import client from './client'

const base = (agencyId) => `/agencies/${agencyId}/groups`

export const getAgencyGroupWorkspace = (agencyId) =>
  client.get(`${base(agencyId)}/workspace`).then((r) => r.data)

export const getChannelMessages = (agencyId, channelId, params) =>
  client.get(`${base(agencyId)}/channels/${channelId}/messages`, { params }).then((r) => r.data)

export const sendGroupMessage = (agencyId, channelId, body) =>
  client.post(`${base(agencyId)}/channels/${channelId}/messages`, body).then((r) => r.data)

export const uploadGroupFile = (agencyId, channelId, body) =>
  client.post(`${base(agencyId)}/channels/${channelId}/upload`, body).then((r) => r.data)

export const groupAiAssist = (agencyId, channelId, question) =>
  client.post(`${base(agencyId)}/channels/${channelId}/ai`, { question }).then((r) => r.data)

export const toggleGroupReaction = (agencyId, messageId, emoji) =>
  client
    .post(`${base(agencyId)}/messages/${messageId}/reactions`, { emoji })
    .then((r) => r.data)

export const pinGroupMessage = (agencyId, messageId, pinned = true) =>
  client.post(`${base(agencyId)}/messages/${messageId}/pin`, { pinned }).then((r) => r.data)

export const deleteGroupMessage = (agencyId, messageId, scope = 'self') =>
  client
    .post(`${base(agencyId)}/messages/${messageId}/delete`, { scope })
    .then((r) => r.data)

export const searchAgencyGroup = (agencyId, params) =>
  client.get(`${base(agencyId)}/search`, { params }).then((r) => r.data)

export const getAgencyGroupAnalytics = (agencyId) =>
  client.get(`${base(agencyId)}/analytics`).then((r) => r.data)

export const getAgencyGroupMembers = (agencyId) =>
  client.get(`${base(agencyId)}/members`).then((r) => r.data)

export const muteGroupMember = (agencyId, userId, body) =>
  client.post(`${base(agencyId)}/moderation/${userId}/mute`, body).then((r) => r.data)

export const banGroupMember = (agencyId, userId, body) =>
  client.post(`${base(agencyId)}/moderation/${userId}/ban`, body).then((r) => r.data)

export const warnGroupMember = (agencyId, userId, body) =>
  client.post(`${base(agencyId)}/moderation/${userId}/warn`, body).then((r) => r.data)

export const createEventRoom = (agencyId, body) =>
  client.post(`${base(agencyId)}/event-rooms`, body).then((r) => r.data)
