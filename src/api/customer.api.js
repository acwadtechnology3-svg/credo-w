import client from './client'

export { getPearlsWallet } from './pearls.api'
export const getVouchers = (params) => client.get('/customer/vouchers', { params }).then((r) => r.data)
export const getCommunity = (params) => client.get('/customer/community', { params }).then((r) => r.data)
export const getMembership = () => client.get('/customer/membership').then((r) => r.data)
export const getAvailableSubscriptions = () =>
  client.get('/customer/subscriptions').then((r) => r.data)
export const subscribe = (subscription_id) =>
  client.post('/customer/subscriptions/subscribe', { subscription_id }).then((r) => r.data)
