import client from './client'
import { asArray } from '../lib/safeData.js'

export const getProgressionHub = () => client.get('/gamification/hub').then((r) => r.data)

export const getLeaderboards = () =>
  client.get('/gamification/leaderboards').then((r) => asArray(r.data))

export const getLeaderboard = (key, period = 'all') =>
  client.get(`/gamification/leaderboards/${key}`, { params: { period } }).then((r) => r.data)

export const getCosmeticsCatalog = () => client.get('/gamification/cosmetics').then((r) => r.data)

export const equipCosmetic = (cosmetic_key) =>
  client.post('/gamification/equip/cosmetic', { cosmetic_key }).then((r) => r.data)

export const equipTitle = (title_key) =>
  client.post('/gamification/equip/title', { title_key }).then((r) => r.data)

export const purchaseCosmetic = (cosmetic_key) =>
  client.post('/gamification/cosmetics/purchase', { cosmetic_key }).then((r) => r.data)

export const triggerProgressionAction = (action) =>
  client.post('/gamification/actions', { action }).then((r) => r.data)

export const compareProgression = (userId) =>
  client.get(`/gamification/compare/${userId}`).then((r) => r.data)
