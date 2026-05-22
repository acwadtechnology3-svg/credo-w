import { supabase } from '../lib/supabase.js'
import { pearlsService, getWeekKey } from '../services/pearls.service.js'

export const pearlsController = {
  async getWallet(req, res) {
    try {
      const wallet = await pearlsService.getWallet(req.user.userId)
      const { data: expiringSoon } = await supabase
        .from('pearls_transactions')
        .select('amount, expires_at')
        .eq('user_id', req.user.userId)
        .eq('type', 'earn')
        .eq('is_expired', false)
        .lt('expires_at', new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString())
        .gt('expires_at', new Date().toISOString())

      const expiringTotal = (expiringSoon || []).reduce((s, t) => s + t.amount, 0)
      return res.json({ ...wallet, expiring_soon: expiringTotal })
    } catch (err) {
      console.error('getWallet pearls:', err)
      return res.status(500).json({ error: 'Server error' })
    }
  },

  async getTransactions(req, res) {
    try {
      const { page = 1, limit = 20, type } = req.query
      const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10)
      let query = supabase
        .from('pearls_transactions')
        .select('*', { count: 'exact' })
        .eq('user_id', req.user.userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + parseInt(limit, 10) - 1)
      if (type) query = query.eq('type', type)
      const { data, count, error } = await query
      if (error) throw error
      return res.json({ data: data || [], total: count })
    } catch (err) {
      console.error('getTransactions pearls:', err)
      return res.status(500).json({ error: 'Server error' })
    }
  },

  async getRewards(req, res) {
    try {
      const { type } = req.query
      const now = new Date().toISOString()
      let query = supabase
        .from('pearl_rewards')
        .select('*')
        .eq('is_active', true)
        .lte('available_from', now)
        .or(`available_until.is.null,available_until.gte.${now}`)
        .order('sort_order')
      if (type) query = query.eq('type', type)
      const { data, error } = await query
      if (error) throw error
      return res.json(data || [])
    } catch (err) {
      console.error('getRewards pearls:', err)
      return res.status(500).json({ error: 'Server error' })
    }
  },

  async redeemReward(req, res) {
    try {
      const { reward_id } = req.body
      if (!reward_id) return res.status(400).json({ error: 'reward_id required' })
      const { data: reward } = await supabase
        .from('pearl_rewards')
        .select('pearl_cost')
        .eq('id', reward_id)
        .single()
      if (!reward) return res.status(404).json({ error: 'Reward not found' })
      const result = await pearlsService.spend(req.user.userId, reward_id, reward.pearl_cost)
      return res.json(result)
    } catch (err) {
      return res.status(400).json({ error: err.message })
    }
  },

  async getMissions(req, res) {
    try {
      const today = new Date().toISOString().split('T')[0]
      const weekKey = getWeekKey()
      const { data: missions } = await supabase
        .from('pearl_missions')
        .select('*')
        .eq('is_active', true)
        .order('sort_order')
      const { data: progress } = await supabase
        .from('pearl_mission_progress')
        .select('*')
        .eq('user_id', req.user.userId)
        .in('period_key', [today, weekKey, 'permanent'])

      const progressMap = {}
      ;(progress || []).forEach((p) => {
        progressMap[`${p.mission_id}_${p.period_key}`] = p
      })

      const result = (missions || []).map((m) => {
        const pk = m.type === 'daily' ? today : m.type === 'weekly' ? weekKey : 'permanent'
        const prog = progressMap[`${m.id}_${pk}`]
        return {
          ...m,
          current_count: prog?.current_count || 0,
          is_completed: prog?.is_completed || false,
          pearl_claimed: prog?.pearl_claimed || false,
          period_key: pk,
        }
      })
      return res.json(result)
    } catch (err) {
      console.error('getMissions pearls:', err)
      return res.status(500).json({ error: 'Server error' })
    }
  },

  async claimMission(req, res) {
    try {
      const { mission_id } = req.params
      const today = new Date().toISOString().split('T')[0]
      const weekKey = getWeekKey()
      const { data: mission } = await supabase
        .from('pearl_missions')
        .select('*')
        .eq('id', mission_id)
        .single()
      if (!mission) return res.status(404).json({ error: 'Mission not found' })
      const pk = mission.type === 'daily' ? today : mission.type === 'weekly' ? weekKey : 'permanent'
      const { data: prog } = await supabase
        .from('pearl_mission_progress')
        .select('*')
        .eq('user_id', req.user.userId)
        .eq('mission_id', mission_id)
        .eq('period_key', pk)
        .maybeSingle()
      if (!prog?.is_completed) return res.status(400).json({ error: 'Mission not completed yet' })
      if (prog?.pearl_claimed) return res.status(400).json({ error: 'Already claimed' })
      await pearlsService.earn(req.user.userId, 'mission_complete', mission.pearl_reward, {
        mission_id,
        mission_title: mission.title,
      })
      await supabase
        .from('pearl_mission_progress')
        .update({ pearl_claimed: true })
        .eq('id', prog.id)
      return res.json({ message: 'Claimed!', earned: mission.pearl_reward })
    } catch (err) {
      console.error('claimMission pearls:', err)
      return res.status(500).json({ error: 'Server error' })
    }
  },

  async getAchievements(req, res) {
    try {
      const { data: all } = await supabase
        .from('pearl_achievements')
        .select('*')
        .eq('is_secret', false)
      const { data: unlocked } = await supabase
        .from('pearl_user_achievements')
        .select('achievement_id, unlocked_at')
        .eq('user_id', req.user.userId)
      const unlockedMap = {}
      ;(unlocked || []).forEach((u) => {
        unlockedMap[u.achievement_id] = u.unlocked_at
      })
      const result = (all || []).map((a) => ({
        ...a,
        is_unlocked: !!unlockedMap[a.id],
        unlocked_at: unlockedMap[a.id] || null,
      }))
      return res.json(result)
    } catch (err) {
      console.error('getAchievements pearls:', err)
      return res.status(500).json({ error: 'Server error' })
    }
  },

  async getLeaderboard(req, res) {
    try {
      const { data, error } = await supabase
        .from('pearls_wallet')
        .select('user_id, lifetime_earned, tier, users(username, full_name)')
        .order('lifetime_earned', { ascending: false })
        .limit(20)
      if (error) throw error
      return res.json(data || [])
    } catch (err) {
      console.error('getLeaderboard pearls:', err)
      return res.status(500).json({ error: 'Server error' })
    }
  },

  async adminGrant(req, res) {
    try {
      const { user_id, amount, reason } = req.body
      if (!user_id || !amount || !reason) {
        return res.status(400).json({ error: 'user_id, amount, reason required' })
      }
      const result = await pearlsService.earn(
        user_id,
        'admin_grant',
        parseInt(amount, 10),
        { reason, granted_by: req.user.userId }
      )
      await supabase.from('audit_logs').insert({
        actor_id: req.user.userId,
        action: 'PEARLS_GRANT',
        entity: 'pearls_wallet',
        entity_id: user_id,
        new_value: { amount, reason },
        ip_address: req.ip,
      })
      return res.json({ message: `${amount} Pearls granted to user`, result })
    } catch (err) {
      console.error('adminGrant pearls:', err)
      return res.status(500).json({ error: 'Server error' })
    }
  },

  async adminGetAnalytics(req, res) {
    try {
      const { data: totalWallets } = await supabase
        .from('pearls_wallet')
        .select('available_balance, lifetime_earned, tier')
      const totalCirculating = (totalWallets || []).reduce((s, w) => s + w.available_balance, 0)
      const totalEverEarned = (totalWallets || []).reduce((s, w) => s + w.lifetime_earned, 0)
      const tierCounts = { bronze: 0, silver: 0, gold: 0, diamond: 0 }
      ;(totalWallets || []).forEach((w) => {
        if (tierCounts[w.tier] !== undefined) tierCounts[w.tier]++
      })
      const { count: totalRedemptions } = await supabase
        .from('pearl_redemptions')
        .select('*', { count: 'exact', head: true })
      const { data: fraudFlags } = await supabase
        .from('pearl_fraud_flags')
        .select('severity')
        .eq('is_resolved', false)
      return res.json({
        totalCirculating,
        totalEverEarned,
        tierCounts,
        totalRedemptions,
        openFraudFlags: fraudFlags?.length || 0,
      })
    } catch (err) {
      console.error('adminGetAnalytics pearls:', err)
      return res.status(500).json({ error: 'Server error' })
    }
  },
}
