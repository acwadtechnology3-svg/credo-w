# Phase 6 — Enterprise MLM Intelligence

## Architecture

```
Purchase → mlm_events (immutable) → mlm_job_queue → propagation pipeline
                                              ├─ BV + bv_propagation_logs
                                              ├─ user_metric_snapshots (PV/BV/CV/GV/TV)
                                              ├─ carry_forward_logs + overflow_logs
                                              ├─ commission_calculations
                                              ├─ rank_snapshots + qualifications
                                              ├─ agency_metric_snapshots
                                              └─ fraud_flags
```

Weekly binary payout still uses existing `commissionService.runWeeklyCycle()` + `team_commissions`. Phase 6 adds **real-time accrual** records and audit trail.

## Event types

`package_purchased`, `package_upgraded`, `package_reversed`, `refund_issued`, `placement_activated`, `rank_achieved`, etc.

## Idempotency

- Events: `idempotency_key` = `mlm:package_purchased:{orderId}`
- Calculations: per event + user + type
- Locks: `mlm_propagation_locks`

## Reversal

`POST /api/super-admin/mlm/orders/:orderId/reverse` — reverses BV logs, commission calcs, payouts.

## Replay

`POST /api/super-admin/mlm/events/:id/replay` — rebuilds propagation for one event.

## User UI

`/mlm` — metrics, matching viz, commissions, event log.

## Env

- `MLM_SYNC_PROPAGATION=true` — process immediately on purchase (dev)
