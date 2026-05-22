/**
 * Central membership / package business rules (P0).
 * Super Admin catalog still lives in DB; these are engine invariants.
 */

export const MEMBERSHIP_LEVELS = {
  NONE: 0,
  MONO: 1,
  TRIPLE: 3,
  SEPT: 7,
}

export const MAX_MEMBERSHIP_LEVEL = MEMBERSHIP_LEVELS.SEPT

/** Direct purchase tiers when user has no package (level 0). */
export const DIRECT_PURCHASE_LEVELS = new Set([
  MEMBERSHIP_LEVELS.MONO,
  MEMBERSHIP_LEVELS.TRIPLE,
  MEMBERSHIP_LEVELS.SEPT,
])

export const SLOTS_BY_LEVEL = { 1: 1, 2: 2, 3: 3, 4: 4, 7: 7 }

export const LEVEL_NAMES = {
  0: 'غير مشترك',
  1: 'أحادي',
  2: 'ثنائي',
  3: 'ثلاثي',
  4: 'رباعي',
  7: 'سباعي',
}

/** P1 enterprise purchase states */
export const PURCHASE_STATUS = {
  INITIATED: 'initiated',
  ELIGIBILITY_CHECKED: 'eligibility_checked',
  PAYMENT_PENDING: 'payment_pending',
  PAYMENT_CONFIRMED: 'payment_confirmed',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
  COMPENSATING: 'compensating',
  REVERSED: 'reversed',
  MANUAL_REVIEW: 'manual_review',
}

export const CHECKOUT_STATUS = {
  ACTIVE: 'active',
  COMPLETED: 'completed',
  EXPIRED: 'expired',
  CANCELLED: 'cancelled',
}

export const CHECKOUT_TTL_MS = 15 * 60 * 1000
export const PENDING_PURCHASE_WINDOW_MS = 5 * 60 * 1000

export const IN_FLIGHT_STATUSES = new Set([
  PURCHASE_STATUS.INITIATED,
  PURCHASE_STATUS.ELIGIBILITY_CHECKED,
  PURCHASE_STATUS.PAYMENT_PENDING,
  PURCHASE_STATUS.PAYMENT_CONFIRMED,
  PURCHASE_STATUS.PROCESSING,
  PURCHASE_STATUS.COMPENSATING,
])

export const PURCHASE_STEPS = {
  VALIDATE_USER: 'validate_user',
  VALIDATE_ELIGIBILITY: 'validate_eligibility',
  CREATE_SNAPSHOT: 'create_snapshot',
  CREATE_ORDER: 'create_order',
  WALLET_DEBIT: 'wallet_debit',
  APPLY_MEMBERSHIP: 'apply_membership',
  CREDIT_BV: 'credit_bv',
  DIRECT_COMMISSION: 'direct_commission',
  RANK_CHECK: 'rank_check',
  PEARLS: 'pearls',
  NOTIFY_USER: 'notify_user',
  COMPENSATE_WALLET: 'compensate_wallet',
}

export function getLevelName(level) {
  return LEVEL_NAMES[level] ?? `Level ${level}`
}

export function defaultPermissions(pkg) {
  const level = pkg.package_level ?? 0
  return {
    can_create_team: level >= MEMBERSHIP_LEVELS.TRIPLE,
    max_team_members: level >= MEMBERSHIP_LEVELS.SEPT ? 500 : level >= MEMBERSHIP_LEVELS.TRIPLE ? 100 : 0,
  }
}
