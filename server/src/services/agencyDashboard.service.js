import { supabase } from '../lib/supabase.js'
import { hasAgencyPermission, AGENCY_ROLES } from '../lib/agencyRoles.js'
import { bvService } from './bv.service.js'
import { agencyPackageGateService } from './agencyPackageGate.service.js'
import { recalcAgencyStats } from './agencies.service.js'

async function assertAgencyAccess(agencyId, userId, permission = 'view_members') {
  const { data: membership } = await supabase
    .from('agency_members')
    .select('role')
    .eq('agency_id', agencyId)
    .eq('user_id', userId)
    .eq('status', 'active')
    .single()

  if (!membership || !hasAgencyPermission(membership.role, permission)) {
    const { data: user } = await supabase.from('users').select('role').eq('id', userId).single()
    if (!['super_admin', 'admin'].includes(user?.role)) {
      throw Object.assign(new Error('Forbidden'), { status: 403 })
    }
  }
  return membership
}

export const agencyDashboardService = {
  async getOverview(agencyId, viewerId) {
    await assertAgencyAccess(agencyId, viewerId, 'view_members')
    await recalcAgencyStats(agencyId)

    const { data: agency } = await supabase.from('agencies').select('*').eq('id', agencyId).single()
    const { data: stats } = await supabase
      .from('agency_statistics')
      .select('*')
      .eq('agency_id', agencyId)
      .maybeSingle()

    const monthStart = new Date()
    monthStart.setDate(1)
    monthStart.setHours(0, 0, 0, 0)

    const { count: newMembersMonth } = await supabase
      .from('agency_members')
      .select('id', { count: 'exact', head: true })
      .eq('agency_id', agencyId)
      .eq('status', 'active')
      .gte('joined_at', monthStart.toISOString())

    const { count: activeInvites } = await supabase
      .from('agency_invitations')
      .select('id', { count: 'exact', head: true })
      .eq('agency_id', agencyId)
      .eq('is_active', true)

    const { count: pendingRequests } = await supabase
      .from('agency_join_requests')
      .select('id', { count: 'exact', head: true })
      .eq('agency_id', agencyId)
      .eq('request_status', 'pending')

    return {
      agency: {
        id: agency.id,
        name: agency.name,
        slug: agency.slug,
        agency_rank: agency.agency_rank,
        rank_level: agency.rank_level,
        total_bv: agency.total_bv,
        total_members: agency.total_members,
        power_score: agency.power_score,
        prestige_tier: agency.prestige_tier,
        status: agency.status,
      },
      statistics: stats,
      counts: {
        new_members_this_month: newMembersMonth || 0,
        active_invitations: activeInvites || 0,
        pending_join_requests: pendingRequests || 0,
      },
    }
  },

  async getGrowthMetrics(agencyId, viewerId, { days = 30 } = {}) {
    await assertAgencyAccess(agencyId, viewerId, 'analytics')
    const since = new Date(Date.now() - days * 86400000).toISOString()

    const { data: joins } = await supabase
      .from('agency_members')
      .select('joined_at, contribution_bv')
      .eq('agency_id', agencyId)
      .eq('status', 'active')
      .gte('joined_at', since)
      .order('joined_at', { ascending: true })

    const byDay = {}
    for (const m of joins || []) {
      const day = (m.joined_at || '').slice(0, 10)
      if (!day) continue
      byDay[day] = byDay[day] || { date: day, members: 0, bv: 0 }
      byDay[day].members += 1
      byDay[day].bv += parseFloat(m.contribution_bv || 0)
    }

    return { series: Object.values(byDay), total_new: joins?.length || 0 }
  },

  async getMonthlyStatistics(agencyId, viewerId) {
    await assertAgencyAccess(agencyId, viewerId, 'analytics')
    const { data: stats } = await supabase
      .from('agency_statistics')
      .select('*')
      .eq('agency_id', agencyId)
      .maybeSingle()

    const monthStart = new Date()
    monthStart.setDate(1)
    monthStart.setHours(0, 0, 0, 0)

    const { data: activity } = await supabase
      .from('agency_activity_logs')
      .select('action, created_at')
      .eq('agency_id', agencyId)
      .gte('created_at', monthStart.toISOString())

    const actions = (activity || []).reduce((acc, a) => {
      acc[a.action] = (acc[a.action] || 0) + 1
      return acc
    }, {})

    return {
      statistics: stats,
      month_activity: actions,
      month_start: monthStart.toISOString(),
    }
  },

  async getRecruiterLeaderboard(agencyId, viewerId, limit = 20) {
    await assertAgencyAccess(agencyId, viewerId, 'view_members')

    const { data: members } = await supabase
      .from('agency_members')
      .select('user_id, role, contribution_bv, joined_at')
      .eq('agency_id', agencyId)
      .eq('status', 'active')
      .in('role', ['recruiter', 'leader', 'manager', 'agency_admin', 'owner', 'founder'])
      .order('contribution_bv', { ascending: false })
      .limit(limit)

    const ids = (members || []).map((m) => m.user_id)
    let usersById = {}
    if (ids.length) {
      const { data: users } = await supabase
        .from('users')
        .select('id, username, full_name, profile_image, user_code, rank_id, ranks(name)')
        .in('id', ids)
      usersById = Object.fromEntries((users || []).map((u) => [u.id, u]))
    }

    const { data: inviteStats } = await supabase
      .from('agency_invitations')
      .select('created_by, conversion_count')
      .eq('agency_id', agencyId)

    const conversionsByUser = {}
    for (const inv of inviteStats || []) {
      conversionsByUser[inv.created_by] =
        (conversionsByUser[inv.created_by] || 0) + (inv.conversion_count || 0)
    }

    return (members || []).map((m, i) => ({
      rank: i + 1,
      role: m.role,
      contribution_bv: m.contribution_bv,
      invite_conversions: conversionsByUser[m.user_id] || 0,
      user: usersById[m.user_id],
    }))
  },

  async getRankProgress(agencyId, viewerId) {
    await assertAgencyAccess(agencyId, viewerId, 'view_members')
    const { data: agency } = await supabase
      .from('agencies')
      .select('rank_level, agency_rank, power_score, total_members, prestige_score')
      .eq('id', agencyId)
      .single()

    const { data: ranks } = await supabase
      .from('agency_rank_definitions')
      .select('*')
      .order('rank_level', { ascending: true })

    const current = (ranks || []).find((r) => r.rank_level === agency?.rank_level)
    const next = (ranks || []).find((r) => r.rank_level === (agency?.rank_level || 0) + 1)

    return {
      current_rank: current,
      next_rank: next,
      progress: next
        ? {
            power_score_pct: Math.min(
              100,
              Math.round(((agency?.power_score || 0) / next.min_power_score) * 100)
            ),
            members_pct: Math.min(
              100,
              Math.round(((agency?.total_members || 0) / next.min_members) * 100)
            ),
          }
        : { power_score_pct: 100, members_pct: 100 },
      agency,
    }
  },

  async getDirectRecruits(agencyId, viewerId, sponsorUserId) {
    await assertAgencyAccess(agencyId, viewerId, 'view_members')
    const sponsorId = sponsorUserId || viewerId

    const { data: downline } = await supabase
      .from('users')
      .select('id, username, full_name, user_code, profile_image, sponsor_id, current_package_level, joined_at:created_at')
      .eq('sponsor_id', sponsorId)
      .eq('agency_id', agencyId)
      .order('created_at', { ascending: false })
      .limit(100)

    return downline || []
  },

  async getPendingInvitations(agencyId, viewerId) {
    await assertAgencyAccess(agencyId, viewerId, 'invite')
    const { data } = await supabase
      .from('agency_invitations')
      .select('*, creator:users!agency_invitations_created_by_fkey(id, username, full_name)')
      .eq('agency_id', agencyId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(50)
    return data || []
  },

  async getPendingRequests(agencyId, viewerId) {
    const { agencyJoinRequestsService } = await import('./agencyJoinRequests.service.js')
    return agencyJoinRequestsService.listForAgency(agencyId, viewerId, { status: 'pending' })
  },

  async getLiveBvStats(agencyId, viewerId) {
    await assertAgencyAccess(agencyId, viewerId, 'analytics')

    const { data: members } = await supabase
      .from('agency_members')
      .select('user_id, contribution_bv')
      .eq('agency_id', agencyId)
      .eq('status', 'active')

    let totalLeft = 0
    let totalRight = 0
    let teamPower = 0

    for (const m of members || []) {
      teamPower += parseFloat(m.contribution_bv || 0)
      try {
        const legs = await bvService.getUserBVTotals(m.user_id)
        totalLeft += legs.sideA
        totalRight += legs.sideB
      } catch {
        /* skip */
      }
    }

    const { data: agency } = await supabase
      .from('agencies')
      .select('total_bv')
      .eq('id', agencyId)
      .single()

    return {
      agency_total_bv: agency?.total_bv || 0,
      aggregated_left_bv: totalLeft,
      aggregated_right_bv: totalRight,
      team_power: teamPower,
      balance_ratio: totalLeft + totalRight > 0 ? totalLeft / (totalLeft + totalRight) : 0.5,
    }
  },

  async getCvStatistics(agencyId, viewerId) {
    await assertAgencyAccess(agencyId, viewerId, 'analytics')
    const { data: members } = await supabase
      .from('agency_members')
      .select('user_id')
      .eq('agency_id', agencyId)
      .eq('status', 'active')

    const ids = (members || []).map((m) => m.user_id)
    if (!ids.length) return { total_cv: 0, members_with_cv: 0 }

    const { data: users } = await supabase
      .from('users')
      .select('id, total_pv, current_package_level')
      .in('id', ids)

    const totalCv = (users || []).reduce((s, u) => s + parseFloat(u.total_pv || 0), 0)
    return {
      total_cv: totalCv,
      members_with_cv: (users || []).filter((u) => parseFloat(u.total_pv || 0) > 0).length,
      avg_cv: ids.length ? totalCv / ids.length : 0,
    }
  },

  async getTeamPower(agencyId, viewerId) {
    const overview = await this.getOverview(agencyId, viewerId)
    const bv = await this.getLiveBvStats(agencyId, viewerId)
    return {
      power_score: overview.agency.power_score,
      total_members: overview.agency.total_members,
      team_power_bv: bv.team_power,
      left_right: {
        left: bv.aggregated_left_bv,
        right: bv.aggregated_right_bv,
        balance: bv.balance_ratio,
      },
    }
  },

  async getMemberDashboard(userId) {
    const gate = await agencyPackageGateService.getParticipationContext(userId)
    const { data: membership } = await supabase
      .from('agency_members')
      .select('agency_id, role')
      .eq('user_id', userId)
      .eq('status', 'active')
      .maybeSingle()

    if (!membership?.agency_id) {
      return { in_agency: false, package_gate: gate }
    }

    const overview = await this.getOverview(membership.agency_id, userId).catch(() => null)
    const rankProgress = await this.getRankProgress(membership.agency_id, userId).catch(() => null)
    const directRecruits = await this.getDirectRecruits(
      membership.agency_id,
      userId,
      userId
    ).catch(() => [])

    return {
      in_agency: true,
      role: membership.role,
      role_label: AGENCY_ROLES[membership.role]?.label_ar,
      package_gate: gate,
      overview,
      rank_progress: rankProgress,
      direct_recruits: directRecruits,
    }
  },
}
