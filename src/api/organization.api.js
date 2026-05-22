import client from './client'

export async function getOrganizationHub() {
  const { data } = await client.get('/organization/hub')
  return data
}

export async function getActivityFeed(params = {}) {
  const { data } = await client.get('/organization/activity', { params })
  return data
}

export async function getTreeFlow(params = {}) {
  const { data } = await client.get('/organization/tree/flow', { params })
  return data
}

export async function searchTreeMembers(q) {
  const { data } = await client.get('/organization/tree/search', { params: { q } })
  return data
}

export async function getTreeNodeChildren(nodeId, depth = 1) {
  const { data } = await client.get(`/organization/tree/nodes/${nodeId}/children`, { params: { depth } })
  return data
}

export async function getTreeMemberCard(userId) {
  const { data } = await client.get(`/organization/tree/members/${userId}`)
  return data
}

export async function getOrgIdentity() {
  const { data } = await client.get('/organization/identity')
  return data
}

export async function getOrgMissions() {
  const { data } = await client.get('/organization/missions')
  return data
}

export async function getOrgLeaderboard(key, params = {}) {
  const { data } = await client.get(`/organization/leaderboards/${key}`, { params })
  return data
}
