# Phase 7 — Tree Engine + Live Network Visualization

## Architecture

| Layer | Tables / modules |
|-------|------------------|
| Placement truth | `tree_nodes` (binary parent/side/path) |
| Network enrichment | `network_nodes`, `network_volumes`, `network_leg_statistics` |
| Sponsor (unilevel) | `network_sponsors` + `users.sponsor_id` |
| Audit | `network_positions` |
| Activity | `network_activity_feed` |
| Entry flow | `network_entry_sessions` |
| Admin | `network_placement_settings` |

**Sponsor ≠ placement parent.** Ahmed may sponsor Omar while Omar is placed deeper on the left/right leg.

## Package gate

Users without an active package see locked onboarding:

> يجب تفعيل باقة أولاً للانضمام إلى المنظومة.

Buttons: شراء باقة · مشاهدة شرح النظام

## Post-package flow

1. **Entry wizard** — invite code, agency, expansion side, AUTO/MANUAL
2. **Onboarding** — 8 cinematic steps (3D, metrics, simulation)
3. **Live tree** — React Flow / 3D / 2D + analytics + activity ticker

## Placement strategies

Configured in `network_placement_settings` (super admin `/super-admin/network`):

- `LEFT` / `RIGHT`
- `AUTO_BALANCE` — fill empty slot, then weaker leg
- `WEAKER_LEG` / `STRONGER_LEG`
- `MANUAL_ONLY` — user must pick side; spillover via BFS when slot taken

## API (`/api/tree`)

| Endpoint | Purpose |
|----------|---------|
| `GET /access` | Gate + auto-activate pending placement |
| `GET /analytics` | PV/GV/TV/BV/CV, legs, team stats |
| `GET /activity` | Network activity feed |
| `GET/POST /entry/*` | Entry wizard session |
| `POST /entry/preview-placement` | Preview side / spillover |
| `POST /entry/complete` | Finalize placement |
| `GET /admin/network` | Admin search + counts |
| `POST /admin/move-placement` | Override placement |
| `POST /admin/freeze-node` | Freeze / unfreeze |
| `POST /admin/simulate-placement` | Dry-run |
| `PUT /admin/placement-settings` | Global strategy |

Existing: join requests, onboarding, visualization config.

## Setup

Run in Supabase SQL Editor (order):

1. `phase-tree-onboarding.sql` (if not done)
2. **`phase-p7-tree-engine.sql`**

Backfill runs automatically via `sync_network_node_from_tree()`.

## Realtime

- Socket events: `network:activity`, `placement_completed`, `org:activity`
- Optional: Supabase Realtime on `network_activity_feed` (publication in migration)

## UI routes

- `/team/placement-tree` — full experience
- `/team/join-requests` — approval queue
- `/super-admin/network` — admin control panel
