import client from './client'

export const getAgencyLeaderboard = (limit = 20, metric) =>
  client.get('/agencies/leaderboard', { params: { limit, metric } }).then((r) => r.data)

export const getMyAgency = () => client.get('/agencies/mine').then((r) => r.data)

export const discoverAgencies = (params) =>
  client.get('/agencies/discover', { params }).then((r) => r.data)

export const getAgencyProfile = (slug) =>
  client.get(`/agencies/profile/${slug}`).then((r) => r.data)

export const getAgencyAnalytics = (agencyId) =>
  client.get(`/agencies/${agencyId}/analytics`).then((r) => r.data)

export const getAgencyAchievements = () =>
  client.get('/agencies/achievements').then((r) => r.data)

export const getAgencyOnboarding = () =>
  client.get('/agencies/onboarding').then((r) => r.data)

export const completeAgencyOnboarding = (body) =>
  client.post('/agencies/onboarding/complete', body).then((r) => r.data)

export const joinAgency = (agency_id, body = {}) =>
  client.post('/agencies/join', { agency_id, ...body }).then((r) => r.data)

export const leaveAgency = () => client.post('/agencies/leave').then((r) => r.data)

export const createAgencyInvite = (agencyId, body) =>
  client.post(`/agencies/${agencyId}/invites`, body).then((r) => r.data)

export const updateAgencyMemberRole = (agencyId, userId, role) =>
  client.patch(`/agencies/${agencyId}/members/${userId}/role`, { role }).then((r) => r.data)

export const resolveJoinContext = (params) =>
  client.get('/public/join/resolve', { params }).then((r) => r.data)

/** Super Admin / Corporate */
export const adminCreateAgency = (body) =>
  client.post('/agencies/admin/create', body).then((r) => r.data)

export const adminListAgencies = () =>
  client.get('/agencies/admin/list').then((r) => r.data)

export const adminUpdateAgency = (agencyId, body) =>
  client.patch(`/agencies/admin/${agencyId}`, body).then((r) => r.data)
