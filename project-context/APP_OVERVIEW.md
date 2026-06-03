# RunStreaks — Full Technical & Product Spec

A complete handoff document describing every feature, view, component, data model, and integration in the RunStreaks app. Intended as a blueprint for replicating or porting the platform.

> Domain: **runstreaks.io** (also runstreak.to)
> Stack: React 18 + Vite + TypeScript + Tailwind + shadcn/ui, Supabase (Postgres + Auth + Edge Functions + Storage + Realtime), Strava API + Webhooks, Vonage SMS, Lovable AI Gateway.

---

## 1. Product Concept

RunStreaks is a **run-streak tracker** built on top of Strava. A "streak" = consecutive days where the runner logged **at least 1 mile**. The app shows:

- Personal streak status + countdown until the streak breaks
- Detailed profile with heatmap, best efforts, streak history, activities
- Public leaderboard / discover view (Strava-compliant: only **boolean active/inactive**, no distance/pace shown publicly)
- AI coach (admin-restricted due to Strava policy)
- Social: follows, kudos, comments, accountability partners, inbox messaging
- SMS engagement + verification via Vonage toll-free
- Referral system w/ custom codes
- Ad spots (fitness-brand sponsors)

### Strava Compliance Pivot (CRITICAL)
Per Strava's API agreement, **public-facing surfaces cannot display another athlete's stats, distance, pace, or activity detail.** Therefore:
- Leaderboard and any unauthenticated/public profile views show **only a boolean "Streak Active ✓" badge** — no day counts, no miles, no pace.
- Detailed stats (heatmap, best efforts, history, streak day count) are shown on the **owner's own profile** and to followers per `user_settings.activity_sharing_mode` (`public` / `followers` / `private`).
- AI Coach (which would imply analysis of athlete data displayed back) is **restricted to admin user only**.

---

## 2. Routes & Views

All routes defined in `src/App.tsx`.

### Public
| Route | Page | Purpose |
|---|---|---|
| `/` | `Index` | Marketing homepage. Hero (video bg in light, hero image in dark), how-it-works (4 steps), animated leaderboard preview, animated heatmap, philosophy, sponsor carousel, footer. Tagline: *"Connect your Strava. Run at least 1 mile per day."* |
| `/features` | `Features` | Feature list |
| `/story`, `/philosophy` | Static narrative pages |
| `/privacy`, `/terms`, `/support` | Legal/support |
| `/discover` | `Discover` | Browse runners (boolean streak status only) |
| `/runner/:id` | `RunnerProfile` | Runner profile. `:id` accepts UUID or username. Public viewers see minimal boolean status; owner sees full stats. |
| `/runner/:id/badge` | `BadgeCustomizer` | Customize embeddable SVG badge |
| `/badge-docs` | Docs for embedding the badge |

### Auth
| Route | Page |
|---|---|
| `/auth` | Email/password + Strava OAuth (returning users). New users **must** Strava OAuth. |
| `/connect` | `StravaConnect` standalone connect screen |
| `/onboarding/*` | 4-step onboarding (Step1..Step4): profile, Strava sync visualization, phone verification, finish |
| `/verify-account`, `/verify-phone` | Verification flows |
| `/admin-setup`, `/admin/login` | One-time admin bootstrap |

### Authenticated
| Route | Page |
|---|---|
| `/settings` | Email/SMS verification status, privacy mode, account, theme, sign out |
| `/edit-profile` | Bio, username, x_profile, city/state/country, avatar upload (to `avatars` bucket) |
| `/activities` | Owner's full activity list, sourced from `strava_activities` |
| `/feed` | Social feed (mutually exclusive with Discover) |
| `/invite` | Referral codes — multi-code support per user, share links |
| `/inbox` | DM-style inbox, matches AI Coach UI exactly; separate nav item w/ unread badge |
| `/coach`, `/coach/:runnerId` | AI Coach chat (admin only) |
| `/admin` | Admin dashboard — analytics via `get_admin_analytics()` RPC, user list, mode toggle (Live vs Test Strava credentials), webhook manager |
| `/ad-checkout`, `/ad-payment-success` | Ad spot purchase flow |

### Layout
- `<AppLayout>` wraps authed pages: sidebar (overlay, not push), top streak countdown banner (`StreakCountdownBanner`), main content.
- Sidebar fixed positioning; sticky header/footer with scrollable middle. Logged-out sidebar copy drives signup.
- Logo text hidden on homepage only.
- Theme: **light default**, dark via toggle. Dark mode uses black/dark grays + orange gradients (no navy tint), glassmorphism (`bg-card/60 backdrop-blur-[40px]`), hero-dark-bg.jpg as global background.
- Branding: **orange gradient accents exclusively** — no other accent colors.

