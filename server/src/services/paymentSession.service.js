import { supabase } from '../lib/supabase.js'
import { roundMoney } from '../lib/money.js'
import {
  PAYMENT_STATUS,
  assertPaymentTransition,
} from '../lib/paymentStateMachine.js'
import { hybridPaymentService } from './hybridPayment.service.js'
import { walletLedgerService } from './walletLedger.service.js'
import { checkoutService } from './checkout.service.js'
import { fraudDetectionService } from './fraudDetection.service.js'
import { purchaseOrchestrator } from './purchaseOrchestrator.service.js'
import { walletService } from './wallet.service.js'

const SESSION_TTL_MS = 30 * 60 * 1000

export const paymentSessionService = {
  async transition(sessionId, toStatus, { actorId = null, reason = null } = {}) {
    const { data: session } = await supabase
      .from('payment_sessions')
      .select('*')
      .eq('id', sessionId)
      .single()

    if (!session) {
      const err = new Error('Payment session not found')
      err.status = 404
      throw err
    }

    assertPaymentTransition(session.status, toStatus)

    const { data: updated, error } = await supabase
      .from('payment_sessions')
      .update({
        status: toStatus,
        updated_at: new Date().toISOString(),
        failure_reason: reason || session.failure_reason,
        completed_at: toStatus === PAYMENT_STATUS.COMPLETED ? new Date().toISOString() : session.completed_at,
      })
      .eq('id', sessionId)
      .select()
      .single()

    if (error) throw error

    await supabase.from('payment_session_transitions').insert({
      payment_session_id: sessionId,
      from_status: session.status,
      to_status: toStatus,
      actor_id: actorId,
      reason,
    })

    return updated
  },

  async createSession(userId, { checkoutSessionId, allocations, paymentMethodId, idempotencyKey }) {
    if (idempotencyKey) {
      const { data: existing } = await supabase
        .from('payment_sessions')
        .select('*')
        .eq('idempotency_key', idempotencyKey)
        .maybeSingle()
      if (existing) return existing
    }

    const checkout = await checkoutService.getSession(userId, checkoutSessionId)
    const total = roundMoney(checkout.session.amount_locked)

    const split = await hybridPaymentService.calculateSplit(userId, total, allocations)

    const walletAmount = split.walletAmount
    const externalAmount = split.externalAmount

    let methodId = paymentMethodId
    if (!methodId && externalAmount > 0) {
      const methods = await hybridPaymentService.getActivePaymentMethods()
      const ext = methods.find((m) => m.method_type !== 'internal_wallet')
      methodId = ext?.id
    }
    if (!methodId && walletAmount > 0) {
      const methods = await hybridPaymentService.getActivePaymentMethods()
      methodId = methods.find((m) => m.code === 'cmoney')?.id
    }

    const expiresAt = new Date(Date.now() + SESSION_TTL_MS).toISOString()

    const { data: session, error } = await supabase
      .from('payment_sessions')
      .insert({
        user_id: userId,
        checkout_session_id: checkoutSessionId,
        package_id: checkout.session.package_id,
        payment_method_id: methodId,
        status: PAYMENT_STATUS.INITIATED,
        total_amount: total,
        wallet_amount: walletAmount,
        external_amount: externalAmount,
        allocations_json: split.allocations,
        idempotency_key: idempotencyKey,
        expires_at: expiresAt,
      })
      .select()
      .single()

    if (error) throw error

    await supabase.from('finance_analytics_events').insert({
      event_type: 'payment_session_created',
      user_id: userId,
      amount: total,
      payload_json: { session_id: session.id, wallet_amount: walletAmount, external_amount: externalAmount },
    })

    return { session, split, checkout }
  },

  async reserveWallets(sessionId, userId) {
    const { data: session } = await supabase
      .from('payment_sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('user_id', userId)
      .single()

    if (!session) throw Object.assign(new Error('Not found'), { status: 404 })
    if (new Date(session.expires_at) < new Date()) {
      await this.transition(sessionId, PAYMENT_STATUS.EXPIRED, { reason: 'session_expired' })
      throw Object.assign(new Error('انتهت جلسة الدفع'), { status: 410 })
    }

    if (
      session.status === PAYMENT_STATUS.WALLET_RESERVED ||
      session.status === PAYMENT_STATUS.EXTERNAL_PENDING ||
      session.status === PAYMENT_STATUS.UNDER_REVIEW
    ) {
      return session
    }

    const allocations = session.allocations_json || []
    for (const a of allocations) {
      await walletLedgerService.createHold({
        userId,
        walletType: a.wallet_type,
        amount: a.amount,
        paymentSessionId: sessionId,
        expiresAt: session.expires_at,
      })
    }

    await this.transition(sessionId, PAYMENT_STATUS.WALLET_RESERVED, {})
    if (parseFloat(session.external_amount) > 0) {
      return this.transition(sessionId, PAYMENT_STATUS.EXTERNAL_PENDING, {})
    }
    return this.getOwnedSession(sessionId, userId)
  },

  async submitProof(sessionId, userId, proofPayload) {
    const session = await this.getOwnedSession(sessionId, userId)

    if (![PAYMENT_STATUS.EXTERNAL_PENDING, PAYMENT_STATUS.WALLET_RESERVED].includes(session.status)) {
      throw Object.assign(new Error('لا يمكن رفع إثبات في هذه الحالة'), { status: 400 })
    }

    const dupCheck = await fraudDetectionService.checkDuplicateProof(proofPayload.file_hash, userId)
    const assessment = await fraudDetectionService.assessPaymentSession(session, dupCheck)

    const { data: proof, error } = await supabase
      .from('payment_proofs')
      .insert({
        payment_session_id: sessionId,
        user_id: userId,
        proof_type: proofPayload.proof_type || 'screenshot',
        storage_path: proofPayload.storage_path,
        file_hash: proofPayload.file_hash,
        external_reference: proofPayload.external_reference,
        amount_claimed: proofPayload.amount_claimed || session.external_amount,
        is_duplicate: dupCheck.duplicate,
      })
      .select()
      .single()

    if (error) throw error

    if (dupCheck.duplicate) {
      await fraudDetectionService.recordSignal({
        userId,
        paymentSessionId: sessionId,
        signalType: 'duplicate_receipt',
        severity: 'high',
        scoreDelta: 40,
      })
    }

    await supabase.from('payment_reviews').upsert(
      {
        payment_session_id: sessionId,
        status: assessment.review_status,
        risk_score: assessment.risk_score,
        fraud_flags: assessment.fraud_flags,
      },
      { onConflict: 'payment_session_id' }
    )

    await this.transition(sessionId, PAYMENT_STATUS.UNDER_REVIEW, { reason: 'proof_submitted' })

    await supabase.from('notifications').insert({
      user_id: userId,
      type: 'PAYMENT_UNDER_REVIEW',
      title: 'دفعتك قيد المراجعة',
      body: 'سيتم إشعارك عند الموافقة على إثبات الدفع',
    })

    return { proof, assessment }
  },

  async completeWalletOnly(sessionId, userId, { idempotencyKey }) {
    const session = await this.getOwnedSession(sessionId, userId)

    if (session.external_amount > 0) {
      throw Object.assign(new Error('يتطلب دفع خارجي أو إثبات'), { status: 400 })
    }

    await this.reserveWallets(sessionId, userId)

    for (const a of session.allocations_json || []) {
      await walletService.debit(
        userId,
        a.wallet_type,
        a.amount,
        'PACKAGE_PURCHASE',
        `Payment session ${sessionId}`,
        sessionId,
        { idempotencyKey: `${idempotencyKey}-${a.wallet_type}` }
      )
    }

    await walletLedgerService.consumeHolds(sessionId)

    const purchase = await purchaseOrchestrator.executePurchase({
      userId,
      packageId: session.package_id,
      checkoutSessionId: session.checkout_session_id,
      idempotencyKey,
      paymentMethod: 'hybrid_wallet',
    })

    await supabase
      .from('payment_sessions')
      .update({ purchase_transaction_id: purchase.purchase?.id })
      .eq('id', sessionId)

    await this.transition(sessionId, PAYMENT_STATUS.COMPLETED, { reason: 'wallet_only' })

    return purchase
  },

  async getOwnedSession(sessionId, userId) {
    const { data, error } = await supabase
      .from('payment_sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('user_id', userId)
      .single()

    if (error || !data) throw Object.assign(new Error('Not found'), { status: 404 })
    return data
  },

  async getSession(sessionId, userId) {
    const session = await this.getOwnedSession(sessionId, userId)

    const [{ data: proofs }, { data: review }, { data: transitions }] = await Promise.all([
      supabase.from('payment_proofs').select('*').eq('payment_session_id', sessionId),
      supabase.from('payment_reviews').select('*').eq('payment_session_id', sessionId).maybeSingle(),
      supabase
        .from('payment_session_transitions')
        .select('*')
        .eq('payment_session_id', sessionId)
        .order('created_at'),
    ])

    return { session, proofs: proofs || [], review, transitions: transitions || [] }
  },
}
