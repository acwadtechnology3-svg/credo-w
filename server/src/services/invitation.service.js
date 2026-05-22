import crypto from 'crypto'
import { supabase } from '../lib/supabase.js'
import { resolveAvatarDisplayUrl } from '../lib/avatarUrl.js'
import { sendMail } from '../lib/mailer.js'
import {
  buildInviteEmailHtml,
  getInviteEmailText,
  INVITE_EMAIL_SUBJECT,
} from '../mail/templates/inviteEmail.js'
import { pearlsService } from './pearls.service.js'
import { evaluateAchievements, syncGamification } from './profileGamification.service.js'
import { getUserTeam } from './teams.service.js'

const DEFAULT_EXPIRY_HOURS = 168

function clientOrigin() {
  return (
    process.env.CLIENT_ORIGIN ||
    process.env.ALLOWED_ORIGIN ||
    'http://localhost:5173'
  ).replace(/\/$/, '')
}

function generateInviteCode() {
  const chunk = crypto.randomBytes(4).toString('hex').toUpperCase()
  return `CREDO-${chunk}`
}

export async function getInviteSettings() {
  const keys = [
    'invite_expiry_hours',
    'invite_limits',
    'invite_themes',
    'invite_rewards',
    'invite_auto_placement',
  ]
  const { data } = await supabase.from('system_settings').select('key, value').in('key', keys)

  const map = Object.fromEntries((data || []).map((r) => [r.key, r.value]))
  return {
    expiryHours: map.invite_expiry_hours?.hours ?? DEFAULT_EXPIRY_HOURS,
    limits: map.invite_limits ?? { max_pending_per_user: 50, max_per_day: 20 },
    themes: map.invite_themes?.themes ?? ['valorant', 'nitro', 'royal', 'cyber'],
    rewards: map.invite_rewards ?? { pearls_per_join: 250, pearls_first_purchase: 600 },
    autoPlacement: map.invite_auto_placement ?? { mode: 'weaker_bv_side' },
  }
}

/** Pick weaker BV leg for balanced binary tree growth. */
export async function resolveOptimalPlacementSide(inviterId, preferred) {
  const pref = (preferred || 'AUTO').toUpperCase()
  if (pref === 'LEFT' || pref === 'RIGHT') return pref

  const { data: logs } = await supabase
    .from('bv_logs')
    .select('side, amount')
    .eq('user_id', inviterId)

  let sideA = 0
  let sideB = 0
  for (const log of logs || []) {
    const amt = parseFloat(log.amount || 0)
    if (log.side === 'LEFT') sideA += amt
    else sideB += amt
  }

  if (sideA === sideB) {
    const { data: myNode } = await supabase
      .from('tree_nodes')
      .select('id')
      .eq('user_id', inviterId)
      .maybeSingle()

    if (!myNode) return 'LEFT'

    const { data: children } = await supabase
      .from('tree_nodes')
      .select('side')
      .eq('parent_id', myNode.id)

    const leftCount = (children || []).filter((c) => c.side === 'LEFT').length
    const rightCount = (children || []).filter((c) => c.side === 'RIGHT').length
    return leftCount <= rightCount ? 'LEFT' : 'RIGHT'
  }

  return sideA <= sideB ? 'LEFT' : 'RIGHT'
}

async function bumpRecruiterStats(userId, field) {
  const { data: existing } = await supabase
    .from('recruiter_stats')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  const today = new Date().toISOString().slice(0, 10)
  let streak = existing?.invite_streak || 0
  const last = existing?.last_invite_date
  if (field === 'invites_sent') {
    if (last === today) {
      /* same day */
    } else if (last) {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      streak = last === yesterday.toISOString().slice(0, 10) ? streak + 1 : 1
    } else {
      streak = 1
    }
  }

  const patch = {
    [field]: (existing?.[field] || 0) + 1,
    updated_at: new Date().toISOString(),
  }
  if (field === 'invites_sent') {
    patch.last_invite_date = today
    patch.invite_streak = streak
  }

  if (existing) {
    await supabase.from('recruiter_stats').update(patch).eq('user_id', userId)
  } else {
    await supabase.from('recruiter_stats').insert({ user_id: userId, ...patch })
  }
}