---

## 3. Database Schema (Postgres / Supabase)

26 tables. Highlights below; full column lists live in `src/integrations/supabase/types.ts`.

### Core
- **runners** (57 cols) — one row per Strava athlete. PK `id` (uuid) = `auth.users.id`. Holds `strava_user_id`, OAuth tokens (`strava_access_token`, `strava_refresh_token`, `token_expires_at`), display fields, **denormalized streak stats** (`current_streak_days`, `current_streak_miles`, `streak_start_date`, `last_activity_date`, `longest_streak_ever`, `streak_status` = `'active' | 'broken'`), YTD + all-time totals, athlete profile from Strava (sex, weight, ftp, clubs, bikes, shoes), location (`city`, `state`, `country`, `timezone`, `lat/lng`), `joined_runstreak_at` + "days on streak since joining" metrics (30/60/90), `ai_analysis` JSON cache.
- **strava_activities** (60 cols) — **source of truth** for activity-level data. Unique constraint: `(runner_id, strava_activity_id)`. Full Strava field capture (splits, segments, gear, weather, photos, etc.).
- **daily_activities** (35 cols) — one row per `(runner_id, activity_date)` aggregated for streak math + heatmap.
- **streak_history** — historical streaks, used by `StreakHistory` component.
- **best_efforts** (12 cols) — PRs at 14 standard distances. `is_estimated` and `is_current_pr` flags. See §6.

### Social
- **user_follows**, **accountability_partners**, **activity_kudos**, **activity_comments**, **activity_status**, **messages** (DMs), **coach_messages**, **coaching_sessions**.

### Settings / Auth
- **user_settings** (19 cols) — `email`, `phone_number`, `phone_verified`, `email_verified`, `ai_coach_enabled/frequency/time/style`, `free_month_claimed`, **`activity_sharing_mode`** (`public` | `followers` | `private`).
- **user_roles** — `app_role` enum (`admin`, `moderator`, `user`). Roles **MUST** be stored here, never on profile. Checked via `has_role(user_id, role)` SECURITY DEFINER fn.
- **phone_verification_codes** — Vonage SMS OTPs.

### Ops
- **app_settings** — kv store. Key `strava_api_mode` = `'live' | 'test'` toggles between two Strava app credentials.
- **sync_queue** (12 cols) — deferred background sync for users with >1000 activities. Hard retry cap (2-5), no infinite backoff.
- **aggregate_stats**, **ad_spots**, **referrals**, **referral_codes**, **referral_prizes**, **splits**, **segment_efforts**.

### RLS / Grants Rules
- Every public-schema table has explicit `GRANT` statements; default privileges are not given by Supabase.
- `user_roles` granted only to `authenticated` + `service_role` — never `anon`.
- Roles checked via `has_role()` SECURITY DEFINER function to avoid recursive RLS.

---

## 4. Strava Integration

### 4.1 OAuth
- Scopes: `read,activity:read_all,profile:read_all`.
- **Two app credentials** in env: `STRAVA_CLIENT_ID/SECRET` (live) + `STRAVA_CLIENT_ID_2/SECRET_2` (test). Edge functions read `app_settings.strava_api_mode` to pick.
- `strava-auth` (no JWT) — builds authorize URL, accepts optional referral code via `state` param.
- `strava-callback` (no JWT) — exchanges code → tokens → fetches athlete + stats → resolves identity:
  1. If `strava_user_id` already exists → reuse `runners.id` & link.
  2. Else if admin one-time-link key present → link to admin auth user.
  3. Else create new `auth.users` via `supabase.auth.admin.createUser()` (email from Strava — note: **Strava does NOT verify emails**, so we auto-verify post-OAuth but treat the address as spoofable).
- After identity: insert `runners` row, kick off **two-stage sync** (see §4.4), then full-page redirect to `/onboarding` (first signup) or `/runner/me`.

