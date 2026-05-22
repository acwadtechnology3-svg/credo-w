import { checkoutService } from '../../services/checkout.service.js'
import { purchaseError, PurchaseErrorCodes } from '../../lib/purchaseErrors.js'

function mapError(err, res) {
  const status = err.statusHint ?? (err.code === PurchaseErrorCodes.USER_SUSPENDED ? 403 : 400)
  return res.status(status).json({ success: false, error: err.message, code: err.code || 'ERROR' })
}

export const checkoutController = {
  async createSession(req, res) {
    try {
      const { package_id } = req.body
      if (!package_id) {
        return res.status(400).json({ success: false, error: 'package_id مطلوب' })
      }
      const result = await checkoutService.createSession(req.user.userId, package_id)
      return res.status(201).json({ success: true, ...result })
    } catch (err) {
      console.error('POST /v2/checkout/session:', err)
      return mapError(err, res)
    }
  },
}
