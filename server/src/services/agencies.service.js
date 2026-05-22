import crypto from 'crypto'
import { supabase } from '../lib/supabase.js'
import { getStorageSupabase } from '../lib/supabase.js'
import { canCreateAgency } from '../lib/agencyRoles.js'
import { agencyReputationService } from './agencyReputation.service.js'
import { agencyAchievementsService } from './agencyAchievements.service.js'

const RESERVED_SLUGS = new Set([
  'admin',
  'api',
  'credo',
  'official',
  'support',
  'agencies',
  'teams',
  'login',
  'register',
  'join',
  'www',
])

function slugify(name) {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40)
  return `${base}-${Date.now().toString(36).slice(-4)}`
}

function generateShortCode(name) {
  const letters = name.replace(/[^a-zA-Z\u0600-\u06FF]/g, '').toUpperCase().slice(0, 4)
  const suffix = crypto.randomBytes(2).toString('hex').toUpperCase()
  return `${letters || 'CRD'}${suffix}`.slice(0, 10)
}

function generateInviteCode() {
  return `AG-${crypto.randomBytes(3).toString('hex').toUpperCase()}`
}

async function getEcosystemRules() {
  const { data } = await supabase
    .from('system_settings')
    .select('value')
    .eq('key', 'agency_ecosystem_rules')
    .maybeSingle()
  return (
    data?.value || {
      creation_roles: ['super_admin', 'admin'],
      invite_throttle_per_hour: 30,
      allow_agency_switch: false,
    }
  )
}

export async function recalcAgencyStats(agencyId) {
  const { data: members } = await supabase
    .from('agency_members')
    .select('contribution_bv, user_id')
    .eq('agency_id', agencyId)
    .eq('status', 'active')

  const totalBv = (members || []).reduce((s, m) => s + parseFloat(m.contribution_bv || 0), 0)
  const totalMembers = members?.length || 0
  const powerScore = Math.round(totalBv * 1.2 + totalMembers * 50)

  await supabase
    .from('agencies')
    .update({
      total_bv: totalBv,
      total_members: totalMembers,
      power_score: powerScore,
      updated_at: new Date().toISOString(),
    })
    .eq('id', agencyId)

  return { total_bv: totalBv, total_members: totalMembers, power_score: powerScore }
}

export async function recalcAgencyRank(agencyId) {
  const { data: agency } = await supabase
    .from('agencies')
    .select('power_score, total_members, prestige_score')
    .eq('id', agencyId)
    .single()

  const { data: ranks } = await supabase
    .from('agency_rank_definitions')
    .select('*')
    .order('rank_level', { ascending: false })

  const achieved = (ranks || []).find(
    (l) =>
      (agency?.power_score || 0) >= l.min_power_score &&
      (agency?.total_members || 0) >= l.min_members
  )
  const rankLevel = achieved?.rank_level || 1
  const rankKey = achieved?.rank_key || 'rising'
  const maxMembers = achieved?.max_members_cap || 500
  const prestige = (agency?.prestige_score || 0) + rankLevel * 200
  const tier = agencyReputationService.calcPrestigeTier(prestige)

  await supabase
    .from('agencies')
    .update({
      rank_level: rankLevel,
      agency_rank: rankKey,
      max_members: maxMembers,
      prestige_score: prestige,
      prestige_tier: tier,
    })
    .eq('id', agencyId)

  return { rank_level: rankLevel, agency_rank: rankKey }
}

