# Database Setup

## Step 1 — Run schema.sql

1. Go to https://supabase.com → your project → SQL Editor
2. Copy everything from schema.sql
3. Paste and click Run
4. Should complete with no errors

## Step 2 — Run seed.sql

1. Copy everything from seed.sql
2. Paste in SQL Editor and click Run
3. This creates: 9 ranks, 13 system settings, 6 sample products

## Quick setup (no DATABASE_URL)

Copy all of **`setup-once.sql`** into Supabase SQL Editor → Run once.
Then restart `npm run dev` and test `/register`.

## Pearls Wallet

Run **`phase-pearls-wallet.sql`** in SQL Editor after `schema.sql` / `users` exist.
Creates `pearls_wallet`, marketplace rewards, missions, achievements, campaigns, and replaces legacy `pearls_transactions` with the full ledger schema.

## Shop / Cart (Phase 4)

If add-to-cart fails or cart stays empty, run **`shop-phase4.sql`** (or re-run **`setup-once.sql`**, section 4) in SQL Editor.
Creates `cart_items` + `increment_direct_count()`.

Verify: `npm run test:shop` (server must be running on :3001).

## Member invitations (profile → Send premium email)

If you see **`Could not find the table 'public.member_invitations'`**:

1. Supabase → **SQL Editor**
2. Run all of **`member-invitations-bootstrap.sql`** (or **`phase-member-invitations.sql`**)
3. Reload `/profile` and try again

Or with `DATABASE_URL` in `.env`: `npm run db:invitations`

## Step 3 — RLS for backend API

Run `rls-backend.sql` if signup/login return database/RLS errors and you use the **publishable** key in `.env`.
Better: set `SUPABASE_SERVICE_KEY` to the real **service_role** secret (bypasses RLS).

## Premium Support Chat (phase-support-chat)

Run **`phase-support-chat.sql`** in SQL Editor after `schema.sql`.

Creates threaded chat (`support_messages`), attachments, agents registry, activity logs, and extends `support_tickets` with ticket numbers, priority, departments, and smart context.

If sending messages fails with RLS on `support_messages`, run **`fix-support-messages-rls.sql`** (or set **`SUPABASE_SERVICE_KEY`** to service_role in `.env`).

Routes: `GET/POST /api/support/*` — public stats at `GET /api/support/stats`.

## Admin Control (Phase A)

Run **`phase-admin-control.sql`** in SQL Editor for ban columns, deposit requests, KYC documents, and notification templates.

## Super Admin (Phase Super Admin)

Run **`phase-super-admin.sql`** in SQL Editor after schema + seed.
Creates: `packages` table, `super_admin` role, financial caps, rank monthly caps, and user **superadmin** / **SuperAdmin@2026**.

## Storage uploads (avatars, products)

1. Create bucket **`credo-w-media`** in Supabase → Storage (public).
2. Set **`SUPABASE_SERVICE_KEY`** (service_role) in `.env` — required for server uploads.
3. If you only have the anon key, run **`phase-storage-policies.sql`** in SQL Editor.

## Phase P0 — Production foundation (required)

Run **`phase-p0-foundation.sql`** in SQL Editor after phase-d reseed.  
Creates `teams` / `team_members` if missing (or run **`phase-profile-identity.sql`** first for full team + gamification).

Creates:
- `package_snapshots` — frozen catalog at purchase time
- `purchase_transactions` — idempotent audit log (`pending` → `completed` / `failed`)
- `payment_methods_config` — SA prep (CMONEY seeded)
- `wallet_apply_delta()` — atomic wallet debit/credit
- Indexes, membership constraints, team foundation fields on `users`

Then restart the API server. Package purchase requires `idempotency_key` in the request body.

## Phase P1 — Purchase engine (required after P0)

Run **`phase-p1-purchase-engine.sql`** in SQL Editor.

Adds:
- `checkout_sessions` — price lock, 15 min TTL, one active session per user
- P1 purchase state machine on `purchase_transactions`
- `purchase_steps` + `purchase_transition_log` — audit trail
- `wallet_reconciliation_logs` + `purchase_job_queue` (stub)

**API v2:**
- `POST /api/v2/checkout/session` `{ package_id }`
- `POST /api/v2/purchases` `{ package_id, checkout_session_id, idempotency_key }`
- `GET /api/v2/purchases/:id`
- `GET /api/v2/membership/me`

Legacy `POST /api/packages/purchase` still works (auto-creates checkout session).

## Phase P2 — Dynamic Business Control (required after P1)

