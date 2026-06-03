# Profile & Leaderboard API Reference

RunStreaks has no custom REST endpoints — all reads go directly to the Supabase PostgREST API using the JS client. This document specifies the exact queries, the request/response shapes the frontend depends on, sorting/filter parameters, and error codes.

Base URL: `https://<PROJECT_REF>.supabase.co/rest/v1`
Auth: `apikey: <anon>` + (when authenticated) `Authorization: Bearer <user_jwt>`.
All responses are JSON.

---

## 1. Leaderboard

### 1.1 Top streaks

JS client:
```ts
supabase
  .from("runners")
  .select(
    "id, username, strava_username, avatar_url, country_code, " +
    "current_streak_days, longest_streak_days, streak_status, " +
    "last_run_date, timezone"
  )
  .order("current_streak_days", { ascending: false })
  .range(from, from + pageSize - 1)
```

PostgREST equivalent:
```
GET /rest/v1/runners
    ?select=id,username,strava_username,avatar_url,country_code,current_streak_days,longest_streak_days,streak_status,last_run_date,timezone
    &order=current_streak_days.desc
    &limit=50
    &offset=0
```

**Query params (frontend-controlled):**

| Param | Type | Default | Notes |
|---|---|---|---|
| `order` | enum | `current_streak_days.desc` | Allowed: `current_streak_days.desc`, `longest_streak_days.desc`, `created_at.desc` (new runners) |
| `limit` | int | 50 | Hard cap 1000 (PostgREST default) |
| `offset` | int | 0 | Pagination cursor |
| `streak_status` | enum filter | (none) | `eq.active`, `eq.at_risk`, `eq.broken` |
| `country_code` | string filter | (none) | `eq.US` |

**Response (200):**
```json
[
  {
    "id": "uuid",
    "username": "joeruns",
    "strava_username": "joe-strava",
    "avatar_url": "https://...",
    "country_code": "US",
    "current_streak_days": 423,
    "longest_streak_days": 423,
    "streak_status": "active",
    "last_run_date": "2026-06-02",
    "timezone": "America/Los_Angeles"
  }
]
```

> **Strava-compliance note:** the leaderboard intentionally **does not** select `total_distance`, pace, or any private metric. Boolean streak status only on public surfaces.

### 1.2 Total runner count

```ts
supabase.from("runners").select("*", { count: "exact", head: true });
```
Headers: `Content-Range: 0-0/1234`.

### 1.3 Runner's rank
```ts
const { data } = await supabase
  .from("runners")
  .select("id")
  .order("current_streak_days", { ascending: false });
const rank = data.findIndex(r => r.id === runnerId) + 1;
```
(Computed client-side; for >10k runners replace with a SQL `RANK()` view.)

---

## 2. Public Runner Profile

### 2.1 Resolve runner by id OR username

```ts
// Try UUID first
supabase.from("runners").select("*").eq("id", idOrUsername).maybeSingle();
// Fallback to username
supabase.from("runners").select("*").eq("username", idOrUsername).maybeSingle();
```

`GET /rest/v1/runners?id=eq.<uuid>&select=*`
`GET /rest/v1/runners?username=eq.<slug>&select=*`

**Response (200) — abridged:**
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "username": "joeruns",
  "strava_username": "joe-strava",
  "first_name": "Joe",
  "last_name": "R.",
  "avatar_url": "https://...",
  "city": "Portland",
  "state": "OR",
  "country_code": "US",
  "bio": "1 mile a day.",
  "timezone": "America/Los_Angeles",
  "current_streak_days": 423,
  "longest_streak_days": 423,
  "streak_status": "active",
  "last_run_date": "2026-06-02",
  "created_at": "2025-01-12T10:00:00Z"
}
```

### 2.2 Activity count

```ts
supabase
  .from("daily_activities")
  .select("*", { count: "exact", head: true })
  .eq("runner_id", runnerId);
```
Returns `Content-Range: */NNN`.

### 2.3 Followers / following counts

```ts
supabase.from("user_follows").select("*", { count: "exact", head: true }).eq("following_id", runnerId);
supabase.from("user_follows").select("*", { count: "exact", head: true }).eq("follower_id", runnerId);
```

### 2.4 Heatmap data (last 365 days)

```ts
supabase
  .from("daily_activities")
  .select("activity_date, distance, moving_time, strava_activity_id")
  .eq("runner_id", runnerId)
  .gte("activity_date", oneYearAgoISO)
  .order("activity_date", { ascending: true });
```

RLS-gated: if viewer is not owner and `user_settings.activity_sharing_mode != 'public'`, returns `[]` — UI renders the boolean "Streak Active ✓" badge instead.

### 2.5 Best efforts (PR board)

```ts
supabase
  .from("best_efforts")
  .select("distance, moving_time, elapsed_time, start_date, is_estimated, strava_activity_id, achieved_at")
  .eq("runner_id", runnerId)
  .eq("is_current_pr", true)
  .order("distance", { ascending: true });
