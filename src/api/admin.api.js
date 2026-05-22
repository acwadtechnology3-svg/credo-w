import client from './client'

export const getAdminOverview = () => client.get('/admin/overview').then((r) => r.data)
export const getAdminUsers = (params) => client.get('/admin/users', { params }).then((r) => r.data)
export const getAdminUser = (id) => client.get(`/admin/users/${id}`).then((r) => r.data)
export const updateUserStatus = (id, status) =>
  client.put(`/admin/users/${id}/status`, { status }).then((r) => r.data)
export const updateUserRole = (id, role) =>
  client.put(`/admin/users/${id}/role`, { role }).then((r) => r.data)
export const grantBonus = (id, body) =>
  client.post(`/admin/users/${id}/bonus`, body).then((r) => r.data)
export const getAdminWithdrawals = (params) =>
  client.get('/admin/withdrawals', { params }).then((r) => r.data)
export const processWithdrawal = (id, body) =>
  client.put(`/admin/withdrawals/${id}/process`, body).then((r) => r.data)
export const getAdminProducts = () => client.get('/admin/products').then((r) => r.data)
export const createProduct = (body) => client.post('/admin/products', body).then((r) => r.data)
export const updateProduct = (id, body) =>
  client.put(`/admin/products/${id}`, body).then((r) => r.data)
export const deleteProduct = (id) => client.delete(`/admin/products/${id}`).then((r) => r.data)
export const runCommission = () => client.post('/admin/commission/run').then((r) => r.data)
export const getCommissionCycles = () =>
  client.get('/admin/commission/cycles').then((r) => r.data)
export const getCycleDetails = (id) =>
  client.get(`/admin/commission/cycles/${id}`).then((r) => r.data)
export const getSettings = () => client.get('/admin/settings').then((r) => r.data)
export const updateSetting = (key, value) =>
  client.put(`/admin/settings/${key}`, { value }).then((r) => r.data)
export const getAuditLogs = (params) => client.get('/admin/audit', { params }).then((r) => r.data)
export const generateVouchers = (body) =>
  client.post('/admin/vouchers/generate', body).then((r) => r.data)
export const getAdminVouchers = (params) =>
  client.get('/admin/vouchers', { params }).then((r) => r.data)

export const getUserDetails = (id) => client.get(`/admin/users/${id}/details`).then((r) => r.data)
export const banUser = (id, body) => client.post(`/admin/users/${id}/ban`, body).then((r) => r.data)
export const unbanUser = (id, body) => client.post(`/admin/users/${id}/unban`, body).then((r) => r.data)

export const getAdminDeposits = (params) =>
  client.get('/admin/deposits', { params }).then((r) => r.data)
export const processDeposit = (id, body) =>
  client.put(`/admin/deposits/${id}/process`, body).then((r) => r.data)

export const getKycRequests = (params) => client.get('/admin/kyc', { params }).then((r) => r.data)
export const processKyc = (id, body) =>
  client.put(`/admin/kyc/${id}/process`, body).then((r) => r.data)

export const getAdminReports = (params) =>
  client.get('/admin/reports', { params }).then((r) => r.data)
