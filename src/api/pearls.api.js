import client from './client'

export const getPearlsWallet = () => client.get('/pearls/wallet').then((r) => r.data)
export const getPearlsTx = (params) => client.get('/pearls/transactions', { params }).then((r) => r.data)
export const getPearlRewards = (params) => client.get('/pearls/rewards', { params }).then((r) => r.data)
export const redeemPearlReward = (reward_id) =>
  client.post('/pearls/redeem', { reward_id }).then((r) => r.data)
export const getPearlMissions = () => client.get('/pearls/missions').then((r) => r.data)
export const claimMission = (mission_id) =>
  client.post(`/pearls/missions/${mission_id}/claim`).then((r) => r.data)
export const getPearlAchievements = () => client.get('/pearls/achievements').then((r) => r.data)
export const getPearlLeaderboard = () => client.get('/pearls/leaderboard').then((r) => r.data)
export const adminGrantPearls = (body) => client.post('/pearls/admin/grant', body).then((r) => r.data)
export const getPearlAnalytics = () => client.get('/pearls/admin/analytics').then((r) => r.data)