```

**Response item:**
```json
{
  "distance": 5000,
  "moving_time": 1234,
  "elapsed_time": 1240,
  "start_date": "2026-05-12",
  "is_estimated": false,
  "strava_activity_id": 1234567890,
  "achieved_at": "2026-05-12T15:42:00Z"
}
```

### 2.6 Streak history

```ts
supabase
  .from("streak_history")
  .select("start_date, end_date, length_days, is_current")
  .eq("runner_id", runnerId)
  .order("start_date", { ascending: false })
  .limit(20);
```

### 2.7 Activities page (paginated)

```ts
supabase
  .from("strava_activities")
  .select("strava_activity_id, name, start_date_local, distance, moving_time, elapsed_time, average_speed, average_heartrate, type")
  .eq("runner_id", runnerId)
  .order("start_date_local", { ascending: false })
  .range(page * 25, page * 25 + 24);
```

| Param | Default | Notes |
|---|---|---|
| `range` | `0–24` | 25 per page |
| `order` | `start_date_local.desc` | Switchable to `distance.desc`, `moving_time.asc` |
| `type` filter | (none) | `eq.Run`, `eq.TrailRun` |

---

## 3. Social

### 3.1 Following feed

```ts
supabase
  .from("daily_activities")
  .select("*, runners!inner(username, avatar_url)")
  .in("runner_id", followedIds)
  .order("activity_date", { ascending: false })
  .range(0, 49);
```

### 3.2 Follow / unfollow

```ts
supabase.from("user_follows").insert({ follower_id, following_id });
supabase.from("user_follows").delete().eq("follower_id", me).eq("following_id", them);
```

### 3.3 Kudos / comments

```ts
supabase.from("activity_kudos").insert({ activity_id, runner_id });
supabase.from("activity_comments").insert({ activity_id, runner_id, body });
```

---

## 4. Discover

```ts
supabase
  .from("runners")
  .select("id, username, avatar_url, current_streak_days, streak_status, country_code")
  .eq("streak_status", "active")
  .order("current_streak_days", { ascending: false })
  .limit(50);
```

Optional filters: `country_code=eq.US`, `current_streak_days=gte.30`.

---

## 5. Sorting & filtering reference

All operators are standard PostgREST:

| Operator | Example | Meaning |
|---|---|---|
| `eq` | `streak_status=eq.active` | Equal |
| `neq` | `country_code=neq.US` | Not equal |
| `gte` / `lte` | `current_streak_days=gte.30` | ≥ / ≤ |
| `in` | `runner_id=in.(uuid1,uuid2)` | Set membership |
| `order` | `order=current_streak_days.desc.nullslast` | Sort |
| `limit` / `offset` | `limit=50&offset=100` | Pagination |
| `range` (header) | `Range: 0-49` | Alt pagination |

---

## 6. Error codes

PostgREST returns standard HTTP plus a JSON body:
```json
{ "code": "PGRSTxxx", "message": "...", "details": null, "hint": null }
```

| HTTP | PostgREST code | Cause | Frontend action |
|---|---|---|---|
| 400 | `PGRST100` | Malformed query / invalid operator | Show generic error, log |
| 401 | `PGRST301` | Missing/invalid JWT | Redirect to `/auth` |
| 403 | `42501` | RLS blocked (insufficient privileges) | Render minimal/boolean-only UI |
| 404 | `PGRST116` | Single-row query returned 0 (`single()` only — `maybeSingle()` returns `null`) | "Runner not found" |
| 406 | `PGRST102` | Unsupported `Accept` header | n/a |
| 409 | `23505` | Unique constraint (e.g. duplicate follow) | Toast "Already following" |
| 416 | — | Invalid `Range` header | Reset pagination |
| 429 | — | Rate limit (very rare, project-level) | Backoff + retry |
| 500 | `PGRST002` | Schema cache stale / internal | Toast + Sentry |

Edge function errors follow our own envelope:
```json
{ "error": "string", "code"?: "string", "details"?: any }
```
HTTP 400 for validation, 401 for missing JWT (when `verify_jwt=true`), 403 for non-admin attempts, 500 for unhandled.

---

## 7. Realtime channels

```ts
supabase.channel("messages")
  .on("postgres_changes", { event: "*", schema: "public", table: "messages" }, handler)
  .subscribe();
```
Enabled tables: `messages`, `activity_kudos`, `activity_comments` (added via `ALTER PUBLICATION supabase_realtime`).

RLS still applies — subscribers only receive rows they can `SELECT`.
