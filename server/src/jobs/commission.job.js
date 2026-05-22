import cron from 'node-cron'
import { commissionService } from '../services/commission.service.js'
import { pearlsService } from '../services/pearls.service.js'

export const startCommissionJob = () => {
  cron.schedule('5 0 * * *', async () => {
    console.log('Running Pearl expiry job...')
    try {
      const result = await pearlsService.runExpiryJob()
      console.log(`Pearl expiry: ${result.processed} users processed`)
    } catch (err) {
      console.error('Pearl expiry job failed:', err.message)
    }
  })
  console.log('Pearl expiry cron scheduled (daily 00:05)')

  cron.schedule('0 0 * * 0', async () => {
    console.log('Running weekly commission cycle...')
    try {
      const result = await commissionService.runWeeklyCycle()
      console.log(
        `Commission done: ${result.usersProcessed} users, EGP ${result.totalPaid} paid`
      )
    } catch (err) {
      console.error('Commission job failed:', err.message)
    }
  })
  console.log('Commission cron job scheduled (every Sunday midnight)')
}
