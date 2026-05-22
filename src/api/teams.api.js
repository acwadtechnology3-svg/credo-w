import client from './client'

export const getTeamLeaderboard = (limit = 20) =>
  client.get('/teams/leaderboard', { params: { limit } }).then((r) => r.data)

export const getMyTeam = () => client.get('/teams/mine').then((r) => r.data)

export const getFoundationStatus = () =>
  client.get('/teams/foundation/status').then((r) => r.data)

export const validateTeamSlug = (slug) =>
  client.get('/teams/foundation/validate-slug', { params: { slug } }).then((r) => r.data)

export const establishTeam = (body) =>
  client.post('/teams/foundation/establish', body).then((r) => r.data)

export const discoverTeams = (params) =>
  client.get('/teams/discover', { params }).then((r) => r.data)

export const getTeamProfile = (slug) =>
  client.get(`/teams/profile/${slug}`).then((r) => r.data)

export const getTeamAnalytics = (teamId) =>
  client.get(`/teams/${teamId}/analytics`).then((r) => r.data)

export const getTeamAchievements = () =>
  client.get('/teams/achievements').then((r) => r.data)

export const completeTeamOnboarding = (body) =>
  client.post('/teams/onboarding/complete', body).then((r) => r.data)

export const browseTeams = () => client.get('/teams/browse').then((r) => r.data)

export const createTeam = (body) => client.post('/teams', body).then((r) => r.data)

export const joinTeam = (team_id) => client.post('/teams/join', { team_id }).then((r) => r.data)

export const leaveTeam = () => client.post('/teams/leave').then((r) => r.data)

export const updateMemberRole = (teamId, userId, role) =>
  client.patch(`/teams/${teamId}/members/${userId}/role`, { role }).then((r) => r.data)