### 4.2 Webhook
- One subscription per Strava app, registered via `strava-subscribe-webhook` → `POST /api/v3/push_subscriptions`. Callback URL = `https://<project-ref>.supabase.co/functions/v1/strava-webhook`.
- `strava-webhook` (no JWT):
  - **GET** — challenge/response: validate `hub.mode === 'subscribe'` && `hub.verify_token === STRAVA_WEBHOOK_VERIFY_TOKEN`, return `{ "hub.challenge": ... }`.
  - **POST** — **always return 200 immediately**, then fire-and-forget IIFE for heavy work. Handles `aspect_type`: `create` / `update` / `delete`. For create/update: refresh token if needed → `GET /activities/{id}` → upsert into `strava_activities` (UTC `start_date` converted to runner's timezone) → derive/update `daily_activities` → invoke `recalculate-streak`, `calculate-best-efforts`, `calculate-streak-history`. For delete (or activity becoming private): remove from `strava_activities` + `daily_activities` (Strava policy: privacy deletion sync).
- Rate limits: 200/15min, 2000/day per app. Sync queue handles bulk backfills.

### 4.3 Manual sync
- `sync-strava` — full sync for current user; the **Sync Strava button must invoke `sync-strava` directly** (don't route through a generic edge). Direct invocation is enforced architecturally.
- `sync-all-runners` — admin-triggered or cron-style mass refresh.
- `process-sync-queue` — drains `sync_queue` rows respecting retry cap.

### 4.4 Two-stage onboarding sync
1. **Quick fetch**: first 200 activities synchronously so onboarding heatmap/leaderboard isn't empty.
2. **Background full sync**: `EdgeRuntime.waitUntil()` enqueues full history. Scan animation persists in UI until sync completes (state polled from `runners.sync_status` or `sync_queue`).

### 4.5 Timezone canonicalization
- Strava `start_date` is UTC; `start_date_local` is athlete-local but tz-naive.
- We store the athlete's IANA `timezone` in `runners.timezone`, then **all streak/countdown math converts UTC → DB-stored timezone**, never browser-local.

---

## 5. Streak Logic

- **Requirement**: ≥1 mile per UTC-converted-to-runner-tz calendar day.
- **Statuses**:
  - `active` & **safe** — ran today (or within current local day).
  - `active` & **at risk** — gap <2 days; `StreakCountdownBanner` shows red countdown to local midnight rollover.
  - `broken` — gap ≥2 full days.
- **Calculation lives in `recalculate-streak` edge function** — DB-only, no Strava calls. Reads `daily_activities`, walks back from today, updates `runners` denormalized fields + writes a `streak_history` row when streaks end.
- `calculate-streak-history` rebuilds the full history table from scratch (used on initial sync and admin recalcs).
- Banner copy when safe: *"Streak safe. You're good for the day."*
- **Reuse existing logic** — do not rewrite. Replicate the proven component flow.

---

## 6. Best Efforts Analysis (the clever part)

File: `supabase/functions/calculate-best-efforts/index.ts`.

**Problem**: Strava's `best_efforts` field on an activity is only populated for "Run" type and requires fetching each activity individually (rate-limit expensive). With thousands of activities per athlete, naively fetching all of them blows the 200/15min budget.

**Solution: estimate first, then upgrade top candidates**.

14 standard distances tracked (m): `400, 800, 1000, 1609, 3219, 5000, 10000, 15000, 16093, 20000, 21097, 30000, 42195, 50000`.

### Stage 1 — Estimated PRs (0 API calls)
For each standard distance D and each `daily_activities` row whose distance ≥ D:
- `pacePerMeter = moving_time / activity_distance_meters`
- `estimatedTime = round(pacePerMeter * D)`

Keep the best (lowest) estimated time per distance. Insert into `best_efforts` with `is_estimated = true`, `is_current_pr = true`. This guarantees **every athlete has a populated PR board immediately** with no API spend.

### Stage 2 — Upgrade top candidates (≤30 API calls)
For up to 30 of the best estimated candidates (those most likely to have real PRs):
- `GET /activities/{strava_activity_id}` with the runner's access token.
- If response includes `best_efforts[]`, find the entry whose `distance` matches D exactly.
- Replace the estimated row: `is_estimated = false`, `strava_activity_id` set, use Strava's `elapsed_time` & `moving_time`.

### PR replacement rules
On each call, for each new effort vs existing `is_current_pr` row:
- If new is faster → archive old (`is_current_pr = false`), insert new.
- If new is **actual** and old was **estimated** → upgrade in place (`is_estimated = false`).
- Else no-op.

### Initialization
DB trigger `handle_new_runner_best_efforts` → `initialize_runner_best_efforts(uuid)` seeds placeholder rows for all 14 distances on new runner creation, so the UI never sees a half-empty PR table.

### Per-activity drill-down
`fetch-activity-best-efforts` — invoked when user opens a specific activity's detail view; fetches that one activity's `best_efforts` array for full segment breakdown.

---

## 7. AI Coach (admin-restricted)

- Models served via **Lovable AI Gateway** — supports `google/gemini-2.5-*`, `openai/gpt-5*`, etc. No customer-supplied API key needed.
- `analyze-runner` — generates 3 insight cards (Sparkles / TrendingUp / Target) shown by `AIAnalysisCards`. Cached on `runners.ai_analysis` to avoid recompute; falls back to live invocation if cache empty.
- `send-coach-message` — chat completion endpoint for the AI Coach screen. Persists to `coach_messages` + `coaching_sessions`.
- `generate-activity-status` — short AI-generated caption for an activity (admin only).
- `generate-invite-message` — personalized invite copy for the referral flow.
- **Hard gate**: `/coach` route checks `useAdmin()` (which calls `has_role()`); non-admins are redirected. Required to stay Strava-compliant.

---

## 8. SMS (Vonage, Toll-Free)

- `send-verification-sms` — sends 6-digit OTP via Vonage; stores hash + expiry in `phone_verification_codes`.
- `verify-sms-code` — validates code, flips `user_settings.phone_verified`.
- `sms-webhook` — inbound message handler (for engagement replies).
- Toll-free 1-800 numbers required for verification-class traffic (US carrier policy).
- Phone sign-in is **not** required; SMS verification is independent of auth method.

---

## 9. Components Inventory

### Streak & Stats
- `CurrentStreakCard`, `DaysOnStreakCard`, `StreakCountdown`, `StreakCountdownBanner` (global top banner, dual-state safe/at-risk), `StreakHistory`, `RunnerStreakStatus`, `AggregateStatsCard`.
- `ActivityHeatmap` — full-width responsive (no max-width cap), GitHub-style year grid. Month labels align precisely in a structured grid. Date parsing: parse `YYYY-MM-DD` uniformly as UTC then convert to local. Tooltips are **clickable** for touch support, not hover-only.
- `AnimatedHeatmap`, `AnimatedLeaderboard` — homepage marketing previews.
- `BestEfforts` — 14-distance PR table; shows `est.` badge when `is_estimated`.

### Profile
- `ProfileEditor`, `UserAvatarHeader`, `UserProfileDropdown`, `UserProfileMenu`, `RunnerActivities` (uses `strava_activities`), country flags via flagcdn (ISO codes).

### Social
- `FollowButton`, `AccountabilityPartnerButton`, `AccountabilityPartnersSection`, `ActivityKudos`, `ActivityComments`, `InboxNotification`.

### Leaderboard
- `LeaderboardTable` (desktop), `MobileLeaderboardCard` — **boolean badge only** per Strava compliance.

### Marketing & Ads
- `SponsorCarousel`, `DesktopAdSidebar`, `AdvertiseModal`, `AppDownloadSection`, `RunStreakPhilosophy`, `Footer`.

### Auth & Onboarding
- `OnboardingModal` (legacy — current flow uses dedicated routes), `ScanningAnimation` (persists until sync completes), `UnverifiedAccountBanner`, `PrivacySettings`.

### Admin / Ops
- `StravaWebhookManager` — admin UI for subscribe/list/delete.
- `AdminRoute`, `ProtectedRoute` — route guards.

### AI
- `AICoachChat`, `AnimatedAIChat`, `CoachSessionHistory`, `AIAnalysisCards`.

---

## 10. Edge Functions (full list)

| Function | JWT | Purpose |
|---|---|---|
| `strava-auth` | off | Build authorize URL (mode-aware) |
| `strava-callback` | off | OAuth exchange + identity resolution + initial sync |
| `strava-webhook` | off | Inbound activity create/update/delete |
| `strava-subscribe-webhook` | on | Admin: manage push subscription |
| `sync-strava` | on | Manual full sync for current user |
| `sync-all-runners` | on | Admin: mass refresh |
| `process-sync-queue` | on | Drain deferred sync jobs |
| `recalculate-streak` | off | DB-only streak math |
| `calculate-best-efforts` | off | Estimated + upgraded PR pipeline (§6) |
| `fetch-activity-best-efforts` | on | On-demand single-activity PR fetch |
| `calculate-streak-history` | off | Rebuild streak_history from scratch |
| `analyze-runner` | on | AI insight cards |
| `send-coach-message` | on | AI Coach chat |
| `generate-activity-status` | on | AI activity caption |
| `generate-invite-message` | on | AI invite copy |
| `send-verification-sms` | off | Vonage OTP send |
| `verify-sms-code` | off | OTP validate |
| `sms-webhook` | off | Vonage inbound |
| `badge` | off | SVG badge renderer for embeds |
| `create-admin` | off | One-time admin bootstrap (key-gated) |
| `admin-delete-user` | on | Cascade-delete a user (admin) |
| `update-aggregate-stats` | on | Refresh `aggregate_stats` |
| `create-ad-spot` | on | Ad spot checkout |

---

## 11. Secrets

`STRAVA_CLIENT_ID`, `STRAVA_CLIENT_SECRET`, `STRAVA_CLIENT_ID_2`, `STRAVA_CLIENT_SECRET_2`, `STRAVA_WEBHOOK_VERIFY_TOKEN`, `STRAVA_WEBHOOK_VERIFY_TOKEN_2`, `VONAGE_API_KEY`, `VONAGE_API_SECRET`, `VONAGE_PHONE_NUMBER`, `TWILIO_*` (legacy), `LOVABLE_API_KEY` (AI Gateway), Supabase managed: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ANON_KEY`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_DB_URL`.

---

## 12. Auth Flow Summary

- **New users**: Strava OAuth only — no email/password signup permitted. Auto-verifies email post-OAuth (with awareness Strava emails are spoofable).
- **Returning users**: Strava OAuth OR email/password OR SMS sign-in (independent of phone verification).
- **Google OAuth**: not enabled (Strava is mandatory entry point).
- Session persistence: avoid Supabase calls inside `onAuthStateChange` to prevent deadlocks; defer with `setTimeout(0)`.
- Avatar loaded from DB into `AuthContext` to avoid placeholder flicker.

---

## 13. Privacy Modes (`user_settings.activity_sharing_mode`)

| Mode | Heatmap / Activities / PRs visible to |
|---|---|
| `public` | Anyone (but leaderboard still shows boolean only) |
| `followers` | Accepted followers + self |
| `private` | Self only |

Enforced via RLS on `daily_activities`, `strava_activities`, `best_efforts`, `streak_history`. Frontend always renders the minimal-actionable empty state with a CTA when data is locked down.

---

## 14. Referral System

- `generate_referral_code(runner_id)` RPC — idempotent; first call creates from `UPPER(LEFT(username,6)) + UPPER(RIGHT(uuid,4))`.
- **Multiple codes per user** (`referral_codes` table) for campaign tracking.
- `referrals` row recorded on signup if `state.ref` param present in OAuth flow.
- `referral_prizes` — admin-defined rewards.

---

## 15. Replication Checklist

1. Provision Postgres + apply migrations (tables, enums, `has_role`, triggers, grants).
2. Create two Strava apps (live + test), set redirect URI to `/functions/v1/strava-callback`.
3. Drop secrets into edge runtime.
4. Deploy all 23 edge functions; set `verify_jwt` per table in §10.
5. Run `strava-subscribe-webhook` once per app to register the push subscription.
6. Bootstrap admin via `create-admin` (one-time key) → link to a Strava-connected runner.
7. Configure Vonage toll-free number + webhook URL → `sms-webhook`.
8. Wire Lovable AI Gateway (or swap to direct OpenAI/Gemini if porting off Lovable).
9. Frontend: copy `src/` (auth context, route guards, theme, components), wire Tailwind tokens (orange-gradient design system, glassmorphism dark mode).
10. Verify Strava compliance: public surfaces show **boolean only**; AI Coach gated to admin.

---

## 16. Companion docs

This overview is the entry point. Four deep-dive companion documents in this folder cover the rest:

- **[EDGE_FUNCTIONS.md](./EDGE_FUNCTIONS.md)** — Every edge function with purpose, trigger type (webhook / scheduler / manual), required secrets, and example request/response payloads. Includes the recommended cron schedule matrix.
- **[BEST_EFFORTS_PIPELINE.md](./BEST_EFFORTS_PIPELINE.md)** — Step-by-step walkthrough of the two-stage PR pipeline: inputs, the estimate stage (0 API calls), the upgrade stage (≤30 calls), thresholds, persistence rules, caching, and failure modes.
- **[API_REFERENCE.md](./API_REFERENCE.md)** — Every profile and leaderboard read path expressed as both `supabase-js` calls and raw PostgREST URLs. Request/response schemas, sorting & filter parameters, full PostgREST + edge function error code table, and realtime channels.
- **[DATA_FETCHING_AND_RLS.md](./DATA_FETCHING_AND_RLS.md)** — The exact queries the frontend issues for leaderboard and profile views, the pagination strategy per surface, the indexes that back them, and the full RLS policy reference (`runners`, `daily_activities`, `user_follows`, `user_settings`, `user_roles`) including the privacy/sharing model that keeps the app Strava-policy compliant.

Read these in order when onboarding a new engineer: overview → edge functions → data fetching/RLS → API reference → best-efforts pipeline.
