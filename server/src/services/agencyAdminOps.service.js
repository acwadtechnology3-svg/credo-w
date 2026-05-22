import { supabase } from '../lib/supabase.js'
import { canManageAgencies } from '../lib/agencyRoles.js'
import { agencyPlacementService } from './agencyPlacement.service.js'
import { agencyJoinRequestsService } from './agencyJoinRequests.service.js'
import { agencyOperationsService } from './agencyOperations.service.js'
import { joinAgency, recalcAgencyStats } from './agencies.service.js'
import { agencyRealtimeService } from './agencyRealtime.service.js'
import { bvService } from './bv.service.js'

function assertSuperAdmin(platformRole) {
  if (!['super_admin', 'admin'].includes(platformRole)) {
    throw Object.assign(new Error('Super admin only'), { status: 403 })
  }
}

export const agencyAdminOpsService = {
  async moveMember(adminId, platformRole, { userId, fromAgencyId, toAgencyId, role = 'member' }) {
    assertSuperAdmin(platformRole)

    await supabase
      .from('agency_members')
      .update({ status: 'transferred', left_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('agency_id', fromAgencyId)

    await joinAgency(userId, toAgencyId, { role, join_mode: 'admin_transfer' })

    await supabase.from('agency_activity_logs').insert({
      agency_id: toAgencyId,
      actor_id: adminId,
      action: 'admin_member_move',
      details: { userId, fromAgencyId },
    })

    return { ok: true }
  },

  async overridePlacement(adminId, platformRole, payload) {
    assertSuperAdmin(platformRole)
    return agencyPlacementService.manualPlace(adminId, payload)
  },

  async changeSponsor(adminId, platformRole, { userId, newSponsorId, agencyId }) {
    assertSuperAdmin(platformRole)

    await supabase.from('users').update({ sponsor_id: newSponsorId }).eq('id', userId)

    await supabase.from('agency_members').update({
      sponsor_within_agency: newSponsorId,
    }).eq('user_id', userId).eq('agency_id', agencyId)

    await supabase.from('agency_activity_logs').insert({
      agency_id: agencyId,
      actor_id: adminId,
      action: 'admin_sponsor_change',
      details: { userId, newSponsorId },
    })

    await agencyRealtimeService.emit(agencyId, 'agency_updated', {
      actorId: adminId,
      targetUserId: userId,
      payload: { newSponsorId },
    })

    return { ok: true }
  },

  async editBvManual(adminId, platformRole, { userId, amount, note, agencyId }) {
    assertSuperAdmin(platformRole)
    const bv = parseFloat(amount)
    if (!bv || bv <= 0) throw Object.assign(new Error('Invalid BV amount'), { status: 400 })

    await bvService.creditBV(userId, bv, null)

    await supabase.from('agency_members').update({
      contribution_bv: bv,
    }).eq('user_id', userId).eq('agency_id', agencyId)

    await recalcAgencyStats(agencyId)

    await supabase.from('agency_activity_logs').insert({
      agency_id: agencyId,
      actor_id: adminId,
      action: 'admin_bv_adjustment',
      details: { userId, amount: bv, note },
    })

    return { ok: true }
  },

  async resetStructure(adminId, platformRole, agencyId) {
    assertSuperAdmin(platformRole)

    const { data: members } = await supabase
      .from('agency_members')
      .select('user_id')
      .eq('agency_id', agencyId)
      .eq('status', 'active')

    const ids = (members || []).map((m) => m.user_id)
    if (ids.length) {
      await supabase.from('pending_tree_placements').delete().in('user_id', ids)
    }

    await supabase.from('agency_activity_logs').insert({
      agency_id: agencyId,
      actor_id: adminId,
      action: 'admin_reset_structure',
      details: { member_count: ids.length },
    })

    return { ok: true, cleared_pending: ids.length }
  },

  async approveSpecialJoin(adminId, platformRole, requestId) {
    assertSuperAdmin(platformRole)
    return agencyJoinRequestsService.approve(requestId, adminId, { asPlatformAdmin: true })
  },

  async impersonateContext(adminId, platformRole, agencyId) {
    assertSuperAdmin(platformRole)

    const { data: agency } = await supabase.from('agencies').select('*').eq('id', agencyId).single()
    const { data: ownerMember } = await supabase
      .from('agency_members')
      .select('user_id, role')
      .eq('agency_id', agencyId)
      .in('role', ['owner', 'founder', 'agency_admin'])
      .eq('status', 'active')
      .order('joined_at', { ascending: true })
      .limit(1)
      .maybeSingle()

    return {
      agency,
      act_as_user_id: ownerMember?.user_id || agency?.owner_id,
      act_as_role: ownerMember?.role || 'agency_admin',
      issued_by: adminId,
      expires_in_seconds: 3600,
    }
  },

  async freezeAgency(adminId, platformRole, agencyId) {
    assertSuperAdmin(platformRole)
    return agencyOperationsService.freeze(agencyId, adminId, platformRole)
  },

  async disableAgency(adminId, platformRole, agencyId, reason) {
    assertSuperAdmin(platformRole)
    return agencyOperationsService.deactivate(agencyId, adminId, platformRole, { reason })
  },
}
