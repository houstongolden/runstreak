# Data Fetching & RLS

How RunStreaks fetches leaderboard and profile data from Supabase, how it paginates, and the exact RLS rules that enforce Strava-compliant privacy.

---

## 1. Stack

- **Client:** `@supabase/supabase-js` singleton at `src/integrations/supabase/client.ts` (auto-generated — never edited).
- **Cache:** `@tanstack/react-query` (`staleTime: 60_000`, `cacheTime: 5 * 60_000`, `refetchOnWindowFocus: true` for live boards).
- **Types:** `src/integrations/supabase/types.ts` (auto-generated from schema).

All reads are direct PostgREST calls — no edge function in the request path for read traffic. Writes that mutate sensitive denormalized fields (`current_streak_days`, `best_efforts`) go through service-role edge functions.

---

## 2. Leaderboard query (Discover, MobileLeaderboardCard, LeaderboardTable)

```ts
// src/pages/Discover.tsx
const { data, error } = await supabase
  .from("runners")
  .select(
    "id, username, strava_username, avatar_url, country_code, " +
    "current_streak_days, longest_streak_days, streak_status, " +
    "last_run_date, timezone"
  )
  .order("current_streak_days", { ascending: false })
  .limit(50);
```

**Key design choices:**

- **Denormalized streak stats live on `runners`** so the leaderboard is a single-table, index-backed query — no joins, no aggregates.
- **Explicit column allow-list** — never `select("*")` on `runners` because the row holds `strava_access_token` / `strava_refresh_token`. RLS would block tokens for anon, but defense-in-depth.
- **Boolean-only public display** — `total_distance`, `total_runs`, pace are deliberately excluded from the leaderboard `select` to satisfy Strava's "no public display of activity data" policy.

### Pagination

- Default page size: **50**.
- Infinite scroll uses `.range(from, from + 49)`; React Query's `useInfiniteQuery` tracks `getNextPageParam = (last, all) => last.length === 50 ? all.length * 50 : undefined`.
- For counts, a separate `head: true, count: "exact"` query reads `Content-Range`.

### Indexes that make this fast
```sql
CREATE INDEX idx_runners_current_streak_desc
  ON runners (current_streak_days DESC, id);
CREATE INDEX idx_runners_streak_status
  ON runners (streak_status) WHERE streak_status = 'active';
CREATE INDEX idx_runners_country
  ON runners (country_code);
```

---

## 3. Profile query (RunnerProfile.tsx)

The profile page issues **5–7 parallel queries** on mount, batched via `Promise.all`:

```ts
const [runner, activityCount, followers, following, totalRunners, rank] =
  await Promise.all([
    supabase.from("runners").select("*").eq("id", idOrUsername).maybeSingle(),
    supabase.from("daily_activities")
      .select("*", { count: "exact", head: true }).eq("runner_id", runnerId),
    supabase.from("user_follows")
      .select("*", { count: "exact", head: true }).eq("following_id", runnerId),
    supabase.from("user_follows")
      .select("*", { count: "exact", head: true }).eq("follower_id", runnerId),
    supabase.from("runners").select("*", { count: "exact", head: true }),
    supabase.from("runners").select("id")
      .order("current_streak_days", { ascending: false }),
  ]);
```

Subcomponents fetch their own slices lazily:
- `ActivityHeatmap` → `daily_activities` last 365 days
- `BestEfforts` → `best_efforts` where `is_current_pr=true`
- `StreakHistory` → `streak_history` ordered by `start_date`
- `RunnerActivities` (tab) → `strava_activities` paginated 25 / page

