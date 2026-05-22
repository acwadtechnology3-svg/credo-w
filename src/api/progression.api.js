import client from './client.js'

const unwrap = (r) => r.data

export const getCareerHub = () => client.get('/progression/career').then(unwrap)
export const getCareerPath = () => client.get('/progression/career/path').then(unwrap)
export const getRankHistory = () => client.get('/progression/rank-history').then(unwrap)
export const getProgressionBonuses = () => client.get('/progression/bonuses').then(unwrap)
export const getProgressionLeaderboard = (key, period) =>
  client.get(`/progression/leaderboards/${key}`, { params: { period } }).then(unwrap)
export const getPublicPrestige = (userId) => client.get(`/progression/prestige/${userId}`).then(unwrap)
export const refreshMyRank = () => client.post('/progression/rank/refresh').then(unwrap)

export const getSAProgressionOverview = () =>
  client.get('/super-admin/progression/overview').then(unwrap)
export const forcePromotion = (body) =>
  client.post('/super-admin/progression/force-promotion', body).then(unwrap)
export const simulateBonus = (body) =>
  client.post('/super-admin/progression/simulate-bonus', body).then(unwrap)
export const refreshProgressionLeaderboard = (key) =>
  client.post(`/super-admin/progression/leaderboards/${key}/refresh`).then(unwrap)
