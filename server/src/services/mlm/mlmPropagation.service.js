import { randomUUID } from 'crypto'
import { supabase } from '../../lib/supabase.js'
import { roundMoney } from '../../lib/money.js'
import { bvService } from '../bv.service.js'
import { mlmEventService } from './mlmEvent.service.js'
import { mlmMetricsService } from './mlmMetrics.service.js'
import { mlmMatchingService } from './mlmMatching.service.js'
import { mlmCommissionEngine } from './mlmCommissionEngine.service.js'
import { mlmRankEngine } from './mlmRankEngine.service.js'
import { mlmFraudService } from './mlmFraud.service.js'
import { emitToUser } from '../../lib/socket.js'

export const mlmPropagationService = {
  /**
   * Entry: package purchase / upgrade — idempotent via order id.
   */
  async emitPackagePurchase({
    userId,
    user,
    pkg,
    order,
    purchaseTransactionId,
    isUpgrade = false,
  }) {
    const eventType = isUpgrade ? 'package_upgraded' : 'package_purchased'
    const { event, duplicate } = await mlmEventService.createEvent({
      eventType,
      userId,
      orderId: order.id,
      purchaseTransactionId,
      packageId: pkg.id,
      bvAmount: pkg.bv_points || 0,
      pvAmount: pkg.pv_points || pkg.bv_points || 0,
      cvAmount: pkg.bv_points || 0,
      idempotencyKey: `mlm:${eventType}:${order.id}`,
      metadata: { package_level: pkg.package_level, package_name: pkg.name },
    })

    if (duplicate && event.processing_status === 'completed') {
      return { event, skipped: true }
    }

    await mlmQueueService.enqueue('propagate_event', event.id, `job:propagate:${event.id}`)

    const sync = process.env.MLM_SYNC_PROPAGATION === 'true'
    if (sync) {
      await this.processEvent(event.id)
    }

    return { event }
  },

  async acquireLock(eventId) {
    const lockKey = `propagate:${eventId}`
    const expires = new Date(Date.now() + 120000).toISOString()
    const { error } = await supabase.from('mlm_propagation_locks').insert({
      lock_key: lockKey,
      event_id: eventId,
      expires_at: expires,
    })
    if (error?.code === '23505') return false
    if (error && !/mlm_propagation_locks|42P01/i.test(error.message)) throw error
    return true
  },

  async releaseLock(eventId) {
    await supabase.from('mlm_propagation_locks').delete().eq('lock_key', `propagate:${eventId}`)
  },

  async processEvent(eventId) {
    const locked = await this.acquireLock(eventId)
    if (!locked) return { skipped: true, reason: 'locked' }

    const event = await mlmEventService.getEvent(eventId)
    if (event.processing_status === 'completed') {
      await this.releaseLock(eventId)
      return { skipped: true }
    }

    await mlmEventService.markStatus(eventId, 'processing')
    const propagationId = randomUUID()

    try {
      const fraud = await mlmFraudService.scanEvent(event)
      if (fraud.blocked) {
        await mlmEventService.markStatus(eventId, 'failed', 'Blocked by fraud detection')
        await this.releaseLock(eventId)
        return { blocked: true, fraud }
      }

      const { data: user } = await supabase
        .from('users')
        .select('*, ranks(name)')
        .eq('id', event.user_id)
        .single()

      const { data: pkg } = event.package_id
        ? await supabase.from('packages').select('*').eq('id', event.package_id).single()
        : { data: null }

      if (
        ['package_purchased', 'package_upgraded'].includes(event.event_type) &&
        event.bv_amount > 0 &&
        event.order_id
      ) {
        await this.propagateBV(event, propagationId)
        if (pkg && user.sponsor_id) {
          await mlmCommissionEngine.processDirectBonus(event, pkg, user.sponsor_id)
        }
      }

      await mlmMetricsService.snapshotUser(event.user_id, eventId)
      if (event.agency_id) {
        await mlmMetricsService.snapshotAgency(event.agency_id, eventId)
      }

      const matching = await mlmMatchingService.computeMatching(event.user_id, eventId)
      await mlmCommissionEngine.processBinaryPreview(event, event.user_id, matching)

      await mlmRankEngine.evaluateAndSnapshot(event.user_id, eventId)

      const uplineIds = await this.getUplineUserIds(event.user_id)
      for (const uid of uplineIds.slice(0, 20)) {
        await mlmMetricsService.snapshotUser(uid, eventId)
        const uplinkMatching = await mlmMatchingService.computeMatching(uid, eventId)
        await mlmCommissionEngine.processBinaryPreview(event, uid, uplinkMatching)
      }

      try {
        const { trackOrgAction, emitOrgEvent } = await import('../../lib/organizationEvents.js')
        await emitOrgEvent(event.user_id, 'package_purchased', {
          title: `عملية MLM: ${event.event_type}`,
          payload: { bv: event.bv_amount, matched: matching.matched },
        })
        await trackOrgAction(event.user_id, 'bv_credit', { increment: Math.round(event.bv_amount) })
      } catch {
        /* optional */
      }

      emitToUser(event.user_id, 'mlm:propagation', {
        eventId,
        matching,
        status: 'completed',
      })

      if (user.sponsor_id) {
        emitToUser(user.sponsor_id, 'mlm:downline_activity', { eventId, buyerId: event.user_id })
      }

      await mlmEventService.markStatus(eventId, 'completed')
      return { ok: true, matching }
    } catch (e) {
      await mlmEventService.markStatus(eventId, 'failed', e.message)
      throw e
    } finally {
      await this.releaseLock(eventId)
    }
  },

  async propagateBV(event, propagationId) {
    const bv = roundMoney(event.bv_amount)
    if (bv <= 0) return

    await bvService.creditBV(event.user_id, bv, event.order_id)

    const { data: buyerNode } = await supabase
      .from('tree_nodes')
      .select('path')
      .eq('user_id', event.user_id)
      .maybeSingle()

    if (!buyerNode?.path) return

    const pathParts = buyerNode.path.split('/').filter(Boolean)
    let depth = 0
    for (const nodeId of pathParts) {
      const { data: ancestorNode } = await supabase
        .from('tree_nodes')
        .select('user_id, side')
        .eq('id', nodeId)
        .single()
      if (!ancestorNode) continue

      const ancestorIndex = pathParts.indexOf(nodeId)
      const nextNodeId = pathParts[ancestorIndex + 1]
      let side = 'LEFT'
      if (nextNodeId) {
        const { data: nextNode } = await supabase
          .from('tree_nodes')
          .select('side')
          .eq('id', nextNodeId)
          .single()
        side = nextNode?.side || 'LEFT'
      }

      try {
        await supabase.from('bv_propagation_logs').insert({
          event_id: event.id,
          propagation_id: propagationId,
          beneficiary_user_id: ancestorNode.user_id,
          source_user_id: event.user_id,
          side,
          bv_amount: bv,
          depth_level: depth++,
          leg_path: buyerNode.path,
        })
      } catch {
        /* table optional */
      }
    }
  },

  async getUplineUserIds(userId) {
    const { data: node } = await supabase
      .from('tree_nodes')
      .select('path')
      .eq('user_id', userId)
      .maybeSingle()
    if (!node?.path) return []

    const ids = []
    for (const nodeId of node.path.split('/').filter(Boolean)) {
      const { data: n } = await supabase.from('tree_nodes').select('user_id').eq('id', nodeId).single()
      if (n?.user_id) ids.push(n.user_id)
    }
    return ids.reverse()
  },
}