Run **`phase-p2-business-control.sql`** in SQL Editor.

Creates:
- **Package Studio** columns on `packages` (themes, visibility, rewards_json, config_version)
- **`package_upgrade_rules`** — dynamic upgrade graph (replaces hardcoded 1→3, 3→7 paths)
- **`rank_requirements`** / **`rank_rewards`** — admin-driven qualification & perks
- **`promotions`** / **`promotion_rules`**, **`feature_flags`**, **`ui_configurations`**
- **`team_policy_rules`**, **`wallet_rules_config`**
- **`admin_roles`**, **`admin_permissions`**, **`config_version_snapshots`**, **`business_events`**

Seeds upgrade rules from existing packages when the catalog has rows.

**Runtime:** `rulesEngine.service.js` validates purchases and membership options from DB rules (60s cache; invalidated on admin edits).

**Super Admin API** (requires `super_admin` role):

| Endpoint | Purpose |
|----------|---------|
| `GET /api/super-admin/business/overview` | KPI counts |
| `GET/POST/PUT /api/super-admin/business/packages` | Package studio |
| `GET/POST/PUT/DELETE /api/super-admin/business/upgrade-rules` | Upgrade graph |
| `GET/POST/PUT /api/super-admin/business/ranks` | Ranks + requirements + rewards |
| `GET/POST/PUT /api/super-admin/business/payment-methods` | Payment rails |
| `GET/POST/PUT /api/super-admin/business/promotions` | Campaigns |
| `GET/POST/PUT /api/super-admin/business/feature-flags` | Feature toggles |
| `GET/PUT /api/super-admin/business/team-rules` | Team policy JSON |
| `GET/PUT /api/super-admin/business/wallet-rules` | Wallet policy JSON |
| `GET /api/super-admin/business/audit-logs` | Admin audit trail |

**Frontend:** `/super-admin/business` hub + upgrades, payments, promotions, feature-flags pages.

**Edge cases:** Checkout locks price in `checkout_sessions`; package disabled mid-checkout fails at validation; rank edits apply to new qualifications only (historical purchases use snapshots).

## Phase P3 — Enterprise Finance & Payments (required after P2)

Run **`phase-p3-finance.sql`** in SQL Editor.

Creates:
- Extended wallet types (`BONUS`, `LOCKED`, `PENDING`, `PROMO`, `CASHBACK`, `RANK_REWARD`)
- **`wallet_ledger_entries`** — immutable before/after ledger (wired into `wallet_apply_delta`)
- **`wallet_holds`** — hybrid payment reserves
- **`payment_sessions`** + state machine (`INITIATED` → `COMPLETED` / `REJECTED` / …)
- **`payment_proofs`** + **`payment_reviews`** — manual approval queue
- **`financial_refunds`**, **`fraud_signals`**, external payment method seeds

**User API (`/api/v3/finance`):**
- `GET /wallets` — full ecosystem with available balances
- `GET /ledger` — immutable ledger history
- `POST /hybrid/quote` — wallet/external split suggestion
- `POST /payment-sessions` — start hybrid payment (links P1 checkout session)
- `POST /payment-sessions/:id/complete-wallet` — full wallet pay
- `POST /payment-sessions/:id/proof` — upload external proof

**Admin API (`/api/admin/finance`):**
- `GET /dashboard`, `GET /payment-reviews`, approve/reject, ledger explorer, refunds

**UI:**
- `/finance` — multi-wallet ecosystem + immutable ledger explorer
- `/packages/pay?package_id=…` — hybrid payment wizard (wallet + external proof)
- `/admin/finance` — Finance Hub (approvals, sessions, ledger, fraud, analytics)

**Cron:** payment session expiry every 10 min (`finance.job.js`).

**Edge-case behavior:**
| Scenario | Backend | Recovery |
|----------|---------|----------|
| Wallet reserved, payment fails | Holds released, session → `FAILED`/`REJECTED` | User retries new session |
| Duplicate receipt hash | `payment_proofs.is_duplicate`, fraud signal, review `fraud_suspected` | Manual reject |
| Expired session | Cron → `EXPIRED`, holds released | New checkout + session |
| Admin rejects after reserve | `releaseHolds`, `REJECTED`, notify user | Wallet funds unlocked |
| Refund after purchase | `financial_refunds` + wallet credit + optional purchase compensate | Admin `processRefund` |
| User suspended during review | Approve blocked 403 | Reject + release holds |
| Simultaneous approve | Purchase idempotency key on `executePurchase` | Second call deduped |

