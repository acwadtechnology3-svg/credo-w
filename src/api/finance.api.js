import client from './client'

const unwrap = (r) => r.data

export const getFinanceWallets = () =>
  client.get('/v3/finance/wallets').then((r) => r.data.wallets)

export const getFinanceLedger = (params) =>
  client.get('/v3/finance/ledger', { params }).then((r) => r.data.ledger)

export const getFinancePaymentMethods = () =>
  client.get('/v3/finance/payment-methods').then((r) => r.data.methods)

export const quoteHybridPayment = (body) =>
  client.post('/v3/finance/hybrid/quote', body).then(unwrap)

export const createPaymentSession = (body) =>
  client.post('/v3/finance/payment-sessions', body).then(unwrap)

export const getPaymentSession = (id) =>
  client.get(`/v3/finance/payment-sessions/${id}`).then(unwrap)

export const reservePaymentWallets = (id) =>
  client.post(`/v3/finance/payment-sessions/${id}/reserve`).then(unwrap)

export const completeWalletPayment = (id, body) =>
  client.post(`/v3/finance/payment-sessions/${id}/complete-wallet`, body).then(unwrap)

export const uploadPaymentProof = (id, body) =>
  client.post(`/v3/finance/payment-sessions/${id}/proof`, body).then(unwrap)

export const getFinanceAdminDashboard = () =>
  client.get('/admin/finance/dashboard').then(unwrap)

export const getPaymentReviewQueue = (params) =>
  client.get('/admin/finance/payment-reviews', { params }).then((r) => r.data.data)

export const approvePaymentReview = (id, body) =>
  client.post(`/admin/finance/payment-reviews/${id}/approve`, body).then(unwrap)

export const rejectPaymentReview = (id, body) =>
  client.post(`/admin/finance/payment-reviews/${id}/reject`, body).then(unwrap)

export const requestMoreProof = (id, body) =>
  client.post(`/admin/finance/payment-reviews/${id}/request-proof`, body).then(unwrap)

export const getAdminPaymentSessions = (params) =>
  client.get('/admin/finance/payment-sessions', { params }).then((r) => r.data.data)

export const getAdminLedger = (params) =>
  client.get('/admin/finance/ledger', { params }).then((r) => r.data.data)

export const getFraudSignals = () =>
  client.get('/admin/finance/fraud-signals').then((r) => r.data.data)

export const adminGrantWallet = (body) =>
  client.post('/admin/finance/wallet-grant', body).then(unwrap)

export const financeTransfer = (body) =>
  client.post('/v3/finance/transfer', body).then(unwrap)
