import { supabase } from '../lib/supabase.js'
import { roundMoney } from '../lib/money.js'
import { mlmMetricsService } from './mlm/mlmMetrics.service.js'
import { emitToUser } from '../lib/socket.js'
import { bonusDistributionService } from './bonusDistribution.service.js'

const METRIC_KEYS = {
  pv: (m) => m.pv,
  pbv: (m) => m.pv,
  personal_bv: (m) => m.pv,
  gv: (m) => m.gv,
  tv: (m) => m.tv,
  bv: (m) => m.bv_left + m.bv_right,
  bv_matching: (m) => m.bv_matching,
  matching_bv: (m) => m.bv_matching,
  cv: (m) => m.cv,
  directs: (m) => m.direct_count,
  direct_recruits: (m) => m.direct_count,
  active_recruits: (m) => m.active_direct_count,
  active_directs: (m) => m.active_direct_count,
  weak_leg_volume: (m) => m.weak_leg,
  strong_leg_volume: (m) => m.strong_leg,
  balanced_volume: (m) => m.balanced_volume,
  package_level: (m) => m.package_level,
  active_package: (m) => m.package_level,
  binary_matches: (m) => m.binary_matches,
  achievement_count: (m) => m.achievement_count,
  training_completion: (m) => m.training_completion_pct,
  retention_score: (m) => m.retention_score,
  team_bv: (m) => m.team_bv,
  agency_performance: (m) => m.agency_gv,
}

const COMPARATORS = {
  gte: (a, r) => a >= r,
  gt: (a, r) => a > r,
  lte: (a, r) => a <= r,
  lt: (a, r) => a < r,
  eq: (a, r) => a === r,
}

function compareRequirement(actual, required, comparator = 'gte') {
  const fn = COMPARATORS[comparator] || COMPARATORS.gte
  return fn(Number(actual ?? 0), Number(required ?? 0))
}

function evaluateGroup(requirements, metrics, operator = 'AND') {
  if (!requirements?.length) return true
  const results = requirements.map((req) => {
    const getter = METRIC_KEYS[req.requirement_key]
    const actual = getter ? getter(metrics) : metrics[req.requirement_key]
    return compareRequirement(actual, req.requirement_value, req.comparator || 'gte')
  })
  return operator === 'OR' ? results.some(Boolean) : results.every(Boolean)
}

async function loadRankStudio() {
  const { data: ranks } = await supabase
    .from('ranks')
    .select('*')
    .eq('is_active', true)
    .eq('is_visible', true)
    .order('sort_order', { ascending: true })

  const { data: reqs } = await supabase
    .from('rank_requirements')
    .select('*, rank_requirement_groups(logic_operator, group_key)')
    .eq('is_active', true)

  const { data: groups } = await supabase
    .from('rank_requirement_groups')
    .select('*')
    .eq('is_active', true)

  const { data: rewards } = await supabase.from('rank_rewards').select('*').eq('is_active', true)

  return { ranks: ranks || [], reqs: reqs || [], groups: groups || [], rewards: rewards || [] }
}

function buildRequirementsMap(reqs, groups, ranks) {
  const groupByRank = {}
  for (const g of groups) {
    if (!groupByRank[g.rank_id]) groupByRank[g.rank_id] = []
    groupByRank[g.rank_id].push(g)
  }

  const reqsByRank = {}
  for (const r of reqs) {
    if (!reqsByRank[r.rank_id]) reqsByRank[r.rank_id] = []
    reqsByRank[r.rank_id].push(r)
  }

  return ranks.map((rank) => {
    const rankReqs = reqsByRank[rank.id] || []
    const rankGroups = groupByRank[rank.id] || []
    const logicMode = rank.logic_mode || 'AND'

    if (rankGroups.length) {
      const grouped = rankGroups.map((g) => ({
        group: g,
        requirements: rankReqs.filter((r) => r.group_id === g.id),
        operator: g.logic_operator || 'AND',
      }))
      const ungrouped = rankReqs.filter((r) => !r.group_id)
      return { rank, grouped, ungrouped, logicMode }
    }

    return {
      rank,
      flat: rankReqs,
      logicMode,
      legacy: !rankReqs.length,
    }
  })
}