async function logEvent(invitationId, eventType, meta = {}, req = null) {
  const ip = req?.ip || req?.headers?.['x-forwarded-for'] || ''
  const ipHash = ip ? crypto.createHash('sha256').update(String(ip)).digest('hex').slice(0, 32) : null

  await supabase.from('invitation_events').insert({
    invitation_id: invitationId,
    event_type: eventType,
    meta,
    ip_hash: ipHash,
    user_agent: req?.headers?.['user-agent']?.slice(0, 512) || null,
  })
}

async function loadInviterContext(inviterId) {
  const { data: user } = await supabase
    .from('users')
    .select(
      'id, user_code, username, full_name, profile_image, direct_count, current_package_level, ranks(name, sort_order)'
    )
    .eq('id', inviterId)
    .single()

  if (!user) throw new Error('Inviter not found')

  let profile_image = user.profile_image
  if (profile_image) {
    profile_image = await resolveAvatarDisplayUrl(profile_image)
  }

  let clan = null
  try {
    clan = await getUserTeam(inviterId)
  } catch {
    /* teams optional */
  }

  const packageLabels = { 0: 'Free', 1: 'Mono', 3: 'Triple', 7: 'Septuple' }
  const pkgLevel = user.current_package_level || 0

  return {
    id: user.id,
    user_code: user.user_code,
    username: user.username,
    full_name: user.full_name,
    profile_image,
    rank: user.ranks?.name || 'BAP',
    rank_sort: user.ranks?.sort_order || 0,
    direct_count: user.direct_count || 0,
    package_label: packageLabels[pkgLevel] || `L${pkgLevel}`,
    team_name: clan?.name || `${user.username}'s Legion`,
    team_color: clan?.team_color || '#7B6CF6',
  }
}

