import { supabase } from '../lib/supabase.js'
import { agencyPlacementService } from './agencyPlacement.service.js'

/**
 * Sponsor genealogy layer (users.sponsor_id) — separate from binary tree parent.
 */
export const agencySponsorService = {
  async resolveByUsername(username) {
    const { data } = await supabase
      .from('users')
      .select('id, username, full_name, user_code, profile_image, agency_id, status')
      .eq('username', String(username).trim())
      .maybeSingle()
    if (!data || data.status !== 'active') {
      throw Object.assign(new Error('الراعي غير موجود أو غير مُفعّل'), { status: 404 })
    }
    return data
  },

  async assignSponsor(userId, sponsorId, { agencyId = null } = {}) {
    if (userId === sponsorId) {
      throw Object.assign(new Error('لا يمكن أن يكون الراعي هو نفس المستخدم'), { status: 400 })
    }
    await agencyPlacementService.assertNoCycle(sponsorId, userId)
    await supabase
      .from('users')
      .update({ sponsor_id: sponsorId, agency_id: agencyId || undefined })
      .eq('id', userId)

    if (agencyId) {
      await supabase
        .from('agency_members')
        .update({ sponsor_within_agency: sponsorId })
        .eq('user_id', userId)
        .eq('agency_id', agencyId)
    }

    return { user_id: userId, sponsor_user_id: sponsorId, agency_id: agencyId }
  },

  async getSponsorChain(userId, maxDepth = 20) {
    const chain = []
    let current = userId
    const seen = new Set()

    for (let i = 0; i < maxDepth; i++) {
      if (!current || seen.has(current)) break
      seen.add(current)
      const { data: user } = await supabase
        .from('users')
        .select('id, username, full_name, user_code, sponsor_id, agency_id')
        .eq('id', current)
        .single()
      if (!user) break
      chain.push(user)
      if (!user.sponsor_id) break
      current = user.sponsor_id
    }
    return chain
  },
}
