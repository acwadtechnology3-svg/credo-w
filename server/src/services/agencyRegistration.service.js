import { supabase } from '../lib/supabase.js'
import { joinAgency } from './agencies.service.js'
import { resolveOptimalPlacementSide } from './invitation.service.js'

/**
 * Resolves agency + sponsor context for registration.
 * Keeps agency identity separate from binary tree (tree_nodes) and sponsor genealogy (users.sponsor_id).
 */
export const agencyRegistrationService = {
  async resolveJoinContext(query = {}) {
    const agencyId = (query.agency || '').trim()
    const agencySlug = (query.agency_slug || '').trim()
    const agencyCode = (query.agency_code || query.agency_invite || '').trim().toUpperCase()
    const refUsername = (query.ref || '').trim()
    const side = (query.side || '').trim().toUpperCase()

    let agency = null
    let invite = null
    let sponsor = null
    let placementSide = ['LEFT', 'RIGHT'].includes(side) ? side : 'AUTO'
    let joinMode = 'direct_agency'

    if (agencyCode) {
      const { data: inv } = await supabase
        .from('agency_invitations')
        .select('*, agencies(*)')
        .eq('code', agencyCode)
        .eq('is_active', true)
        .maybeSingle()

      if (!inv || (inv.expires_at && new Date(inv.expires_at) < new Date())) {
        return { ok: false, error: 'Invalid or expired agency invitation' }
      }
      invite = inv
      agency = inv.agencies
      if (inv.sponsor_user_id) {
        const { data: sp } = await supabase
          .from('users')
          .select('id, username, status')
          .eq('id', inv.sponsor_user_id)
          .single()
        if (sp?.status === 'active') {
          sponsor = sp
          joinMode = 'recruiter_sponsor'
        }
      }
      if (inv.placement_side && inv.placement_side !== 'AUTO') {
        placementSide = inv.placement_side
      }
    }

    if (!agency && agencyId) {
      const { data } = await supabase
        .from('agencies')
        .select('id, slug, name, status, logo_url, primary_color, is_verified')
        .eq('id', agencyId)
        .maybeSingle()
      agency = data
    }

    if (!agency && agencySlug) {
      const { data } = await supabase
        .from('agencies')
        .select('id, slug, name, status, logo_url, primary_color, is_verified')
        .eq('slug', agencySlug.toLowerCase())
        .maybeSingle()
      agency = data
    }

    if (!agency) {
      return { ok: false, error: agencyId || agencySlug || agencyCode ? 'Agency not found' : null }
    }

    if (agency.status !== 'active') {
      return { ok: false, error: 'Agency is not accepting new members' }
    }

    if (!sponsor && refUsername) {
      const { data: found } = await supabase
        .from('users')
        .select('id, username, status, agency_id')
        .eq('username', refUsername)
        .maybeSingle()

      if (!found) return { ok: false, error: 'Invalid sponsor username' }
      if (found.status !== 'active') return { ok: false, error: 'Sponsor account is not active' }

      if (found.agency_id && found.agency_id !== agency.id) {
        return { ok: false, error: 'Sponsor is not part of this agency' }
      }

      sponsor = found
      joinMode = 'recruiter_sponsor'
    }

    if (!sponsor && joinMode === 'direct_agency') {
      joinMode = 'auto_placement'
    }

    return {
      ok: true,
      agency,
      invite,
      sponsor,
      placementSide,
      joinMode,
      inviteCode: invite?.code || null,
    }
  },

  async applyAgencyMembership(userId, context) {
    if (!context?.ok || !context.agency) return null

    await joinAgency(userId, context.agency.id, {
      sponsor_within_agency: context.sponsor?.id || null,
      placement_side: context.placementSide,
      join_mode: context.joinMode,
    })

    if (context.invite?.code) {
      const { agencyInvitationOpsService } = await import('./agencyInvitationOps.service.js')
      await agencyInvitationOpsService.onInviteAccepted(context.invite.code, userId)
    }

    if (context.sponsor?.id) {
      const { agencyPlacementService } = await import('./agencyPlacement.service.js')
      await agencyPlacementService.assignPlacement({
        userId,
        sponsorId: context.sponsor.id,
        agencyId: context.agency.id,
        placementSide: context.placementSide,
        source: 'registration',
      })
    }

    return context.agency.id
  },

  async resolvePlacementForSponsor(sponsorId, preferred) {
    return resolveOptimalPlacementSide(sponsorId, preferred)
  },
}
