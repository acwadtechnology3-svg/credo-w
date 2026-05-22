import { supabase } from '../lib/supabase.js'
import { emitToAgency, emitToUser, getIO } from '../lib/socket.js'
import { notifyUser } from '../lib/notify.js'
import { agencyPackageGateService } from './agencyPackageGate.service.js'
import {
  mapAgencyRoleToGroupRole,
  canAccessChannel,
  canPostInChannel,
  canModerate,
  canManageGroup,
  isPlatformStaff,
  groupRoleRank,
} from '../lib/agencyGroupPermissions.js'
import { getGroupAiSuggestion } from './agencyGroupsAi.service.js'

const MESSAGE_TYPES = new Set([
  'text',
  'image',
  'file',
  'voice',
  'system',
  'onboarding_card',
  'achievement_card',
  'rank_card',
  'package_card',
  'welcome',
  'ai',
])
const FLOOD_MS = 800
const recentSends = new Map()

async function logActivity(agencyId, action, { actorId, targetUserId, groupId, channelId, details } = {}) {
  await supabase.from('agency_group_activity_logs').insert({
    agency_id: agencyId,
    group_id: groupId || null,
    channel_id: channelId || null,
    actor_id: actorId || null,
    action,
    target_user_id: targetUserId || null,
    details: details || {},
  })
}

async function getPlatformRole(userId) {
  const { data } = await supabase.from('users').select('role').eq('id', userId).single()
  return data?.role
}

async function getActiveBan(agencyId, userId) {
  const now = new Date().toISOString()
  const { data } = await supabase
    .from('agency_group_bans')
    .select('*')
    .eq('agency_id', agencyId)
    .eq('user_id', userId)
    .eq('is_active', true)
    .maybeSingle()
  if (!data) return null
  if (data.ban_type === 'temporary' && data.expires_at && data.expires_at < now) {
    await supabase.from('agency_group_bans').update({ is_active: false }).eq('id', data.id)
    return null
  }
  return data
}

async function getActiveMute(agencyId, userId) {
  const now = new Date().toISOString()
  const { data } = await supabase
    .from('agency_group_mutes')
    .select('*')
    .eq('agency_id', agencyId)
    .eq('user_id', userId)
    .eq('is_active', true)
    .maybeSingle()
  if (!data) return null
  if (data.mute_type === 'temporary' && data.expires_at && data.expires_at < now) {
    await supabase.from('agency_group_mutes').update({ is_active: false }).eq('id', data.id)
    return null
  }
  return data
}

export async function bootstrapAgencyGroups(agencyId, ownerId = null) {
  const { data, error } = await supabase.rpc('bootstrap_agency_group_infra', {
    p_agency_id: agencyId,
    p_owner_id: ownerId,
  })
  if (error) {
    const { data: existing } = await supabase
      .from('agency_groups')
      .select('id')
      .eq('agency_id', agencyId)
      .eq('group_type', 'main')
      .maybeSingle()
    if (existing) return existing.id
    throw error
  }
  return data
}

export async function assertGroupAccess(userId, agencyId, { requirePackage = true } = {}) {
  const platformRole = await getPlatformRole(userId)
  if (isPlatformStaff(platformRole)) {
    return { platformRole, membership: { role: 'platform_admin' }, groupMember: null, ban: null, mute: null }
  }

  const { data: membership } = await supabase
    .from('agency_members')
    .select('role, agency_id, status')
    .eq('user_id', userId)
    .eq('agency_id', agencyId)
    .eq('status', 'active')
    .maybeSingle()

  if (!membership) {
    throw Object.assign(new Error('يجب أن تكون عضواً معتمداً في الوكالة'), { status: 403, code: 'NOT_MEMBER' })
  }

  if (requirePackage) {
    await agencyPackageGateService.assertAgencyParticipation(userId, {
      requirePackage: true,
      requireMembership: true,
    })
  }

  const ban = await getActiveBan(agencyId, userId)
  if (ban) {
    throw Object.assign(new Error('محظور من قنوات الوكالة'), { status: 403, code: 'BANNED' })
  }

  const mute = await getActiveMute(agencyId, userId)

  const { data: group } = await supabase
    .from('agency_groups')
    .select('id')
    .eq('agency_id', agencyId)
    .eq('group_type', 'main')
    .maybeSingle()

  let groupMember = null
  if (group) {
    const { data: gm } = await supabase
      .from('agency_group_members')
      .select('*')
      .eq('group_id', group.id)
      .eq('user_id', userId)
      .eq('status', 'active')
      .maybeSingle()
    groupMember = gm
  }

  return { platformRole, membership, groupMember, ban, mute }
}

