import { supabase } from '../lib/supabase.js'
import { emitToUser } from '../lib/socket.js'

const AGENCY_EVENT_TYPES = new Set([
  'member_joined',
  'join_request_created',
  'join_request_approved',
  'join_request_rejected',
  'placement_completed',
  'invitation_accepted',
  'package_activated',
  'rank_updated',
  'agency_updated',
  'agency_deactivated',
])

export const agencyRealtimeService = {
  async emit(agencyId, eventType, { actorId = null, targetUserId = null, payload = {} } = {}) {
    if (!agencyId || !AGENCY_EVENT_TYPES.has(eventType)) return null

    const row = {
      agency_id: agencyId,
      event_type: eventType,
      actor_id: actorId,
      target_user_id: targetUserId,
      payload,
    }

    let saved = null
    try {
      const { data } = await supabase.from('agency_realtime_events').insert(row).select().single()
      saved = data
    } catch {
      /* table optional until migration */
    }

    const envelope = { agencyId, eventType, payload, at: new Date().toISOString(), id: saved?.id }

    if (targetUserId) emitToUser(targetUserId, `agency:${eventType}`, envelope)
    if (actorId && actorId !== targetUserId) emitToUser(actorId, `agency:${eventType}`, envelope)

    try {
      const { emitToAgency } = await import('../lib/socket.js')
      emitToAgency(agencyId, `agency:${eventType}`, envelope)
    } catch {
      /* socket optional */
    }

    return saved
  },

  async notifyAgencyLeaders(agencyId, notification, { minRoleRank = 70 } = {}) {
    const { data: members } = await supabase
      .from('agency_members')
      .select('user_id, role')
      .eq('agency_id', agencyId)
      .eq('status', 'active')

    const rankByRole = {
      owner: 100,
      founder: 100,
      agency_admin: 95,
      manager: 90,
      leader: 85,
      recruiter: 70,
    }

    for (const m of members || []) {
      if ((rankByRole[m.role] || 0) >= minRoleRank) {
        await emitToUser(m.user_id, notification)
      }
    }
  },
}
