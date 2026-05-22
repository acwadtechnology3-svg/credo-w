import client from './client'

export async function getTreeAccess() {
  const { data } = await client.get('/tree/access')
  return data
}

export async function getTreeOnboarding() {
  const { data } = await client.get('/tree/onboarding')
  return data
}

export async function completeOnboardingStep(stepKey) {
  const { data } = await client.post('/tree/onboarding/complete-step', { stepKey })
  return data
}

export async function skipTreeOnboarding() {
  const { data } = await client.post('/tree/onboarding/skip')
  return data
}

export async function listJoinRequests(role = 'requester') {
  const { data } = await client.get('/tree/join-requests', { params: { role } })
  return data
}

export async function createJoinRequest(payload) {
  const { data } = await client.post('/tree/join-requests', payload)
  return data
}

export async function approveJoinRequest(id) {
  const { data } = await client.post(`/tree/join-requests/${id}/approve`)
  return data
}

export async function rejectJoinRequest(id, reason) {
  const { data } = await client.post(`/tree/join-requests/${id}/reject`, { reason })
  return data
}

export async function cancelJoinRequest(id) {
  const { data } = await client.post(`/tree/join-requests/${id}/cancel`)
  return data
}

export async function getTreeAnalytics() {
  const { data } = await client.get('/tree/analytics')
  return data
}

export async function getNetworkActivity(limit = 40) {
  const { data } = await client.get('/tree/activity', { params: { limit } })
  return data
}

export async function getTreeEntrySession() {
  const { data } = await client.get('/tree/entry')
  return data
}

export async function saveTreeEntryStep(payload) {
  const { data } = await client.post('/tree/entry/step', payload)
  return data
}

export async function previewTreePlacement(payload) {
  const { data } = await client.post('/tree/entry/preview-placement', payload)
  return data
}

export async function completeTreeEntry(payload) {
  const { data } = await client.post('/tree/entry/complete', payload)
  return data
}

export async function adminNetworkOverview(q) {
  const { data } = await client.get('/tree/admin/network', { params: { q } })
  return data
}

export async function adminMovePlacement(payload) {
  const { data } = await client.post('/tree/admin/move-placement', payload)
  return data
}

export async function adminFreezeNode(payload) {
  const { data } = await client.post('/tree/admin/freeze-node', payload)
  return data
}

export async function adminSimulatePlacement(payload) {
  const { data } = await client.post('/tree/admin/simulate-placement', payload)
  return data
}

export async function adminPlacementSettings(payload) {
  if (payload) {
    const { data } = await client.put('/tree/admin/placement-settings', payload)
    return data
  }
  const { data } = await client.get('/tree/admin/placement-settings')
  return data
}
