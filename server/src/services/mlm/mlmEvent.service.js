import { supabase } from '../../lib/supabase.js'

export const MLM_EVENT_TYPES = new Set([
  'package_purchased',
  'package_upgraded',
  'package_reversed',
  'refund_issued',
  'sponsor_joined',
  'placement_activated',
  'member_activated',
  'rank_achieved',
  'payout_generated',
  'matching_completed',
  'tree_propagation',
])

export const mlmEventService = {
  async createEvent(payload) {
    const {
      eventType,
      userId,
      agencyId = null,
      sponsorUserId = null,
      placementParentId = null,
      packageId = null,
      orderId = null,
      purchaseTransactionId = null,
      bvAmount = 0,
      cvAmount = 0,
      pvAmount = 0,
      idempotencyKey = null,
      metadata = {},
    } = payload

    if (!MLM_EVENT_TYPES.has(eventType)) {
      throw new Error(`Unknown MLM event type: ${eventType}`)
    }

    if (idempotencyKey) {
      const { data: existing } = await supabase
        .from('mlm_events')
        .select('id, processing_status')
        .eq('idempotency_key', idempotencyKey)
        .maybeSingle()
      if (existing) return { event: existing, duplicate: true }
    }

    const { data: user } = await supabase
      .from('users')
      .select('sponsor_id, agency_id')
      .eq('id', userId)
      .single()

    const { data: event, error } = await supabase
      .from('mlm_events')
      .insert({
        event_type: eventType,
        user_id: userId,
        agency_id: agencyId || user?.agency_id,
        sponsor_user_id: sponsorUserId || user?.sponsor_id,
        placement_parent_id: placementParentId,
        package_id: packageId,
        order_id: orderId,
        purchase_transaction_id: purchaseTransactionId,
        bv_amount: bvAmount,
        cv_amount: cvAmount,
        pv_amount: pvAmount,
        idempotency_key: idempotencyKey,
        metadata,
        processing_status: 'pending',
      })
      .select()
      .single()

    if (error) throw error
    return { event, duplicate: false }
  },

  async markStatus(eventId, status, errorMessage = null) {
    await supabase
      .from('mlm_events')
      .update({
        processing_status: status,
        processed_at: ['completed', 'failed', 'reversed'].includes(status)
          ? new Date().toISOString()
          : null,
        error_message: errorMessage,
      })
      .eq('id', eventId)
  },

  async getEvent(eventId) {
    const { data, error } = await supabase.from('mlm_events').select('*').eq('id', eventId).single()
    if (error) throw error
    return data
  },

  async listEvents({ userId, limit = 50, status = null }) {
    let q = supabase.from('mlm_events').select('*').order('created_at', { ascending: false }).limit(limit)
    if (userId) q = q.eq('user_id', userId)
    if (status) q = q.eq('processing_status', status)
    const { data, error } = await q
    if (error) throw error
    return data || []
  },
}
