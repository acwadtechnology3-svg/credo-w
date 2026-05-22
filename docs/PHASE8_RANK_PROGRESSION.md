# Phase P8 — Rank Engine + Bonus System + Career Progression

Transforms Credo W into a competitive digital leadership economy with dynamic ranks, bonuses, achievements, and visible career progression.

## Database setup

1. Supabase SQL Editor → run **`server/src/db/phase-p8-rank-progression.sql`**
2. Prerequisites: `schema.sql`, `phase-p2-business-control.sql`, `phase-p5-gamification.sql`, `phase-p6-mlm-intelligence.sql`

## Architecture

| Layer | Responsibility |
|--------|----------------|
| `rankProgressionEngine` | Multi-metric evaluation (PV/GV/TV/BV/CV, legs, directs), AND/OR groups, promotions, history |
| `bonusEngine` | Direct, binary matching, periodic payouts, idempotent `bonus_transactions` |
| `progressionV8Service` | Career hub, achievements (P8 keys), leaderboard refresh |
| `progressionEngine` (P5) | XP, levels, cosmetics — integrated on rank-up |
| Socket.IO | `progression:celebration`, `mlm:rank_promoted` |

## Default rank ladder

Beginner → Starter → Builder → Bronze → Silver → Gold → Platinum → Diamond → Crown Diamond → Royal Leader → Legend → Legacy Founder

Super Admin can edit, disable, reorder, or add ranks via `/super-admin/ranks` and `/super-admin/progression`.

## User experience

- **`/progression`** — XP hub (P5)
- **`/progression/career`** — Rank ladder, requirements, AI coaching, achievements, bonuses, leaderboards
- Real-time rank unlock animations via Socket.IO

## Admin controls

- Force promotion, bonus simulation, campaign management
- Leaderboard refresh
- Periodic bonus run (`POST /api/super-admin/progression/bonuses/run-periodic`)

## Requirement keys (examples)

`pv`, `gv`, `tv`, `bv_matching`, `cv`, `direct_recruits`, `active_recruits`, `weak_leg_volume`, `strong_leg_volume`, `package_level`, `achievement_count`, `training_completion`, `agency_performance`, `binary_matches`

## Anti-abuse

`user_fraud_scores` table + integration hooks with `progressionEngine.flagAbuse` on XP rate limits.
