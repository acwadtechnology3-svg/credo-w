import client from './client'

export const getFranchiseOverview = () => client.get('/franchise/overview').then((r) => r.data)
export const getNetworkAmbassadors = (params) =>
  client.get('/franchise/network', { params }).then((r) => r.data)
export const activateAmbassador = (userId) =>
  client.put(`/franchise/network/${userId}/activate`).then((r) => r.data)
