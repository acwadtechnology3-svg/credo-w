import client from './client'
import { createPurchaseIdempotencyKey } from './packages.api'

export { createPurchaseIdempotencyKey }

export const createCheckoutSession = (package_id) =>
  client.post('/v2/checkout/session', { package_id }).then((r) => r.data)

export const executePurchase = (body) =>
  client.post('/v2/purchases', body).then((r) => r.data)

export const getPurchase = (id) => client.get(`/v2/purchases/${id}`).then((r) => r.data)

export const getMembershipMe = () => client.get('/v2/membership/me').then((r) => r.data)