export function buildInviteUrls(inviteCode, placementSide) {
  const origin = clientOrigin()
  const side = placementSide || 'AUTO'
  const registerUrl = `${origin}/register?invite=${encodeURIComponent(inviteCode)}&side=${side}`
  const landingUrl = `${origin}/invite/${encodeURIComponent(inviteCode)}`
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=280x280&margin=10&data=${encodeURIComponent(registerUrl)}`
  return { registerUrl, landingUrl, qrUrl }
}

export async function buildInviteCardPayload(invitation, inviter) {
  const urls = buildInviteUrls(invitation.invite_code, invitation.placement_side)
  const resolvedSide =
    invitation.placement_side === 'AUTO'
      ? await resolveOptimalPlacementSide(invitation.inviter_id, 'AUTO')
      : invitation.placement_side

  return {
    invitation: {
      id: invitation.id,
      invite_code: invitation.invite_code,
      status: invitation.status,
      placement_side: invitation.placement_side,
      resolved_side: resolvedSide,
      invitation_message: invitation.invitation_message,
      invite_theme: invitation.invite_theme,
      card_style: invitation.card_style,
      invite_emoji: invitation.invite_emoji,
      expires_at: invitation.expires_at,
    },
    inviter,
    urls,
  }
}

export const invitationService = {
  getInviteSettings,

  async getHub(userId) {
    const settings = await getInviteSettings()
    const inviter = await loadInviterContext(userId)

    const { data: stats } = await supabase
      .from('recruiter_stats')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()

    const { data: recent } = await supabase
      .from('member_invitations')
      .select('id, invited_email, status, placement_side, invite_code, created_at, expires_at')
      .eq('inviter_id', userId)
      .order('created_at', { ascending: false })
      .limit(8)

    const optimalSide = await resolveOptimalPlacementSide(userId, 'AUTO')

    const { data: sideBv } = await supabase
      .from('bv_logs')
      .select('side, amount')
      .eq('user_id', userId)

    let sideA = 0
    let sideB = 0
    for (const log of sideBv || []) {
      const amt = parseFloat(log.amount || 0)
      if (log.side === 'LEFT') sideA += amt
      else sideB += amt
    }

    const { data: topRecruiters } = await supabase
      .from('recruiter_stats')
      .select('user_id, invites_converted, invite_streak, users!inner(username, full_name, profile_image)')
      .order('invites_converted', { ascending: false })
      .limit(10)

    return {
      settings,
      inviter,
      stats: stats || {
        invites_sent: 0,
        invites_opened: 0,
        invites_clicked: 0,
        invites_converted: 0,
        invite_streak: 0,
      },
      treeBalance: { sideA, sideB, recommendedSide: optimalSide },
      recentInvitations: recent || [],
      leaderboard: (topRecruiters || []).map((r, i) => ({
        rank: i + 1,
        username: r.users?.username,
        full_name: r.users?.full_name,
        conversions: r.invites_converted,
        streak: r.invite_streak,
      })),
    }
  },

  async listInvitations(userId, { page = 1, limit = 20, status } = {}) {
    const offset = (page - 1) * limit
    let query = supabase
      .from('member_invitations')
      .select('*', { count: 'exact' })
      .eq('inviter_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (status) query = query.eq('status', status)

    const { data, count, error } = await query
    if (error) throw error
    return { data: data || [], total: count ?? 0, page, limit }
  },

  async createInvitation(userId, body, req) {
    const settings = await getInviteSettings()
    const {
      invited_email,
      placement_side = 'AUTO',
      invitation_message,
      invite_theme = 'valorant',
      card_style = 'holographic',
      invite_emoji = '🔥',
      invite_channel = 'email',
      send_email = true,
    } = body

    if (!invited_email?.trim()) throw Object.assign(new Error('Email is required'), { status: 400 })

    const email = invited_email.trim().toLowerCase()
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRe.test(email)) throw Object.assign(new Error('Invalid email'), { status: 400 })

    const { data: inviter } = await supabase
      .from('users')
      .select('status')
      .eq('id', userId)
      .single()

    if (!inviter || inviter.status !== 'active') {
      throw Object.assign(new Error('يجب أن يكون حسابك نشطاً لإرسال الدعوات'), { status: 403 })
    }

    const { count: pendingCount } = await supabase
      .from('member_invitations')
      .select('*', { count: 'exact', head: true })
      .eq('inviter_id', userId)
      .in('status', ['pending', 'opened', 'clicked'])

    if ((pendingCount || 0) >= (settings.limits.max_pending_per_user || 50)) {
      throw Object.assign(new Error('Too many pending invitations'), { status: 429 })
    }

    const startOfDay = new Date()
    startOfDay.setHours(0, 0, 0, 0)
    const { count: todayCount } = await supabase
      .from('member_invitations')
      .select('*', { count: 'exact', head: true })
      .eq('inviter_id', userId)
      .gte('created_at', startOfDay.toISOString())

    if ((todayCount || 0) >= (settings.limits.max_per_day || 20)) {
      throw Object.assign(new Error('Daily invitation limit reached'), { status: 429 })
    }

    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .maybeSingle()

    if (existingUser) {
      throw Object.assign(new Error('هذا البريد مسجّل بالفعل في المنصة'), { status: 409 })
    }

    const side = ['LEFT', 'RIGHT', 'AUTO'].includes((placement_side || '').toUpperCase())
      ? placement_side.toUpperCase()
      : 'AUTO'

    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + (settings.expiryHours || DEFAULT_EXPIRY_HOURS))

    let inviteCode = generateInviteCode()
    for (let attempt = 0; attempt < 5; attempt++) {
      const { data, error } = await supabase
        .from('member_invitations')
        .insert({
          inviter_id: userId,
          invited_email: email,
          placement_side: side,
          invite_code: inviteCode,
          invitation_message: invitation_message?.slice(0, 280) || null,
          invite_theme: invite_theme?.slice(0, 32) || 'valorant',
          card_style: card_style?.slice(0, 32) || 'holographic',
          invite_emoji: invite_emoji?.slice(0, 8) || '🔥',
          invite_channel: invite_channel?.slice(0, 20) || 'email',
          expires_at: expiresAt.toISOString(),
        })
        .select()
        .single()

      if (!error) {
        await bumpRecruiterStats(userId, 'invites_sent')
        await logEvent(data.id, 'sent', { channel: invite_channel }, req)

        const inviterCtx = await loadInviterContext(userId)
        const card = await buildInviteCardPayload(data, inviterCtx)

        let emailSent = false
        let emailError = null
        if (send_email) {
          try {
            await this.sendInvitationEmail(data, inviterCtx, card)
            emailSent = true
          } catch (mailErr) {
            console.error('sendInvitationEmail:', mailErr)
            emailError = mailErr.message || 'Email delivery failed'
          }
        }

        return { invitation: data, card, emailSent, emailError }
      }

      if (error.code === '23505') {
        inviteCode = generateInviteCode()
        continue
      }
      throw error
    }

    throw new Error('Could not generate unique invite code')
  },

  async sendInvitationEmail(invitation, inviter, card) {
    const subject = INVITE_EMAIL_SUBJECT.replace('{name}', inviter.full_name || inviter.username)
    const html = buildInviteEmailHtml({ inviter, card })
    const text = getInviteEmailText({ inviter, card })

    await sendMail({
      to: invitation.invited_email,
      subject,
      html,
      text,
    })
  },

  async getInvitationCard(userId, invitationId) {
    const { data: invitation } = await supabase
      .from('member_invitations')
      .select('*')
      .eq('id', invitationId)
      .eq('inviter_id', userId)
      .maybeSingle()

    if (!invitation) throw Object.assign(new Error('Invitation not found'), { status: 404 })

    const inviter = await loadInviterContext(userId)
    return buildInviteCardPayload(invitation, inviter)
  },

  async getPublicInvite(inviteCode, req) {
    const code = (inviteCode || '').trim().toUpperCase()
    const { data: invitation } = await supabase
      .from('member_invitations')
      .select('*')
      .eq('invite_code', code)
      .maybeSingle()

    if (!invitation) throw Object.assign(new Error('Invitation not found'), { status: 404 })

    if (new Date(invitation.expires_at) < new Date()) {
      if (invitation.status !== 'expired') {
        await supabase
          .from('member_invitations')
          .update({ status: 'expired', updated_at: new Date().toISOString() })
          .eq('id', invitation.id)
      }
      throw Object.assign(new Error('Invitation has expired'), { status: 410 })
    }

    if (['rejected', 'expired'].includes(invitation.status)) {
      throw Object.assign(new Error('Invitation is no longer valid'), { status: 410 })
    }

    const inviter = await loadInviterContext(invitation.inviter_id)
    const card = await buildInviteCardPayload(invitation, inviter)

    return { card, invitation }
  },

  async trackEvent(inviteCode, eventType, req) {
    const { invitation } = await this.getPublicInvite(inviteCode, req).catch((e) => {
      if (e.status === 410) throw e
      throw e
    })

    const now = new Date().toISOString()
    const updates = { updated_at: now }
    const inv = invitation

    if (eventType === 'opened' && !['registered', 'joined_team'].includes(inv.status)) {
      updates.status = inv.status === 'pending' ? 'opened' : inv.status
      updates.open_count = (inv.open_count || 0) + 1
      if (!inv.opened_at) updates.opened_at = now
      await bumpRecruiterStats(inv.inviter_id, 'invites_opened')
    }

    if (eventType === 'clicked' && !['registered', 'joined_team'].includes(inv.status)) {
      updates.status = 'clicked'
      updates.click_count = (inv.click_count || 0) + 1
      if (!inv.clicked_at) updates.clicked_at = now
      await bumpRecruiterStats(inv.inviter_id, 'invites_clicked')
    }

    await supabase.from('member_invitations').update(updates).eq('id', inv.id)
    await logEvent(inv.id, eventType, {}, req)

    return { ok: true }
  },

  async resolveInviteForRegistration(inviteCode) {
    const code = (inviteCode || '').trim().toUpperCase()
    if (!code) return null

    const { data: invitation } = await supabase
      .from('member_invitations')
      .select('*')
      .eq('invite_code', code)
      .maybeSingle()

    if (!invitation) return null
    if (new Date(invitation.expires_at) < new Date()) return null
    if (['rejected', 'expired', 'registered', 'joined_team'].includes(invitation.status)) {
      return null
    }

    const { data: inviter } = await supabase
      .from('users')
      .select('id, user_code, status')
      .eq('id', invitation.inviter_id)
      .single()

    if (!inviter || inviter.status !== 'active') return null

    const side = await resolveOptimalPlacementSide(
      invitation.inviter_id,
      invitation.placement_side
    )

    return {
      invitation,
      sponsorId: inviter.id,
      sponsorCode: inviter.user_code,
      placementSide: side,
    }
  },

  async onUserRegistered(inviteCode, newUserId, email) {
    const resolved = await this.resolveInviteForRegistration(inviteCode)
    if (!resolved) return null

    const { invitation } = resolved
    const now = new Date().toISOString()

    await supabase
      .from('member_invitations')
      .update({
        status: 'registered',
        registered_user_id: newUserId,
        accepted_at: now,
        updated_at: now,
      })
      .eq('id', invitation.id)

    await logEvent(invitation.id, 'registered', { user_id: newUserId })

    if (email && invitation.invited_email !== email.toLowerCase()) {
      /* still count — user may use different email typo; optional strict match skipped */
    }

    await bumpRecruiterStats(invitation.inviter_id, 'invites_converted')

    const settings = await getInviteSettings()
    const pearls = settings.rewards?.pearls_per_join ?? 250
    try {
      await pearlsService.earn(invitation.inviter_id, 'invite_recruit', pearls, {
        invitation_id: invitation.id,
        referee_id: newUserId,
      })
    } catch (e) {
      console.warn('Invite pearls reward:', e.message)
    }

    await this.checkRecruitmentAchievements(invitation.inviter_id)

    return resolved
  },

  async onUserJoinedTeam(userId) {
    const { data: invitation } = await supabase
      .from('member_invitations')
      .select('id, inviter_id')
      .eq('registered_user_id', userId)
      .in('status', ['registered'])
      .maybeSingle()

    if (!invitation) return

    await supabase
      .from('member_invitations')
      .update({ status: 'joined_team', updated_at: new Date().toISOString() })
      .eq('id', invitation.id)

    await logEvent(invitation.id, 'joined', { user_id: userId })
    await this.checkRecruitmentAchievements(invitation.inviter_id)
  },

  async checkRecruitmentAchievements(userId) {
    const { data: stats } = await supabase
      .from('recruiter_stats')
      .select('invites_converted, invite_streak')
      .eq('user_id', userId)
      .maybeSingle()

    const conversions = stats?.invites_converted || 0
    const streak = stats?.invite_streak || 0

    const checks = [
      { id: 'team_builder_invite', ok: conversions >= 1 },
      { id: 'elite_recruiter', ok: conversions >= 5 },
      { id: 'legendary_founder', ok: conversions >= 25 },
      { id: 'invite_streak_7', ok: streak >= 7 },
    ]

    for (const c of checks) {
      if (!c.ok) continue
      await supabase.from('user_achievements').upsert(
        { user_id: userId, achievement_id: c.id },
        { onConflict: 'user_id,achievement_id', ignoreDuplicates: true }
      )
    }

    const { data: user } = await supabase
      .from('users')
      .select('total_pv, direct_count, commission_paid_total, current_package_level, ranks(sort_order)')
      .eq('id', userId)
      .single()

    const { data: bv } = await supabase.from('bv_logs').select('side, amount').eq('user_id', userId)
    let sideA = 0
    let sideB = 0
    for (const log of bv || []) {
      const amt = parseFloat(log.amount || 0)
      if (log.side === 'LEFT') sideA += amt
      else sideB += amt
    }

    let hasTeam = false
    try {
      hasTeam = !!(await getUserTeam(userId))
    } catch {
      /* optional */
    }

    const metrics = {
      totalPv: parseFloat(user?.total_pv || 0),
      directCount: user?.direct_count || 0,
      sideA,
      sideB,
      commissionTotal: parseFloat(user?.commission_paid_total || 0),
      rankSortOrder: user?.ranks?.sort_order || 0,
      packageLevel: user?.current_package_level || 0,
      hasTeam,
      streakDays: streak,
    }

    await syncGamification(userId, metrics)
    await evaluateAchievements(userId, metrics)
  },

  async rejectInvitation(userId, invitationId) {
    const { data } = await supabase
      .from('member_invitations')
      .update({
        status: 'rejected',
        rejected_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', invitationId)
      .eq('inviter_id', userId)
      .select()
      .single()

    if (!data) throw Object.assign(new Error('Invitation not found'), { status: 404 })
    await logEvent(data.id, 'rejected', {})
    return data
  },

  async updateAdminSettings(body) {
    const allowed = [
      'invite_expiry_hours',
      'invite_limits',
      'invite_themes',
      'invite_rewards',
      'invite_auto_placement',
    ]

    for (const key of allowed) {
      if (body[key] !== undefined) {
        await supabase
          .from('system_settings')
          .upsert({ key, value: body[key], updated_at: new Date().toISOString() })
      }
    }

    return getInviteSettings()
  },
}
