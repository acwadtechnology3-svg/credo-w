import { supabase } from '../lib/supabase.js'

const LEVEL_THRESHOLDS = [0, 500, 1200, 2500, 5000, 10000, 20000, 40000, 80000, 150000]

export function xpToLevel(xp) {
  let level = 1
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= LEVEL_THRESHOLDS[i]) {
      level = i + 1
      break
    }
  }
  return Math.min(level, LEVEL_THRESHOLDS.length)
}

export function levelProgress(xp) {
  const level = xpToLevel(xp)
  const current = LEVEL_THRESHOLDS[level - 1] ?? 0
  const next = LEVEL_THRESHOLDS[level] ?? LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1]
  const pct = next > current ? Math.min(100, ((xp - current) / (next - current)) * 100) : 100
  return { level, currentXp: xp, xpToNext: Math.max(0, next - xp), nextThreshold: next, pct }
}

export function computeScores({ totalPv, directCount, sideA, sideB, commissionTotal }) {
  const matchingBv = Math.min(sideA, sideB)
  const power = Math.round(totalPv * 2 + matchingBv * 0.5 + directCount * 25)
  const network = Math.round(matchingBv + (sideA + sideB) * 0.3)
  const referral = Math.round(directCount * 40 + commissionTotal * 0.1)
  return { power_score: power, network_score: network, referral_score: referral }
}

export function computeXpFromMetrics(metrics) {
  return Math.round(
    (metrics.totalPv || 0) * 8 +
      Math.min(metrics.sideA || 0, metrics.sideB || 0) * 2 +
      (metrics.directCount || 0) * 60 +
      (metrics.commissionTotal || 0) * 0.5
  )
}

export async function ensureGamificationRow(userId) {
  const { data: existing } = await supabase
    .from('user_gamification')
    .select('user_id')
    .eq('user_id', userId)
    .maybeSingle()

  if (existing) return existing

  const slug = userId.replace(/-/g, '').slice(0, 12).toLowerCase()
  const { data, error } = await supabase
    .from('user_gamification')
    .insert({ user_id: userId, share_slug: slug })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function syncGamification(userId, metrics) {
  await ensureGamificationRow(userId)
  const xp = computeXpFromMetrics(metrics)
  const level = xpToLevel(xp)
  const scores = computeScores(metrics)
  const prestige = Math.floor((metrics.rankSortOrder || 0) / 2)

  const today = new Date().toISOString().slice(0, 10)
  const { data: current } = await supabase
    .from('user_gamification')
    .select('last_active_date, streak_days')
    .eq('user_id', userId)
    .single()

  let streak = current?.streak_days || 0
  const last = current?.last_active_date
  if (last) {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const yStr = yesterday.toISOString().slice(0, 10)
    if (last === today) {
      /* same day */
    } else if (last === yStr) {
      streak += 1
    } else {
      streak = 1
    }
  } else {
    streak = 1
  }

  const { data, error } = await supabase
    .from('user_gamification')
    .update({
      xp,
      level,
      prestige,
      streak_days: streak,
      last_active_date: today,
      ...scores,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId)
    .select()
    .single()

  if (error) throw error
  return { ...data, progress: levelProgress(xp) }
}

export async function evaluateAchievements(userId, ctx) {
  const checks = [
    { id: 'first_referral', ok: (ctx.directCount || 0) >= 1 },
    { id: 'three_directs', ok: (ctx.directCount || 0) >= 3 },
    { id: 'rank_bronze', ok: (ctx.rankSortOrder || 0) >= 2 },
    {
      id: 'bv_1000',
      ok: Math.min(ctx.sideA || 0, ctx.sideB || 0) >= 1000,
    },
    { id: 'team_joined', ok: !!ctx.hasTeam },
    { id: 'streak_7', ok: (ctx.streakDays || 0) >= 7 },
    { id: 'package_triple', ok: (ctx.packageLevel || 0) >= 3 },
    { id: 'wallet_earner', ok: (ctx.commissionTotal || 0) > 0 },
  ]

  const unlocked = []
  for (const c of checks) {
    if (!c.ok) continue
    const { error } = await supabase.from('user_achievements').upsert(
      { user_id: userId, achievement_id: c.id },
      { onConflict: 'user_id,achievement_id', ignoreDuplicates: true }
    )
    if (!error) unlocked.push(c.id)
  }
  return unlocked
}

export async function getUserAchievements(userId) {
  const { data: defs } = await supabase
    .from('achievement_definitions')
    .select('*')
    .order('sort_order')

  const { data: earned } = await supabase
    .from('user_achievements')
    .select('achievement_id, unlocked_at')
    .eq('user_id', userId)

  const earnedMap = Object.fromEntries((earned || []).map((e) => [e.achievement_id, e.unlocked_at]))

  return (defs || []).map((d) => ({
    ...d,
    unlocked: !!earnedMap[d.id],
    unlocked_at: earnedMap[d.id] || null,
  }))
}

export async function getRankTimeline(userId) {
  const { data } = await supabase
    .from('rank_milestones')
    .select('rank_name, reached_at')
    .eq('user_id', userId)
    .order('reached_at', { ascending: true })

  return data || []
}