export const mlmQueueService = {
  async enqueue(jobType, eventId, idempotencyKey = null) {
    try {
      const { error } = await supabase.from('mlm_job_queue').insert({
        job_type: jobType,
        event_id: eventId,
        payload_json: { eventId },
        idempotency_key: idempotencyKey,
      })
      if (error && !/mlm_job_queue|42P01/i.test(error.message)) throw error
    } catch (e) {
      console.warn('[mlm-queue] enqueue:', e.message)
    }
  },

  async processPending(limit = 10) {
    const { data: jobs } = await supabase
      .from('mlm_job_queue')
      .select('*')
      .eq('status', 'pending')
      .lte('scheduled_at', new Date().toISOString())
      .order('scheduled_at')
      .limit(limit)

    let processed = 0
    for (const job of jobs || []) {
      await supabase
        .from('mlm_job_queue')
        .update({ status: 'processing', started_at: new Date().toISOString(), attempts: job.attempts + 1 })
        .eq('id', job.id)

      try {
        if (job.job_type === 'propagate_event' && job.event_id) {
          await mlmPropagationService.processEvent(job.event_id)
        }
        await supabase
          .from('mlm_job_queue')
          .update({ status: 'completed', completed_at: new Date().toISOString() })
          .eq('id', job.id)
        processed++
      } catch (e) {
        const failed = job.attempts + 1 >= job.max_attempts
        await supabase
          .from('mlm_job_queue')
          .update({
            status: failed ? 'failed' : 'pending',
            error_message: e.message,
            scheduled_at: new Date(Date.now() + 60000 * job.attempts).toISOString(),
          })
          .eq('id', job.id)
      }
    }
    return processed
  },
}