export async function syncMemberToGroups(userId, agencyId, agencyRole = 'member') {
  await bootstrapAgencyGroups(agencyId)
  const { data: group } = await supabase
    .from('agency_groups')
    .select('id')
    .eq('agency_id', agencyId)
    .eq('group_type', 'main')
    .single()

  const groupRole = mapAgencyRoleToGroupRole(agencyRole)
  await supabase.from('agency_group_members').upsert(
    {
      group_id: group.id,
      agency_id: agencyId,
      user_id: userId,
      group_role: groupRole,
      can_post: true,
      status: 'active',
      joined_at: new Date().toISOString(),
      left_at: null,
    },
    { onConflict: 'group_id,user_id' }
  )

  await postWelcomeFlow(userId, agencyId, group.id)
}

export async function revokeMemberFromGroups(userId, agencyId) {
  const { data: groups } = await supabase.from('agency_groups').select('id').eq('agency_id', agencyId)
  for (const g of groups || []) {
    await supabase
      .from('agency_group_members')
      .update({ status: 'left', left_at: new Date().toISOString(), can_post: false })
      .eq('group_id', g.id)
      .eq('user_id', userId)
  }
}

async function postWelcomeFlow(userId, agencyId, groupId) {
  const { data: user } = await supabase
    .from('users')
    .select('id, full_name, username, sponsor_id, current_package_level, agency_onboarding_status')
    .eq('id', userId)
    .single()

  const { data: agency } = await supabase.from('agencies').select('name, slug').eq('id', agencyId).single()

  let sponsorName = null
  if (user?.sponsor_id) {
    const { data: sp } = await supabase
      .from('users')
      .select('full_name, username')
      .eq('id', user.sponsor_id)
      .maybeSingle()
    sponsorName = sp?.full_name || sp?.username
  }

  const { data: onboardingCh } = await supabase
    .from('agency_group_channels')
    .select('id')
    .eq('group_id', groupId)
    .eq('channel_type', 'onboarding')
    .single()

  const displayName = user?.full_name || user?.username || 'عضو جديد'
  const welcomeBody = sponsorName
    ? `مرحباً ${displayName} في ${agency?.name}. راعيك: ${sponsorName}.`
    : `مرحباً ${displayName} في ${agency?.name}.`

  await postSystemMessage({
    agencyId,
    groupId,
    channelId: onboardingCh?.id,
    messageType: 'welcome',
    body: welcomeBody,
    metadata: {
      user_id: userId,
      sponsor_name: sponsorName,
      agency_name: agency?.name,
      compact: true,
    },
  })

  await supabase.from('agency_messages').insert({
    channel_id: onboardingCh?.id,
    group_id: groupId,
    agency_id: agencyId,
    sender_id: null,
    sender_role: 'credo_ai',
    body: `أهلاً ${displayName} — اسألني عن الباقات أو خطوات الانضمام.`,
    message_type: 'ai',
    metadata: { intro: true, compact: true },
  })
}

function viewerCanSeeDeletedContent(ctx) {
  const groupRole = ctx.groupMember?.group_role || mapAgencyRoleToGroupRole(ctx.membership?.role)
  return canModerate(groupRole, ctx.membership?.role, ctx.platformRole)
}

