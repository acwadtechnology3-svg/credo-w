import client from './client'

export const getProfile = () => client.get('/profile').then((r) => r.data)
export const updateProfile = (body) => client.put('/profile', body).then((r) => r.data)
export const uploadProfileAvatar = (body) =>
  client.post('/profile/avatar', body).then((r) => r.data)
export const changePassword = (body) =>
  client.post('/profile/change-password', body).then((r) => r.data)
export const setPin = (body) => client.post('/profile/set-pin', body).then((r) => r.data)
export const hasPin = () => client.get('/profile/has-pin').then((r) => r.data)
export const getProfileHub = () => client.get('/profile/hub').then((r) => r.data)
export const updateIdentitySettings = (body) =>
  client.patch('/profile/identity', body).then((r) => r.data)
