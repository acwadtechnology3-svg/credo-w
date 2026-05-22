import { supabase } from '../lib/supabase.js'
import { agencyRealtimeService } from './agencyRealtime.service.js'
import { emitToAgency, emitToUser } from '../lib/socket.js'

const FEED_EVENT_MAP = {
  recruit_joined: { icon: '⚔️', severity: 'success', sound: 'recruit' },
  package_purchased: { icon: '📦', severity: 'epic', sound: 'purchase' },
  package_upgraded: { icon: '⬆️', severity: 'epic', sound: 'upgrade' },
  onboarding_completed: { icon: '🎓', severity: 'success', sound: 'level' },
  rank_promoted: { icon: '🏆', severity: 'legendary', sound: 'rank' },
  achievement_unlocked: { icon: '✨', severity: 'epic', sound: 'achievement' },
  mission_completed: { icon: '🎯', severity: 'success', sound: 'mission' },
  invite_accepted: { icon: '📨', severity: 'success', sound: 'invite' },
  placement_changed: { icon: '🌳', severity: 'info', sound: 'tree' },
  join_request_approved: { icon: '✅', severity: 'success', sound: 'join' },
  leaderboard_changed: { icon: '📊', severity: 'info', sound: 'leaderboard' },
  tree_activated: { icon: '🔥', severity: 'legendary', sound: 'activate' },
}

export const organizationActivityService = {
  async record({
    agencyId = null,
    eventType,
    actorId = null,
    targetUserId = null,
    title,
    body = null,
    payload = {},
    isPublic = true,
  }) {
    const meta = FEED_EVENT_MAP[eventType] || { icon: '⚡', severity: 'info', sound: null }
    const row = {
      agency_id: agencyId,
      event_type: eventType,
      actor_id: actorId,
      target_user_id: targetUserId,
      title,
      body,
      icon: meta.icon,
      severity: meta.severity,
      sound_key: meta.sound,
      payload,
      is_public: isPublic,
    }

    let saved = null
    try {
      const { data, error } = await supabase.from('agency_activity_feed').insert(row).select().single()
      if (!error) saved = data
    } catch {
      /* table optional */
    }

    const envelope = {
      id: saved?.id,
      eventType,
      agencyId,
      title,
      body,
      icon: meta.icon,
      severity: meta.severity,
      soundKey: meta.sound,
      payload,
      at: saved?.created_at || new Date().toISOString(),
    }

    emitToUser(actorId, 'org:activity', envelope)
    if (targetUserId && targetUserId !== actorId) emitToUser(targetUserId, 'org:activity', envelope)
    if (agencyId) {
      emitToAgency(agencyId, 'org:activity', envelope)
      const rtType = {
        recruit_joined: 'member_joined',
        package_purchased: 'package_activated',
        package_upgraded: 'package_activated',
        invite_accepted: 'invitation_accepted',
        join_request_approved: 'join_request_approved',
        placement_changed: 'placement_completed',
        tree_activated: 'placement_completed',
        onboarding_completed: 'member_joined',
      }[eventType]
      if (rtType) {
        await agencyRealtimeService.emit(agencyId, rtType, {
          actorId,
          targetUserId,
          payload: { title, body, ...payload },
        })
      }
    }

    return saved
  },

  async getFeed({ agencyId, userId, limit = 40, eventTypes = null, cursor = null }) {
    let q = supabase
      .from('agency_activity_feed')
      .select(
        `
        *,
        actor:users!agency_activity_feed_actor_id_fkey(id, username, full_name, profile_image, user_code),
        target:users!agency_activity_feed_target_user_id_fkey(id, username, full_name, user_code)
      `
      )
      .order('created_at', { ascending: false })
      .limit(limit)

    if (agencyId) q = q.eq('agency_id', agencyId)
    else if (userId) {
      const { data: member } = await supabase
        .from('agency_members')
        .select('agency_id')
        .eq('user_id', userId)
        .eq('status', 'active')
        .maybeSingle()
      if (member?.agency_id) q = q.eq('agency_id', member.agency_id)
      else q = q.is('agency_id', null)
    }

    if (eventTypes?.length) q = q.in('event_type', eventTypes)
    if (cursor) q = q.lt('created_at', cursor)

    const { data, error } = await q
    if (error) throw error
    return { items: data || [], nextCursor: data?.length === limit ? data[data.length - 1]?.created_at : null }
  },
}