Enable external rails: set feature flag `external_payments` = true in Super Admin (`/super-admin/business/feature-flags`).

## Package upgrades (Phase D)

Run **`phase-d-package-upgrades.sql`** in SQL Editor after **`phase-super-admin.sql`**.
Adds cumulative package levels (أحادي → ثنائي → ثلاثي → رباعي → سباعي), `user_packages` history, and user slot tracking columns.

**If packages page shows no tiers:** the `packages` table is empty (often after `DELETE` without a successful `INSERT`). Run **`phase-d-reseed-packages.sql`** — it inserts 5 rows only when the table is empty. Confirm the last query returns 5 rows.

**RLS:** Server inserts need **`SUPABASE_SERVICE_KEY`** = real `service_role` secret (not the anon/publishable key). Or run **`rls-backend.sql`** / the policy block in `phase-d-reseed-packages.sql`.

**If package purchase fails with `row-level security policy for table "user_packages"`:** run **`fix-user-packages-rls.sql`** in SQL Editor (or re-run **`rls-backend.sql`** for all tables).

## Phase P4 — Agency Ecosystem & Organization Structure

Run **`phase-p4-agencies.sql`** in SQL Editor after P0/P1 (replaces free user-created teams).

Creates / migrates:
- **`agencies`** — official managed organizations (branding, rank, verification, treasury prep)
- **`agency_members`**, **`agency_role_definitions`**, **`agency_invitations`**
- **`agency_rank_definitions`**, achievements, missions, events, statistics, rankings
- **`agency_reputation_logs`**, moderation, onboarding, permissions, transfer logs
- `users.agency_id` — organizational identity (separate from binary tree + sponsor genealogy)
- Compatibility views `teams` / `team_members` for legacy reads

**Rules:** Only `super_admin` / `admin` create agencies. Members join via invite links.

**Operational migration:** run **`phase-p4-agency-operations.sql`** after `phase-p4-agencies.sql` (adds `agency_member_onboarding_progress`, `agency_realtime_events`).

**User API (`/api/agencies`):**
- `GET /discover`, `GET /profile/:slug`, `GET /leaderboard`
- `GET /mine`, `GET /dashboard/member`, `GET /participation` (package gate)
- `GET /onboarding` + `POST /onboarding/complete` — cinematic agency profile onboarding
- `GET /journey/onboarding` + `POST /journey/onboarding/step` — 10-step post-package journey
- `POST /join`, `POST /leave`
- Join requests: `POST /:agencyId/join-requests`, `GET /:agencyId/join-requests`, approve/reject
- Placement: `POST /placement/preview`, `POST /placement/assign`, `GET /placement/context`
- Invites: `GET /invites/:code/card` (public), `POST /:agencyId/invites`, email + analytics
- Dashboard: `GET /:agencyId/dashboard/*` (overview, growth, live-bv, team-power, pending-*)
- Tree (3D prep): `GET /:agencyId/tree/scope|subtree|node|expand|search|sponsor-trace`
- Settings: `GET|PATCH /:agencyId/settings`, `POST /:agencyId/deactivate`
- `POST /admin/create` — Super Admin agency creation
- Admin ops: move member, override placement, change sponsor, BV adjust, freeze, impersonate

**Public:** `GET /api/public/join/resolve`, `GET /api/public/join/agency/:slug`

**Registration query params:** `agency`, `agency_code`, `ref` (recruiter), `side` (placement)

**UI:**
- `/agencies/discover` — featured verified agencies
- `/agencies/profile/:slug` — premium agency profile
- `/agencies/onboarding` — cinematic member onboarding
- `/agencies/leaderboard` — org rankings

Legacy `/api/teams` routes remain but user creation returns `403 AGENCY_ECOSYSTEM_ONLY`.

## Agency Communication & Groups

Run **`phase-agency-groups.sql`** in SQL Editor after `phase-p4-agencies.sql`.

Creates:
- **`agency_groups`** — organization HQ per agency (main + event/training/voice prep)
- **`agency_group_channels`** — main, announcements (read-only), leadership, onboarding, support
- **`agency_group_members`**, **`agency_group_roles`**, **`agency_messages`**, reactions, attachments
- **`agency_group_bans`**, **`agency_group_mutes`**, **`agency_group_warnings`**, invites, activity logs
- **`agency_voice_rooms`** — future voice / live sessions
- RPC **`bootstrap_agency_group_infra(agency_id, owner_id)`** — auto-provision on agency create

