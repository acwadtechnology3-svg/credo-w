import crypto from 'crypto'
import { supabase } from '../lib/supabase.js'
import { getStorageSupabase } from '../lib/supabase.js'
import { recalcTeamStats, getUserTeam } from './teams.service.js'
import { teamReputationService } from './teamReputation.service.js'
import { teamAchievementsService } from './teamAchievements.service.js'
import { hasTeamPermission } from '../lib/teamRoles.js'

const RESERVED_SLUGS = new Set([
  'admin',
  'api',
  'credo',
  'official',
  'support',
  'teams',
  'login',
  'register',
  'www',
])

const PROFANITY = ['fuck', 'shit', 'damn', 'asshole']

function slugify(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\u0600-\u06FF]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48)
}

function generateShortCode(name) {
  const letters = name.replace(/[^a-zA-Z\u0600-\u06FF]/g, '').toUpperCase().slice(0, 4)
  const suffix = crypto.randomBytes(2).toString('hex').toUpperCase()
  return `${letters || 'CRD'}${suffix}`.slice(0, 10)
}

function generateRecruitCode() {
  return `GUILD-${crypto.randomBytes(3).toString('hex').toUpperCase()}`
}

async function getFoundationRules() {
  const { data } = await supabase
    .from('system_settings')
    .select('value')
    .eq('key', 'team_foundation_rules')
    .maybeSingle()
  return data?.value || { min_package_level: 1, max_teams_per_user: 1 }
}

