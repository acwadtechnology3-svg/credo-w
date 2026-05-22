import { supabase } from '../lib/supabase.js'
import { packageService } from '../services/package.service.js'
import { purchaseOrchestrator } from '../services/purchaseOrchestrator.service.js'
import { mapPurchaseRlsError } from '../lib/dbErrors.js'

export const packagesController = {
  async getMyPackageStatus(req, res) {
    try {
      const available = await packageService.getAvailablePackages(req.user.userId)

      let history = []
      const { data: historyRows, error: historyError } = await supabase
        .from('user_packages')
        .select('*, packages(name, package_level, slots, can_upgrade_to_level)')
        .eq('user_id', req.user.userId)
        .order('purchased_at', { ascending: false })
        .limit(50)

      if (!historyError) history = historyRows || []
      else if (!/user_packages|does not exist|42P01/i.test(historyError.message || '')) {
        console.warn('user_packages history:', historyError.message)
      }

      let recentPurchases = []
      const { data: purchases, error: purchaseError } = await supabase
        .from('purchase_transactions')
        .select('id, status, amount, previous_level, resulting_level, created_at, completed_at')
        .eq('user_id', req.user.userId)
        .order('created_at', { ascending: false })
        .limit(10)

      if (!purchaseError) recentPurchases = purchases || []
      else if (!/purchase_transactions|does not exist|42P01/i.test(purchaseError.message || '')) {
        console.warn('purchase_transactions:', purchaseError.message)
      }

      return res.json({
        ...available,
        history,
        recentPurchases,
      })
    } catch (err) {
      console.error('getMyPackageStatus:', err)
      return res.status(500).json({ error: 'Server error' })
    }
  },

  async purchasePackage(req, res) {
    try {
      const { package_id, idempotency_key, payment_method } = req.body
      const result = await purchaseOrchestrator.executeFromLegacy({
        userId: req.user.userId,
        packageId: package_id,
        idempotencyKey: idempotency_key,
        paymentMethod: payment_method || 'cmoney',
      })

      return res.status(201).json(result)
    } catch (err) {
      console.error('Package purchase error:', err)
      const rls = mapPurchaseRlsError(err)
      if (rls) return res.status(rls.status).json({ error: rls.error, code: rls.code })

      const status =
        err.code === 'INSUFFICIENT_BALANCE' ||
        err.code === 'INVALID_IDEMPOTENCY' ||
        err.code === 'PURCHASE_LOCKED' ||
        err.code === 'PURCHASE_IN_PROGRESS'
          ? 400
          : err.code === 'PACKAGE_NOT_FOUND' || err.code === 'USER_NOT_FOUND'
            ? 404
            : err.code === 'USER_SUSPENDED'
              ? 403
              : 400

      return res.status(status).json({
        error: err.message || 'Server error',
        code: err.code || 'PURCHASE_ERROR',
      })
    }
  },
}
