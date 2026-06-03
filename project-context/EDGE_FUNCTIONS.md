# Edge Functions Index

All edge functions live in `supabase/functions/<name>/index.ts` and are deployed via the Lovable Cloud (Supabase) runtime. `verify_jwt` defaults per function are set in `supabase/config.toml`.

Invocation patterns:
- **Manual (client SDK):** `supabase.functions.invoke('<name>', { body })` — JWT auto-attached.
- **Manual (curl):** `POST https://<PROJECT_REF>.supabase.co/functions/v1/<name>` with `Authorization: Bearer <anon-or-user-jwt>` and `apikey: <anon>`.
- **Webhook:** Strava/Vonage POST directly to the public URL; `verify_jwt = false`.
- **Scheduler:** Triggered by a Supabase scheduled job (pg_cron / dashboard cron) — configured outside the repo.

Legend: 🔓 public (`verify_jwt=false`) · 🔒 JWT required · ⏰ scheduler-eligible · 🪝 webhook · 🛠 manual.

---

## 1. `strava-auth` 🔓 🛠
- **Purpose:** Build Strava OAuth authorize URL and 302-redirect the browser.
- **Trigger:** Browser GET (full-page redirect from "Connect Strava" button).
- **Secrets:** `STRAVA_CLIENT_ID`, `STRAVA_CLIENT_ID_2`, app_settings.strava_api_mode.
- **Payload:** Query `?ref=<referral_code>&mode=live|test` (optional).
- **Returns:** 302 → `https://www.strava.com/oauth/authorize?...&scope=read,activity:read_all,profile:read_all`.

## 2. `strava-callback` 🔓 🪝
- **Purpose:** Exchange auth code for tokens, create/link Supabase user, kick off two-stage sync.
- **Trigger:** Strava redirects browser → `/functions/v1/strava-callback?code=...&state=...`.
- **Secrets:** `STRAVA_CLIENT_ID(_2)`, `STRAVA_CLIENT_SECRET(_2)`, `SUPABASE_SERVICE_ROLE_KEY`.
- **Payload:** Query `code`, `scope`, `state` (contains `ref` if any).
- **Returns:** 302 → `/onboarding/step1` (new) or `/feed` (returning).

## 3. `strava-webhook` 🔓 🪝
- **Purpose:** Receive Strava push events; **always respond 200 immediately**, do heavy work in fire-and-forget IIFE.
- **Trigger:** Strava push subscription.
- **Secrets:** `STRAVA_WEBHOOK_VERIFY_TOKEN(_2)`, `SUPABASE_SERVICE_ROLE_KEY`.
- **GET payload (verification):** `?hub.mode=subscribe&hub.verify_token=...&hub.challenge=...`
  - Returns `{ "hub.challenge": "<challenge>" }`.
- **POST payload (event):**
  ```json
  {
    "object_type": "activity",
    "object_id": 1234567890,
    "aspect_type": "create",
    "updates": {},
    "owner_id": 11111,
    "subscription_id": 222,
    "event_time": 1707000000
  }
  ```
- **Returns:** Always `200 OK`. Side effects: upsert into `strava_activities`, then invoke `recalculate-streak`, `calculate-best-efforts`, `calculate-streak-history`.

## 4. `strava-subscribe-webhook` 🔒 🛠
- **Purpose:** Admin tool to create/list/delete the single push subscription per Strava app.
- **Trigger:** Admin UI (`StravaWebhookManager.tsx`).
- **Secrets:** `STRAVA_CLIENT_ID(_2)`, `STRAVA_CLIENT_SECRET(_2)`, `STRAVA_WEBHOOK_VERIFY_TOKEN(_2)`.
- **Payload:** `{ "action": "subscribe" | "list" | "delete", "subscriptionId"?: number }`
- **Returns:** Strava API response JSON.