**Access rules:** approved `agency_members` + active package + not banned.

**API** (`/api/agencies/:agencyId/groups`, auth required):
- `GET /workspace` — channels, unread, permissions
- `GET /channels/:channelId/messages`, `POST` send, `POST` upload, `POST` ai
- `POST /messages/:id/reactions`, pin, delete
- `POST /moderation/:userId/mute|ban|warn`
- `GET /search`, `GET /analytics`, `GET /members`, `POST /event-rooms`

**UI:** `/agencies/comms` — futuristic org chat (glassmorphism, realtime socket, Credo AI in groups).

**Socket:** `agency-group:join-channel`, `agency-group:typing`, `agency-group:message`.

**Message delete** (run **`fix-agency-message-delete.sql`** if the table already exists):
- `حذف لدي` — hides message for that user only (`agency_message_user_hides`)
- `حذف للجميع` — shows placeholder to members; **admins/moderators still see full text**

**Migration file:** `phase-p4-agencies.sql` is the single canonical P4 script (idempotent, all states). Re-run the entire file after any partial failure. Optional `fix-agency-members-bootstrap.sql` only renames `team_members` if you need a quick members fix.

## Phase P5 — Gamification & Prestige Engine

Run **`phase-p5-gamification.sql`** in SQL Editor after `schema.sql` (needs `users`). Bootstraps `user_gamification` if missing — you do **not** need `phase-profile-identity.sql` first. Recommended: pearls wallet + P4 teams for full team/season features.

Creates:
- Extended **`user_gamification`** (global/seasonal/team/leadership XP, prestige, equipped cosmetics)
- **`game_xp_rules`** — admin-configurable XP formulas (no hardcoded rates)
- **`game_level_definitions`**, **`game_prestige_definitions`**
- **`game_achievement_definitions`** / **`game_user_achievements`**
- **`game_mission_definitions`** / **`game_user_missions`** (daily/weekly/seasonal)
- **`game_streak_definitions`** / **`game_user_streaks`**
- **`game_cosmetic_definitions`** / **`game_user_cosmetics`** (cosmetic-only — no MLM impact)
- **`game_seasons`**, **`game_season_rewards`**, **`game_limited_events`**
- **`game_booster_definitions`**, **`game_leaderboard_*`**, **`game_xp_ledger`**, **`game_reward_claims`**
- RPC **`game_grant_xp`** — idempotent atomic XP grants

**User API (`/api/gamification`):**
- `GET /hub` — full progression state (XP, missions, achievements, cosmetics, season, FOMO events)
- `GET /leaderboards`, `GET /leaderboards/:key`
- `POST /equip/cosmetic`, `POST /equip/title`, `POST /cosmetics/purchase`
- `POST /actions` — client-triggered mission progress (shop visit, referral share, etc.)
- `GET /compare/:userId` — social comparison

**Super Admin API (`/api/super-admin/gamification`):**
- XP rules, missions, achievements, seasons, limited events, config, XP rollback

**UI:**
- `/progression` — cinematic Progression Hub (Framer Motion celebrations via socket)
- `/super-admin/gamification` — admin overview

**Event hooks:** login, purchase, referral, rank-up, team founded → `progressionEngine.service.js`

**Cron:** leaderboard refresh every 15 min (`gamification.job.js`).

**Edge cases:**
| Scenario | Handling |
|----------|----------|
| Duplicate XP grant | `idempotency_key` on `game_xp_ledger` + RPC dedup |
| Duplicate mission reward | `game_reward_claims` unique + `reward_claimed` flag |
| XP rollback | Admin `POST /xp-rollback` reverses ledger + recalculates level |
| Rate limit / farming | `max_per_hour` per rule + `game_progression_flags` |
| Cosmetic double-purchase | `game_reward_claims` claim_ref unique |
| Season reset | Set `reset_seasonal_xp` on season; run admin season transition (future cron) |

## Credo Academy — Courses (Phase C)

Run **`phase-c-courses.sql`** in SQL Editor after `schema.sql` (needs `users`, `orders`, `ranks`).
Creates: `course_categories`, `courses`, `course_sections`, `lessons`, `course_enrollments`, `lesson_progress`, `course_reviews`, and `update_course_stats()`.
Includes `access_type` (`public`, `marketers_only`, `invited_only`, `rank_required`) and `required_rank_id`.

## Phase 6 — MLM Intelligence & Compensation Engine

Run **`phase-p6-mlm-intelligence.sql`** after Phase 5 + packages + tree migrations.

