import client from './client'

export async function getMlmDashboard() {
  const { data } = await client.get('/mlm/dashboard')
  return data
}

export async function getMlmMatching() {
  const { data } = await client.get('/mlm/matching')
  return data
}

export async function getMlmEvents() {
  const { data } = await client.get('/mlm/events')
  return data
}
