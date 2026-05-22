import client from './client'

const unwrap = (r) => (r.data?.data !== undefined ? r.data.data : r.data)

export const getBCOverview = () =>
  client.get('/super-admin/business/overview').then((r) => r.data.overview)

export const getBCPackages = () =>
  client.get('/super-admin/business/packages').then(unwrap)

export const saveBCPackage = (body, id) =>
  (id
    ? client.put(`/super-admin/business/packages/${id}`, body)
    : client.post('/super-admin/business/packages', body)
  ).then(unwrap)

export const getBCUpgradeRules = () =>
  client.get('/super-admin/business/upgrade-rules').then(unwrap)

export const saveBCUpgradeRule = (body, id) =>
  (id
    ? client.put(`/super-admin/business/upgrade-rules/${id}`, body)
    : client.post('/super-admin/business/upgrade-rules', body)
  ).then(unwrap)

export const deleteBCUpgradeRule = (id) =>
  client.delete(`/super-admin/business/upgrade-rules/${id}`).then((r) => r.data)

export const getBCRanks = () => client.get('/super-admin/business/ranks').then(unwrap)

export const saveBCRank = (body, id) =>
  (id
    ? client.put(`/super-admin/business/ranks/${id}`, body)
    : client.post('/super-admin/business/ranks', body)
  ).then(unwrap)

export const getBCPaymentMethods = () =>
  client.get('/super-admin/business/payment-methods').then(unwrap)

export const saveBCPaymentMethod = (body, id) =>
  (id
    ? client.put(`/super-admin/business/payment-methods/${id}`, body)
    : client.post('/super-admin/business/payment-methods', body)
  ).then(unwrap)

export const getBCPromotions = () =>
  client.get('/super-admin/business/promotions').then(unwrap)

export const saveBCPromotion = (body, id) =>
  (id
    ? client.put(`/super-admin/business/promotions/${id}`, body)
    : client.post('/super-admin/business/promotions', body)
  ).then(unwrap)

export const getBCFeatureFlags = () =>
  client.get('/super-admin/business/feature-flags').then(unwrap)

export const saveBCFeatureFlag = (body, id) =>
  (id
    ? client.put(`/super-admin/business/feature-flags/${id}`, body)
    : client.post('/super-admin/business/feature-flags', body)
  ).then(unwrap)

export const getBCAuditLogs = (limit = 50) =>
  client.get('/super-admin/business/audit-logs', { params: { limit } }).then(unwrap)
