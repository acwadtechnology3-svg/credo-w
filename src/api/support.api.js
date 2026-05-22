import client from './client'

export const getSupportStats = () => client.get('/support/stats').then((r) => r.data)
export const supportAiAssist = (body) => client.post('/support/ai', body).then((r) => r.data)
export const getSupportUnread = () => client.get('/support/unread').then((r) => r.data)
export const createTicket = (body) => client.post('/support', body).then((r) => r.data)
export const getMyTickets = () => client.get('/support/my').then((r) => r.data)
export const getAllTickets = (params) => client.get('/support/all', { params }).then((r) => r.data)
export const getTicket = (id) => client.get(`/support/${id}`).then((r) => r.data)
export const sendSupportMessage = (id, body) =>
  client.post(`/support/${id}/messages`, body).then((r) => r.data)
export const updateSupportTicket = (id, body) =>
  client.patch(`/support/${id}`, body).then((r) => r.data)
export const uploadSupportFile = (id, body) =>
  client.post(`/support/${id}/upload`, body).then((r) => r.data)
export const replyTicket = (id, body) =>
  client.put(`/support/${id}/reply`, body).then((r) => r.data)
export const getUserSupportContext = (userId) =>
  client.get(`/support/users/${userId}/context`).then((r) => r.data)
