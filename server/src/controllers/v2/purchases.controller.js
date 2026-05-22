import { purchaseOrchestrator } from '../../services/purchaseOrchestrator.service.js'
import { PurchaseErrorCodes } from '../../lib/purchaseErrors.js'
import { mapPurchaseRlsError } from '../../lib/dbErrors.js'

function mapError(err, res) {
  const rls = mapPurchaseRlsError(err)
  if (rls) return res.status(rls.status).json({ success: false, error: rls.error, code: rls.code })
  const code = err.code || 'PURCHASE_ERROR'
  let status = err.statusHint ?? 400
  if (code === PurchaseErrorCodes.PACKAGE_NOT_FOUND || code === 'NOT_FOUND') status = 404
  if (code === PurchaseErrorCodes.USER_SUSPENDED) status = 403
  return res.status(status).json({ success: false, error: err.message, code })
}

export const purchasesController = {
  async create(req, res) {
    try {
      const { package_id, checkout_session_id, idempotency_key, payment_method } = req.body
      const result = await purchaseOrchestrator.executePurchase({
        userId: req.user.userId,
        packageId: package_id,
        checkoutSessionId: checkout_session_id,
        idempotencyKey: idempotency_key,
        paymentMethod: payment_method || 'cmoney',
      })
      return res.status(201).json(result)
    } catch (err) {
      console.error('POST /v2/purchases:', err)
      return mapError(err, res)
    }
  },

  async getById(req, res) {
    try {
      const data = await purchaseOrchestrator.getPurchase(req.user.userId, req.params.id)
      return res.json({ success: true, ...data })
    } catch (err) {
      console.error('GET /v2/purchases/:id:', err)
      return mapError(err, res)
    }
  },
}