function applyMessageVisibility(messages, userId, ctx) {
  const staff = viewerCanSeeDeletedContent(ctx)
  return messages
    .filter((m) => !m._hidden_for_user)
    .map((m) => {
      const out = { ...m }
      if (m.deleted_for_all_at) {
        if (staff) {
          out._moderation_view = true
          out._original_body = m.body
          out.body = m.body
        } else {
          out.body = null
          out.deleted_placeholder = true
          out.deleted_label =
            m.sender_id === userId ? 'أنت حذفت هذه الرسالة' : 'تم حذف هذه الرسالة'
        }
      }
      return out
    })
}

export async function postSystemMessage({
  agencyId,
  groupId,
  channelId,
  messageType = 'system',
  body,
  metadata = {},
  targetUserId = null,
}) {
  if (!channelId) {
    const { data: ch } = await supabase
      .from('agency_group_channels')
      .select('id, group_id')
      .eq('agency_id', agencyId)
      .eq('channel_type', 'main')
      .maybeSingle()
    channelId = ch?.id
    groupId = groupId || ch?.group_id
  }

  const { data: msg } = await supabase
    .from('agency_messages')
    .insert({
      channel_id: channelId,
      group_id: groupId,
      agency_id: agencyId,
      sender_id: null,
      sender_role: 'system',
      body,
      message_type: messageType,
      metadata,
    })
    .select()
    .single()

  const payload = { message: msg, agencyId, channelId }
  emitToAgency(agencyId, 'agency-group:message', payload)
  if (targetUserId) emitToUser(targetUserId, 'agency-group:message', payload)
  return msg
}

export async function emitLiveEvent(agencyId, eventType, { userId, payload = {} } = {}) {
  const templates = {
    member_joined: (p) => `👋 انضم **${p.name || 'عضو جديد'}** إلى الوكالة`,
    package_upgraded: (p) => `📦 ترقية باقة → المستوى **${p.packageLevel}**`,
    rank_unlocked: (p) => `🏆 رتبة جديدة: **${p.rankName || 'ترقية'}**`,
    achievement_earned: (p) => `✨ إنجاز: **${p.title || 'إنجاز جديد'}**`,
    agency_milestone: (p) => `🎯 إنجاز الوكالة: **${p.milestone || 'معلم جديد'}**`,
  }

  const body = templates[eventType]?.(payload) || payload.body || eventType
  const typeMap = {
    package_upgraded: 'package_card',
    rank_unlocked: 'rank_card',
    achievement_earned: 'achievement_card',
    member_joined: 'system',
    agency_milestone: 'system',
  }

  return postSystemMessage({
    agencyId,
    messageType: typeMap[eventType] || 'system',
    body,
    metadata: { event_type: eventType, ...payload },
    targetUserId: userId,
  })
}

