import client from './client'

export const getInviteHub = () => client.get('/invitations/hub').then((r) => r.data)

export const listInvitations = (params) =>
  client.get('/invitations', { params }).then((r) => r.data)

export const createInvitation = (body) =>
  client.post('/invitations', body).then((r) => r.data)

export const getInvitationCard = (id) =>
  client.get(`/invitations/${id}/card`).then((r) => r.data)

export const resendInvitationEmail = (id) =>
  client.post(`/invitations/${id}/send-email`).then((r) => r.data)

export const rejectInvitation = (id) =>
  client.post(`/invitations/${id}/reject`).then((r) => r.data)

export const getPublicInvite = (code) =>
  client.get(`/public/invite/${encodeURIComponent(code)}`).then((r) => r.data)

export const trackInviteEvent = (code, event) =>
  client.post(`/public/invite/${encodeURIComponent(code)}/track`, { event }).then((r) => r.data)
