import client from './client'

export const getMarketingAssets = (params) =>
  client.get('/marketing', { params }).then((r) => r.data)
export const createAsset = (body) => client.post('/marketing', body).then((r) => r.data)
export const deleteAsset = (id) => client.delete(`/marketing/${id}`).then((r) => r.data)
