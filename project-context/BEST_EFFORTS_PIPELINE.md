# Best Efforts Analysis Pipeline

End-to-end documentation of how RunStreaks computes per-runner PRs ("best efforts") across 14 standard distances while staying inside Strava's tight API rate limits (200 / 15 min, 2000 / day, per token).

## 1. Inputs

| Source | Table / API | Fields used |
|---|---|---|
| Daily aggregates | `daily_activities` | `activity_date`, `distance` (miles), `moving_time` (s), `strava_activity_id` |
| Detailed per-activity | Strava `GET /api/v3/activities/{id}` | `best_efforts[]` (`distance`, `moving_time`, `elapsed_time`, `start_date`) |
| Runner credentials | `runners` | `strava_access_token`, `strava_refresh_token`, `token_expires_at` |
| Existing PRs | `best_efforts` | filtered by `runner_id`, `is_current_pr=true` |

**Standard distances (meters):** `400, 800, 1000, 1609, 3219, 5000, 10000, 15000, 16093, 20000, 21097, 30000, 42195, 50000`.

## 2. Trigger surface

- **Webhook fan-out** — `strava-webhook` invokes `calculate-best-efforts` after every activity create/update.
- **Post-sync** — `sync-strava` invokes it once at the end of a manual sync.
- **Manual** — "Recalculate PRs" button on profile / Admin.
- **Single-activity upgrade** — `fetch-activity-best-efforts` runs when a user opens the activity detail and clicks "Extract Best Efforts" (1 API call exactly).
- **Seeding** — `handle_new_runner_best_efforts` trigger calls `initialize_runner_best_efforts(runner_id)` on `INSERT INTO runners`, populating 14 placeholder rows (`is_estimated=true`, `elapsed_time=0`).

## 3. Stage 1 — Estimate (0 API calls)

For each standard distance `D`:

1. Filter `daily_activities` where `distance_meters = distance * 1609.34 >= D`.
2. Compute pace per meter: `pacePerMeter = moving_time / distance_meters`.
3. Estimate time at `D`: `estimatedTime = round(pacePerMeter * D)`.
4. Keep the activity that minimizes `estimatedTime`.

Output: up to 14 estimated PRs with `is_estimated=true`. These power the UI immediately and never require Strava bandwidth.

> **Caveat:** This assumes constant pace across the run, so estimates overstate true PRs for negative-split or interval workouts. Stage 2 corrects this for the top candidates.

## 4. Stage 2 — Upgrade (≤ 30 API calls per run)

1. Take the activities that won Stage 1 → at most 14 distinct activity IDs, capped at the first 30.
2. Refresh `strava_access_token` if `token_expires_at <= now()`.
3. For each candidate, `GET /activities/{strava_activity_id}` (Strava enriches with `best_efforts[]` only on the detail endpoint).
4. Match Strava's reported `effort.distance` against our standard distances.
5. Replace the estimated row with the actual `moving_time` / `elapsed_time`, set `is_estimated=false`, persist `strava_activity_id`.

If a detail call fails (401, 404, rate-limited), the estimate is preserved — no row is deleted.

## 5. Thresholds and guards

| Guard | Value | Reason |
|---|---|---|
| Max detail fetches per run | 30 | Hard rate-limit budget |
| Min distance for distance D | `>= D` (meters) | Avoid extrapolation |
| Token refresh window | `token_expires_at <= now()` | Strava expires ~6 h |
| New PR replaces old | `moving_time < currentPR.moving_time` | Archives old row (`is_current_pr=false`) for history |
| Actual upgrades estimate | `effort.is_estimated=false AND currentPR.is_estimated=true` | In-place replacement |
| Placeholder rows | `elapsed_time=0, moving_time=0, is_estimated=true` | Seed on runner creation |

## 6. Persistence & history

The `best_efforts` table is append-mostly:

- A new PR **inserts** a new row with `is_current_pr=true` and **flips the previous winner to `is_current_pr=false`** — never overwrites historic PRs.
- An estimate getting upgraded to actual data is the **one in-place UPDATE** (no history milestone).
- `achieved_at` is stamped at write time; `start_date` reflects the activity's date.

Reads always filter `is_current_pr=true`. Historical progression is `SELECT ... ORDER BY achieved_at`.

## 7. Caching & refresh strategy

| Layer | Refresh on | TTL |
|---|---|---|
| `best_efforts` rows | webhook event, manual recalc, post-sync | persistent — recomputed only when a new activity lands |
| Strava detail enrichment | once per activity via `fetch-activity-best-efforts` | permanent (the activity itself is immutable for completed runs) |
| Frontend `BestEfforts.tsx` | React Query `staleTime: 60s`, `cacheTime: 5m` | revalidates on focus |

There's no time-based invalidation — the source of truth is the database, and only new Strava events trigger recompute.

## 8. Failure modes

| Failure | Behavior |
|---|---|
| Strava 401 | Token auto-refresh; if refresh fails → user must reconnect. Estimated PRs remain. |
| Strava 429 | Skip remaining candidates in this run; webhook will re-trigger on next event. |
| `strava_activity_id` missing on `daily_activities` row | Skip Stage 2 for that distance; keep estimate. |
| Runner has 0 activities | Function exits early with `message: "No activities to calculate best efforts from"`. |

## 9. End-to-end sequence

```
Strava activity create
      │
      ▼
strava-webhook (200 OK immediately)
      │ (fire-and-forget IIFE)
      ▼
upsert into strava_activities + daily_activities
      ▼
invoke calculate-best-efforts(runnerId)
      │
      ├── Stage 1 — pure DB scan over daily_activities (0 API calls)
      │     produce 14 candidate PRs (is_estimated=true)
      │
      ├── Stage 2 — up to 30 GET /activities/{id} calls
      │     replace estimates with Strava-reported best_efforts
      │
      └── DB writes
            • new PR     → insert new row, flip old to is_current_pr=false
            • estimate→actual → in-place UPDATE
            • no change  → noop
```

## 10. Why this design

- **Cheap by default:** Stage 1 gives a full PR set for free, so the UI is never blank.
- **Bandwidth-bounded:** Stage 2 has a fixed 30-call ceiling regardless of activity count.
- **Self-healing:** Each webhook re-runs the pipeline, so missed PRs eventually upgrade.
- **History-preserving:** Archived rows (`is_current_pr=false`) drive the PR progression chart.
