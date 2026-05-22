import { supabase } from '../lib/supabase.js'
import { treeAccessService } from './treeAccess.service.js'
import { treeActivationService } from './treeActivation.service.js'
import { notifyUser } from '../lib/notify.js'

const EXPIRY_DAYS = 14

export const joinRequestsService = {
  async createRequest(requesterId, { sponsorId, agencyId, placementSide, message }) {
    if (!sponsorId) {
      throw Object.assign(new Error('معرّف الراعي مطلوب'), { status: 400 })
    }

    const { data: sponsor } = await supabase
      .from('users')
      .select('id, status, user_code, username')
      .eq('id', sponsorId)
      .single()

    if (!sponsor || sponsor.status !== 'active') {
      throw Object.assign(new Error('الراعي غير نشط'), { status: 400 })
    }

    if (sponsorId === requesterId) {
      throw Object.assign(new Error('لا يمكنك إرسال طلب لنفسك'), { status: 400 })
    }

    const { data: dup } = await supabase
      .from('join_requests')
      .select('id')
      .eq('requester_id', requesterId)
      .eq('sponsor_id', sponsorId)
      .eq('status', 'pending')
      .maybeSingle()

    if (dup) {
      throw Object.assign(new Error('لديك طلب معلّق بالفعل لهذا الراعي'), { status: 409 })
    }

    const side = ['LEFT', 'RIGHT', 'AUTO'].includes((placementSide || '').toUpperCase())
      ? placementSide.toUpperCase()
      : 'AUTO'

    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + EXPIRY_DAYS)

    const { data: row, error } = await supabase
      .from('join_requests')
      .insert({
        requester_id: requesterId,
        sponsor_id: sponsorId,
        agency_id: agencyId || null,
        placement_side: side,
        message: message?.trim()?.slice(0, 500) || null,
        status: 'pending',
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single()

    if (error) throw error

    await treeActivationService.queuePendingPlacement({
      userId: requesterId,
      sponsorId,
      placementSide: side,
      agencyId,
      source: 'join_request',
      joinRequestId: row.id,
    })

    await notifyUser(sponsorId, {
      type: 'JOIN_REQUEST_RECEIVED',
      title: 'طلب انضمام للشبكة',
      body: 'عضو يطلب الانضمام تحتك — راجع طلبات الشجرة',
    })

    return row
  },

  async listForUser(userId, { role = 'requester' } = {}) {
    const baseSelect = `
        *,
        requester:users!join_requests_requester_id_fkey(id, user_code, username, full_name, profile_image, current_package_level, membership_status, status),
        sponsor:users!join_requests_sponsor_id_fkey(id, user_code, username, full_name, profile_image)
      `
    let q = supabase.from('join_requests').select(baseSelect).order('created_at', { ascending: false }).limit(50)

    if (role === 'sponsor') {
      q = q.eq('sponsor_id', userId)
    } else {
      q = q.eq('requester_id', userId)
    }

    const { data, error } = await q
    if (error) throw error

    const rows = data || []
    const agencyIds = [...new Set(rows.map((r) => r.agency_id).filter(Boolean))]
    if (!agencyIds.length) return rows

    try {
      const { data: agencies } = await supabase
        .from('agencies')
        .select('id, name, slug')
        .in('id', agencyIds)
      const byId = Object.fromEntries((agencies || []).map((a) => [a.id, a]))
      return rows.map((r) => ({
        ...r,
        agency: r.agency_id ? byId[r.agency_id] || null : null,
      }))
    } catch {
      return rows
    }
  },

  async approve(requestId, sponsorUserId) {
    const { data: req } = await supabase
      .from('join_requests')
      .select('*')
      .eq('id', requestId)
      .single()

    if (!req || req.sponsor_id !== sponsorUserId) {
      throw Object.assign(new Error('الطلب غير موجود'), { status: 404 })
    }
    if (req.status !== 'pending') {
      throw Object.assign(new Error(`الطلب في حالة ${req.status}`), { status: 400 })
    }
    if (req.expires_at && new Date(req.expires_at) < new Date()) {
      await supabase.from('join_requests').update({ status: 'expired' }).eq('id', requestId)
      throw Object.assign(new Error('انتهت صلاحية الطلب'), { status: 410 })
    }

    await treeAccessService.assertCanApproveJoinRequest(req.requester_id)

    const { data: sponsor } = await supabase
      .from('users')
      .select('status')
      .eq('id', sponsorUserId)
      .single()

    if (!sponsor || sponsor.status !== 'active') {
      throw Object.assign(new Error('حسابك غير نشط'), { status: 403 })
    }

    await treeActivationService.queuePendingPlacement({
      userId: req.requester_id,
      sponsorId: req.sponsor_id,
      placementSide: req.placement_side,
      agencyId: req.agency_id,
      source: 'join_request',
      joinRequestId: req.id,
    })

    const activation = await treeActivationService.activateForUser(req.requester_id)

    if (!activation.activated) {
      throw Object.assign(new Error('تعذّر الوضع في الشجرة — تحقق من توفر الموضع'), {
        status: 422,
        code: activation.reason,
      })
    }

    const now = new Date().toISOString()
    await supabase
      .from('join_requests')
      .update({
        status: 'approved',
        approved_by: sponsorUserId,
        approved_at: now,
        placement_node_id: activation.node?.id,
      })
      .eq('id', requestId)

    await notifyUser(req.requester_id, {
      type: 'JOIN_REQUEST_APPROVED',
      title: '✅ تمت الموافقة على انضمامك',
      body: 'تم وضعك في الشبكة — أكمل التعريف التفاعلي',
    })

    try {
      const { emitOrgEvent, trackOrgAction } = await import('../lib/organizationEvents.js')
      await emitOrgEvent(req.requester_id, 'join_request_approved', {
        title: 'تمت الموافقة على الانضمام',
        actorId: sponsorUserId,
        payload: { requestId },
      })
      await trackOrgAction(sponsorUserId, 'referral_join')
    } catch {
      /* optional */
    }

    return { ok: true, activation }
  },

  async reject(requestId, sponsorUserId, reason) {
    const { data: req } = await supabase
      .from('join_requests')
      .select('requester_id, sponsor_id, status')
      .eq('id', requestId)
      .single()

    if (!req || req.sponsor_id !== sponsorUserId) {
      throw Object.assign(new Error('الطلب غير موجود'), { status: 404 })
    }
    if (req.status !== 'pending') {
      throw Object.assign(new Error(`الطلب في حالة ${req.status}`), { status: 400 })
    }

    await supabase
      .from('join_requests')
      .update({
        status: 'rejected',
        rejected_by: sponsorUserId,
        rejected_at: new Date().toISOString(),
        rejection_reason: reason?.slice(0, 300) || null,
      })
      .eq('id', requestId)

    await notifyUser(req.requester_id, {
      type: 'JOIN_REQUEST_REJECTED',
      title: 'تم رفض طلب الانضمام',
      body: reason || 'تواصل مع الراعي أو اختر راعياً آخر',
    })

    return { ok: true }
  },

  async cancel(requestId, requesterId) {
    const { data: req } = await supabase
      .from('join_requests')
      .select('id, status')
      .eq('id', requestId)
      .eq('requester_id', requesterId)
      .single()

    if (!req) throw Object.assign(new Error('الطلب غير موجود'), { status: 404 })
    if (req.status !== 'pending') {
      throw Object.assign(new Error('لا يمكن إلغاء هذا الطلب'), { status: 400 })
    }

    await supabase
      .from('join_requests')
      .update({ status: 'cancelled', updated_at: new Date().toISOString() })
      .eq('id', requestId)

    return { ok: true }
  },

  async expireStale() {
    const { data } = await supabase
      .from('join_requests')
      .select('id, requester_id')
      .eq('status', 'pending')
      .lt('expires_at', new Date().toISOString())

    for (const row of data || []) {
      await supabase.from('join_requests').update({ status: 'expired' }).eq('id', row.id)
      await notifyUser(row.requester_id, {
        type: 'JOIN_REQUEST_EXPIRED',
        title: 'انتهت صلاحية طلب الانضمام',
        body: 'أرسل طلباً جديداً أو اشترِ باقة وانضم مباشرة',
      })
    }
    return (data || []).length
  },
}
