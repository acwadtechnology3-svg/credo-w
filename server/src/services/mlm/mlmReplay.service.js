import { supabase } from '../../lib/supabase.js'
import { mlmPropagationService } from './mlmPropagation.service.js'
import { mlmEventService } from './mlmEvent.service.js'
import { mlmMetricsService } from './mlmMetrics.service.js'

export const mlmReplayService = {
  async replayEvent(eventId, { force = false } = {}) {
    const event = await mlmEventService.getEvent(eventId)
    if (!force && event.processing_status === 'completed') {
      await mlmEventService.markStatus(eventId, 'pending')
    }

    await supabase.from('mlm_propagation_locks').delete().eq('lock_key', `propagate:${eventId}`)

    return mlmPropagationService.processEvent(eventId)
  },

  async rebuildUserMetrics(userId) {
    await mlmMetricsService.snapshotUser(userId)
    const week = new Date().toISOString().slice(0, 7)
    await mlmMetricsService.snapshotUser(userId, null, week)
    return mlmMetricsService.computeUserMetrics(userId)
  },

  async replayUserEvents(userId, { limit = 50 } = {}) {
    const events = await mlmEventService.listEvents({ userId, limit })
    const results = []
    for (const ev of events.filter((e) => e.processing_status !== 'reversed').reverse()) {
      try {
        const r = await this.replayEvent(ev.id, { force: true })
        results.push({ eventId: ev.id, ok: true, r })
      } catch (e) {
        results.push({ eventId: ev.id, ok: false, error: e.message })
      }
    }
    return results
  },
}
