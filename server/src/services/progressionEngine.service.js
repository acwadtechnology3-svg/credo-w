import { supabase } from '../lib/supabase.js'
import { pearlsService, getWeekKey } from './pearls.service.js'

const RULES_CACHE_MS = 60_000
let rulesCache = { at: 0, rules: null }

function todayKey() {
  return new Date().toISOString().slice(0, 10)
}

function monthKey() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function seasonPeriodKey() {
  return `season-${monthKey()}`
}

async function loadXpRules() {
  if (rulesCache.rules && Date.now() - rulesCache.at < RULES_CACHE_MS) {
    return rulesCache.rules
  }
  const { data } = await supabase.from('game_xp_rules').select('*').eq('is_active', true)
  rulesCache = { at: Date.now(), rules: data || [] }
  return rulesCache.rules
}

async function getActiveXpMultiplier(userId, eventKey) {
  const now = new Date().toISOString()
  let mult = 1.0

  const { data: boosters } = await supabase
    .from('game_user_boosters')
    .select('multiplier, booster_key')
    .eq('user_id', userId)
    .gt('expires_at', now)

  for (const b of boosters || []) {
    if (b.booster_key.startsWith('xp_')) mult = Math.max(mult, parseFloat(b.multiplier))
  }

  const { data: events } = await supabase
    .from('game_limited_events')
    .select('multiplier, applies_to')
    .eq('is_active', true)
    .lte('starts_at', now)
    .gte('ends_at', now)

  for (const ev of events || []) {
    if (ev.applies_to?.includes(eventKey) || ev.applies_to?.includes('all')) {
      mult = Math.max(mult, parseFloat(ev.multiplier))
    }
  }

  return mult
}

async function checkRateLimit(userId, source, maxPerHour) {
  if (!maxPerHour || maxPerHour <= 0) return true
  const hourAgo = new Date(Date.now() - 3600000).toISOString()
  const { count } = await supabase
    .from('game_xp_ledger')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('source', source)
    .gte('created_at', hourAgo)
  return (count || 0) < maxPerHour
}

function computeLevelFromXp(xpGlobal) {
  return supabase
    .from('game_level_definitions')
    .select('level, xp_required, title_en, rarity, unlocks_json')
    .order('level', { ascending: false })
    .then(({ data: levels }) => {
      let level = 1
      let def = levels?.[levels.length - 1]
      for (const l of levels || []) {
        if (xpGlobal >= l.xp_required) {
          level = l.level
          def = l
          break
        }
      }
      const sorted = [...(levels || [])].sort((a, b) => a.level - b.level)
      const next = sorted.find((l) => l.level > level)
      const currentReq = def?.xp_required ?? 0
      const nextReq = next?.xp_required ?? currentReq
      const pct =
        nextReq > currentReq
          ? Math.min(100, ((xpGlobal - currentReq) / (nextReq - currentReq)) * 100)
          : 100
      return {
        level,
        title: def?.title_en,
        rarity: def?.rarity,
        unlocks: def?.unlocks_json,
        xpToNext: Math.max(0, nextReq - xpGlobal),
        nextThreshold: nextReq,
        pct,
      }
    })
}

