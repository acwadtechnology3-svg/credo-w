import crypto from 'crypto'
import { supabase } from '../lib/supabase.js'
import { hasAgencyPermission } from '../lib/agencyRoles.js'
import { agencyPlacementService } from './agencyPlacement.service.js'
import { agencyRealtimeService } from './agencyRealtime.service.js'
import { sendMail } from '../lib/mailer.js'

function clientOrigin() {
  return (process.env.CLIENT_ORIGIN || 'http://localhost:5173').replace(/\/$/, '')
}

export const agencyInvitationOpsService = {
  async getInviteCard(code) {
    const { data: inv } = await supabase
      .from('agency_invitations')
      .select('*, agencies(id, name, slug, logo_url, motto, primary_color, agency_rank, is_verified)')
      .eq('code', code.toUpperCase())
      .eq('is_active', true)
      .maybeSingle()

    if (!inv || (inv.expires_at && new Date(inv.expires_at) < new Date())) {
      return null
    }

    const sponsorId = inv.sponsor_user_id || inv.created_by
    const { data: sponsor } = await supabase
      .from('users')
      .select('id, username, full_name, profile_image, user_code, rank_id, ranks(name)')
      .eq('id', sponsorId)
      .single()

    const { data: creator } = await supabase
      .from('agency_members')
      .select('role')
      .eq('user_id', sponsorId)
      .eq('agency_id', inv.agency_id)
      .eq('status', 'active')
      .maybeSingle()

    let placementPreview = null
    try {
      placementPreview = await agencyPlacementService.previewPlacement(
        sponsorId,
        inv.placement_side
      )
    } catch {
      placementPreview = { placement_side: inv.placement_side }
    }

    const joinUrl = `${clientOrigin()}/register?agency_code=${inv.code}&ref=${sponsor?.username || ''}`

    return {
      invitation: inv,
      agency: inv.agencies,
      sponsor,
      inviter_role: creator?.role || 'recruiter',
      placement_preview: placementPreview,
      join_url: joinUrl,
      qr_payload: inv.qr_payload || joinUrl,
      benefits: [
        'انضمام لوكالة رسمية مُدارة',
        'شجرة ثنائية للعمولات',
        'تتبع BV و PV',
        'دعم القادة والمجندين',
      ],
      package_recommendation: 'يُفضّل باقة أحادي أو أعلى لتفعيل الشجرة',
    }
  },

  async trackOpen(code) {
    const { data: inv } = await supabase
      .from('agency_invitations')
      .select('open_count, agency_id')
      .eq('code', code.toUpperCase())
      .maybeSingle()
    if (!inv) return
    await supabase
      .from('agency_invitations')
      .update({ open_count: (inv.open_count || 0) + 1 })
      .eq('code', code.toUpperCase())
  },

  async trackClick(code) {
    const { data: inv } = await supabase
      .from('agency_invitations')
      .select('click_count, agency_id')
      .eq('code', code.toUpperCase())
      .maybeSingle()
    if (!inv) return
    await supabase
      .from('agency_invitations')
      .update({ click_count: (inv.click_count || 0) + 1 })
      .eq('code', code.toUpperCase())
  },

  async createRecruiterInvite(agencyId, creatorId, options = {}) {
    const { data: membership } = await supabase
      .from('agency_members')
      .select('role')
      .eq('agency_id', agencyId)
      .eq('user_id', creatorId)
      .eq('status', 'active')
      .single()

    if (!membership || !hasAgencyPermission(membership.role, 'invite')) {
      throw Object.assign(new Error('Cannot create invites'), { status: 403 })
    }

    const code = `AG-${crypto.randomBytes(3).toString('hex').toUpperCase()}`
    const expiresAt = options.expires_in_hours
      ? new Date(Date.now() + options.expires_in_hours * 3600000).toISOString()
      : null

    const { data: inv, error } = await supabase
      .from('agency_invitations')
      .insert({
        agency_id: agencyId,
        created_by: creatorId,
        sponsor_user_id: creatorId,
        code,
        invite_type: options.invite_type || 'recruiter_link',
        placement_side: options.placement_side || 'AUTO',
        theme: options.theme || 'elite',
        qr_payload: options.qr_payload || `${clientOrigin()}/register?agency_code=${code}`,
        expires_at: expiresAt,
        meta: options.meta || {},
      })
      .select()
      .single()

    if (error) throw error

    const card = await this.getInviteCard(code)
    return { invite: inv, card }
  },

  async sendEmailInvite(agencyId, creatorId, { email, recipientName, inviteId }) {
    const { data: inv } = await supabase
      .from('agency_invitations')
      .select('code, agency_id')
      .eq('id', inviteId)
      .eq('agency_id', agencyId)
      .single()

    if (!inv) throw Object.assign(new Error('Invite not found'), { status: 404 })

    const card = await this.getInviteCard(inv.code)
    const html = `
      <h2>دعوة للانضمام — ${card.agency?.name}</h2>
      <p>مرحباً ${recipientName || ''},</p>
      <p>يدعوك ${card.sponsor?.full_name || card.sponsor?.username} للانضمام إلى وكالة ${card.agency?.name} على Credo W.</p>
      <p><a href="${card.join_url}">اضغط هنا للتسجيل</a></p>
    `

    await sendMail({
      to: email,
      subject: `دعوة انضمام — ${card.agency?.name}`,
      html,
    })

    return { sent: true, join_url: card.join_url }
  },

  async getAgencyInviteAnalytics(agencyId, requesterId) {
    const { data: membership } = await supabase
      .from('agency_members')
      .select('role')
      .eq('agency_id', agencyId)
      .eq('user_id', requesterId)
      .single()

    if (!membership || !hasAgencyPermission(membership.role, 'analytics')) {
      throw Object.assign(new Error('Forbidden'), { status: 403 })
    }

    const { data: invites } = await supabase
      .from('agency_invitations')
      .select('id, code, open_count, click_count, conversion_count, is_active, created_at, created_by')
      .eq('agency_id', agencyId)
      .order('created_at', { ascending: false })
      .limit(200)

    const totals = (invites || []).reduce(
      (acc, i) => {
        acc.opens += i.open_count || 0
        acc.clicks += i.click_count || 0
        acc.conversions += i.conversion_count || 0
        if (i.is_active) acc.active += 1
        return acc
      },
      { opens: 0, clicks: 0, conversions: 0, active: 0 }
    )

    totals.conversion_rate = totals.clicks > 0 ? totals.conversions / totals.clicks : 0

    return { invites: invites || [], totals }
  },

  async onInviteAccepted(code, userId) {
    const { data: inv } = await supabase
      .from('agency_invitations')
      .select('agency_id, created_by')
      .eq('code', code.toUpperCase())
      .maybeSingle()
    if (!inv) return
    await supabase
      .from('agency_invitations')
      .update({ conversion_count: (inv.conversion_count || 0) + 1 })
      .eq('code', code.toUpperCase())

    await agencyRealtimeService.emit(inv.agency_id, 'invitation_accepted', {
      actorId: userId,
      targetUserId: inv.created_by,
      payload: { code },
    })
  },
}
