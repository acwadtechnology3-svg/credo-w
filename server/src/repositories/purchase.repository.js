import { supabase } from '../lib/supabase.js'
import { assertTransition, normalizePurchaseStatus } from '../lib/purchaseStateMachine.js'
import { IN_FLIGHT_STATUSES, PURCHASE_STATUS } from '../lib/packageRules.js'

export const purchaseRepository = {
  async findByIdempotencyKey(idempotencyKey) {
    const { data } = await supabase
      .from('purchase_transactions')
      .select('*')
      .eq('idempotency_key', idempotencyKey)
      .maybeSingle()
    return data
  },

  async findById(id, userId = null) {
    let q = supabase.from('purchase_transactions').select('*').eq('id', id)
    if (userId) q = q.eq('user_id', userId)
    const { data, error } = await q.maybeSingle()
    if (error) throw error
    return data
  },

  async findInFlightForUser(userId, sinceIso) {
    const statuses = [...IN_FLIGHT_STATUSES, 'pending', 'processing']
    const { data } = await supabase
      .from('purchase_transactions')
      .select('id, status, idempotency_key, created_at')
      .eq('user_id', userId)
      .in('status', statuses)
      .gte('created_at', sinceIso)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    return data
  },

  async create(row) {
    const { data, error } = await supabase
      .from('purchase_transactions')
      .insert(row)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async update(id, patch) {
    const { data, error } = await supabase
      .from('purchase_transactions')
      .update(patch)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async transition(purchaseId, fromStatus, toStatus, metadata = {}) {
    const from = normalizePurchaseStatus(fromStatus)
    const to = normalizePurchaseStatus(toStatus)
    assertTransition(from, to)

    const patch = { status: to }
    if (to === PURCHASE_STATUS.COMPLETED || to === PURCHASE_STATUS.FAILED || to === PURCHASE_STATUS.REVERSED) {
      patch.completed_at = new Date().toISOString()
    }

    const { data: current } = await supabase
      .from('purchase_transactions')
      .select('status')
      .eq('id', purchaseId)
      .single()

    if (current && normalizePurchaseStatus(current.status) !== from) {
      const err = new Error(`Purchase status drift: expected ${from}, got ${current.status}`)
      err.code = 'STATUS_DRIFT'
      throw err
    }

    await supabase.from('purchase_transition_log').insert({
      purchase_transaction_id: purchaseId,
      from_status: from,
      to_status: to,
      metadata_json: metadata,
    })

    return this.update(purchaseId, patch)
  },

  async findStuckProcessing(olderThanIso, limit = 50) {
    const { data } = await supabase
      .from('purchase_transactions')
      .select('id, user_id, status, amount_total, amount, created_at')
      .in('status', [
        PURCHASE_STATUS.PROCESSING,
        PURCHASE_STATUS.PAYMENT_CONFIRMED,
        PURCHASE_STATUS.COMPENSATING,
        'processing',
      ])
      .lt('created_at', olderThanIso)
      .limit(limit)
    return data || []
  },
}
