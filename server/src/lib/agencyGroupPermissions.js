/** Agency group channel access + moderation permissions */

import { AGENCY_ROLES, normalizeAgencyRole } from './agencyRoles.js'

export const GROUP_ROLE_RANK = {
  owner: 100,
  founder: 100,
  agency_admin: 95,
  manager: 90,
  recruiter_leader: 70,
  recruiter: 70,
  moderator: 65,
  mentor: 60,
  member: 10,
  observer: 5,
}

const LEADERSHIP_CHANNEL_ROLES = new Set([
  'owner',
  'founder',
  'agency_admin',
  'manager',
  'recruiter_leader',
  'recruiter',
  'leader',
  'co_leader',
])

const ANNOUNCEMENT_POST_ROLES = new Set([
  'owner',
  'founder',
  'agency_admin',
  'manager',
  'moderator',
  'recruiter_leader',
  'recruiter',
])

export function mapAgencyRoleToGroupRole(agencyRole) {
  const r = normalizeAgencyRole(agencyRole) || agencyRole
  if (r === 'owner' || r === 'founder') return 'owner'
  if (r === 'agency_admin' || r === 'manager' || r === 'co_leader') return 'agency_admin'
  if (r === 'recruiter' || r === 'leader') return 'recruiter_leader'
  if (r === 'moderator' || r === 'officer') return 'moderator'
  return 'member'
}

export function groupRoleRank(role) {
  return GROUP_ROLE_RANK[role] || GROUP_ROLE_RANK.member
}

export function isPlatformStaff(platformRole) {
  return ['super_admin', 'admin'].includes(platformRole)
}

export function canAccessChannel({ channelType, groupRole, agencyRole, platformRole, isBanned }) {
  if (isPlatformStaff(platformRole)) return true
  if (isBanned) return false

  const effective = groupRole || mapAgencyRoleToGroupRole(agencyRole)

  if (channelType === 'leadership') {
    return LEADERSHIP_CHANNEL_ROLES.has(effective) || LEADERSHIP_CHANNEL_ROLES.has(agencyRole)
  }
  return true
}

export function canPostInChannel({ channel, groupRole, agencyRole, platformRole, isMuted, isBanned }) {
  if (isPlatformStaff(platformRole)) return true
  if (isBanned || isMuted) return false
  if (channel?.is_locked) return false

  const effective = groupRole || mapAgencyRoleToGroupRole(agencyRole)

  if (channel?.is_read_only || channel?.channel_type === 'announcements') {
    return (
      ANNOUNCEMENT_POST_ROLES.has(effective) ||
      ANNOUNCEMENT_POST_ROLES.has(agencyRole) ||
      groupRoleRank(effective) >= 65
    )
  }

  return canAccessChannel({
    channelType: channel?.channel_type,
    groupRole: effective,
    agencyRole,
    platformRole,
    isBanned,
  })
}

export function canModerate(groupRole, agencyRole, platformRole) {
  if (isPlatformStaff(platformRole)) return true
  const effective = groupRole || mapAgencyRoleToGroupRole(agencyRole)
  return groupRoleRank(effective) >= GROUP_ROLE_RANK.moderator
}

export function canManageGroup(groupRole, agencyRole, platformRole) {
  if (isPlatformStaff(platformRole)) return true
  const effective = groupRole || mapAgencyRoleToGroupRole(agencyRole)
  return groupRoleRank(effective) >= GROUP_ROLE_RANK.agency_admin
}

export function agencyRoleRank(role) {
  return AGENCY_ROLES[normalizeAgencyRole(role)]?.rank ?? AGENCY_ROLES[role]?.rank ?? 0
}