async function evaluatePrestige(userId, xpGlobal, level, achievementCount) {
  const { data: tiers } = await supabase
    .from('game_prestige_definitions')
    .select('*')
    .order('sort_order', { ascending: false })

  let best = 'none'
  for (const t of tiers || []) {
    if (
      level >= t.min_level &&
      xpGlobal >= t.min_xp_global &&
      achievementCount >= t.min_achievements
    ) {
      best = t.tier_key
      break
    }
  }

  const { data: current } = await supabase
    .from('user_gamification')
    .select('prestige_tier, prestige_count')
    .eq('user_id', userId)
    .single()

  const upgraded = best !== 'none' && best !== (current?.prestige_tier || 'none')
  if (upgraded || best !== current?.prestige_tier) {
    await supabase
      .from('user_gamification')
      .update({
        prestige_tier: best,
        prestige: tiers?.find((t) => t.tier_key === best)?.sort_order ?? 0,
        prestige_count: upgraded
          ? (current?.prestige_count || 0) + 1
          : current?.prestige_count || 0,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
  }

  return { tier: best, upgraded }
}

async function unlockCosmeticFromUnlocks(userId, unlocks) {
  if (!unlocks || typeof unlocks !== 'object') return
  const keys = []
  if (unlocks.frame) keys.push(unlocks.frame)
  if (unlocks.theme) keys.push(unlocks.theme)
  if (unlocks.background) keys.push(unlocks.background)
  if (unlocks.invite_theme) keys.push(unlocks.invite_theme)
  if (unlocks.card_skin) keys.push(unlocks.card_skin)

  for (const key of keys) {
    await supabase.from('game_user_cosmetics').upsert(
      { user_id: userId, cosmetic_key: key, acquired_via: 'level_unlock' },
      { onConflict: 'user_id,cosmetic_key', ignoreDuplicates: true }
    )
  }
}

export const progressionEngine = {
  invalidateRulesCache() {
    rulesCache = { at: 0, rules: null }
  },

  async ensureProgress(userId) {
    await supabase.rpc('game_grant_xp', {
      p_user_id: userId,
      p_xp_type: 'global',
      p_amount: 0,
      p_source: 'ensure_row',
      p_idempotency_key: `ensure-${userId}`,
    }).catch(() => {
      /* RPC may reject zero — fallback */
    })

    const { data: existing } = await supabase
      .from('user_gamification')
      .select('user_id, season_id')
      .eq('user_id', userId)
      .maybeSingle()

    if (!existing) {
      const slug = userId.replace(/-/g, '').slice(0, 12).toLowerCase()
      await supabase.from('user_gamification').insert({ user_id: userId, share_slug: slug })
    }

    if (!existing?.season_id) {
      const { data: season } = await supabase
        .from('game_seasons')
        .select('id')
        .eq('is_active', true)
        .order('starts_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (season) {
        await supabase
          .from('user_gamification')
          .update({ season_id: season.id })
          .eq('user_id', userId)
      }
    }
  },

  async grantXp(userId, eventKey, options = {}) {
    const {
      referenceId = null,
      idempotencyKey = null,
      meta = {},
      overrideAmounts = null,
    } = options

    await this.ensureProgress(userId)
    const rules = await loadXpRules()
    const rule = rules.find((r) => r.event_key === eventKey)
    if (!rule && !overrideAmounts) return { skipped: true, reason: 'no_rule' }

    const maxPerHour = rule?.max_per_hour ?? 20
    if (!(await checkRateLimit(userId, eventKey, maxPerHour))) {
      await this.flagAbuse(userId, 'xp_rate_limit', 'medium', { eventKey })
      return { skipped: true, reason: 'rate_limit' }
    }

    const mult = await getActiveXpMultiplier(userId, eventKey)
    const buckets = overrideAmounts || {
      global: Math.round((rule?.xp_global || 0) * mult),
      seasonal: Math.round((rule?.xp_seasonal || 0) * mult),
      team: Math.round((rule?.xp_team || 0) * mult),
      leadership: Math.round((rule?.xp_leadership || 0) * mult),
    }

    const results = []
    for (const [type, amount] of Object.entries({
      global: buckets.global,
      seasonal: buckets.seasonal,
      team: buckets.team,
      leadership: buckets.leadership,
    })) {
      if (!amount || amount <= 0) continue
      const idem =
        idempotencyKey != null
          ? `${idempotencyKey}:${type}`
          : referenceId
            ? `${eventKey}:${referenceId}:${type}`
            : null

      const { data, error } = await supabase.rpc('game_grant_xp', {
        p_user_id: userId,
        p_xp_type: type,
        p_amount: amount,
        p_source: eventKey,
        p_idempotency_key: idem,
        p_reference_id: referenceId,
        p_meta: meta,
      })

      if (error) {
        if (/duplicate|unique/i.test(error.message)) {
          results.push({ type, duplicate: true })
          continue
        }
        console.warn('[progression] grantXp', type, error.message)
        continue
      }
      results.push({ type, ...(data || {}) })
    }

    const pearlBonus = rule?.pearl_bonus || 0
    if (pearlBonus > 0) {
      await pearlsService.earn(userId, `progression_${eventKey}`, pearlBonus, meta, referenceId)
    }

    const levelResult = await this.syncLevelAndPrestige(userId)
    return { results, levelResult, pearlBonus }
  },

  async syncLevelAndPrestige(userId) {
    const { data: g } = await supabase
      .from('user_gamification')
      .select('xp_global, level')
      .eq('user_id', userId)
      .single()

    const xpGlobal = g?.xp_global ?? 0
    const levelInfo = await computeLevelFromXp(xpGlobal)
    const prevLevel = g?.level ?? 1
    const leveledUp = levelInfo.level > prevLevel

    await supabase
      .from('user_gamification')
      .update({
        level: levelInfo.level,
        xp: xpGlobal,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)

    if (leveledUp && levelInfo.unlocks) {
      await unlockCosmeticFromUnlocks(userId, levelInfo.unlocks)
    }

    const { count } = await supabase
      .from('game_user_achievements')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)

    const prestige = await evaluatePrestige(
      userId,
      xpGlobal,
      levelInfo.level,
      count || 0
    )

    if (leveledUp || prestige.upgraded) {
      try {
        const { emitToUser } = await import('../lib/socket.js')
        emitToUser(userId, 'progression:celebration', {
          type: prestige.upgraded ? 'prestige' : 'level_up',
          level: levelInfo.level,
          prestige: prestige.tier,
          title: levelInfo.title,
          rarity: levelInfo.rarity,
        })
      } catch {
        /* optional */
      }

      const title = prestige.upgraded
        ? `👑 Prestige unlocked: ${prestige.tier}!`
        : `⬆️ Level ${levelInfo.level}: ${levelInfo.title}!`
      await supabase.from('notifications').insert({
        user_id: userId,
        type: prestige.upgraded ? 'PRESTIGE_UNLOCK' : 'LEVEL_UP',
        title,
        body: 'New rewards and cosmetics may be available in your Progression Hub.',
      })
    }

    return { ...levelInfo, leveledUp, prestige }
  },

  async recordStreak(userId, streakKey = 'login') {
    const today = todayKey()
    const { data: row } = await supabase
      .from('game_user_streaks')
      .select('*')
      .eq('user_id', userId)
      .eq('streak_key', streakKey)
      .maybeSingle()

    if (row?.last_active_date === today) return { streak: row.current_days, already: true }

    const { data: def } = await supabase
      .from('game_streak_definitions')
      .select('*')
      .eq('streak_key', streakKey)
      .single()

    let newDays = 1
    if (row?.last_active_date) {
      const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
      if (row.last_active_date === yesterday) {
        newDays = (row.current_days || 0) + 1
      } else if (row.freeze_count > 0) {
        const twoAgo = new Date(Date.now() - 2 * 86400000).toISOString().slice(0, 10)
        if (row.last_active_date === twoAgo) {
          newDays = (row.current_days || 0) + 1
          await supabase
            .from('game_user_streaks')
            .update({ freeze_count: row.freeze_count - 1 })
            .eq('user_id', userId)
            .eq('streak_key', streakKey)
        }
      }
    }

    const longest = Math.max(newDays, row?.longest_days || 0)
    await supabase.from('game_user_streaks').upsert(
      {
        user_id: userId,
        streak_key: streakKey,
        current_days: newDays,
        longest_days: longest,
        last_active_date: today,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,streak_key' }
    )

    if (streakKey === 'login') {
      await supabase
        .from('user_gamification')
        .update({ streak_days: newDays, last_active_date: today })
        .eq('user_id', userId)
    }

    const milestones = def?.milestone_json || []
    for (const m of milestones) {
      if (newDays === m.days) {
        await this.grantXp(userId, 'streak_milestone', {
          idempotencyKey: `streak-${streakKey}-${m.days}-${userId}`,
          overrideAmounts: { global: m.xp || 200, seasonal: 0, team: 0, leadership: 0 },
        })
        if (m.pearls) {
          await pearlsService.earn(userId, 'streak_milestone', m.pearls, { streak: newDays })
        }
      }
    }

    await this.evaluateAchievements(userId, { login_streak: newDays })
    return { streak: newDays, longest }
  },

  async triggerMission(userId, actionTrigger, increment = 1) {
    const today = todayKey()
    const weekKey = getWeekKey()
    const seasonKey = seasonPeriodKey()

    const { data: missions } = await supabase
      .from('game_mission_definitions')
      .select('*')
      .eq('action_trigger', actionTrigger)
      .eq('is_active', true)

    const completed = []

    for (const mission of missions || []) {
      const periodKey =
        mission.mission_type === 'daily'
          ? today
          : mission.mission_type === 'weekly'
            ? weekKey
            : mission.mission_type === 'monthly'
              ? monthKey()
              : mission.mission_type === 'seasonal'
                ? seasonKey
                : 'permanent'

      const { data: existing } = await supabase
        .from('game_user_missions')
        .select('*')
        .eq('user_id', userId)
        .eq('mission_id', mission.id)
        .eq('period_key', periodKey)
        .maybeSingle()

      if (existing?.reward_claimed) continue

      const currentCount = (existing?.current_count || 0) + increment
      const isCompleted = currentCount >= mission.target_count

      await supabase.from('game_user_missions').upsert(
        {
          user_id: userId,
          mission_id: mission.id,
          period_key: periodKey,
          current_count: currentCount,
          is_completed: isCompleted,
          completed_at: isCompleted ? new Date().toISOString() : null,
          reward_claimed: existing?.reward_claimed || false,
        },
        { onConflict: 'user_id,mission_id,period_key' }
      )

      if (isCompleted && !existing?.reward_claimed) {
        const claimKey = `mission:${mission.id}:${periodKey}:${userId}`
        const { error: claimErr } = await supabase.from('game_reward_claims').insert({
          user_id: userId,
          claim_type: 'mission',
          claim_ref: claimKey,
          payload: { mission_key: mission.key },
        })
        if (claimErr && !/duplicate|unique/i.test(claimErr.message)) continue

        await supabase
          .from('game_user_missions')
          .update({ reward_claimed: true, claimed_at: new Date().toISOString() })
          .eq('user_id', userId)
          .eq('mission_id', mission.id)
          .eq('period_key', periodKey)

        await this.grantXp(userId, 'mission_complete', {
          idempotencyKey: claimKey,
          overrideAmounts: {
            global: mission.xp_reward,
            seasonal: Math.floor(mission.xp_reward * 0.6),
            team: 0,
            leadership: 0,
          },
          meta: { mission: mission.key },
        })

        if (mission.pearl_reward > 0) {
          await pearlsService.earn(userId, 'game_mission', mission.pearl_reward, {
            mission: mission.key,
          })
        }

        if (mission.booster_key) {
          const { data: bdef } = await supabase
            .from('game_booster_definitions')
            .select('*')
            .eq('key', mission.booster_key)
            .maybeSingle()
          if (bdef) {
            await supabase.from('game_user_boosters').insert({
              user_id: userId,
              booster_key: bdef.key,
              multiplier: bdef.multiplier,
              expires_at: new Date(
                Date.now() + bdef.duration_hours * 3600000
              ).toISOString(),
              source: `mission:${mission.key}`,
            })
          }
        }

        await supabase.from('notifications').insert({
          user_id: userId,
          type: 'MISSION_COMPLETE',
          title: `✅ ${mission.title}`,
          body: `+${mission.xp_reward} XP · +${mission.pearl_reward} Pearls`,
        })

        completed.push({
          mission: mission.title,
          xp: mission.xp_reward,
          pearls: mission.pearl_reward,
          rarity: mission.rarity,
        })

        try {
          const { emitToUser } = await import('../lib/socket.js')
          emitToUser(userId, 'progression:celebration', {
            type: 'mission_complete',
            mission: mission.title,
            rarity: mission.rarity,
          })
        } catch {
          /* optional */
        }
      }
    }

    await pearlsService.triggerMission(userId, actionTrigger)
    return completed
  },

  async evaluateAchievements(userId, ctx = {}) {
    const { data: defs } = await supabase
      .from('game_achievement_definitions')
      .select('*')
      .eq('is_active', true)

    const { data: earned } = await supabase
      .from('game_user_achievements')
      .select('achievement_key')
      .eq('user_id', userId)

    const earnedSet = new Set((earned || []).map((e) => e.achievement_key))
    const unlocked = []

    for (const d of defs || []) {
      if (earnedSet.has(d.key)) continue
      if (d.available_until && new Date(d.available_until) < new Date()) continue

      let ok = false
      switch (d.condition_type) {
        case 'direct_count':
          ok = (ctx.directCount ?? ctx.direct_count ?? 0) >= d.condition_value
          break
        case 'package_level':
          ok = (ctx.packageLevel ?? ctx.package_level ?? 0) >= d.condition_value
          break
        case 'rank_sort':
          ok = (ctx.rankSortOrder ?? ctx.rank_sort ?? 0) >= d.condition_value
          break
        case 'commission_total':
          ok = (ctx.commissionTotal ?? ctx.commission_total ?? 0) >= d.condition_value
          break
        case 'login_streak':
          ok = (ctx.login_streak ?? ctx.streakDays ?? 0) >= d.condition_value
          break
        case 'team_founded':
          ok = !!ctx.teamFounded
          break
        case 'seasonal_xp': {
          const { data: g } = await supabase
            .from('user_gamification')
            .select('xp_seasonal')
            .eq('user_id', userId)
            .single()
          ok = (g?.xp_seasonal || 0) >= d.condition_value
          break
        }
        default:
          break
      }

      if (!ok) continue

      const { error } = await supabase.from('game_user_achievements').insert({
        user_id: userId,
        achievement_key: d.key,
        claim_idempotency_key: `ach:${d.key}:${userId}`,
      })
      if (error) continue

      await this.grantXp(userId, 'achievement_unlock', {
        idempotencyKey: `ach-xp:${d.key}:${userId}`,
        overrideAmounts: {
          global: d.xp_reward,
          seasonal: Math.floor(d.xp_reward * 0.5),
          team: 0,
          leadership: 0,
        },
      })

      if (d.pearl_reward > 0) {
        await pearlsService.earn(userId, 'game_achievement', d.pearl_reward, {
          achievement: d.key,
        })
      }

      if (d.cosmetic_unlock_key) {
        await supabase.from('game_user_cosmetics').upsert(
          {
            user_id: userId,
            cosmetic_key: d.cosmetic_unlock_key,
            acquired_via: 'achievement',
          },
          { onConflict: 'user_id,cosmetic_key', ignoreDuplicates: true }
        )
      }

      if (d.title_unlock_key) {
        await supabase.from('game_user_titles').upsert(
          { user_id: userId, title_key: d.title_unlock_key },
          { onConflict: 'user_id,title_key', ignoreDuplicates: true }
        )
      }

      await supabase.from('notifications').insert({
        user_id: userId,
        type: 'ACHIEVEMENT',
        title: `${d.icon} ${d.title}`,
        body: d.description,
      })

      unlocked.push(d)

      try {
        const { emitToUser } = await import('../lib/socket.js')
        emitToUser(userId, 'progression:celebration', {
          type: 'achievement',
          title: d.title,
          rarity: d.rarity,
          icon: d.icon,
        })
      } catch {
        /* optional */
      }
    }

    if (unlocked.length) await this.syncLevelAndPrestige(userId)
    return unlocked
  },

  async onLogin(userId) {
    await this.recordStreak(userId, 'login')
    await this.grantXp(userId, 'login')
    return this.triggerMission(userId, 'login')
  },

  async onPurchase(userId, pkg, orderId, isUpgrade) {
    const eventKey = isUpgrade ? 'upgrade' : 'purchase'
    await this.grantXp(userId, eventKey, { referenceId: orderId })
    await this.triggerMission(userId, 'order_complete')
    if ((pkg.bv_points || 0) > 0) {
      await this.triggerMission(userId, 'bv_earned', pkg.bv_points)
    }

    const { data: user } = await supabase
      .from('users')
      .select('current_package_level, commission_paid_total, ranks(sort_order)')
      .eq('id', userId)
      .single()

    await this.evaluateAchievements(userId, {
      packageLevel: user?.current_package_level,
      commissionTotal: parseFloat(user?.commission_paid_total || 0),
      rankSortOrder: user?.ranks?.sort_order ?? 0,
    })
  },

  async onReferralJoin(sponsorId, refereeId) {
    await this.grantXp(sponsorId, 'referral_join', { referenceId: refereeId })
    await this.recordStreak(sponsorId, 'referral')
    await this.triggerMission(sponsorId, 'referral_join')

    const { count } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('sponsor_id', sponsorId)

    await this.evaluateAchievements(sponsorId, { directCount: count || 0 })
  },

  async onRankUp(userId, rank) {
    await this.grantXp(userId, 'rank_up', {
      referenceId: rank?.id,
      meta: { rank: rank?.name },
    })
    await this.evaluateAchievements(userId, { rankSortOrder: rank?.sort_order ?? 0 })
  },

  async onTeamFounded(userId) {
    await this.grantXp(userId, 'team_activity', { meta: { action: 'team_founded' } })
    await this.evaluateAchievements(userId, { teamFounded: true })
  },

  async flagAbuse(userId, flagType, severity, details) {
    await supabase.from('game_progression_flags').insert({
      user_id: userId,
      flag_type: flagType,
      severity,
      details,
    })
  },

  async refreshLeaderboard(leaderboardKey, periodKey = 'all') {
    const { data: def } = await supabase
      .from('game_leaderboard_definitions')
      .select('*')
      .eq('key', leaderboardKey)
      .eq('is_active', true)
      .single()
    if (!def) return []

    let rows = []
    if (def.metric === 'xp_global' || def.metric === 'xp_seasonal' || def.metric === 'prestige') {
      const col =
        def.metric === 'xp_seasonal'
          ? 'xp_seasonal'
          : def.metric === 'prestige'
            ? 'prestige'
            : 'xp_global'
      const { data } = await supabase
        .from('user_gamification')
        .select(`user_id, ${col}, users(full_name, user_code, profile_image)`)
        .order(col, { ascending: false })
        .limit(100)
      rows = (data || []).map((r) => ({
        entity_type: 'user',
        entity_id: r.user_id,
        score: r[col] ?? 0,
        meta: { user: r.users },
      }))
    } else if (def.metric === 'referrals') {
      const { data } = await supabase
        .from('users')
        .select('id, full_name, user_code, direct_count, profile_image')
        .order('direct_count', { ascending: false })
        .limit(100)
      rows = (data || []).map((u) => ({
        entity_type: 'user',
        entity_id: u.id,
        score: u.direct_count || 0,
        meta: { user: u },
      }))
    } else if (def.metric === 'team_growth') {
      const { data } = await supabase
        .from('teams')
        .select('id, name, slug, power_score, total_members, logo_url')
        .order('power_score', { ascending: false })
        .limit(50)
      rows = (data || []).map((t) => ({
        entity_type: 'team',
        entity_id: t.id,
        score: t.power_score || 0,
        meta: { team: t },
      }))
    } else if (def.metric === 'pearls') {
      const { data } = await supabase
        .from('pearls_wallet')
        .select('user_id, lifetime_earned, users(full_name, user_code)')
        .order('lifetime_earned', { ascending: false })
        .limit(100)
      rows = (data || []).map((r) => ({
        entity_type: 'user',
        entity_id: r.user_id,
        score: r.lifetime_earned || 0,
        meta: { user: r.users },
      }))
    }

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      await supabase.from('game_leaderboard_entries').upsert(
        {
          leaderboard_key: leaderboardKey,
          period_key: periodKey,
          entity_type: row.entity_type,
          entity_id: row.entity_id,
          score: row.score,
          rank_position: i + 1,
          meta: row.meta,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'leaderboard_key,period_key,entity_type,entity_id' }
      )
    }

    return rows.slice(0, 50)
  },
}
