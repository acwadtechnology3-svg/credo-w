import { purchaseRecoveryService } from '../services/purchaseRecovery.service.js'

const INTERVAL_MS = 5 * 60 * 1000

let timer = null

/**
 * P1 maintenance: expire checkout sessions + flag stuck purchases.
 * Queue worker stub — processes purchase_job_queue when table exists.
 */
export function startPurchaseMaintenanceJob() {
  if (process.env.VERCEL || timer) return

  const tick = async () => {
    try {
      const expired = await purchaseRecoveryService.expireCheckoutSessions()
      const stuck = await purchaseRecoveryService.scanStuckPurchases()
      if (expired > 0 || stuck > 0) {
        console.log(`[purchase-maintenance] expired_sessions=${expired} stuck_flagged=${stuck}`)
      }
    } catch (err) {
      console.warn('[purchase-maintenance]', err.message)
    }
  }

  tick()
  timer = setInterval(tick, INTERVAL_MS)
  timer.unref?.()
}
