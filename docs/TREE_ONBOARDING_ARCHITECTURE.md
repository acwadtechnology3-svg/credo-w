# Binary Tree & Network Onboarding Architecture

## Core rule

Users cannot access the live binary tree until they have an **active package** (`membership_status = active`, `current_package_level > 0`) and completed **tree onboarding** (8 cinematic steps).

## Data model

| Table | Purpose |
|-------|---------|
| `join_requests` | Inbound placement requests (pending → approved/rejected/expired) |
| `pending_tree_placements` | Deferred placement until package purchase |
| `onboarding_progress` | Per-user step completion |
| `onboarding_steps` | Super-admin configurable content |
| `onboarding_events` | Funnel analytics |
| `onboarding_rewards` | Pearls/badges per step |
| `tree_visualization_configs` | 3D scene settings |

User columns: `tree_status`, `tree_onboarding_completed`, `tree_unlocked_at`.

## Flows

### Scenario 1 — Package first, then join

1. User buys package → `purchaseEffects` → `treeActivationService.activateForUser`
2. User submits join request → sponsor approves (requires requester package + payment)
3. Placement executes via `treeService.placeUser`

### Scenario 2 — Referral before package

1. Register with `ref` / invite → `queuePendingPlacement` (no `tree_nodes` row)
2. User buys package → auto `activateForUser` → placement from pending row

### Scenario 3 — Invite email

1. Register via invite → pending placement + sponsor
2. Purchase → tree unlock + onboarding wizard

## API (`/api/tree`)

- `GET /access` — gate state, preview metrics, onboarding
- `GET|POST /join-requests` — create, list, approve, reject, cancel
- `GET /onboarding`, `POST /onboarding/complete-step`, `POST /onboarding/skip`
- Super admin: `GET|PUT /admin/onboarding-steps`, `PUT /admin/visualization-config`

## Edge cases

| Case | Behavior |
|------|----------|
| Package before join request | Approve runs placement immediately |
| Request expires | Cron/job sets `expired`, notifies requester |
| Sponsor rejected | Status `rejected`, notify requester |
| Sponsor banned | Manual; pending requests should be rejected by admin |
| Placement full | `placeUser` BFS spillover; failure → `pending_tree_placements.status = failed` |
| Duplicate pending request | Unique index per requester+sponsor |
| Sponsor change | Update `pending_tree_placements` before activation |
| Payment reversed | `suspendOnPaymentReversal` (hook from finance admin) |
| Onboarding interrupted | `interrupted_at` on progress; user can skip or resume |

## Frontend routes

- `/team/placement-tree` — locked preview \| onboarding wizard \| 3D/2D live tree
- `/team/join-requests` — requester + sponsor queues

## Setup

Run `server/src/db/phase-tree-onboarding.sql` in Supabase SQL Editor.

Install deps: `three`, `@react-three/fiber@8`, `@react-three/drei@9`.
