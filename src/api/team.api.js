import client from './client'

export const getReferrals = (params) =>
  client.get('/team/referrals', { params }).then((r) => r.data)

export const checkReferralAvailability = (params) =>
  client.get('/team/check-availability', { params }).then((r) => r.data)

export const createReferral = (body) =>
  client.post('/team/new-referral', body).then((r) => r.data)

export const getGenealogy = (params) =>
  client.get('/team/genealogy', { params }).then((r) => r.data)

export const getPlacementTree = () =>
  client.get('/team/placement-tree').then((r) => r.data)

export const getTeamMember = (userId) =>
  client.get(`/team/members/${userId}`).then((r) => r.data)

export const notifyTeamMember = (userId, body) =>
  client.post(`/team/members/${userId}/notify`, body).then((r) => r.data)

export const getBusinessVolume = (params) =>
  client.get('/team/bv', { params }).then((r) => r.data)

export const getPersonalVolume = () => client.get('/team/pv').then((r) => r.data)
