import crypto from 'crypto'
import { supabase } from '../lib/supabase.js'
import { getStorageSupabase } from '../lib/supabase.js'
import { recalcAgencyStats, getUserAgency } from './agencies.service.js'
import { agencyReputationService } from './agencyReputation.service.js'
import { agencyAchievementsService } from './agencyAchievements.service.js'
import { hasAgencyPermission } from '../lib/agencyRoles.js'

const RESERVED_SLUGS = new Set(['admin', 'api', 'credo', 'official', 'support', 'join'])

export const agencyFoundationService = {
  async getAgencyProfile(slugOrId) {
    let q = supabase.from('agencies').select('*')
    if (slugOrId.includes('-') && slugOrId.length > 10) {
      q = q.eq('id', slugOrId)
    } else {
      q = q.eq('slug', slugOrId)
    }
    const { data: agency } = await q.single()
    if (!agency) return null

    const ownerId = agency.owner_id || agency.founder_id
    const { data: owner } = await supabase
      .from('users')
      .select('id, username, full_name, profile_image, title')
      .eq('id', ownerId)
      .single()

    const achievements = await agencyAchievementsService.listForAgency(agency.id)
    const { data: invites } = await supabase
      .from('agency_invitations')
      .select('code, invite_type, open_count, click_count, conversion_count')
      .eq('agency_id', agency.id)
      .eq('is_active', true)
      .limit(5)

    const { data: stats } = await supabase
      .from('agency_statistics')
      .select('*')
      .eq('agency_id', agency.id)
      .maybeSingle()

    return {
      ...agency,
      owner,
      achievements,
      invite_links: invites || [],
      statistics: stats,
    }
  },

  async getDiscovery({ region, category, featured, limit = 30 } = {}) {
    let q = supabase
      .from('agencies')
      .select(
        'id, slug, short_code, name, motto, logo_url, banner_url, primary_color, agency_category, agency_rank, rank_level, total_bv, total_members, power_score, prestige_tier, is_verified, verification_status, reputation_score, region'
      )
      .eq('is_discoverable', true)
      .eq('status', 'active')

    if (region) q = q.eq('region', region)
    if (category) q = q.eq('agency_category', category)
    if (featured) q = q.in('verification_status', ['verified', 'featured'])

    const { data } = await q.order('power_score', { ascending: false }).limit(limit)
    return data || []
  },

  async getAgencyAnalytics(agencyId, requesterId) {
    const { data: membership } = await supabase
      .from('agency_members')
      .select('role')
      .eq('agency_id', agencyId)
      .eq('user_id', requesterId)
      .eq('status', 'active')
      .single()

    if (!membership || !hasAgencyPermission(membership.role, 'analytics')) {
      throw Object.assign(new Error('Forbidden'), { status: 403 })
    }

    const { data: stats } = await supabase
      .from('agency_statistics')
      .select('*')
      .eq('agency_id', agencyId)
      .maybeSingle()

    const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString()
    const { data: activity } = await supabase
      .from('agency_activity_logs')
      .select('action, created_at, details')
      .eq('agency_id', agencyId)
      .gte('created_at', weekAgo)
      .order('created_at', { ascending: false })
      .limit(50)

    const { data: members } = await supabase
      .from('agency_members')
      .select('user_id, role, contribution_bv, joined_at, status')
      .eq('agency_id', agencyId)
      .eq('status', 'active')
      .order('contribution_bv', { ascending: false })

    const { data: rankings } = await supabase
      .from('agency_rankings')
      .select('*')
      .eq('agency_id', agencyId)
      .order('updated_at', { ascending: false })
      .limit(10)

    return {
      stats,
      activity: activity || [],
      members: members || [],
      rankings: rankings || [],
      period: '7d',
    }
  },

  async getOnboardingContext(userId) {
    const agency = await getUserAgency(userId)
    if (!agency) return null

    const { data: onboarding } = await supabase
      .from('agency_member_onboarding')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()

    const { data: user } = await supabase
      .from('users')
      .select('sponsor_id, agency_join_mode')
      .eq('id', userId)
      .single()

    let recruiter = null
    if (user?.sponsor_id) {
      const { data: sp } = await supabase
        .from('users')
        .select('id, username, full_name, profile_image, user_code')
        .eq('id', user.sponsor_id)
        .single()
      recruiter = sp
    }

    const { data: owner } = await supabase
      .from('users')
      .select('id, username, full_name, profile_image')
      .eq('id', agency.owner_id)
      .single()

    const achievements = await agencyAchievementsService.listForAgency(agency.id)
    const unlocked = achievements.filter((a) => a.is_unlocked)

    return {
      agency,
      onboarding,
      recruiter,
      founder: owner,
      achievements_unlocked: unlocked.slice(0, 6),
      checklist: [
        { key: 'welcome', done: !!onboarding?.welcomed, label: 'شاهد ترحيب الوكالة' },
        { key: 'intro', done: !!onboarding?.viewed_intro, label: 'تعرف على هوية الوكالة' },
        { key: 'founder', done: !!onboarding?.viewed_founder_message, label: 'رسالة المؤسس' },
        { key: 'recruiter', done: !!onboarding?.viewed_recruiter_card, label: 'بطاقة المجند' },
        { key: 'checklist', done: !!onboarding?.completed_checklist, label: 'أكمل قائمة البداية' },
      ],
    }
  },

  async completeOnboarding(userId, patch) {
    const { data: membership } = await supabase
      .from('agency_members')
      .select('agency_id')
      .eq('user_id', userId)
      .single()
    if (!membership) throw Object.assign(new Error('Not in an agency'), { status: 404 })

    const allDone =
      (patch.welcomed ?? true) &&
      (patch.viewed_intro ?? true) &&
      (patch.viewed_founder_message ?? true) &&
      (patch.viewed_recruiter_card ?? true)

    await supabase.from('agency_member_onboarding').upsert({
      user_id: userId,
      agency_id: membership.agency_id,
      welcomed: patch.welcomed ?? true,
      viewed_intro: patch.viewed_intro ?? true,
      viewed_founder_message: patch.viewed_founder_message ?? true,
      viewed_recruiter_card: patch.viewed_recruiter_card ?? true,
      completed_checklist: patch.completed_checklist ?? allDone,
      starter_missions_done: patch.starter_missions_done ?? 0,
      completed_at: allDone ? new Date().toISOString() : null,
    })

    if (allDone) {
      await supabase
        .from('users')
        .update({ agency_onboarding_status: 'completed' })
        .eq('id', userId)
    }

    return this.getOnboardingContext(userId)
  },

  async logActivity(agencyId, actorId, action, details = {}) {
    await supabase.from('agency_activity_logs').insert({
      agency_id: agencyId,
      actor_id: actorId,
      action,
      details,
    })
    await agencyReputationService.bumpActivity(agencyId, 2)
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
    const { data: invite, error } = await supabase
      .from('agency_invitations')
      .insert({
        agency_id: agencyId,
        created_by: creatorId,
        code,
        invite_type: options.invite_type || 'recruiter_link',
        placement_side: options.placement_side || 'AUTO',
        sponsor_user_id: creatorId,
        theme: options.theme || 'elite',
        expires_at: options.expires_at || null,
      })
      .select()
      .single()

    if (error) throw error

    const origin = process.env.CLIENT_ORIGIN || 'http://localhost:5173'
    const { data: creator } = await supabase
      .from('users')
      .select('username')
      .eq('id', creatorId)
      .single()

    return {
      invite,
      urls: {
        agency_code: `${origin}/register?agency_code=${code}`,
        recruiter: `${origin}/register?ref=${creator?.username}&agency=${agencyId}`,
        placement: `${origin}/register?ref=${creator?.username}&agency=${agencyId}&side=${options.placement_side || 'AUTO'}`,
      },
    }
  },

  async uploadBranding(staffUserId, agencyId, { logo_base64, banner_base64, logo_filename, banner_filename }) {
    const storage = getStorageSupabase()
    const out = {}

    async function put(base64, filename, folder) {
      if (!base64) return null
      const buffer = Buffer.from(base64.replace(/^data:image\/\w+;base64,/, ''), 'base64')
      if (buffer.length > 5 * 1024 * 1024) {
        throw Object.assign(new Error('Image too large'), { status: 400 })
      }
      const ext = (filename || 'img.jpg').split('.').pop() || 'jpg'
      const path = `agencies/${agencyId}/${folder}-${Date.now()}.${ext}`
      const { error } = await storage.storage
        .from('credo-w-media')
        .upload(path, buffer, { contentType: `image/${ext === 'png' ? 'png' : 'jpeg'}` })
      if (error) throw error
      return path
    }

    out.logo_url = await put(logo_base64, logo_filename, 'logo')
    out.banner_url = await put(banner_base64, banner_filename, 'banner')

    if (out.logo_url || out.banner_url) {
      await supabase
        .from('agencies')
        .update({
          logo_url: out.logo_url || undefined,
          banner_url: out.banner_url || undefined,
          updated_at: new Date().toISOString(),
        })
        .eq('id', agencyId)

      await this.logActivity(agencyId, staffUserId, 'branding_updated', out)
    }

    return out
  },
}