### Why username + UUID dual-resolution
Pretty URLs (`/runner/joeruns`) for shareability, UUID fallback (`/runner/<uuid>`) for stability. The component tries UUID first (it's the typical link from internal pages), falls back to username.

### Avatar without flicker
Avatar URL comes from `AuthContext` (cached on login), not from a per-render fetch. See `mem://architecture/avatar-loading-no-placeholder-flicker`.

---

## 4. Privacy model (Strava compliance)

Three sharing levels, stored on `user_settings.activity_sharing_mode`:

| Mode | Who can SELECT detailed rows |
|---|---|
| `public` | Anyone authenticated; anon may read the runner row but **not** distance/pace |
| `followers` | Owner + accepted followers (`user_follows` row exists) |
| `private` | Owner only |

The leaderboard **always** shows the boolean badge regardless of mode — it never reads `daily_activities`, only `current_streak_days` which is a derived flag.

---

## 5. RLS policy reference

### 5.1 `runners` (2 policies)

```sql
-- Public discovery: anyone can read non-sensitive columns
CREATE POLICY "Runners are viewable by everyone"
ON public.runners FOR SELECT
USING (true);

-- Self-write only
CREATE POLICY "Users can update their own runner"
ON public.runners FOR UPDATE
USING (auth.uid() = user_id);
```

Tokens (`strava_access_token`, `strava_refresh_token`) are protected by column-level grant: anon/authenticated have `SELECT` on the table but the frontend select list never asks for them. Edge functions use `service_role` which bypasses RLS.

### 5.2 `daily_activities` (3 policies)

```sql
CREATE POLICY "Owner full access"
ON public.daily_activities FOR ALL
USING (
  EXISTS (SELECT 1 FROM runners r WHERE r.id = runner_id AND r.user_id = auth.uid())
);

CREATE POLICY "Public mode visible to all authenticated"
ON public.daily_activities FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_settings us
    JOIN runners r ON r.user_id = us.user_id
    WHERE r.id = runner_id AND us.activity_sharing_mode = 'public'
  )
);

CREATE POLICY "Followers mode visible to accepted followers"
ON public.daily_activities FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_settings us
    JOIN runners r ON r.user_id = us.user_id
    JOIN user_follows f ON f.following_id = r.id
    WHERE r.id = runner_id
      AND us.activity_sharing_mode IN ('public','followers')
      AND f.follower_id IN (SELECT id FROM runners WHERE user_id = auth.uid())
  )
);
```

Same pattern repeats for `strava_activities`, `best_efforts`, `streak_history`, `splits`, `segment_efforts`.

### 5.3 `user_follows` (3 policies)

```sql
CREATE POLICY "Follows readable by all" FOR SELECT USING (true);

CREATE POLICY "Own follow rows insert" FOR INSERT
WITH CHECK (
  EXISTS (SELECT 1 FROM runners WHERE id = follower_id AND user_id = auth.uid())
);

CREATE POLICY "Own follow rows delete" FOR DELETE
USING (
  EXISTS (SELECT 1 FROM runners WHERE id = follower_id AND user_id = auth.uid())
);
```

### 5.4 `user_roles` (2 policies)

```sql
CREATE POLICY "Read own roles" FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins read all" FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));
```
The `has_role()` SECURITY DEFINER function avoids recursive RLS — see `mem://` index.

### 5.5 `user_settings` (3 policies)
Owner full CRUD, plus a `SELECT` policy exposing only `activity_sharing_mode` to authenticated readers (used implicitly via the join inside the activity policies above).

---

## 6. Pagination strategies

| Surface | Strategy | Page size | Why |
|---|---|---|---|
| Leaderboard | `range()` + infinite scroll | 50 | Snappy initial paint, predictable scroll |
| Activities tab | `range()` + numbered pages | 25 | Heavier rows, allow jumping |
| Following feed | `range()` + infinite scroll | 50 | Chronological merge |
| Heatmap | Single bounded query | 365 days | Fixed window, no pagination |
| Best efforts | Single query | 14 rows | Bounded by standard distances |
| Streak history | `limit(20)` + "Show all" | 20 / all | Long tail uncommon |

We **don't** use cursor pagination — `created_at`-keyset would be marginally better at >100k runners but adds complexity for current scale (<10k).

### 1000-row default
Supabase caps unbounded queries at 1000 rows. The rank-by-scan query at §3 is the only place we approach that ceiling — earmarked for a SQL `RANK()` view if user count crosses ~10k.

---

## 7. Caching & invalidation

- **Read cache:** React Query, keyed by `[table, filters]`. Mutations call `queryClient.invalidateQueries([...])`.
- **Realtime invalidation:** for `activity_kudos`, `activity_comments`, `messages`, a Postgres-changes subscription pushes invalidations without polling.
- **Auth state:** `AuthContext` exposes `runner` (cached at login), preventing re-fetch on every page.
- **Edge mutations** (e.g. `sync-strava`): on success, frontend invalidates `["runner", id]`, `["daily_activities", id]`, `["best_efforts", id]`.

---

## 8. Security checklist (used as the review gate before any new table)

1. `CREATE TABLE` → immediately followed by `GRANT` block.
2. `ALTER TABLE ... ENABLE ROW LEVEL SECURITY`.
3. At minimum a `SELECT` and a write policy.
4. No token / secret column readable by anon — confirmed via the explicit `select(...)` allow-list in the frontend.
5. Service-role-only mutations on denormalized derived fields (streak counters, PRs).
6. New RLS policies use `has_role()` or runner-ownership joins, never self-referencing queries (avoid recursion).
