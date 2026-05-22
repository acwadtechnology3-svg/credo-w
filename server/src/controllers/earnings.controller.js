import { supabase } from '../lib/supabase.js'
import { commissionService } from '../services/commission.service.js'

export const earningsController = {
  async getWallet(req, res) {
    try {
      const userId = req.user.userId
      const { from, to, category } = req.query

      const { data: wallets } = await supabase
        .from('wallets')
        .select('id, type, balance')
        .eq('user_id', userId)
      const earningsWallet = wallets?.find((w) => w.type === 'EARNINGS')
      const cmoneyWallet = wallets?.find((w) => w.type === 'CMONEY')

      let query = supabase
        .from('wallet_transactions')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(100)

      if (earningsWallet?.id) {
        query = query.eq('wallet_id', earningsWallet.id)
      }
      if (category) query = query.eq('category', category)
      if (from) query = query.gte('created_at', from)
      if (to) query = query.lte('created_at', to)

      const { data: transactions, count } = await query

      return res.json({
        earning: parseFloat(earningsWallet?.balance || 0),
        available: parseFloat(earningsWallet?.balance || 0),
        cmoney: parseFloat(cmoneyWallet?.balance || 0),
        transactions: transactions || [],
        total: count,
      })
    } catch (err) {
      console.error('getWallet error:', err)
      return res.status(500).json({ error: 'Server error' })
    }
  },

  async getTeamCommission(req, res) {
    try {
      const { from, to } = req.query
      let query = supabase
        .from('team_commissions')
        .select('*, commission_cycles(week_start, week_end)')
        .eq('user_id', req.user.userId)
        .order('created_at', { ascending: false })
        .limit(100)

      if (from) query = query.gte('created_at', from)
      if (to) query = query.lte('created_at', to)

      const { data } = await query

      const totalBonus = (data || []).reduce(
        (s, d) => s + parseFloat(d.commission_amount || 0),
        0
      )

      return res.json({
        totalBonus: Math.round(totalBonus * 100) / 100,
        commissions: (data || []).map((c) => ({
          id: c.id,
          commission_date: c.created_at,
          commission_period: `${c.commission_cycles?.week_start} → ${c.commission_cycles?.week_end}`,
          pay_leg_volume: c.pay_leg_volume,
          left_carry: c.left_carry,
          right_carry: c.right_carry,
          commission_pct: c.commission_pct,
          rank: c.rank_at_time,
          commission_amount: c.commission_amount,
        })),
      })
    } catch (err) {
      console.error('getTeamCommission error:', err)
      return res.status(500).json({ error: 'Server error' })
    }
  },

  async getLevelBonus(req, res) {
    try {
      const { from, to } = req.query
      let query = supabase
        .from('level_bonuses')
        .select('*, source:source_user_id(username), orders(order_ref)')
        .eq('user_id', req.user.userId)
        .order('created_at', { ascending: false })
        .limit(100)

      if (from) query = query.gte('created_at', from)
      if (to) query = query.lte('created_at', to)

      const { data } = await query
      const total = (data || []).reduce((s, d) => s + parseFloat(d.bonus_amount || 0), 0)

      return res.json({ totalAmount: Math.round(total * 100) / 100, bonuses: data || [] })
    } catch (err) {
      console.error('getLevelBonus error:', err)
      return res.status(500).json({ error: 'Server error' })
    }
  },

  async getFastStart(req, res) {
    try {
      const { data: txs } = await supabase
        .from('wallet_transactions')
        .select('*')
        .eq('user_id', req.user.userId)
        .eq('category', 'FAST_START')
        .order('created_at', { ascending: false })

      const total = (txs || []).reduce((s, t) => s + parseFloat(t.amount || 0), 0)
      return res.json({ totalAmount: Math.round(total * 100) / 100, bonuses: txs || [] })
    } catch (err) {
      console.error('getFastStart error:', err)
      return res.status(500).json({ error: 'Server error' })
    }
  },

  async getRankBonus(req, res) {
    try {
      const { data: ranks } = await supabase.from('ranks').select('*').order('sort_order')

      const { data: user } = await supabase
        .from('users')
        .select('rank_id, total_pv, direct_count, ranks(sort_order)')
        .eq('id', req.user.userId)
        .single()

      const { data: bvLogs } = await supabase
        .from('bv_logs')
        .select('side, amount')
        .eq('user_id', req.user.userId)
      const sideA = (bvLogs || [])
        .filter((b) => b.side === 'LEFT')
        .reduce((s, b) => s + parseFloat(b.amount), 0)
      const sideB = (bvLogs || [])
        .filter((b) => b.side === 'RIGHT')
        .reduce((s, b) => s + parseFloat(b.amount), 0)
      const matchingBV = Math.min(sideA, sideB)

      const { data: bonusTxs } = await supabase
        .from('wallet_transactions')
        .select('*')
        .eq('user_id', req.user.userId)
        .eq('category', 'RANK_BONUS')

      const ranksWithStatus = (ranks || []).map((r) => ({
        ...r,
        achieved:
          parseFloat(user?.total_pv || 0) >= parseFloat(r.pbv_required) &&
          matchingBV >= parseFloat(r.matching_bv_required) &&
          (user?.direct_count || 0) >= r.directs_required,
        bonus_paid: bonusTxs?.some((t) => t.description?.includes(r.name)),
      }))

      return res.json({ ranks: ranksWithStatus, userRankOrder: user?.ranks?.sort_order || 0 })
    } catch (err) {
      console.error('getRankBonus error:', err)
      return res.status(500).json({ error: 'Server error' })
    }
  },

  async getRetailProfit(req, res) {
    try {
      const { data: txs } = await supabase
        .from('wallet_transactions')
        .select('*')
        .eq('user_id', req.user.userId)
        .eq('category', 'RETAIL_PROFIT')
        .order('created_at', { ascending: false })

      const total = (txs || []).reduce((s, t) => s + parseFloat(t.amount || 0), 0)
      return res.json({ totalAmount: Math.round(total * 100) / 100, profits: txs || [] })
    } catch (err) {
      console.error('getRetailProfit error:', err)
      return res.status(500).json({ error: 'Server error' })
    }
  },

  async runCommission(req, res) {
    try {
      const result = await commissionService.runWeeklyCycle()
      return res.json({ message: 'Commission cycle completed', ...result })
    } catch (err) {
      return res.status(400).json({ error: err.message })
    }
  },
}