function rankQualifies(config, metrics) {
  const { rank, grouped, ungrouped, flat, logicMode, legacy } = config

  if (legacy) {
    return (
      metrics.pv >= parseFloat(rank.pbv_required || 0) &&
      metrics.bv_matching >= parseFloat(rank.matching_bv_required || 0) &&
      metrics.direct_count >= (rank.directs_required || 0)
    )
  }

  if (grouped?.length) {
    const groupResults = grouped.map((g) => evaluateGroup(g.requirements, metrics, g.operator))
    const ungroupedOk = ungrouped?.length
      ? evaluateGroup(ungrouped, metrics, 'AND')
      : true
    const topOk = logicMode === 'OR' ? groupResults.some(Boolean) : groupResults.every(Boolean)
    return topOk && ungroupedOk
  }

  if (flat?.length) {
    return evaluateGroup(flat, metrics, logicMode)
  }

  return legacy
}

function requirementProgress(req, metrics) {
  const getter = METRIC_KEYS[req.requirement_key]
  const actual = Number(getter ? getter(metrics) : metrics[req.requirement_key] ?? 0)
  const required = Number(req.requirement_value || 0)
  const met = compareRequirement(actual, required, req.comparator || 'gte')
  const pct = required > 0 ? Math.min(100, (actual / required) * 100) : met ? 100 : 0
  return {
    key: req.requirement_key,
    label: req.display_label || req.requirement_key.replace(/_/g, ' '),
    actual,
    required,
    met,
    pct: Math.round(pct),
    gap: Math.max(0, required - actual),
  }
}

function buildCoachingHints(missing, metrics) {
  const hints = []
  for (const m of missing.slice(0, 5)) {
    if (m.key.includes('weak') || m.key === 'weak_leg_volume') {
      hints.push(`Your weak leg needs ${m.gap} more GV to progress.`)
    } else if (m.key.includes('direct') || m.key.includes('recruit')) {
      hints.push(`Invite ${Math.ceil(m.gap)} more active member${m.gap > 1 ? 's' : ''} to unlock the next rank.`)
    } else if (m.key.includes('package')) {
      hints.push('Upgrade your package to unlock higher commissions and ranks.')
    } else if (m.gap > 0) {
      hints.push(`You need ${m.gap} more ${m.label} (currently ${m.actual}/${m.required}).`)
    }
  }
  if (metrics.weak_leg < metrics.strong_leg * 0.5 && metrics.strong_leg > 0) {
    hints.push('Balance your binary legs — focus growth on your weaker side.')
  }
  return hints
}

