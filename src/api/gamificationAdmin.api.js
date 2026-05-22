import client from './client'

const base = '/super-admin/gamification'

export const getGamificationOverview = () => client.get(`${base}/overview`).then((r) => r.data)

export const listGamificationXpRules = () => client.get(`${base}/xp-rules`).then((r) => r.data)

export const upsertGamificationXpRule = (body) =>
  client.post(`${base}/xp-rules`, body).then((r) => r.data)

export const listGamificationMissions = () => client.get(`${base}/missions`).then((r) => r.data)

export const upsertGamificationMission = (body) =>
  client.post(`${base}/missions`, body).then((r) => r.data)

export const listGamificationAchievements = () =>
  client.get(`${base}/achievements`).then((r) => r.data)

export const listGamificationSeasons = () => client.get(`${base}/seasons`).then((r) => r.data)

export const listGamificationEvents = () => client.get(`${base}/events`).then((r) => r.data)
