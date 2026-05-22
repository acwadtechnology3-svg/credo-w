import { PURCHASE_STATUS } from './packageRules.js'

/** Explicit allowed transitions — no silent jumps. */
export const PURCHASE_TRANSITIONS = {
  [PURCHASE_STATUS.INITIATED]: [
    PURCHASE_STATUS.ELIGIBILITY_CHECKED,
    PURCHASE_STATUS.FAILED,
  ],
  [PURCHASE_STATUS.ELIGIBILITY_CHECKED]: [
    PURCHASE_STATUS.PAYMENT_PENDING,
    PURCHASE_STATUS.FAILED,
  ],
  [PURCHASE_STATUS.PAYMENT_PENDING]: [
    PURCHASE_STATUS.PAYMENT_CONFIRMED,
    PURCHASE_STATUS.FAILED,
  ],
  [PURCHASE_STATUS.PAYMENT_CONFIRMED]: [
    PURCHASE_STATUS.PROCESSING,
    PURCHASE_STATUS.FAILED,
  ],
  [PURCHASE_STATUS.PROCESSING]: [
    PURCHASE_STATUS.COMPLETED,
    PURCHASE_STATUS.COMPENSATING,
    PURCHASE_STATUS.FAILED,
    PURCHASE_STATUS.MANUAL_REVIEW,
  ],
  [PURCHASE_STATUS.COMPENSATING]: [
    PURCHASE_STATUS.REVERSED,
    PURCHASE_STATUS.FAILED,
    PURCHASE_STATUS.MANUAL_REVIEW,
  ],
  [PURCHASE_STATUS.COMPLETED]: [],
  [PURCHASE_STATUS.FAILED]: [],
  [PURCHASE_STATUS.REVERSED]: [],
  [PURCHASE_STATUS.MANUAL_REVIEW]: [
    PURCHASE_STATUS.COMPENSATING,
    PURCHASE_STATUS.REVERSED,
    PURCHASE_STATUS.FAILED,
  ],
}

/** Map legacy P0 DB values if migration not run yet. */
export const LEGACY_STATUS_MAP = {
  pending: PURCHASE_STATUS.INITIATED,
  processing: PURCHASE_STATUS.PROCESSING,
  completed: PURCHASE_STATUS.COMPLETED,
  failed: PURCHASE_STATUS.FAILED,
  reversed: PURCHASE_STATUS.REVERSED,
}

export function normalizePurchaseStatus(status) {
  return LEGACY_STATUS_MAP[status] ?? status
}

export function canTransition(fromStatus, toStatus) {
  const from = normalizePurchaseStatus(fromStatus)
  const to = normalizePurchaseStatus(toStatus)
  if (from === to) return true
  const allowed = PURCHASE_TRANSITIONS[from]
  return allowed?.includes(to) ?? false
}

export function assertTransition(fromStatus, toStatus) {
  if (!canTransition(fromStatus, toStatus)) {
    const err = new Error(`Invalid purchase transition: ${fromStatus} → ${toStatus}`)
    err.code = 'INVALID_TRANSITION'
    throw err
  }
}

export const TERMINAL_STATUSES = new Set([
  PURCHASE_STATUS.COMPLETED,
  PURCHASE_STATUS.FAILED,
  PURCHASE_STATUS.REVERSED,
])

export const IN_FLIGHT_STATUSES = new Set([
  PURCHASE_STATUS.INITIATED,
  PURCHASE_STATUS.ELIGIBILITY_CHECKED,
  PURCHASE_STATUS.PAYMENT_PENDING,
  PURCHASE_STATUS.PAYMENT_CONFIRMED,
  PURCHASE_STATUS.PROCESSING,
  PURCHASE_STATUS.COMPENSATING,
])