export async function getAgencyLeaderboard(limit = 20, rankingKey = 'power_score') {
  const orderCol = ['total_bv', 'total_members', 'reputation_score'].includes(rankingKey)
    ? rankingKey
    : 'power_score'

  const { data, error } = await supabase
    .from('agencies')
    .select(
      'id, slug, name, motto, logo_url, banner_url, primary_color, agency_rank, rank_level, total_bv, total_members, power_score, owner_id, leader_id, is_verified, verification_status, region'
    )
    .eq('is_public', true)
    .eq('status', 'active')
    .order(orderCol, { ascending: false })
    .limit(limit)

  if (error) throw error

  const leaderIds = [...new Set((data || []).map((t) => t.owner_id || t.leader_id).filter(Boolean))]
  let leadersById = {}
  if (leaderIds.length) {
    const { data: leaders } = await supabase
      .from('users')
      .select('id, full_name, username, profile_image')
      .in('id', leaderIds)
    leadersById = Object.fromEntries((leaders || []).map((u) => [u.id, u]))
  }

  return (data || []).map((t, i) => ({
    ...t,
    rank_position: i + 1,
    leader: leadersById[t.owner_id || t.leader_id] || null,
  }))
}

export async function getUserAgency(userId) {
  const { data: membership } = await supabase
    .from('agency_members')
    .select(
      'role, contribution_bv, joined_at, status, agencies(id, slug, name, motto, logo_url, banner_url, primary_color, agency_rank, rank_level, total_bv, total_members, power_score, owner_id, verification_status, is_verified)'
    )
    .eq('user_id', userId)
    .eq('status', 'active')
    .maybeSingle()

  if (!membership?.agencies) return null

  const agency = membership.agencies
  const { data: allAgencies } = await supabase
    .from('agencies')
    .select('id, power_score')
    .eq('is_public', true)
    .order('power_score', { ascending: false })

  const position = (allAgencies || []).findIndex((t) => t.id === agency.id) + 1 || null

  const { data: members } = await supabase
    .from('agency_members')
    .select('role, contribution_bv, joined_at, user_id')
    .eq('agency_id', agency.id)
    .eq('status', 'active')
    .order('contribution_bv', { ascending: false })
    .limit(50)

  const memberIds = (members || []).map((m) => m.user_id).filter(Boolean)
  let usersById = {}
  if (memberIds.length) {
    const { data: users } = await supabase
      .from('users')
      .select('id, username, full_name, user_code, profile_image, rank_id, ranks(name)')
      .in('id', memberIds)
    usersById = Object.fromEntries((users || []).map((u) => [u.id, u]))
  }

  const { data: onboarding } = await supabase
    .from('agency_member_onboarding')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  return {
    ...agency,
    my_role: membership.role,
    my_contribution_bv: membership.contribution_bv,
    joined_at: membership.joined_at,
    leaderboard_position: position,
    onboarding: onboarding || null,
    members: (members || []).map((m) => {
      const u = usersById[m.user_id] || {}
      return {
        role: m.role,
        contribution_bv: m.contribution_bv,
        joined_at: m.joined_at,
        id: u.id,
        username: u.username,
        full_name: u.full_name,
        user_code: u.user_code,
        profile_image: u.profile_image,
        rank: u.ranks?.name,
      }
    }),
  }
}