## 5. `sync-strava` 🔒 🛠
- **Purpose:** Manual full sync — pulls athlete profile, stats, and recent/historical activities for one runner.
- **Trigger:** "Sync now" button on profile.
- **Secrets:** `STRAVA_CLIENT_ID*`, `STRAVA_CLIENT_SECRET*`, `SUPABASE_SERVICE_ROLE_KEY`.
- **Payload:** `{ "runnerId": "<uuid>", "fullSync"?: boolean }`
- **Returns:** `{ success: true, activities_synced: 142 }`.

## 6. `sync-all-runners` 🔒 ⏰
- **Purpose:** Nightly cron: iterates all runners, invokes `sync-strava` per runner.
- **Trigger:** Scheduled (recommended daily 03:00 UTC).
- **Secrets:** `SUPABASE_SERVICE_ROLE_KEY`.
- **Payload:** `{}` (no body).
- **Returns:** `{ total, synced, failed, errors? }`.

## 7. `process-sync-queue` 🔒 ⏰
- **Purpose:** Drains `sync_queue` (deferred backfills for runners with >1000 activities). Retries capped at 2–5.
- **Trigger:** Scheduled (recommended every 5–15 min).
- **Secrets:** `SUPABASE_SERVICE_ROLE_KEY`, `STRAVA_CLIENT_*`.
- **Payload:** `{ "batchSize"?: 5 }`
- **Returns:** `{ processed, succeeded, failed }`.

## 8. `recalculate-streak` 🔓 🛠
- **Purpose:** Recomputes `current_streak_days`, `longest_streak_days`, `streak_status` from `daily_activities` (DB-only).
- **Trigger:** Invoked by `strava-webhook`, `sync-strava`, manual.
- **Secrets:** `SUPABASE_SERVICE_ROLE_KEY`.
- **Payload:** `{ "runnerId": "<uuid>" }`
- **Returns:** `{ success: true, current_streak_days, longest_streak_days, streak_status }`.

## 9. `calculate-best-efforts` 🔓 🛠
- **Purpose:** Two-stage PR calculation — estimates from `daily_activities` (0 API calls), then upgrades top 30 via Strava detail fetches. See `BEST_EFFORTS_PIPELINE.md`.
- **Trigger:** `strava-webhook`, post-sync, manual "Recalculate PRs" button.
- **Secrets:** `STRAVA_CLIENT_*`, `SUPABASE_SERVICE_ROLE_KEY`.
- **Payload:** `{ "runnerId": "<uuid>" }`
- **Returns:** `{ success: true, best_efforts_count: 14 }`.

## 10. `fetch-activity-best-efforts` 🔒 🛠
- **Purpose:** Fetch full detail for one activity and extract its `best_efforts` array; upgrades estimated PRs.
- **Trigger:** "Analyze activity" button on activity detail.
- **Secrets:** `STRAVA_CLIENT_*`, `SUPABASE_SERVICE_ROLE_KEY`.
- **Payload:** `{ "strava_activity_id": 1234567890, "runner_id": "<uuid>" }`
- **Returns:** `{ success: true, updated_count: 3 }`.

## 11. `calculate-streak-history` 🔓 🛠
- **Purpose:** Rebuild `streak_history` table from scratch (every historical streak run).
- **Trigger:** Webhook, post-sync.
- **Secrets:** `SUPABASE_SERVICE_ROLE_KEY`.
- **Payload:** `{ "runnerId": "<uuid>" }`
- **Returns:** `{ success: true, streaks_recorded: 7 }`.

## 12. `update-aggregate-stats` 🔒 ⏰
- **Purpose:** Recomputes `aggregate_stats` (sitewide totals shown on homepage).
- **Trigger:** Scheduled (hourly).
- **Payload:** `{}`
- **Returns:** `{ success: true, stats: { ... } }`.

