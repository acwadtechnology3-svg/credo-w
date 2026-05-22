import { supabase } from './supabase.js'
import { organizationActivityService } from '../services/organizationActivity.service.js'
import { organizationGamificationService } from '../services/organizationGamification.service.js'

export async function getUserAgencyId(userId) {
  const { data } = await supabase
    .from('agency_members')
    .select('agency_id')
    .eq('user_id', userId)
    .eq('status', 'active')
    .maybeSingle()
  return data?.agency_id || null
}

export async function emitOrgEvent(userId, eventType, { title, body, payload = {}, actorId = null } = {}) {
  try {
    const agencyId = await getUserAgencyId(userId)
    await organizationActivityService.record({
      agencyId,
      eventType,
      actorId: actorId || userId,
      targetUserId: userId,
      title,
      body,
      payload,
    })
  } catch (e) {
    console.warn('[org-event]', eventType, e.message)
  }
}

export async function trackOrgAction(userId, actionTrigger, opts = {}) {
  try {
    const agencyId = await getUserAgencyId(userId)
    await organizationGamificationService.incrementMission(userId, actionTrigger, {
      agencyId,
      ...opts,
    })
  } catch (e) {
    console.warn('[org-mission]', actionTrigger, e.message)
  }
}