export async function createAgency(staffUserId, platformRole, payload) {
  if (!canCreateAgency(platformRole)) {
    throw Object.assign(new Error('Only Super Admin or Corporate Management can create agencies'), {
      status: 403,
    })
  }

  const { name, owner_id, slug: slugInput, region, agency_category } = payload
  if (!name?.trim()) throw Object.assign(new Error('Agency name required'), { status: 400 })
  if (!owner_id) throw Object.assign(new Error('Agency owner (leader) required'), { status: 400 })

  const { data: owner } = await supabase
    .from('users')
    .select('id, status')
    .eq('id', owner_id)
    .single()
  if (!owner || owner.status !== 'active') {
    throw Object.assign(new Error('Agency owner must be an active user'), { status: 400 })
  }

  const slug = (slugInput || slugify(name)).toLowerCase().replace(/[^a-z0-9-]/g, '')
  if (slug.length < 3 || RESERVED_SLUGS.has(slug)) {
    throw Object.assign(new Error('Invalid or reserved agency slug'), { status: 400 })
  }

  const { data: dup } = await supabase.from('agencies').select('id').eq('slug', slug).maybeSingle()
  if (dup) throw Object.assign(new Error('Agency slug already exists'), { status: 409 })

  let shortCode = generateShortCode(name)
  const { data: dupCode } = await supabase.from('agencies').select('id').eq('short_code', shortCode).maybeSingle()
  if (dupCode) shortCode = generateShortCode(name)

  const { data: agency, error } = await supabase
    .from('agencies')
    .insert({
      slug,
      short_code: shortCode,
      name: name.trim(),
      motto: payload.motto?.trim() || null,
      mission: payload.mission?.trim() || null,
      bio: payload.bio?.trim() || null,
      slogan: payload.slogan?.trim() || null,
      logo_url: payload.logo_url || null,
      banner_url: payload.banner_url || null,
      welcome_video_url: payload.welcome_video_url || null,
      intro_video_url: payload.intro_video_url || null,
      primary_color: payload.primary_color || '#7B6CF6',
      secondary_color: payload.secondary_color || '#534AB7',
      glow_theme: payload.glow_theme || 'purple_pulse',
      agency_category: agency_category || 'official',
      region: region || 'global',
      owner_id,
      leader_id: owner_id,
      founder_id: owner_id,
      created_by_staff_id: staffUserId,
      verification_status: payload.verification_status || 'pending',
      is_verified: !!payload.is_verified,
      is_public: payload.is_public !== false,
      is_discoverable: payload.is_discoverable !== false,
      max_members: payload.max_members || 500,
      branding_json: payload.branding_json || {},
      social_links: payload.social_links || {},
      status: payload.status || 'active',
    })
    .select()
    .single()

  if (error) throw error

  await supabase.from('agency_members').insert({
    agency_id: agency.id,
    user_id: owner_id,
    role: 'owner',
  })

  await supabase.from('users').update({ agency_id: agency.id }).eq('id', owner_id)

  const inviteCode = generateInviteCode()
  await supabase.from('agency_invitations').insert({
    agency_id: agency.id,
    created_by: staffUserId,
    code: inviteCode,
    invite_type: 'agency_link',
    placement_side: payload.default_placement || 'AUTO',
    theme: payload.invite_theme || 'elite',
  })

  await supabase.from('agency_statistics').upsert({ agency_id: agency.id })
  await supabase.from('agency_treasury').upsert({ agency_id: agency.id })
  try {
    const { bootstrapAgencyGroups } = await import('./agencyGroups.service.js')
    await bootstrapAgencyGroups(agency.id, owner_id)
  } catch {
    /* optional until phase-agency-groups.sql */
  }

  await recalcAgencyStats(agency.id)
  await recalcAgencyRank(agency.id)
  await agencyAchievementsService.checkAndUnlock(agency.id)

  await supabase.from('agency_activity_logs').insert({
    agency_id: agency.id,
    actor_id: staffUserId,
    action: 'agency_created',
    details: { name: agency.name, slug: agency.slug, owner_id },
  })

  const origin = process.env.CLIENT_ORIGIN || 'http://localhost:5173'
  return {
    agency,
    invite_code: inviteCode,
    invite_urls: {
      agency: `${origin}/register?agency=${agency.id}`,
      agency_slug: `${origin}/join/agency/${agency.slug}`,
      code: `${origin}/register?agency_code=${inviteCode}`,
    },
  }
}