Creates: `mlm_events`, `mlm_job_queue`, `bv_propagation_logs`, `user_metric_snapshots`, `commission_calculations`, `commission_payouts`, carry/overflow/fraud tables.

API: `/api/mlm/*` (user dashboard), `/api/super-admin/mlm/*` (rules, replay, reverse, queue).

Purchase flow routes through `mlmPropagationService` (async queue every 2 min). Set `MLM_SYNC_PROPAGATION=true` for immediate processing in dev.

See `docs/PHASE6_MLM_INTELLIGENCE.md`.

## Phase 5 — Live Organization (gamification layer + interactive tree)

Run **`phase-p5-live-organization.sql`** after `phase-p5-gamification.sql` and `phase-tree-onboarding.sql`.

Creates: `agency_activity_feed`, `agency_member_xp`, `agency_member_prestige`, `agency_missions`, `agency_leaderboards`, `user_presence`.

API: `/api/organization/*` — hub, activity feed, React Flow tree, missions, leaderboards.

UI: `/organization` (live hub), enhanced `/team/placement-tree` (flow + 3D + 2D + activity feed).

## Phase 7 — Tree Engine (network layer + placement engine)

Run **`phase-p7-tree-engine.sql`** after `phase-tree-onboarding.sql` and Phase 5/6.

Creates: `network_nodes`, `network_sponsors`, `network_positions`, `network_volumes`, `network_snapshots`, `network_rank_history`, `network_leg_statistics`, `network_activity_feed`, `network_entry_sessions`, `network_placement_settings`, and `sync_network_node_from_tree()`.

API: extended `/api/tree/*` — analytics, activity, entry wizard, admin network panel.

See `docs/PHASE7_TREE_ENGINE.md`.

## Phase P8 — Rank Engine + Bonus System + Career Progression

Run **`phase-p8-rank-progression.sql`** after Phase P2 (rank studio), P5 gamification, and P6 MLM.

Creates / extends:
- **`ranks`** — categories, colors, AND/OR `logic_mode`, animations
- **`rank_requirement_groups`** + extended **`rank_requirements`** (multi-condition engine)
- **`user_ranks`**, **`rank_history`**
- **`bonuses`**, **`bonus_rules`**, **`bonus_transactions`**
- **`achievement_rewards`**, views **`xp_levels`** / **`user_xp`**
- **`seasonal_campaigns`**, **`leaderboards`**, **`leaderboard_entries`**
- **`agency_rank_levels`**, **`user_fraud_scores`**
- Seeds 12 default ranks (Beginner → Legacy Founder), 10 bonus types, P8 achievements

**API:**
- User: `/api/progression/career`, `/career/path`, `/rank-history`, `/bonuses`, `/leaderboards/:key`, `/rank/refresh`
- Super Admin: `/api/super-admin/progression/*` (overview, force promotion, simulate bonus, campaigns)

**UI:** `/progression/career` (rank ladder, AI coach, achievements, leaderboards), `/super-admin/progression`

**Jobs:** weekly/monthly binary bonuses, leaderboard refresh, rank sweep (every 6h).

See `docs/PHASE8_RANK_PROGRESSION.md`.

## Binary tree onboarding (package-gated tree + join requests)

Run **`phase-tree-onboarding.sql`** in SQL Editor after `schema.sql` + package migrations (agencies **not** required). After `phase-p4-agencies.sql`, re-run the script (or just the final `DO $$` block) to add optional `agency_id` foreign keys.

Creates: `join_requests`, `pending_tree_placements`, `onboarding_*`, `tree_visualization_configs`, and user columns `tree_status`, `tree_onboarding_completed`.

API: `/api/tree/*` — see `docs/TREE_ONBOARDING_ARCHITECTURE.md`.

## Step 4 — Create admin user (optional)

Run `admin-bootstrap.sql` in SQL Editor. Login: **admin** / **Admin@1234**  
Or register the **first** account at `/register` (no sponsor needed) — it becomes root admin `USR-000000`.

## Step 5 — Add .env values

Copy your Supabase project URL and service_role key into .env

## Tables created (24 total):

ranks, users, tree_nodes, wallets, wallet_transactions,
bv_logs, products, shipping_addresses, orders, order_items,
commission_cycles, team_commissions, level_bonuses, vouchers,
withdrawals, bank_accounts, notifications, audit_logs,
system_settings, marketing_assets, support_tickets,
pearls_transactions, subscriptions, user_subscriptions
