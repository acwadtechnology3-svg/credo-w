# Phase 5 — Live Organization Experience

Extends Phases 1–4 and existing `game_*` gamification (does not replace `phase-p5-gamification.sql`).

## Deploy

1. `phase-p5-gamification.sql` (if not already run)
2. `phase-tree-onboarding.sql`
3. **`phase-p5-live-organization.sql`**
4. `npm install` (adds `@xyflow/react`)
5. Restart API

## New tables

| Table | Purpose |
|-------|---------|
| `agency_activity_feed` | Live feed events |
| `agency_member_xp` / `agency_member_levels` | Agency-scoped XP |
| `agency_member_prestige` / `agency_prestige_tiers` | Bronze → Immortal |
| `agency_missions` / `agency_member_missions` | Daily/weekly/monthly quests |
| `agency_seasonal_events` | Campaign multipliers |
| `agency_leaderboards` / `agency_leaderboard_entries` | Rankings + snapshots |
| `user_presence` | Online indicators on tree nodes |

## API (`/api/organization`)

- `GET /hub` — feed, profile, missions, leaderboards
- `GET /activity` — paginated feed
- `GET /tree/flow` — React Flow nodes/edges (lazy expand via `expanded` query)
- `GET /tree/search?q=` — member search in downline
- `GET /tree/nodes/:id/children` — lazy subtree
- `GET /tree/members/:userId` — hover card payload
- `GET /missions`, `POST /missions/claim`
- `GET /leaderboards/:key`
- `GET /identity` — gaming profile bundle

## Realtime (Socket.IO)

- `org:activity` — feed + tree invalidation
- `org:presence` — online status
- `agency:*` — existing agency room events
- Presence updated on connect/disconnect

## Event wiring

Automatic feed + XP/missions on:

- Package purchase / upgrade
- Tree activation
- Onboarding complete
- Join request approved

## UI routes

- `/organization` — full live hub (tree + feed + LB + missions)
- `/team/placement-tree` — flow (default) / 3D / 2D + sidebar feed

## Super admin

Continue using `/api/super-admin/gamification` for global `game_*` rules.

Agency mission/XP admin can be extended via new endpoints on `organization` router (future CMS page).