export const rankProgressionEngine = {
  async gatherMetrics(userId) {
    const base = await mlmMetricsService.computeUserMetrics(userId)
    const weak = Math.min(base.bv_left, base.bv_right)
    const strong = Math.max(base.bv_left, base.bv_right)
    const balanced = weak

    const { count: achCount } = await supabase
      .from('game_user_achievements')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)

    const { data: gam } = await supabase
      .from('user_gamification')
      .select('streak_days')
      .eq('user_id', userId)
      .maybeSingle()

    const { data: enrollments } = await supabase
      .from('course_enrollments')
      .select('progress_pct')
      .eq('user_id', userId)

    let trainingPct = 0
    if (enrollments?.length) {
      trainingPct =
        enrollments.reduce((s, e) => s + (parseFloat(e.progress_pct) || 0), 0) / enrollments.length
    }

    const { data: agencyMember } = await supabase
      .from('agency_members')
      .select('agency_id')
      .eq('user_id', userId)
      .eq('status', 'active')
      .maybeSingle()

    let agency_gv = 0
    if (agencyMember?.agency_id) {
      const snap = await mlmMetricsService.snapshotAgency(agencyMember.agency_id)
      agency_gv = snap?.agency_gv ?? 0
    }

    const binary_matches = Math.floor(weak / 100)

    return {
      ...base,
      weak_leg: roundMoney(weak),
      strong_leg: roundMoney(strong),
      balanced_volume: roundMoney(balanced),
      team_bv: roundMoney(base.bv_left + base.bv_right),
      achievement_count: achCount || 0,
      streak_days: gam?.streak_days || 0,
      training_completion_pct: Math.round(trainingPct),
      retention_score: base.active_direct_count > 0 ? 70 : 40,
      binary_matches,
      agency_gv: roundMoney(agency_gv),
    }
  },

  async evaluateRank(userId) {
    const metrics = await this.gatherMetrics(userId)
    const studio = await loadRankStudio()
    const configs = buildRequirementsMap(studio.reqs, studio.groups, studio.ranks)

    let bestRank = null
    for (let i = configs.length - 1; i >= 0; i--) {
      if (rankQualifies(configs[i], metrics)) {
        bestRank = configs[i].rank
        break
      }
    }

    return { metrics, bestRank, allRanks: studio.ranks }
  },

  async getCareerPath(userId) {
    const { data: user } = await supabase
      .from('users')
      .select('rank_id, ranks(id, name, slug, sort_order, color_hex, rarity, icon_key, glow_theme)')
      .eq('id', userId)
      .single()

    const metrics = await this.gatherMetrics(userId)
    const studio = await loadRankStudio()
    const configs = buildRequirementsMap(studio.reqs, studio.groups, studio.ranks)

    const currentSort = user?.ranks?.sort_order ?? 0
    const nextConfig = configs.find((c) => c.rank.sort_order > currentSort)
    const nextRank = nextConfig?.rank ?? null

    let nextProgress = []
    let coaching = []
    if (nextConfig) {
      const reqs = nextConfig.flat || [
        ...(nextConfig.grouped?.flatMap((g) => g.requirements) || []),
        ...(nextConfig.ungrouped || []),
      ]
      nextProgress = reqs.map((r) => requirementProgress(r, metrics))
      coaching = buildCoachingHints(nextProgress.filter((p) => !p.met), metrics)
    }

    const ladder = studio.ranks.map((r) => {
      const cfg = configs.find((c) => c.rank.id === r.id)
      const unlocked = r.sort_order <= currentSort
      const isCurrent = r.id === user?.rank_id
      const reqs = cfg?.flat || cfg?.grouped?.flatMap((g) => g.requirements) || []
      const progress =
        reqs.length && !unlocked
          ? Math.round(
              reqs.reduce((s, req) => s + requirementProgress(req, metrics).pct, 0) / reqs.length
            )
          : unlocked
            ? 100
            : 0
      return {
        ...r,
        unlocked,
        isCurrent,
        progress,
      }
    })

    const overallPct = nextProgress.length
      ? Math.round(nextProgress.reduce((s, p) => s + p.pct, 0) / nextProgress.length)
      : 100

    return {
      currentRank: user?.ranks,
      nextRank,
      metrics,
      ladder,
      nextRequirements: nextProgress,
      progressToNext: overallPct,
      coaching,
      prediction: nextRank
        ? {
            rankName: nextRank.name,
            estimatedDays: Math.max(7, Math.ceil((100 - overallPct) / 5)),
          }
        : null,
    }
  },

  async promoteUser(userId, { forceRankId = null, actorId = null, notes = null } = {}) {
    const { data: before } = await supabase
      .from('users')
      .select('rank_id, ranks(name, sort_order)')
      .eq('id', userId)
      .single()

    const { metrics, bestRank } = await this.evaluateRank(userId)
    const targetRank = forceRankId
      ? (await supabase.from('ranks').select('*').eq('id', forceRankId).single()).data
      : bestRank

    if (!targetRank) return { promoted: false, rank: before?.ranks }

    const prevSort = before?.ranks?.sort_order ?? 0
    if (targetRank.sort_order <= prevSort && !forceRankId) {
      return { promoted: false, rank: before?.ranks, metrics }
    }

    await supabase.from('users').update({ rank_id: targetRank.id }).eq('id', userId)

    await supabase.from('user_ranks').upsert(
      {
        user_id: userId,
        rank_id: targetRank.id,
        is_current: true,
        qualified_at: new Date().toISOString(),
        metrics_snapshot: metrics,
      },
      { onConflict: 'user_id,rank_id' }
    )

    await supabase
      .from('user_ranks')
      .update({ is_current: false })
      .eq('user_id', userId)
      .neq('rank_id', targetRank.id)

    const { data: rewards } = await supabase
      .from('rank_rewards')
      .select('*')
      .eq('rank_id', targetRank.id)
      .eq('is_active', true)

    let bonusEgp = 0
    for (const rw of rewards || []) {
      if (rw.reward_key === 'cash_bonus' || rw.reward_key === 'wallet_bonus') {
        bonusEgp += parseFloat(rw.reward_value) || 0
      }
    }
    if (!bonusEgp && targetRank.rank_bonus_usd > 0) {
      bonusEgp = roundMoney(targetRank.rank_bonus_usd * 50)
    }

    if (bonusEgp > 0) {
      await bonusDistributionService.distributeRankBonus(userId, targetRank.name, bonusEgp)
    }

    await supabase.from('rank_history').insert({
      user_id: userId,
      rank_id: targetRank.id,
      rank_name: targetRank.name,
      event_type: forceRankId ? 'manual' : 'promotion',
      previous_rank_id: before?.rank_id,
      previous_rank_name: before?.ranks?.name,
      bonus_egp: bonusEgp,
      rewards_json: rewards || [],
      metrics_json: metrics,
      notes: notes || (actorId ? `Promoted by admin ${actorId}` : null),
    })

    await supabase.from('rank_milestones').insert({
      user_id: userId,
      rank_id: targetRank.id,
      rank_name: targetRank.name,
    })

    try {
      const { progressionEngine } = await import('./progressionEngine.service.js')
      await progressionEngine.onRankUp(userId, targetRank)
      const { pearlsService } = await import('./pearls.service.js')
      await pearlsService.onRankUp(userId, targetRank)
    } catch (e) {
      console.warn('P8 rank side-effects:', e.message)
    }

    emitToUser(userId, 'progression:celebration', {
      type: 'rank_unlock',
      rank: targetRank.name,
      rarity: targetRank.rarity,
      color: targetRank.color_hex,
      icon: targetRank.icon_key,
    })
    emitToUser(userId, 'mlm:rank_promoted', { rank: targetRank.name })

    await supabase.from('notifications').insert({
      user_id: userId,
      type: 'RANK_UP',
      title: `Rank Unlocked: ${targetRank.name}`,
      body: bonusEgp > 0 ? `You earned EGP ${bonusEgp} rank bonus!` : 'Congratulations on your promotion!',
    })

    return { promoted: true, rank: targetRank, bonusEgp, metrics }
  },

  async checkAndPromote(userId) {
    const { data: user } = await supabase.from('users').select('rank_id').eq('id', userId).single()
    const { bestRank } = await this.evaluateRank(userId)
    if (!bestRank || bestRank.id === user?.rank_id) return null
    return this.promoteUser(userId)
  },

  async getRankHistory(userId, limit = 20) {
    const { data } = await supabase
      .from('rank_history')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)
    return data || []
  },

  async getPublicPrestige(userId) {
    const { data: user } = await supabase
      .from('users')
      .select(
        'id, username, full_name, profile_image, rank_id, direct_count, commission_paid_total, ranks(name, rarity, color_hex, icon_key, glow_theme)'
      )
      .eq('id', userId)
      .single()

    const { data: achievements } = await supabase
      .from('game_user_achievements')
      .select('achievement_key, unlocked_at')
      .eq('user_id', userId)
      .order('unlocked_at', { ascending: false })
      .limit(12)

    const history = await this.getRankHistory(userId, 5)

    const { data: agency } = await supabase
      .from('agency_members')
      .select('agencies(id, name, slug)')
      .eq('user_id', userId)
      .eq('status', 'active')
      .maybeSingle()

    return {
      user,
      achievements: achievements || [],
      rankHistory: history,
      agency: agency?.agencies ?? null,
    }
  },
}
