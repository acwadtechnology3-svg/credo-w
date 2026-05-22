import client from './client'

export const getPublicPackages = () =>
  client.get('/public/packages').then((r) => r.data)

export const getPublicStats = () => client.get('/public/stats').then((r) => r.data)

export const getPublicRanks = () => client.get('/public/ranks').then((r) => r.data)
