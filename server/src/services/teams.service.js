/**
 * Legacy team API — delegates to agency ecosystem (Phase P4 refactor).
 * User-created teams are deprecated; use agencies.service.js directly.
 */
import {
  recalcAgencyStats as recalcTeamStats,
  getAgencyLeaderboard as getTeamLeaderboard,
  getUserAgency,
  joinAgency,
  leaveAgency,
} from './agencies.service.js'
import { canCreateAgency } from '../lib/agencyRoles.js'

export function canCreateTeam(role) {
  return canCreateAgency(role)
}

export async function getUserTeam(userId) {
  const agency = await getUserAgency(userId)
  if (!agency) return null
  return { ...agency, team_color: agency.primary_color, level: agency.rank_level }
}

export async function joinTeam(userId, teamId) {
  return joinAgency(userId, teamId)
}

export async function leaveTeam(userId) {
  return leaveAgency(userId)
}

export { recalcTeamStats, getTeamLeaderboard }

export async function createTeam() {
  throw Object.assign(
    new Error('User team creation is disabled. Agencies are created by Super Admin only.'),
    { status: 403 }
  )
}
