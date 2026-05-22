import { supabase } from '../lib/supabase.js'
import { agencyPackageGateService } from './agencyPackageGate.service.js'
import { agencyPlacementService } from './agencyPlacement.service.js'
import { agencyRealtimeService } from './agencyRealtime.service.js'
import { hasAgencyPermission, normalizeAgencyRole } from '../lib/agencyRoles.js'
import { notifyUser } from '../lib/notify.js'
import { joinAgency } from './agencies.service.js'
import { validateJoinRequestBody } from '../lib/agencyValidators.js'

const EXPIRY_DAYS = 14

async function getMembership(actorId, agencyId) {
  const { data } = await supabase
    .from('agency_members')
    .select('role, agency_id')
    .eq('user_id', actorId)
    .eq('agency_id', agencyId)
    .eq('status', 'active')
    .maybeSingle()
  return data
}

export const agencyJoinRequestsService = {
  async expireStale() {
    const now = new Date().toISOString()
    await supabase
      .from('agency_join_requests')
      .update({ request_status: 'expired', updated_at: now })
      .eq('request_status', 'pending')
      .lt('created_at', new Date(Date.now() - EXPIRY_DAYS * 86400000).toISOString())
  },

  async create(requesterId, input) {
    const { agencyId, sponsorUserId, placementSide, message, inviteCode } =
      input.agencyId && !input.agency_id
        ? input
        : validateJoinRequestBody({
            agency_id: input.agencyId || input.agency_id,
            sponsor_user_id: input.sponsorUserId,
            placement_side: input.placementSide,
            message: input.message,
            invite_code: input.inviteCode,
          })

    const { data: agency } = await supabase
      .from('agencies')
      .select('id, name, status, max_members, total_members')
      .eq('id', agencyId)
      .single()

    if (!agency || agency.status !== 'active') {
      throw Object.assign(new Error('الوكالة غير متاحة'), { status: 400 })
    }
    if (agency.total_members >= agency.max_members) {
      throw Object.assign(new Error('الوكالة ممتلئة'), { status: 400 })
    }

    const { data: dup } = await supabase
      .from('agency_join_requests')
      .select('id')
      .eq('agency_id', agencyId)
      .eq('user_id', requesterId)
      .eq('request_status', 'pending')
      .maybeSingle()

    if (dup) {
      throw Object.assign(new Error('لديك طلب معلّق لهذه الوكالة'), { status: 409 })
    }

    let sponsorId = sponsorUserId || null
    if (!sponsorId && inviteCode) {
      const { data: inv } = await supabase
        .from('agency_invitations')
        .select('created_by, sponsor_user_id, agency_id')
        .eq('code', inviteCode.toUpperCase())
        .eq('is_active', true)
        .maybeSingle()
      if (inv?.agency_id === agencyId) sponsorId = inv.sponsor_user_id || inv.created_by
    }

    const side = ['LEFT', 'RIGHT', 'AUTO'].includes((placementSide || '').toUpperCase())
      ? placementSide.toUpperCase()
      : 'AUTO'

    const { data: row, error } = await supabase
      .from('agency_join_requests')
      .insert({
        agency_id: agencyId,
        user_id: requesterId,
        sponsor_user_id: sponsorId,
        placement_side: side,
        request_status: 'pending',
        invite_code: inviteCode || null,
        message: message?.trim()?.slice(0, 500) || null,
      })
      .select()
      .single()

    if (error) throw error

    if (sponsorId) {
      await supabase.from('users').update({ sponsor_id: sponsorId }).eq('id', requesterId)
    }

    await agencyRealtimeService.emit(agencyId, 'join_request_created', {
      actorId: requesterId,
      targetUserId: sponsorId,
      payload: { requestId: row.id },
    })

    if (sponsorId) {
      await notifyUser(sponsorId, {
        type: 'AGENCY_JOIN_REQUEST',
        title: `طلب انضمام — ${agency.name}`,
        body: 'عضو يطلب الانضمام تحتك في الوكالة',
      })
    }

    await agencyRealtimeService.notifyAgencyLeaders(
      agencyId,
      {
        type: 'AGENCY_JOIN_REQUEST',
        title: 'طلب انضمام جديد',
        body: `طلب عضو جديد للانضمام إلى ${agency.name}`,
      },
      { minRoleRank: 90 }
    )

    return row
  },

  async listForAgency(agencyId, viewerId, { status = 'pending' } = {}) {
    await this.expireStale()
    const membership = await getMembership(viewerId, agencyId)
    if (
      !membership ||
      (!hasAgencyPermission(membership.role, 'approve_joins') &&
        !hasAgencyPermission(membership.role, 'moderate'))
    ) {
      const { data: user } = await supabase.from('users').select('role').eq('id', viewerId).single()
      if (!['super_admin', 'admin'].includes(user?.role)) {
        throw Object.assign(new Error('Forbidden'), { status: 403 })
      }
    }

    let q = supabase
      .from('agency_join_requests')
      .select(
        `
        *,
        user:users!agency_join_requests_user_id_fkey(id, username, full_name, user_code, profile_image, current_package_level, membership_status, status),
        sponsor:users!agency_join_requests_sponsor_user_id_fkey(id, username, full_name, user_code, profile_image)
      `
      )
      .eq('agency_id', agencyId)
      .order('created_at', { ascending: false })
      .limit(100)

    if (status !== 'all') q = q.eq('request_status', status)

    const { data, error } = await q
    if (error) throw error
    return data || []
  },

  async listMine(userId) {
    await this.expireStale()
    const { data, error } = await supabase
      .from('agency_join_requests')
      .select('*, agencies(id, name, slug, logo_url)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50)
    if (error) throw error
    return data || []
  },

  async approve(requestId, reviewerId, { asPlatformAdmin = false } = {}) {
    await this.expireStale()
    const { data: req } = await supabase
      .from('agency_join_requests')
      .select('*')
      .eq('id', requestId)
      .single()

    if (!req) throw Object.assign(new Error('الطلب غير موجود'), { status: 404 })
    if (req.request_status !== 'pending') {
      throw Object.assign(new Error(`الطلب ${req.request_status}`), { status: 400 })
    }

    if (!asPlatformAdmin) {
      const membership = await getMembership(reviewerId, req.agency_id)
      const canApprove =
        membership &&
        (hasAgencyPermission(membership.role, 'approve_joins') ||
          (req.sponsor_user_id === reviewerId && hasAgencyPermission(membership.role, 'recruit')))
      if (!canApprove) throw Object.assign(new Error('Forbidden'), { status: 403 })
    }

    await agencyPackageGateService.assertAgencyParticipation(req.user_id, {
      requirePackage: true,
      requireMembership: false,
    })

    const now = new Date().toISOString()

    await joinAgency(req.user_id, req.agency_id, {
      sponsor_within_agency: req.sponsor_user_id,
      placement_side: req.placement_side,
      join_mode: req.sponsor_user_id ? 'recruiter_sponsor' : 'join_request',
      role: 'member',
    })

    if (req.sponsor_user_id) {
      await agencyPlacementService.assignPlacement({
        userId: req.user_id,
        sponsorId: req.sponsor_user_id,
        agencyId: req.agency_id,
        placementSide: req.placement_side,
        source: 'agency_join_approved',
      })
    }

    const { data: updated } = await supabase
      .from('agency_join_requests')
      .update({
        request_status: 'approved',
        reviewed_by: reviewerId,
        reviewed_at: now,
        updated_at: now,
      })
      .eq('id', requestId)
      .select()
      .single()

    await agencyRealtimeService.emit(req.agency_id, 'join_request_approved', {
      actorId: reviewerId,
      targetUserId: req.user_id,
      payload: { requestId },
    })

    await notifyUser(req.user_id, {
      type: 'AGENCY_JOIN_APPROVED',
      title: 'تم قبول انضمامك للوكالة',
      body: 'مرحباً بك في المنظمة — أكمل التعريف والتفعيل',
    })

    return updated
  },

  async reject(requestId, reviewerId, { reason, asPlatformAdmin = false } = {}) {
    const { data: req } = await supabase
      .from('agency_join_requests')
      .select('*')
      .eq('id', requestId)
      .single()

    if (!req) throw Object.assign(new Error('الطلب غير موجود'), { status: 404 })
    if (req.request_status !== 'pending') {
      throw Object.assign(new Error(`الطلب ${req.request_status}`), { status: 400 })
    }

    if (!asPlatformAdmin) {
      const membership = await getMembership(reviewerId, req.agency_id)
      if (!membership || !hasAgencyPermission(membership.role, 'approve_joins')) {
        throw Object.assign(new Error('Forbidden'), { status: 403 })
      }
    }

    const now = new Date().toISOString()
    const { data: updated } = await supabase
      .from('agency_join_requests')
      .update({
        request_status: 'rejected',
        reviewed_by: reviewerId,
        reviewed_at: now,
        rejection_reason: reason?.trim()?.slice(0, 500) || null,
        updated_at: now,
      })
      .eq('id', requestId)
      .select()
      .single()

    await agencyRealtimeService.emit(req.agency_id, 'join_request_rejected', {
      actorId: reviewerId,
      targetUserId: req.user_id,
      payload: { requestId, reason },
    })

    await notifyUser(req.user_id, {
      type: 'AGENCY_JOIN_REJECTED',
      title: 'تم رفض طلب الانضمام',
      body: reason || 'تواصل مع قائد الوكالة للمزيد',
    })

    return updated
  },
}
