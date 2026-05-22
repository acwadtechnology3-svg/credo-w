import client from './client'

export const getMyPackageStatus = () =>
  client.get('/packages/my-status').then((r) => r.data)

/** @param {string} package_id @param {string} idempotency_key — same key on retry = safe duplicate */
export const purchasePackage = (package_id, idempotency_key) =>
  client.post('/packages/purchase', { package_id, idempotency_key }).then((r) => r.data)

export function createPurchaseIdempotencyKey() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return `pkg-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`
}
