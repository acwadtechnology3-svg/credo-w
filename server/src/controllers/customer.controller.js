import { supabase } from '../lib/supabase.js'
import { pearlsService } from '../services/pearls.service.js'

export const customerController = {
  async getPearlsWallet(req, res) {
    try {
      const wallet = await pearlsService.getWallet(req.user.userId)
      const { data: transactions, error } = await supabase
        .from('pearls_transactions')
        .select('*')
        .eq('user_id', req.user.userId)
        .order('created_at', { ascending: false })
        .limit(50)
      if (error) throw error
      return res.json({
        ...wallet,
        total: wallet.lifetime_earned,
        available: wallet.available_balance,
        transactions: transactions || [],
      })
    } catch (err) {
      console.error('getPearlsWallet error:', err)
      return res.status(500).json({ error: 'Server error' })
    }
  },

  async getVouchers(req, res) {
    try {
      const { status } = req.query
      let query = supabase
        .from('vouchers')
        .select('*, redeemed_user:users!vouchers_redeemed_by_fkey(username)')
        .eq('user_id', req.user.userId)
        .order('created_at', { ascending: false })

      if (status) query = query.eq('status', status)

      const { data, error } = await query
      if (error) throw error
      return res.json(data || [])
    } catch (err) {
      console.error('getVouchers error:', err)
      return res.status(500).json({ error: 'Server error' })
    }
  },

  async getCommunity(req, res) {
    try {
      const { data: directs, error } = await supabase
        .from('users')
        .select(
          'id, username, full_name, email, country, created_at, user_subscriptions(start_date, expiry_date, status, subscriptions(name))'
        )
        .eq('sponsor_id', req.user.userId)
        .order('created_at', { ascending: false })

      if (error) throw error

      const rows = []
      for (const u of directs || []) {
        const subs = u.user_subscriptions || []
        const activeSub =
          subs.find((s) => s.status === 'active') || subs[0] || null
        if (activeSub) {
          rows.push({
            signup_on: activeSub.start_date || u.created_at,
            name: u.full_name || u.username,
            email: u.email,
            country: u.country,
            membership: activeSub.subscriptions?.name,
            expiry: activeSub.expiry_date,
            referral: u.username,
          })
        }
      }

      const saverCount = rows.filter((r) => r.membership === 'Saver').length
      const superSaverCount = rows.filter((r) => r.membership === 'Super Saver').length

      return res.json({
        saverCount,
        superSaverCount,
        total: rows.length,
        community: rows,
      })
    } catch (err) {
      console.error('getCommunity error:', err)
      return res.status(500).json({ error: 'Server error' })
    }
  },

  async getMembership(req, res) {
    try {
      const { data: subscription } = await supabase
        .from('user_subscriptions')
        .select('*, subscriptions(name, description, price_egp, duration_days)')
        .eq('user_id', req.user.userId)
        .eq('status', 'active')
        .order('start_date', { ascending: false })
        .limit(1)
        .maybeSingle()

      const { data: user } = await supabase
        .from('users')
        .select('full_name, email, phone, country, currency')
        .eq('id', req.user.userId)
        .single()

      return res.json({
        subscription: subscription || null,
        user,
      })
    } catch (err) {
      console.error('getMembership error:', err)
      return res.status(500).json({ error: 'Server error' })
    }
  },

  async getAvailableSubscriptions(req, res) {
    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('is_active', true)
      if (error) throw error
      return res.json(data || [])
    } catch (err) {
      console.error('getAvailableSubscriptions error:', err)
      return res.status(500).json({ error: 'Server error' })
    }
  },

  async subscribe(req, res) {
    try {
      const { subscription_id } = req.body
      if (!subscription_id) {
        return res.status(400).json({ error: 'subscription_id required' })
      }

      const { data: sub } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('id', subscription_id)
        .single()
      if (!sub) return res.status(404).json({ error: 'Subscription not found' })

      const startDate = new Date()
      const expiryDate = new Date()
      expiryDate.setDate(expiryDate.getDate() + sub.duration_days)

      const { data, error } = await supabase
        .from('user_subscriptions')
        .insert({
          user_id: req.user.userId,
          subscription_id,
          start_date: startDate.toISOString().split('T')[0],
          expiry_date: expiryDate.toISOString().split('T')[0],
          status: 'active',
        })
        .select()
        .single()

      if (error) throw error
      return res.status(201).json({ message: 'Subscribed', subscription: data })
    } catch (err) {
      console.error('subscribe error:', err)
      return res.status(500).json({ error: 'Server error' })
    }
  },
}
