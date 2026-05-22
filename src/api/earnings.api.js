import client from './client'

export const getWallet = (params) =>
  client.get('/earnings/wallet', { params }).then((r) => r.data)
export const getTeamCommission = (params) =>
  client.get('/earnings/team-commission', { params }).then((r) => r.data)
export const getLevelBonus = (params) =>
  client.get('/earnings/level-bonus', { params }).then((r) => r.data)
export const getFastStart = () => client.get('/earnings/fast-start').then((r) => r.data)
export const getRankBonus = () => client.get('/earnings/rank-bonus').then((r) => r.data)
export const getRetailProfit = (params) =>
  client.get('/earnings/retail-profit', { params }).then((r) => r.data)
export const runCommission = () =>
  client.post('/earnings/commission/run').then((r) => r.data)
export const getWalletSummary = () => client.get('/wallet/summary').then((r) => r.data)
export const getReceiveInfo = () => client.get('/wallet/receive').then((r) => r.data)
export const lookupTransferUser = (q) =>
  client.get('/wallet/lookup', { params: { q } }).then((r) => r.data)
export const getWallets = () => client.get('/wallet').then((r) => r.data)
export const exchangeWallets = (body) => client.post('/wallet/exchange', body).then((r) => r.data)
export const transferCMoney = (body) =>
  client.post('/wallet/cmoney/transfer', body).then((r) => r.data)
export const getPinStatus = () => client.get('/wallet/pin-status').then((r) => r.data)
export const verifyAccountPassword = (current_password) =>
  client.post('/wallet/verify-password', { current_password }).then((r) => r.data)
export const setPin = (body) => client.post('/wallet/cmoney/set-pin', body).then((r) => r.data)
