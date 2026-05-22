import { Router } from 'express'
import { supabase } from '../lib/supabase.js'
import { invitationsController } from '../controllers/invitations.controller.js'
import { agencyRegistrationService } from '../services/agencyRegistration.service.js'

const router = Router()

router.get('/join/agency/:slug', async (req, res) => {
  try {
    const ctx = await agencyRegistrationService.resolveJoinContext({
      agency_slug: req.params.slug,
      ref: req.query.ref,
      side: req.query.side,
      agency_code: req.query.code,
    })
    if (!ctx.ok) return res.status(404).json({ error: ctx.error || 'Agency not found' })
    return res.json({
      agency: ctx.agency,
      sponsor: ctx.sponsor,
      placementSide: ctx.placementSide,
      joinMode: ctx.joinMode,
    })
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
})

router.get('/join/resolve', async (req, res) => {
  try {
    const ctx = await agencyRegistrationService.resolveJoinContext(req.query)
    if (!ctx.ok && ctx.error) return res.status(400).json({ error: ctx.error })
    return res.json(ctx)
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
})

router.get('/invite/:code', invitationsController.getPublic)
router.post('/invite/:code/track', invitationsController.track)

const COMMISSION_BY_PRICE = {
  5000: 400,
  10000: 1000,
  22000: 1800,
}

router.get('/packages', async (req, res) => {
  try {
    let { data, error } = await supabase
      .from('products')
      .select('id, name, description, price_egp, bv_points, direct_commission_egp')
      .eq('is_package', true)
      .eq('is_active', true)
      .order('price_egp', { ascending: true })

    if (error?.code === '42703' || /direct_commission_egp/i.test(error?.message || '')) {
      const fallback = await supabase
        .from('products')
        .select('id, name, description, price_egp, bv_points')
        .eq('is_package', true)
        .eq('is_active', true)
        .order('price_egp', { ascending: true })
      data = fallback.data
      error = fallback.error
    }

    if (error) throw error

    const rows = (data || []).map((row) => {
      const price = Number(row.price_egp)
      const commission =
        row.direct_commission_egp != null
          ? Number(row.direct_commission_egp)
          : COMMISSION_BY_PRICE[price] || 0
      return { ...row, direct_commission_egp: commission }
    })

    return res.json(rows)
  } catch (err) {
    console.error('GET /public/packages:', err)
    return res.status(500).json({ error: 'Server error' })
  }
})

router.get('/stats', async (req, res) => {
  try {
    const { count: totalUsers, error: usersErr } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active')

    if (usersErr) throw usersErr

    const { count: totalOrders, error: ordersErr } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })

    if (ordersErr) throw ordersErr

    const { data: revenueData, error: revErr } = await supabase
      .from('wallet_transactions')
      .select('amount')
      .eq('category', 'TEAM_COMMISSION')

    if (revErr) throw revErr

    const totalPaid = (revenueData || []).reduce((s, t) => s + parseFloat(t.amount), 0)

    return res.json({
      activeMarketers: totalUsers || 0,
      totalOrders: totalOrders || 0,
      totalCommissionPaid: Math.round(totalPaid),
      countries: 5,
    })
  } catch (err) {
    console.error('GET /public/stats:', err)
    return res.status(500).json({ error: 'Server error' })
  }
})

router.get('/ranks', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('ranks')
      .select('name, commission_pct, weekly_cap_egp, rank_bonus_usd, sort_order')
      .order('sort_order')

    if (error) throw error
    return res.json(data || [])
  } catch (err) {
    console.error('GET /public/ranks:', err)
    return res.status(500).json({ error: 'Server error' })
  }
})

export { router as publicRouter }
