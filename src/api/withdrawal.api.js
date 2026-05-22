import client from './client'

export const getWithdrawals = (params) =>
  client.get('/withdrawal', { params }).then((r) => r.data)
export const requestWithdrawal = (body) =>
  client.post('/withdrawal/request', body).then((r) => r.data)
export const getBankAccounts = () => client.get('/withdrawal/accounts').then((r) => r.data)
export const addBankAccount = (body) =>
  client.post('/withdrawal/accounts', body).then((r) => r.data)
export const deleteBankAccount = (id) =>
  client.delete(`/withdrawal/accounts/${id}`).then((r) => r.data)
