/** P3 payment session states — explicit transitions only */

export const PAYMENT_STATUS = {
  INITIATED: 'INITIATED',
  WALLET_RESERVED: 'WALLET_RESERVED',
  EXTERNAL_PENDING: 'EXTERNAL_PENDING',
  UNDER_REVIEW: 'UNDER_REVIEW',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
  EXPIRED: 'EXPIRED',
  REVERSED: 'REVERSED',
  REFUNDED: 'REFUNDED',
}

const TRANSITIONS = {
  INITIATED: ['WALLET_RESERVED', 'EXTERNAL_PENDING', 'COMPLETED', 'FAILED', 'EXPIRED'],
  WALLET_RESERVED: ['EXTERNAL_PENDING', 'UNDER_REVIEW', 'COMPLETED', 'FAILED', 'EXPIRED', 'REVERSED'],
  EXTERNAL_PENDING: ['UNDER_REVIEW', 'EXPIRED', 'FAILED', 'REVERSED'],
  UNDER_REVIEW: ['APPROVED', 'REJECTED', 'FAILED'],
  APPROVED: ['COMPLETED', 'FAILED'],
  REJECTED: ['REFUNDED', 'REVERSED'],
  COMPLETED: ['REFUNDED', 'REVERSED'],
  FAILED: [],
  EXPIRED: [],
  REVERSED: [],
  REFUNDED: [],
}

export function canTransitionPayment(from, to) {
  if (!from) return to === PAYMENT_STATUS.INITIATED
  return (TRANSITIONS[from] || []).includes(to)
}

export function assertPaymentTransition(from, to) {
  if (!canTransitionPayment(from, to)) {
    const err = new Error(`Invalid payment transition: ${from} → ${to}`)
    err.code = 'INVALID_PAYMENT_TRANSITION'
    throw err
  }
}

export const REVIEW_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  NEEDS_REVIEW: 'needs_review',
  FRAUD_SUSPECTED: 'fraud_suspected',
  EXPIRED: 'expired',
}
