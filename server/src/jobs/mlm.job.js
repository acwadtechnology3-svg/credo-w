import cron from 'node-cron'
import { mlmQueueService } from '../services/mlm/mlmPropagation.service.js'

export function startMlmJob() {
  cron.schedule('*/2 * * * *', async () => {
    try {
      const n = await mlmQueueService.processPending(15)
      if (n > 0) console.log(`[mlm] Processed ${n} propagation jobs`)
    } catch (e) {
      console.warn('[mlm job]', e.message)
    }
  })

  console.log('[mlm] Propagation queue processor every 2 min')
}