## 13. `analyze-runner` 🔒 🛠 (admin-only)
- **Purpose:** AI Coach — full-profile analysis. Gated to admin via `has_role(auth.uid(),'admin')`.
- **Secrets:** `LOVABLE_API_KEY`.
- **Payload:** `{ "runnerId": "<uuid>" }`
- **Returns:** SSE stream of analysis text.

## 14. `send-coach-message` 🔒 🛠 (admin-only)
- **Purpose:** Chat with AI coach about a runner.
- **Secrets:** `LOVABLE_API_KEY`.
- **Payload:** `{ "runnerId": "<uuid>", "message": "<text>", "sessionId"?: "<uuid>" }`
- **Returns:** SSE stream.

## 15. `generate-activity-status` 🔒 🛠 (admin-only)
- **Purpose:** AI summary blurb for a single activity.
- **Payload:** `{ "activityId": "<uuid>" }`
- **Returns:** `{ status: "Crushed a tempo session..." }`.

## 16. `generate-invite-message` 🔒 🛠 (admin-only)
- **Purpose:** AI-drafted referral message.
- **Payload:** `{ "recipientName"?: string, "tone"?: "casual"|"hype" }`
- **Returns:** `{ message: "..." }`.

## 17. `send-verification-sms` 🔓 🛠
- **Purpose:** Send 6-digit code via Vonage. Stores hash in `phone_verification_codes`.
- **Secrets:** `VONAGE_API_KEY`, `VONAGE_API_SECRET`, `VONAGE_PHONE_NUMBER`.
- **Payload:** `{ "phone": "+15551234567", "runnerId": "<uuid>" }`
- **Returns:** `{ success: true, expires_at }`.

## 18. `verify-sms-code` 🔓 🛠
- **Purpose:** Validate 6-digit code, mark `runners.phone_verified=true`.
- **Payload:** `{ "phone": "+15551234567", "code": "123456", "runnerId": "<uuid>" }`
- **Returns:** `{ success: true }` or `{ error: "invalid_code" | "expired" }`.

## 19. `sms-webhook` 🔓 🪝
- **Purpose:** Vonage inbound SMS receiver — logs to `messages`, handles STOP/HELP.
- **Trigger:** Vonage delivery/inbound webhook.
- **Payload (Vonage JSON):**
  ```json
  { "msisdn":"15551234567","to":"18005551111","text":"STOP","messageId":"...","type":"text" }
  ```
- **Returns:** `200 OK` always.

## 20. `badge` 🔓 🛠
- **Purpose:** Renders SVG badge (`<img>` embed) showing streak status for a runner.
- **Payload:** Query `?username=joeruns&style=dark`.
- **Returns:** `image/svg+xml`.

## 21. `create-admin` 🔓 🛠 (one-time)
- **Purpose:** Bootstrap admin user with one-time setup key.
- **Payload:** `{ "email": "...", "password": "...", "setupKey": "<one-time>" }`
- **Returns:** `{ success: true, user_id }`.

## 22. `admin-delete-user` 🔒 🛠 (admin-only)
- **Purpose:** Hard delete runner + cascade.
- **Payload:** `{ "userId": "<uuid>" }`
- **Returns:** `{ success: true }`.

## 23. `create-ad-spot` 🔒 🛠 (admin-only)
- **Purpose:** Create paid ad placement after Stripe/Paddle checkout.
- **Payload:** `{ "tier": "sidebar"|"hero", "advertiser": "...", "starts_at": "ISO", "ends_at": "ISO", "image_url": "..." }`
- **Returns:** `{ ad_spot_id }`.

---

## Scheduling matrix (recommended)

| Function | Cron | Notes |
|---|---|---|
| `sync-all-runners` | `0 3 * * *` | Daily safety net for webhook misses |
| `process-sync-queue` | `*/10 * * * *` | Drain backlog |
| `update-aggregate-stats` | `0 * * * *` | Hourly |

Configure via Supabase Dashboard → Database → Cron Jobs or `pg_cron` directly.
