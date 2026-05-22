import { supabase } from '../lib/supabase.js'

export const EARN_RATES = {
  package_1: 500,
  package_3: 1200,
  package_7: 3000,
  upgrade_2: 700,
  upgrade_4: 1500,
  referral_join: 250,
  referral_package: 600,
  rank_up_base: 200,
  fast_start: 400,
  team_rank_up: 50,
  course_complete: 150,
  mission_complete: 25,
  streak_7: 100,
  streak_30: 500,
  streak_base: 10,
}

export function getWeekKey(date = new Date()) {
  const d = date
  const jan1 = new Date(d.getFullYear(), 0, 1)
  const week = Math.ceil(((d - jan1) / 86400000 + jan1.getDay() + 1) / 7)
  return `${d.getFullYear()}-W${String(week).padStart(2, '0')}`
}

export const pearlsService = {
  async ensureWallet(userId) {
    const { data: existing } = await supabase
      .from('pearls_wallet')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle()
    if (!existing) {
      await supabase.from('pearls_wallet').insert({ user_id: userId })
    }
  },

  async getWallet(userId) {
    await this.ensureWallet(userId)
    const { data, error } = await supabase
      .from('pearls_wallet')
      .select('*')
      .eq('user_id', userId)
      .single()
    if (error) throw error
    return data
  },

  async earn(userId, source, baseAmount, meta = {}, referenceId = null, campaignId = null) {
    await this.ensureWallet(userId)

    const { data: wallet } = await supabase
      .from('pearls_wallet')
      .select('available_balance, lifetime_earned, tier_multiplier')
      .eq('user_id', userId)
      .single()

    const multiplier = parseFloat(wallet.tier_multiplier || 1.0)
    const now = new Date().toISOString()

    const { data: campaigns } = await supabase
      .from('pearl_campaigns')
      .select('*')
      .eq('is_active', true)
      .lte('starts_at', now)
      .gte('ends_at', now)

    let campaignMultiplier = 1.0
    let campaignBonus = 0
    let activeCampaignId = campaignId

    for (const camp of campaigns || []) {
      if (camp.applies_to?.includes(source) || camp.applies_to?.includes('all')) {
        if (camp.target_user_ids?.length && !camp.target_user_ids.includes(userId)) continue
        campaignMultiplier = Math.max(campaignMultiplier, parseFloat(camp.multiplier || 1.0))
        campaignBonus += camp.bonus_flat || 0
        activeCampaignId = camp.id
      }
    }

    const finalAmount = Math.round(baseAmount * multiplier * campaignMultiplier) + campaignBonus
    if (finalAmount <= 0) return null

    const hourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    const { count: recentCount } = await supabase
      .from('pearls_transactions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('source', source)
      .gte('created_at', hourAgo)

    if ((recentCount || 0) >= 10) {
      await this.flagFraud(userId, 'rate_limit_exceeded', 'medium', { source, count: recentCount })
      return null
    }

    const newBalance = (wallet.available_balance || 0) + finalAmount
    const newLifetime = (wallet.lifetime_earned || 0) + finalAmount

    await supabase
      .from('pearls_wallet')
      .update({
        available_balance: newBalance,
        lifetime_earned: newLifetime,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)

    await supabase.from('pearls_transactions').insert({
      user_id: userId,
      type: 'earn',
      source,
      amount: finalAmount,
      balance_after: newBalance,
      reference_id: referenceId,
      campaign_id: activeCampaignId,
      expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      meta: {
        base: baseAmount,
        multiplier,
        campaign_mult: campaignMultiplier,
        campaign_bonus: campaignBonus,
        ...meta,
      },
    })

    await supabase.rpc('update_pearl_tier', { p_user_id: userId })
    await this.checkAchievements(userId, newLifetime)

    try {
      const { emitToUser } = await import('../lib/socket.js')
      emitToUser(userId, 'pearls:updated', { balance: newBalance, earned: finalAmount, source })
    } catch {
      /* socket optional */
    }

    return { earned: finalAmount, balance: newBalance }
  },

  async spend(userId, rewardId, pearlCost) {
    await this.ensureWallet(userId)
    const { data: wallet } = await supabase
      .from('pearls_wallet')
      .select('available_balance, lifetime_used, tier')
      .eq('user_id', userId)
      .single()

    if ((wallet?.available_balance || 0) < pearlCost) {
      throw new Error('Insufficient Pearls balance')
    }

    const { data: reward } = await supabase
      .from('pearl_rewards')
      .select('*')
      .eq('id', rewardId)
      .single()
    if (!reward || !reward.is_active) throw new Error('Reward not available')

    if (reward.stock !== -1 && reward.redeemed_count >= reward.stock) {
      throw new Error('This reward is out of stock')
    }

    const tierOrder = { bronze: 1, silver: 2, gold: 3, diamond: 4 }
    if (tierOrder[wallet.tier] < tierOrder[reward.min_tier]) {
      throw new Error(`This reward requires ${reward.min_tier} tier or above`)
    }

    const newBalance = wallet.available_balance - pearlCost

    await supabase
      .from('pearls_wallet')
      .update({
        available_balance: newBalance,
        lifetime_used: (wallet.lifetime_used || 0) + pearlCost,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)

    await supabase.from('pearls_transactions').insert({
      user_id: userId,
      type: 'spend',
      source: 'marketplace',
      amount: -pearlCost,
      balance_after: newBalance,
      reference_id: rewardId,
      meta: { reward_title: reward.title, reward_type: reward.type },
    })

    await supabase
      .from('pearl_rewards')
      .update({ redeemed_count: (reward.redeemed_count || 0) + 1 })
      .eq('id', rewardId)

    let voucherCode = null
    if (['voucher', 'discount'].includes(reward.type)) {
      voucherCode = `PEARL-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
    }

    const { data: redemption } = await supabase
      .from('pearl_redemptions')
      .insert({
        user_id: userId,
        reward_id: rewardId,
        pearls_spent: pearlCost,
        status: voucherCode ? 'fulfilled' : 'pending',
        voucher_code: voucherCode,
        fulfilled_at: voucherCode ? new Date().toISOString() : null,
      })
      .select()
      .single()

    try {
      const { emitToUser } = await import('../lib/socket.js')
      emitToUser(userId, 'pearls:updated', { balance: newBalance, spent: pearlCost })
    } catch {
      /* socket optional */
    }

    await supabase.from('notifications').insert({
      user_id: userId,
      type: 'PEARLS_REDEEM',
      title: `تم استرداد ${reward.title} ⬡`,
      body: voucherCode ? `كود الخصم: ${voucherCode}` : 'سيتم تفعيل المكافأة قريباً',
    })

    await this.awardAchievement(userId, 'first_redeem')

    return { redemption, voucherCode, balance: newBalance }
  },

  async handleDailyLogin(userId) {
    await this.ensureWallet(userId)
    const { data: wallet } = await supabase
      .from('pearls_wallet')
      .select('current_streak, longest_streak, last_login_date, streak_freeze_count')
      .eq('user_id', userId)
      .single()

    const today = new Date().toISOString().split('T')[0]
    const lastLogin = wallet.last_login_date

    if (lastLogin === today) return { alreadyLogged: true }

    let newStreak = 1
    if (lastLogin) {
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
      if (lastLogin === yesterday) {
        newStreak = (wallet.current_streak || 0) + 1
      } else {
        const twoDaysAgo = new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0]
        if (lastLogin === twoDaysAgo && (wallet.streak_freeze_count || 0) > 0) {
          newStreak = (wallet.current_streak || 0) + 1
          await supabase
            .from('pearls_wallet')
            .update({ streak_freeze_count: wallet.streak_freeze_count - 1 })
            .eq('user_id', userId)
        }
      }
    }

    const newLongest = Math.max(newStreak, wallet.longest_streak || 0)
    await supabase
      .from('pearls_wallet')
      .update({
        current_streak: newStreak,
        longest_streak: newLongest,
        last_login_date: today,
      })
      .eq('user_id', userId)

    const baseStreakReward = Math.min(10 + Math.floor(newStreak / 7) * 10, 100)
    await this.earn(userId, 'daily_streak', baseStreakReward, { streak: newStreak })

    if (newStreak === 7) await this.awardAchievement(userId, 'streak_7')
    if (newStreak === 30) await this.awardAchievement(userId, 'streak_30')

    await supabase.from('notifications').insert({
      user_id: userId,
      type: 'STREAK',
      title: `🔥 يوم ${newStreak} على التوالي!`,
      body: `+${baseStreakReward} ⬡ أضيفت لمحفظة اللآلئ`,
    })

    return { streak: newStreak, pearlsEarned: baseStreakReward }
  },

  async triggerMission(userId, actionTrigger) {
    const today = new Date().toISOString().split('T')[0]
    const weekKey = getWeekKey()

    const { data: missions } = await supabase
      .from('pearl_missions')
      .select('*')
      .eq('action_trigger', actionTrigger)
      .eq('is_active', true)

    const results = []

    for (const mission of missions || []) {
      const periodKey =
        mission.type === 'daily' ? today : mission.type === 'weekly' ? weekKey : 'permanent'

      const { data: existing } = await supabase
        .from('pearl_mission_progress')
        .select('*')
        .eq('user_id', userId)
        .eq('mission_id', mission.id)
        .eq('period_key', periodKey)
        .maybeSingle()

      if (existing?.is_completed) continue

      const currentCount = (existing?.current_count || 0) + 1
      const isCompleted = currentCount >= mission.target_count

      await supabase.from('pearl_mission_progress').upsert(
        {
          user_id: userId,
          mission_id: mission.id,
          current_count: currentCount,
          is_completed: isCompleted,
          completed_at: isCompleted ? new Date().toISOString() : null,
          period_key: periodKey,
          pearl_claimed: existing?.pearl_claimed || false,
        },
        { onConflict: 'user_id,mission_id,period_key' }
      )

      if (isCompleted && !existing?.pearl_claimed) {
        await this.earn(userId, 'mission_complete', mission.pearl_reward, {
          mission_id: mission.id,
          mission_title: mission.title,
        })
        await supabase
          .from('pearl_mission_progress')
          .update({ pearl_claimed: true })
          .eq('user_id', userId)
          .eq('mission_id', mission.id)
          .eq('period_key', periodKey)

        await supabase.from('notifications').insert({
          user_id: userId,
          type: 'MISSION_COMPLETE',
          title: `✅ مهمة مكتملة: ${mission.title}`,
          body: `+${mission.pearl_reward} ⬡ أضيفت لمحفظة اللآلئ`,
        })
        results.push({ mission: mission.title, earned: mission.pearl_reward })
      }
    }

    return results
  },

  async checkAchievements(userId, lifetimeEarned) {
    const { data: allAchievements } = await supabase
      .from('pearl_achievements')
      .select('*')
      .eq('condition_type', 'lifetime_earned')
    const { data: unlocked } = await supabase
      .from('pearl_user_achievements')
      .select('achievement_id')
      .eq('user_id', userId)
    const unlockedIds = new Set((unlocked || []).map((u) => u.achievement_id))

    for (const ach of allAchievements || []) {
      if (!unlockedIds.has(ach.id) && lifetimeEarned >= ach.condition_value) {
        await this.awardAchievement(userId, ach.key)
      }
    }
  },

  async checkReferralAchievements(userId) {
    const { count } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('sponsor_id', userId)
    const directCount = count || 0
    if (directCount >= 1) await this.awardAchievement(userId, 'first_referral')
    if (directCount >= 10) await this.awardAchievement(userId, 'referrals_10')
  },

  async onReferralJoined(sponsorId, refereeId) {
    await this.earn(sponsorId, 'referral_join', EARN_RATES.referral_join, { referee_id: refereeId })
    await this.triggerMission(sponsorId, 'referral_join')
    await this.checkReferralAchievements(sponsorId)
  },

  async onPackagePurchased(userId, pkg, orderId, isUpgrade) {
    const level = pkg.package_level
    const sourceKey = isUpgrade ? `upgrade_${level}` : `package_${level}`
    const amount = EARN_RATES[sourceKey] || EARN_RATES.package_1
    await this.earn(userId, sourceKey, amount, { package_name: pkg.name }, orderId)
    await this.triggerMission(userId, 'order_complete')
    if (isUpgrade) await this.awardAchievement(userId, 'first_upgrade')
  },

  async onRankUp(userId, achievedRank) {
    const rankBonus = Math.min(200 + achievedRank.sort_order * 200, 2000)
    await this.earn(userId, 'rank_up', rankBonus, { rank: achievedRank.name })
  },

  async checkFastStartPearls(sponsorId) {
    const { data: sponsor } = await supabase
      .from('users')
      .select('direct_count')
      .eq('id', sponsorId)
      .single()
    const count = sponsor?.direct_count || 0
    if (count > 0 && count % 3 === 0) {
      await this.earn(sponsorId, 'fast_start', EARN_RATES.fast_start, { direct_count: count })
    }
  },

  async awardAchievement(userId, achievementKey) {
    const { data: ach } = await supabase
      .from('pearl_achievements')
      .select('*')
      .eq('key', achievementKey)
      .maybeSingle()
    if (!ach) return

    const { error } = await supabase.from('pearl_user_achievements').insert({
      user_id: userId,
      achievement_id: ach.id,
    })
    if (error) return

    if (ach.pearl_reward > 0) {
      await this.earn(userId, 'achievement', ach.pearl_reward, { achievement: achievementKey })
    }
    await supabase.from('notifications').insert({
      user_id: userId,
      type: 'ACHIEVEMENT',
      title: `${ach.icon} إنجاز جديد: ${ach.title}!`,
      body: ach.description + (ach.pearl_reward > 0 ? ` · +${ach.pearl_reward} ⬡` : ''),
    })
  },

  async flagFraud(userId, flagType, severity, details) {
    await supabase.from('pearl_fraud_flags').insert({
      user_id: userId,
      flag_type: flagType,
      severity,
      details,
    })
  },

  async runExpiryJob() {
    const now = new Date().toISOString()
    const { data: expiring } = await supabase
      .from('pearls_transactions')
      .select('user_id, amount')
      .eq('type', 'earn')
      .eq('is_expired', false)
      .lt('expires_at', now)

    const grouped = {}
    for (const tx of expiring || []) {
      grouped[tx.user_id] = (grouped[tx.user_id] || 0) + tx.amount
    }

    for (const [userId, totalExpired] of Object.entries(grouped)) {
      const { data: wallet } = await supabase
        .from('pearls_wallet')
        .select('available_balance')
        .eq('user_id', userId)
        .single()
      const newBalance = Math.max(0, (wallet?.available_balance || 0) - totalExpired)
      await supabase
        .from('pearls_wallet')
        .update({ available_balance: newBalance })
        .eq('user_id', userId)
      await supabase.from('pearls_transactions').insert({
        user_id: userId,
        type: 'expire',
        source: 'expiry_cron',
        amount: -totalExpired,
        balance_after: newBalance,
        meta: { auto_expired: true },
      })
    }

    await supabase
      .from('pearls_transactions')
      .update({ is_expired: true })
      .eq('type', 'earn')
      .eq('is_expired', false)
      .lt('expires_at', now)

    return { processed: Object.keys(grouped).length }
  },
}