export async function joinAgency(userId, agencyId, options = {}) {
  const rules = await getEcosystemRules()
  if (!rules.allow_agency_switch) {
    const { data: existing } = await supabase
      .from('agency_members')
      .select('agency_id')
      .eq('user_id', userId)
      .eq('status', 'active')
      .maybeSingle()
    if (existing && existing.agency_id !== agencyId) {
      throw Object.assign(new Error('Agency switch is not allowed. Contact support.'), { status: 400 })
    }
  }

  const { data: agency } = await supabase
    .from('agencies')
    .select('max_members, total_members, status')
    .eq('id', agencyId)
    .single()

  if (!agency) throw Object.assign(new Error('Agency not found'), { status: 404 })
  if (agency.status !== 'active') {
    throw Object.assign(new Error('Agency is not accepting members'), { status: 400 })
  }
  if (agency.total_members >= agency.max_members) {
    throw Object.assign(new Error('Agency is full'), { status: 400 })
  }

  const { data: user } = await supabase.from('users').select('total_pv').eq('id', userId).single()

  const memberRole = options.role || 'member'
  await supabase.from('agency_members').upsert(
    {
      agency_id: agencyId,
      user_id: userId,
      role: memberRole,
      sponsor_within_agency: options.sponsor_within_agency || null,
      placement_preference: options.placement_side || 'AUTO',
      contribution_bv: parseFloat(user?.total_pv || 0),
      status: 'active',
      joined_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' }
  )

  const joinMode = options.join_mode || 'direct_agency'
  await supabase
    .from('users')
    .update({
      agency_id: agencyId,
      agency_join_mode: joinMode,
      agency_onboarding_status: 'pending',
    })
    .eq('id', userId)

  await supabase.from('agency_member_onboarding').upsert({
    user_id: userId,
    agency_id: agencyId,
  })

  await recalcAgencyStats(agencyId)
  await agencyAchievementsService.checkAndUnlock(agencyId)

  try {
    const { agencyRealtimeService } = await import('./agencyRealtime.service.js')
    await agencyRealtimeService.emit(agencyId, 'member_joined', {
      actorId: userId,
      targetUserId: options.sponsor_within_agency || null,
      payload: { join_mode: joinMode, role: memberRole },
    })
  } catch {
    /* optional */
  }

  try {
    const { syncMemberToGroups, emitLiveEvent } = await import('./agencyGroups.service.js')
    await syncMemberToGroups(userId, agencyId, memberRole)
    const { data: u } = await supabase
      .from('users')
      .select('full_name, username')
      .eq('id', userId)
      .single()
    await emitLiveEvent(agencyId, 'member_joined', {
      userId,
      payload: { name: u?.full_name || u?.username },
    })
  } catch {
    /* optional until migration */
  }

  return getUserAgency(userId)
}

export async function leaveAgency(userId, reason = 'voluntary') {
  const { data: membership } = await supabase
    .from('agency_members')
    .select('agency_id, role')
    .eq('user_id', userId)
    .eq('status', 'active')
    .maybeSingle()

  if (!membership) return { ok: true }

  if (membership.role === 'owner') {
    const { count } = await supabase
      .from('agency_members')
      .select('id', { count: 'exact', head: true })
      .eq('agency_id', membership.agency_id)
      .eq('status', 'active')

    if ((count || 0) > 1) {
      throw Object.assign(
        new Error('Transfer agency ownership before leaving as owner'),
        { status: 400 }
      )
    }
    await supabase.from('agencies').update({ status: 'inactive' }).eq('id', membership.agency_id)
  }

  await supabase
    .from('agency_members')
    .update({ status: 'left', left_at: new Date().toISOString() })
    .eq('user_id', userId)

  await supabase
    .from('users')
    .update({ agency_id: null, agency_onboarding_status: 'not_started' })
    .eq('id', userId)

  await supabase.from('agency_activity_logs').insert({
    agency_id: membership.agency_id,
    actor_id: userId,
    action: 'member_left',
    details: { reason },
  })

  await recalcAgencyStats(membership.agency_id)

  try {
    const { revokeMemberFromGroups } = await import('./agencyGroups.service.js')
    await revokeMemberFromGroups(userId, membership.agency_id)
  } catch {
    /* optional */
  }

  return { ok: true }
}

export const agenciesService = {
  recalcAgencyStats,
  recalcAgencyRank,
  getAgencyLeaderboard,
  getUserAgency,
  createAgency,
  joinAgency,
  leaveAgency,
  getEcosystemRules,
  generateInviteCode,
}