export const agencyGroupsService = {
  bootstrapAgencyGroups,
  syncMemberToGroups,
  revokeMemberFromGroups,
  assertGroupAccess,
  postSystemMessage,
  emitLiveEvent,

  async getWorkspace(userId, agencyId) {
    const ctx = await assertGroupAccess(userId, agencyId)
    await bootstrapAgencyGroups(agencyId)

    const { data: agency } = await supabase
      .from('agencies')
      .select('id, name, slug, logo_url, primary_color, secondary_color, glow_theme')
      .eq('id', agencyId)
      .single()

    const { data: group } = await supabase
      .from('agency_groups')
      .select('*')
      .eq('agency_id', agencyId)
      .eq('group_type', 'main')
      .single()

    const { data: channels } = await supabase
      .from('agency_group_channels')
      .select('*')
      .eq('group_id', group.id)
      .eq('is_archived', false)
      .order('sort_order')

    const groupRole =
      ctx.groupMember?.group_role || mapAgencyRoleToGroupRole(ctx.membership?.role)
    const visible = (channels || []).filter((ch) =>
      canAccessChannel({
        channelType: ch.channel_type,
        groupRole,
        agencyRole: ctx.membership?.role,
        platformRole: ctx.platformRole,
        isBanned: false,
      })
    )

    const unread = {}
    for (const ch of visible) {
      const { count } = await supabase
        .from('agency_messages')
        .select('id', { count: 'exact', head: true })
        .eq('channel_id', ch.id)
        .eq('is_deleted', false)
        .gt('created_at', ctx.groupMember?.last_read_at || '1970-01-01')
      unread[ch.id] = count || 0
    }

    return {
      agency,
      group,
      channels: visible,
      membership: ctx.membership,
      group_role: groupRole,
      unread_by_channel: unread,
      can_moderate: canModerate(groupRole, ctx.membership?.role, ctx.platformRole),
      can_manage: canManageGroup(groupRole, ctx.membership?.role, ctx.platformRole),
      is_muted: !!ctx.mute,
    }
  },

  async getMessages(userId, agencyId, channelId, { before, limit = 50 } = {}) {
    const ctx = await assertGroupAccess(userId, agencyId)
    const { data: channel } = await supabase
      .from('agency_group_channels')
      .select('*')
      .eq('id', channelId)
      .eq('agency_id', agencyId)
      .single()

    if (!channel) throw Object.assign(new Error('Channel not found'), { status: 404 })

    const groupRole =
      ctx.groupMember?.group_role || mapAgencyRoleToGroupRole(ctx.membership?.role)
    if (
      !canAccessChannel({
        channelType: channel.channel_type,
        groupRole,
        agencyRole: ctx.membership?.role,
        platformRole: ctx.platformRole,
        isBanned: false,
      })
    ) {
      throw Object.assign(new Error('لا يمكنك الوصول لهذه القناة'), { status: 403 })
    }

    let q = supabase
      .from('agency_messages')
      .select('*')
      .eq('channel_id', channelId)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })
      .limit(Math.min(limit, 100))

    if (before) q = q.lt('created_at', before)

    const { data, error } = await q
    if (error) throw error

    let messages = (data || []).reverse()
    if (messages.length) {
      const ids = messages.map((m) => m.id)
      const [{ data: reactions }, { data: attachments }, { data: senders }, { data: hides }] =
        await Promise.all([
          supabase.from('agency_message_reactions').select('message_id, emoji, user_id').in('message_id', ids),
          supabase.from('agency_message_attachments').select('*').in('message_id', ids),
          supabase
            .from('users')
            .select('id, username, full_name, profile_image')
            .in('id', [...new Set(messages.map((m) => m.sender_id).filter(Boolean))]),
          supabase
            .from('agency_message_user_hides')
            .select('message_id')
            .eq('user_id', userId)
            .in('message_id', ids),
        ])
      const hideSet = new Set((hides || []).map((h) => h.message_id))
      const senderMap = Object.fromEntries((senders || []).map((s) => [s.id, s]))
      for (const m of messages) {
        if (hideSet.has(m.id)) m._hidden_for_user = true
        m.sender = m.sender_id ? senderMap[m.sender_id] : null
        m.reactions = (reactions || []).filter((r) => r.message_id === m.id)
        m.attachments = (attachments || []).filter((a) => a.message_id === m.id)
      }
      messages = applyMessageVisibility(messages, userId, ctx)
    }

    await supabase
      .from('agency_group_members')
      .update({ last_read_at: new Date().toISOString(), last_read_channel_id: channelId })
      .eq('user_id', userId)
      .eq('group_id', channel.group_id)

    return {
      messages,
      channel,
      can_see_deleted: viewerCanSeeDeletedContent(ctx),
    }
  },

  async sendMessage(userId, agencyId, channelId, input) {
    const last = recentSends.get(userId) || 0
    if (Date.now() - last < FLOOD_MS) {
      throw Object.assign(new Error('أرسل ببطء — حماية من الإزعاج'), { status: 429 })
    }
    recentSends.set(userId, Date.now())

    const ctx = await assertGroupAccess(userId, agencyId)
    const { data: channel } = await supabase
      .from('agency_group_channels')
      .select('*, group_id')
      .eq('id', channelId)
      .eq('agency_id', agencyId)
      .single()

    if (!channel) throw Object.assign(new Error('Channel not found'), { status: 404 })

    const groupRole =
      ctx.groupMember?.group_role || mapAgencyRoleToGroupRole(ctx.membership?.role)
    const isMuted = !!ctx.mute || ctx.groupMember?.is_muted

    if (
      !canPostInChannel({
        channel,
        groupRole,
        agencyRole: ctx.membership?.role,
        platformRole: ctx.platformRole,
        isMuted,
        isBanned: false,
      })
    ) {
      throw Object.assign(new Error('لا يمكنك الإرسال في هذه القناة'), { status: 403 })
    }

    const messageType = MESSAGE_TYPES.has(input.message_type) ? input.message_type : 'text'
    const body = input.body?.trim()?.slice(0, 8000) || null
    if (!body && messageType === 'text') {
      throw Object.assign(new Error('Message required'), { status: 400 })
    }

    const { data: msg, error } = await supabase
      .from('agency_messages')
      .insert({
        channel_id: channelId,
        group_id: channel.group_id,
        agency_id: agencyId,
        sender_id: userId,
        sender_role: ctx.membership?.role || groupRole,
        body,
        message_type: messageType,
        reply_to_id: input.reply_to_id || null,
        mentions: input.mentions || [],
        metadata: input.metadata || {},
      })
      .select('*')
      .single()

    if (error) throw error

    if (userId) {
      const { data: sender } = await supabase
        .from('users')
        .select('id, username, full_name, profile_image')
        .eq('id', userId)
        .single()
      msg.sender = sender
    }

    if (input.attachments?.length) {
      await supabase.from('agency_message_attachments').insert(
        input.attachments.map((a) => ({
          message_id: msg.id,
          agency_id: agencyId,
          file_url: a.file_url,
          file_name: a.file_name,
          mime_type: a.mime_type,
          size_bytes: a.size_bytes,
          duration_ms: a.duration_ms,
        }))
      )
    }

    const mentions = input.mentions || []
    for (const uid of mentions) {
      await notifyUser(uid, {
        type: 'AGENCY_GROUP_MENTION',
        title: 'إشارة في قناة الوكالة',
        body: body?.slice(0, 120) || 'رسالة جديدة',
        meta: { agency_id: agencyId, channel_id: channelId, message_id: msg.id },
      })
      emitToUser(uid, 'agency-group:mention', { message: msg, agencyId, channelId })
    }

    const payload = { message: msg, agencyId, channelId }
    emitToAgency(agencyId, 'agency-group:message', payload)
    emitToUser(userId, 'agency-group:message', payload)
    try {
      getIO().to(`agency-channel:${channelId}`).emit('agency-group:message', payload)
    } catch {
      /* socket optional */
    }

    if (input.reply_to_id) {
      const { data: parent } = await supabase
        .from('agency_messages')
        .select('sender_id')
        .eq('id', input.reply_to_id)
        .maybeSingle()
      if (parent?.sender_id && parent.sender_id !== userId) {
        emitToUser(parent.sender_id, 'agency-group:reply', payload)
      }
    }

    return msg
  },

  async toggleReaction(userId, agencyId, messageId, emoji) {
    await assertGroupAccess(userId, agencyId)
    const { data: existing } = await supabase
      .from('agency_message_reactions')
      .select('id')
      .eq('message_id', messageId)
      .eq('user_id', userId)
      .eq('emoji', emoji)
      .maybeSingle()

    if (existing) {
      await supabase.from('agency_message_reactions').delete().eq('id', existing.id)
      return { removed: true }
    }

    await supabase.from('agency_message_reactions').insert({
      message_id: messageId,
      user_id: userId,
      emoji: emoji.slice(0, 16),
    })
    return { added: true }
  },

  async pinMessage(actorId, agencyId, messageId, pinned = true) {
    const ctx = await assertGroupAccess(actorId, agencyId, { requirePackage: false })
    const groupRole =
      ctx.groupMember?.group_role || mapAgencyRoleToGroupRole(ctx.membership?.role)
    if (!canManageGroup(groupRole, ctx.membership?.role, ctx.platformRole)) {
      throw Object.assign(new Error('صلاحية غير كافية'), { status: 403 })
    }

    await supabase.from('agency_messages').update({ is_pinned: pinned }).eq('id', messageId)
    await logActivity(agencyId, pinned ? 'message_pinned' : 'message_unpinned', {
      actorId,
      details: { messageId },
    })
    emitToAgency(agencyId, 'agency-group:pin', { messageId, pinned })
    return { ok: true }
  },

  async deleteMessage(actorId, agencyId, messageId, { scope = 'self' } = {}) {
    const ctx = await assertGroupAccess(actorId, agencyId)
    const groupRole =
      ctx.groupMember?.group_role || mapAgencyRoleToGroupRole(ctx.membership?.role)
    const { data: msg } = await supabase
      .from('agency_messages')
      .select('sender_id, channel_id, deleted_for_all_at')
      .eq('id', messageId)
      .eq('agency_id', agencyId)
      .single()

    if (!msg) throw Object.assign(new Error('الرسالة غير موجودة'), { status: 404 })

    const isOwner = msg.sender_id === actorId
    const isMod = canModerate(groupRole, ctx.membership?.role, ctx.platformRole)

    if (scope === 'self') {
      try {
        await supabase.from('agency_message_user_hides').upsert(
          { message_id: messageId, user_id: actorId },
          { onConflict: 'message_id,user_id' }
        )
      } catch {
        await supabase.from('agency_message_user_hides').insert({
          message_id: messageId,
          user_id: actorId,
        })
      }
      await logActivity(agencyId, 'message_hidden_self', {
        actorId,
        details: { messageId, scope: 'self' },
      })
      emitToUser(actorId, 'agency-group:delete', { messageId, scope: 'self', agencyId })
      return { ok: true, scope: 'self' }
    }

    if (scope === 'everyone') {
      if (!isOwner && !isMod) {
        throw Object.assign(new Error('لا يمكنك حذف هذه الرسالة للجميع'), { status: 403 })
      }
      if (msg.deleted_for_all_at) {
        return { ok: true, scope: 'everyone', already: true }
      }

      await supabase
        .from('agency_messages')
        .update({
          deleted_for_all_at: new Date().toISOString(),
          deleted_for_all_by: actorId,
        })
        .eq('id', messageId)

      await logActivity(agencyId, 'message_deleted_for_all', {
        actorId,
        channelId: msg.channel_id,
        details: { messageId, scope: 'everyone' },
      })

      const payload = { messageId, scope: 'everyone', agencyId, channelId: msg.channel_id }
      emitToAgency(agencyId, 'agency-group:delete', payload)
      try {
        getIO().to(`agency-channel:${msg.channel_id}`).emit('agency-group:delete', payload)
      } catch {
        /* optional */
      }
      return { ok: true, scope: 'everyone' }
    }

    throw Object.assign(new Error('نوع الحذف غير صالح'), { status: 400 })
  },

  async moderateMute(actorId, agencyId, targetUserId, { muteType, reason, hours = 24 }) {
    const ctx = await assertGroupAccess(actorId, agencyId, { requirePackage: false })
    const groupRole =
      ctx.groupMember?.group_role || mapAgencyRoleToGroupRole(ctx.membership?.role)
    if (!canModerate(groupRole, ctx.membership?.role, ctx.platformRole)) {
      throw Object.assign(new Error('صلاحية غير كافية'), { status: 403 })
    }

    const expiresAt =
      muteType === 'permanent'
        ? null
        : new Date(Date.now() + hours * 3600000).toISOString()

    await supabase.from('agency_group_mutes').insert({
      agency_id: agencyId,
      user_id: targetUserId,
      muted_by: actorId,
      mute_type: muteType || 'temporary',
      reason,
      expires_at: expiresAt,
      is_active: true,
    })

    await supabase
      .from('agency_group_members')
      .update({ is_muted: true, muted_until: expiresAt })
      .eq('agency_id', agencyId)
      .eq('user_id', targetUserId)

    await logActivity(agencyId, 'user_muted', { actorId, targetUserId, details: { reason, hours } })
    emitToUser(targetUserId, 'agency-group:muted', { agencyId, reason })
    return { ok: true }
  },

  async moderateBan(actorId, agencyId, targetUserId, { banType, reason, hours = 168 }) {
    const ctx = await assertGroupAccess(actorId, agencyId, { requirePackage: false })
    const groupRole =
      ctx.groupMember?.group_role || mapAgencyRoleToGroupRole(ctx.membership?.role)
    if (!canManageGroup(groupRole, ctx.membership?.role, ctx.platformRole)) {
      throw Object.assign(new Error('صلاحية غير كافية'), { status: 403 })
    }

    const expiresAt =
      banType === 'permanent' ? null : new Date(Date.now() + hours * 3600000).toISOString()

    await supabase.from('agency_group_bans').insert({
      agency_id: agencyId,
      user_id: targetUserId,
      banned_by: actorId,
      ban_type: banType || 'temporary',
      reason,
      expires_at: expiresAt,
      is_active: true,
    })

    await revokeMemberFromGroups(targetUserId, agencyId)
    await logActivity(agencyId, 'user_banned', { actorId, targetUserId, details: { reason, banType } })
    return { ok: true }
  },

  async warnUser(actorId, agencyId, targetUserId, { reason, severity }) {
    const ctx = await assertGroupAccess(actorId, agencyId, { requirePackage: false })
    const groupRole =
      ctx.groupMember?.group_role || mapAgencyRoleToGroupRole(ctx.membership?.role)
    if (!canModerate(groupRole, ctx.membership?.role, ctx.platformRole)) {
      throw Object.assign(new Error('صلاحية غير كافية'), { status: 403 })
    }

    const { data } = await supabase
      .from('agency_group_warnings')
      .insert({
        agency_id: agencyId,
        user_id: targetUserId,
        warned_by: actorId,
        reason,
        severity: severity || 'medium',
      })
      .select()
      .single()

    await notifyUser(targetUserId, {
      type: 'AGENCY_MODERATION',
      title: 'تحذير من إدارة الوكالة',
      body: reason,
    })
    return data
  },

  async search(userId, agencyId, { q, type = 'messages', channelId, limit = 30 }) {
    await assertGroupAccess(userId, agencyId)
    const term = `%${(q || '').trim()}%`
    if (!q?.trim()) return { results: [] }

    if (type === 'members') {
      const { data: members } = await supabase
        .from('agency_members')
        .select('user_id, role, users(id, username, full_name, profile_image)')
        .eq('agency_id', agencyId)
        .eq('status', 'active')
        .limit(200)
      const needle = (q || '').trim().toLowerCase()
      const filtered = (members || []).filter((m) => {
        const u = m.users || {}
        return (
          u.username?.toLowerCase().includes(needle) ||
          u.full_name?.toLowerCase().includes(needle)
        )
      })
      return { results: filtered.slice(0, limit) }
    }

    if (type === 'files') {
      let fq = supabase
        .from('agency_message_attachments')
        .select('*, message:agency_messages(channel_id, body, created_at)')
        .eq('agency_id', agencyId)
        .ilike('file_name', term)
        .limit(limit)
      const { data } = await fq
      return { results: data || [] }
    }

    let mq = supabase
      .from('agency_messages')
      .select('id, body, channel_id, created_at, message_type, sender_id')
      .eq('agency_id', agencyId)
      .eq('is_deleted', false)
      .ilike('body', term)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (channelId) mq = mq.eq('channel_id', channelId)
    if (type === 'pinned') mq = mq.eq('is_pinned', true)

    const { data } = await mq
    return { results: data || [] }
  },

  async getAnalytics(userId, agencyId) {
    const ctx = await assertGroupAccess(userId, agencyId, { requirePackage: false })
    const groupRole =
      ctx.groupMember?.group_role || mapAgencyRoleToGroupRole(ctx.membership?.role)
    if (!canManageGroup(groupRole, ctx.membership?.role, ctx.platformRole)) {
      throw Object.assign(new Error('صلاحية غير كافية'), { status: 403 })
    }

    const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString()

    const [{ count: activeMembers }, { count: messagesWeek }, { data: recruiters }] =
      await Promise.all([
        supabase
          .from('agency_group_members')
          .select('id', { count: 'exact', head: true })
          .eq('agency_id', agencyId)
          .eq('status', 'active'),
        supabase
          .from('agency_messages')
          .select('id', { count: 'exact', head: true })
          .eq('agency_id', agencyId)
          .gte('created_at', weekAgo),
        supabase
          .from('agency_members')
          .select('user_id, role')
          .eq('agency_id', agencyId)
          .eq('status', 'active')
          .in('role', ['recruiter', 'owner', 'manager']),
      ])

    const { data: topSenders } = await supabase
      .from('agency_messages')
      .select('sender_id')
      .eq('agency_id', agencyId)
      .gte('created_at', weekAgo)
      .not('sender_id', 'is', null)

    const counts = {}
    for (const row of topSenders || []) {
      counts[row.sender_id] = (counts[row.sender_id] || 0) + 1
    }
    const sorted = Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([user_id, message_count]) => ({ user_id, message_count }))

    const { count: onboardingDone } = await supabase
      .from('agency_member_onboarding')
      .select('id', { count: 'exact', head: true })
      .eq('agency_id', agencyId)
      .eq('completed_checklist', true)

    const { count: onboardingTotal } = await supabase
      .from('agency_member_onboarding')
      .select('id', { count: 'exact', head: true })
      .eq('agency_id', agencyId)

    return {
      active_members: activeMembers || 0,
      messages_7d: messagesWeek || 0,
      engagement_rate:
        activeMembers > 0 ? Math.round(((messagesWeek || 0) / activeMembers) * 10) / 10 : 0,
      recruiter_count: recruiters?.length || 0,
      top_active_members: sorted,
      onboarding_completion_pct: onboardingTotal
        ? Math.round(((onboardingDone || 0) / onboardingTotal) * 100)
        : 0,
      growth_placeholder: { new_members_7d: 0 },
    }
  },

  async aiAssist(userId, agencyId, channelId, question) {
    await assertGroupAccess(userId, agencyId)
    const answer = getGroupAiSuggestion(question)
    const msg = await this.sendMessage(userId, agencyId, channelId, {
      body: answer.text,
      message_type: 'ai',
      metadata: { category: answer.category, automated: true },
    })
    return { answer, message: msg }
  },

  async createEventRoom(actorId, agencyId, { title, roomType, scheduledAt }) {
    const ctx = await assertGroupAccess(actorId, agencyId)
    const groupRole =
      ctx.groupMember?.group_role || mapAgencyRoleToGroupRole(ctx.membership?.role)
    if (!canManageGroup(groupRole, ctx.membership?.role, ctx.platformRole)) {
      throw Object.assign(new Error('صلاحية غير كافية'), { status: 403 })
    }

    const { data: group } = await supabase
      .from('agency_groups')
      .select('id')
      .eq('agency_id', agencyId)
      .eq('group_type', 'main')
      .single()

    const eventTypeKey = `event_${Date.now()}`
    const { data: channel } = await supabase
      .from('agency_group_channels')
      .insert({
        group_id: group.id,
        agency_id: agencyId,
        channel_type: eventTypeKey,
        name: title?.slice(0, 80) || 'فعالية',
        sort_order: 90,
        voice_ready: true,
        meta: { temporary: true, room_type: roomType },
      })
      .select()
      .single()

    const { data: room } = await supabase
      .from('agency_voice_rooms')
      .insert({
        agency_id: agencyId,
        group_id: group.id,
        channel_id: channel.id,
        room_type: roomType || 'training',
        title: title || 'جلسة مباشرة',
        host_id: actorId,
        scheduled_at: scheduledAt || null,
        status: scheduledAt ? 'scheduled' : 'live',
        started_at: scheduledAt ? null : new Date().toISOString(),
      })
      .select()
      .single()

    return { channel, voice_room: room }
  },

  async listMembers(userId, agencyId) {
    await assertGroupAccess(userId, agencyId)
    const { data } = await supabase
      .from('agency_group_members')
      .select(
        '*, user:users!user_id(id, username, full_name, profile_image, current_package_level)'
      )
      .eq('agency_id', agencyId)
      .eq('status', 'active')
      .order('joined_at', { ascending: false })
    return data || []
  },
}
