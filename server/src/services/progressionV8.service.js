import { supabase } from '../lib/supabase.js'
import { rankProgressionEngine } from './rankProgressionEngine.service.js'
import { bonusEngine } from './bonusEngine.service.js'
import { progressionEngine } from './progressionEngine.service.js'
import { gamificationService } from './gamification.service.js'

function weekKey() {
  const d = new Date()
  const start = new Date(d)
  start.setDate(d.getDate() - d.getDay())
  return `w-${start.toISOString().slice(0, 10)}`
}

function monthKey() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export const progressionV8Service = {
  async getFullHub(userId) {
    const [career, gamHub, bonusHistory, achievements] = await Promise.all([
      rankProgressionEngine.getCareerPath(userId),
      gamificationService.getHub(userId),
      bonusEngine.getUserBonusHistory(userId, 10),
      this.getAchievementsPanel(userId),
    ])

    const { data: campaigns } = await supabase
      .from('seasonal_campaigns')
      .select('*')
      .eq('is_active', true)
      .lte('starts_at', new Date().toISOString())
      .gte('ends_at', new Date().toISOString())
      .limit(3)

    return {
      career,
      gamification: gamHub,
      bonuses: bonusHistory,
      achievements,
      campaigns: campaigns || [],
    }
  },

  async getAchievementsPanel(userId) {
    const { data: defs } = await supabase
      .from('game_achievement_definitions')
      .select('*')
      .eq('is_active', true)
      .order('sort_order')

    const { data: earned } = await supabase
      .from('game_user_achievements')
      .select('achievement_key, unlocked_at')
      .eq('user_id', userId)

    const earnedMap = Object.fromEntries((earned || []).map((e) => [e.achievement_key, e]))

    const categories = {}
    for (const d of defs || []) {
      const cat = d.category || 'general'
      const aKey = d.key || d.achievement_key
      if (!categories[cat]) categories[cat] = []
      categories[cat].push({
        ...d,
        achievement_key: aKey,
        title_en: d.title_en || d.title,
        description_en: d.description_en || d.description,
        unlocked: !!earnedMap[aKey],
        unlockedAt: earnedMap[aKey]?.unlocked_at,
      })
    }

    return { categories, total: (earned || []).length, definitions: defs }
  },

  async getLeaderboard(boardKey, period = null) {
    const { data: board } = await supabase
      .from('leaderboards')
      .select('*')
      .eq('board_key', boardKey)
      .maybeSingle()

    const periodKey =
      period ||
      (board?.period_type === 'monthly'
        ? monthKey()
        : board?.period_type === 'daily'
          ? new Date().toISOString().slice(0, 10)
          : weekKey())

    const { data: entries } = await supabase
      .from('leaderboard_entries')
      .select('*, users(id, username, full_name, profile_image, ranks(name, rarity))')
      .eq('board_key', boardKey)
      .eq('period_key', periodKey)
      .order('score', { ascending: false })
      .limit(50)

    if (entries?.length) {
      return { board, periodKey, entries }
    }

    const gameEntries = await gamificationService.getLeaderboard(boardKey, periodKey)
    return { board, periodKey, entries: gameEntries || [] }
  },

  async refreshLeaderboard(boardKey) {
    const { data: board } = await supabase
      .from('leaderboards')
      .select('*')
      .eq('board_key', boardKey)
      .single()

    if (!board) return { updated: 0 }

    const periodKey =
      board.period_type === 'monthly'
        ? monthKey()
        : board.period_type === 'all_time'
          ? 'all'
          : weekKey()

    let rows = []
    if (board.metric_key === 'xp_global') {
      const { data } = await supabase
        .from('user_gamification')
        .select('user_id, xp_global, users(username, full_name, profile_image)')
        .order('xp_global', { ascending: false })
        .limit(50)
      rows = (data || []).map((r, i) => ({
        board_key: boardKey,
        period_key: periodKey,
        user_id: r.user_id,
        score: r.xp_global,
        rank_position: i + 1,
      }))
    } else if (board.metric_key === 'direct_count') {
      const { data } = await supabase
        .from('users')
        .select('id, direct_count, username, full_name')
        .eq('status', 'active')
        .order('direct_count', { ascending: false })
        .limit(50)
      rows = (data || []).map((r, i) => ({
        board_key: boardKey,
        period_key: periodKey,
        user_id: r.id,
        score: r.direct_count,
        rank_position: i + 1,
      }))
    } else if (board.metric_key === 'commission_paid_total') {
      const { data } = await supabase
        .from('users')
        .select('id, commission_paid_total')
        .order('commission_paid_total', { ascending: false })
        .limit(50)
      rows = (data || []).map((r, i) => ({
        board_key: boardKey,
        period_key: periodKey,
        user_id: r.id,
        score: parseFloat(r.commission_paid_total || 0),
        rank_position: i + 1,
      }))
    }

    for (const row of rows) {
      await supabase.from('leaderboard_entries').upsert(
        { ...row, refreshed_at: new Date().toISOString() },
        { onConflict: 'board_key,period_key,user_id' }
      )
    }

    return { updated: rows.length, periodKey }
  },

  async evaluateAchievements(userId) {
    const metrics = await rankProgressionEngine.gatherMetrics(userId)
    const { data: user } = await supabase
      .from('users')
      .select('rank_id, ranks(sort_order), commission_paid_total')
      .eq('id', userId)
      .single()

    metrics.commission_paid_total = parseFloat(user?.commission_paid_total || 0)
    metrics.rank_sort_order = user?.ranks?.sort_order ?? 0

    const { data: agency } = await supabase
      .from('agency_members')
      .select('id')
      .eq('user_id', userId)
      .eq('status', 'active')
      .maybeSingle()
    metrics.agency_member = agency ? 1 : 0

    const { data: defs } = await supabase
      .from('game_achievement_definitions')
      .select('*')
      .eq('is_active', true)
      .like('key', 'p8_%')

    const { data: earned } = await supabase
      .from('game_user_achievements')
      .select('achievement_key')
      .eq('user_id', userId)

    const earnedSet = new Set((earned || []).map((e) => e.achievement_key))
    const unlocked = []

    for (const def of defs || []) {
      const aKey = def.key || def.achievement_key
      if (earnedSet.has(aKey)) continue
      const actual = resolveConditionMetric(def.condition_type, metrics)
      const met = Number(actual) >= Number(def.condition_value || 0)
      if (!met) continue

      await supabase.from('game_user_achievements').insert({
        user_id: userId,
        achievement_key: aKey,
      })

      if (def.xp_reward > 0) {
        await progressionEngine.grantXp(userId, 'achievement_unlock', {
          referenceId: aKey,
          overrideAmounts: { global: def.xp_reward, seasonal: 0, team: 0, leadership: 0 },
        })
      }

      emitCelebration(userId, aKey, def.title)
      unlocked.push(def)
    }

    return unlocked
  },
}

async function emitCelebration(userId, key, title) {
  try {
    const { emitToUser } = await import('../lib/socket.js')
    emitToUser(userId, 'progression:celebration', {
      type: 'achievement',
      title,
      achievement: key,
    })
  } catch {
    /* socket optional */
  }
}

function resolveConditionMetric(conditionType, m) {
  const map = {
    direct_count: m.direct_count,
    active_direct_count: m.active_direct_count,
    bv_matching: m.bv_matching,
    gv_total: m.gv,
    rank_sort: m.rank_sort_order,
    login_streak: m.streak_days,
    commission_total: m.commission_paid_total,
    agency_member: m.agency_member,
    package_level: m.package_level,
  }
  return map[conditionType] ?? 0
}
