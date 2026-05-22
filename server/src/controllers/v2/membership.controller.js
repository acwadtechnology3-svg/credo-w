import { packageService } from '../../services/package.service.js'
import { supabase } from '../../lib/supabase.js'

export const membershipController = {
  async getMe(req, res) {
    try {
      const status = await packageService.getAvailablePackages(req.user.userId)

      let history = []
      const { data: historyRows, error: historyError } = await supabase
        .from('user_packages')
        .select('*, packages(name, package_level, slots, can_upgrade_to_level)')
        .eq('user_id', req.user.userId)
        .order('purchased_at', { ascending: false })
        .limit(50)

      if (!historyError) history = historyRows || []

      let recentPurchases = []
      const { data: purchases, error: purchaseError } = await supabase
        .from('purchase_transactions')
        .select(
          'id, status, amount_total, amount, previous_level, resulting_level, checkout_session_id, created_at, completed_at'
        )
        .eq('user_id', req.user.userId)
        .order('created_at', { ascending: false })
        .limit(10)

      if (!purchaseError) recentPurchases = purchases || []

      let activeCheckout = null
      const { data: checkout } = await supabase
        .from('checkout_sessions')
        .select('id, package_id, amount_locked, expires_at, status')
        .eq('user_id', req.user.userId)
        .eq('status', 'active')
        .gt('expires_at', new Date().toISOString())
        .maybeSingle()

      if (checkout) activeCheckout = checkout

      return res.json({
        success: true,
        membership: status,
        history,
        recentPurchases,
        activeCheckout,
      })
    } catch (err) {
      console.error('GET /v2/membership/me:', err)
      return res.status(500).json({ success: false, error: 'Server error' })
    }
  },
}