export const teamFoundationService = {
  async getStatus(userId) {
    const { data: user } = await supabase
      .from('users')
      .select(
        'team_foundation_status, current_package_level, membership_status, username, full_name'
      )
      .eq('id', userId)
      .single()

    const { data: membership } = await supabase
      .from('agency_members')
      .select('agency_id')
      .eq('user_id', userId)
      .eq('status', 'active')
      .maybeSingle()

    return {
      team_foundation_status: 'not_applicable',
      agency_ecosystem: true,
      has_team: !!membership,
      has_agency: !!membership,
      eligible_to_establish: false,
      current_package_level: user?.current_package_level || 0,
      user: { username: user?.username, full_name: user?.full_name },
      message: 'Join an official agency via invite link. Agency creation is admin-only.',
    }
  },

  validateName(name) {
    const trimmed = (name || '').trim()
    if (trimmed.length < 3 || trimmed.length > 60) {
      return { ok: false, error: 'اسم الفريق 3–60 حرفاً' }
    }
    const lower = trimmed.toLowerCase()
    if (PROFANITY.some((w) => lower.includes(w))) {
      return { ok: false, error: 'الاسم غير مسموح' }
    }
    return { ok: true, name: trimmed }
  },

  async validateSlug(slug, excludeTeamId = null) {
    const s = (slug || '').toLowerCase().replace(/[^a-z0-9-]/g, '')
    if (s.length < 3) return { ok: false, error: 'الرابط قصير جداً' }
    if (RESERVED_SLUGS.has(s)) return { ok: false, error: 'هذا الرابط محجوز' }

    let q = supabase.from('teams').select('id').eq('slug', s)
    const { data } = await q.maybeSingle()
    if (data && data.id !== excludeTeamId) {
      return { ok: false, error: 'الرابط مستخدم بالفعل' }
    }
    return { ok: true, slug: s }
  },

  async uploadBranding(userId, { logo_base64, banner_base64, logo_filename, banner_filename }) {
    const storage = getStorageSupabase()
    const out = {}

    async function put(base64, filename, folder) {
      if (!base64) return null
      const buffer = Buffer.from(base64.replace(/^data:image\/\w+;base64,/, ''), 'base64')
      if (buffer.length > 5 * 1024 * 1024) throw Object.assign(new Error('حجم الصورة كبير'), { status: 400 })
      const ext = (filename || 'img.jpg').split('.').pop() || 'jpg'
      const path = `teams/${userId}/${folder}-${Date.now()}.${ext}`
      const { error } = await storage.storage
        .from('credo-w-media')
        .upload(path, buffer, { contentType: `image/${ext === 'png' ? 'png' : 'jpeg'}` })
      if (error) throw error
      return path
    }

    out.logo_url = await put(logo_base64, logo_filename, 'logo')
    out.banner_url = await put(banner_base64, banner_filename, 'banner')
    return out
  },

  async establishTeam() {
    throw Object.assign(
      new Error(
        'تأسيس الفرق من المستخدمين متوقف. انضم لوكالة رسمية عبر رابط الدعوة أو تواصل مع الإدارة.'
      ),
      { status: 403, code: 'AGENCY_ECOSYSTEM_ONLY' }
    )
  },

  async recalcTeamLevel(teamId) {
    const { data: team } = await supabase.from('teams').select('power_score, total_members').eq('id', teamId).single()
    const { data: levels } = await supabase
      .from('team_level_definitions')
      .select('*')
      .order('level', { ascending: false })

    const achieved = (levels || []).find(
      (l) =>
        (team?.power_score || 0) >= l.min_power_score &&
        (team?.total_members || 0) >= l.min_members
    )
    const level = achieved?.level || 1
    const maxMembers = achieved?.max_members_cap || 500
    const prestige = (team?.power_score || 0) + level * 200
    const tier = teamReputationService.calcPrestigeTier(prestige)

    await supabase
      .from('teams')
      .update({ level, max_members: maxMembers, prestige_score: prestige, prestige_tier: tier })
      .eq('id', teamId)

    return level
  },

  async getTeamProfile(slugOrId) {
    let q = supabase.from('teams').select('*')
    if (slugOrId.includes('-') && slugOrId.length > 10) {
      q = q.eq('id', slugOrId)
    } else {
      q = q.eq('slug', slugOrId)
    }
    const { data: team } = await q.single()
    if (!team) return null

    const { data: founder } = await supabase
      .from('users')
      .select('id, username, full_name, profile_image')
      .eq('id', team.founder_id)
      .single()

    const achievements = await teamAchievementsService.listForTeam(team.id)
    const { data: recruitLinks } = await supabase
      .from('team_recruit_links')
      .select('code, open_count, click_count, conversion_count')
      .eq('team_id', team.id)
      .eq('is_active', true)
      .limit(5)

    return {
      ...team,
      founder,
      achievements,
      recruit_links: recruitLinks || [],
    }
  },

  async getDiscovery({ type, limit = 20 } = {}) {
    let q = supabase
      .from('teams')
      .select(
        'id, slug, name, motto, logo_url, banner_url, team_color, team_type, level, total_bv, total_members, power_score, prestige_tier, is_verified, reputation_score'
      )
      .eq('is_public', true)
      .eq('status', 'active')

    if (type && type !== 'all') q = q.eq('team_type', type)

    const { data } = await q.order('power_score', { ascending: false }).limit(limit)
    return data || []
  },

  async getTeamAnalytics(teamId, requesterId) {
    const { data: membership } = await supabase
      .from('team_members')
      .select('role')
      .eq('team_id', teamId)
      .eq('user_id', requesterId)
      .single()

    if (!membership || !hasTeamPermission(membership.role, 'analytics')) {
      throw Object.assign(new Error('Forbidden'), { status: 403 })
    }

    const { data: stats } = await supabase
      .from('team_statistics')
      .select('*')
      .eq('team_id', teamId)
      .maybeSingle()

    const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString()
    const { data: activity } = await supabase
      .from('team_activity_logs')
      .select('action, created_at')
      .eq('team_id', teamId)
      .gte('created_at', weekAgo)
      .order('created_at', { ascending: false })
      .limit(50)

    const { data: members } = await supabase
      .from('team_members')
      .select('user_id, role, contribution_bv, joined_at')
      .eq('team_id', teamId)
      .order('contribution_bv', { ascending: false })

    return { stats, activity: activity || [], members: members || [], period: '7d' }
  },

  async logActivity(teamId, actorId, action, details = {}) {
    await supabase.from('team_activity_logs').insert({
      team_id: teamId,
      actor_id: actorId,
      action,
      details,
    })
    await teamReputationService.bumpActivity(teamId, 2)
  },
}
