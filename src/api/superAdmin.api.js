import client from './client'

export const getSAPackages = () => client.get('/super-admin/packages').then((r) => r.data)
export const createSAPackage = (body) => client.post('/super-admin/packages', body).then((r) => r.data)
export const updateSAPackage = (id, body) =>
  client.put(`/super-admin/packages/${id}`, body).then((r) => r.data)
export const deleteSAPackage = (id) => client.delete(`/super-admin/packages/${id}`).then((r) => r.data)

export const getSARanks = () => client.get('/super-admin/ranks').then((r) => r.data)
export const createSARank = (body) => client.post('/super-admin/ranks', body).then((r) => r.data)
export const updateSARank = (id, body) => client.put(`/super-admin/ranks/${id}`, body).then((r) => r.data)

export const getLevelBonus = () => client.get('/super-admin/level-bonus').then((r) => r.data)
export const updateLevelBonus = (body) => client.put('/super-admin/level-bonus', body).then((r) => r.data)

export const getSASettings = () => client.get('/super-admin/settings').then((r) => r.data)
export const updateSASetting = (key, value) =>
  client.put(`/super-admin/settings/${key}`, { value }).then((r) => r.data)

export const getSAAdmins = () => client.get('/super-admin/admins').then((r) => r.data)
export const createSAAdmin = (body) => client.post('/super-admin/admins', body).then((r) => r.data)
export const updateSAAdminRole = (id, role) =>
  client.put(`/super-admin/admins/${id}/role`, { role }).then((r) => r.data)

export const setMaintenance = (enabled, message) =>
  client.post('/super-admin/maintenance', { enabled, message }).then((r) => r.data)
export const reverseCommission = (body) =>
  client.post('/super-admin/commission/reverse', body).then((r) => r.data)
export const grantBV = (body) => client.post('/super-admin/bv/grant', body).then((r) => r.data)
export const getPlatformStats = () => client.get('/super-admin/platform-stats').then((r) => r.data)
