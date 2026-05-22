import client from './client'

export const getNotifications = () => client.get('/notifications').then((r) => r.data)

export const getNotification = (id) => client.get(`/notifications/${id}`).then((r) => r.data)

export const getSentMessages = () => client.get('/notifications/sent').then((r) => r.data)

export const replyToNotification = (id, body) =>
  client.post(`/notifications/${id}/reply`, { body }).then((r) => r.data)

export const markNotificationsRead = (ids) =>
  client.post('/notifications/read', { ids }).then((r) => r.data)

export const deleteNotification = (id) =>
  client.delete(`/notifications/${id}`).then((r) => r.data)
