import { supabase } from '../lib/supabase.js'
import { PAYMENT_STATUS } from '../lib/paymentStateMachine.js'
import { paymentSessionService } from './paymentSession.service.js'
import { walletLedgerService } from './walletLedger.service.js'
import { walletService } from './wallet.service.js'
import { purchaseOrchestrator } from './purchaseOrchestrator.service.js'
import { logAdminAction } from '../lib/adminAudit.js'

export const paymentReviewService = {
  async listQueue({ status = 'pending', limit = 50 } = {}) {
    let q = supabase
      .from('payment_reviews')
      .select('*, payment_sessions(*)')
      .order('created_at', { ascending: false })
      .limit(Math.min(limit, 100))

    if (status && status !== 'all') {
      if (status === 'pending') {
        q = q.in('status', ['pending', 'needs_review', 'fraud_suspected'])
      } else {
        q = q.eq('status', status)
      }
    }

    const { data: reviews, error } = await q
    if (error) throw error

    const enriched = []
    for (const r of reviews || []) {
      const { data: proofs } = await supabase
        .from('payment_proofs')
        .select('*')
        .eq('payment_session_id', r.payment_session_id)
      let user = null
      if (r.payment_sessions?.user_id) {
        const { data: u } = await supabase
          .from('users')
          .select('id, username, full_name, status')
          .eq('id', r.payment_sessions.user_id)
          .single()
        user = u
      }
      enriched.push({ ...r, payment_proofs: proofs || [], user })
    }
    return enriched
  },

  async approve(reviewId, reviewerId, { note, idempotencyKey } = {}) {
    const { data: review } = await supabase
      .from('payment_reviews')
      .select('*, payment_sessions(*)')
      .eq('id', reviewId)
      .single()

    if (!review) throw Object.assign(new Error('Review not found'), { status: 404 })

    const session = review.payment_sessions
    if (!session) throw Object.assign(new Error('Session missing'), { status: 404 })

    const { data: user } = await supabase
      .from('users')
      .select('status')
      .eq('id', session.user_id)
      .single()

    if (user?.status === 'suspended') {
      throw Object.assign(new Error('المستخدم موقوف'), { status: 403 })
    }

    if (session.status !== PAYMENT_STATUS.UNDER_REVIEW) {
      throw Object.assign(new Error(`حالة الدفع: ${session.status}`), { status: 400 })
    }

    await paymentSessionService.transition(session.id, PAYMENT_STATUS.APPROVED, {
      actorId: reviewerId,
      reason: note,
    })

    for (const a of session.allocations_json || []) {
      await walletService.debit(
        session.user_id,
        a.wallet_type,
        a.amount,
        'PACKAGE_PURCHASE',
        `Approved payment ${session.id}`,
        session.id,
        { idempotencyKey: `${idempotencyKey || session.id}-${a.wallet_type}`, refType: 'payment_session' }
      )
    }

    await walletLedgerService.consumeHolds(session.id)

    const purchaseKey = idempotencyKey || `pay-${session.id}`
    const purchase = await purchaseOrchestrator.executePurchase({
      userId: session.user_id,
      packageId: session.package_id,
      checkoutSessionId: session.checkout_session_id,
      idempotencyKey: purchaseKey,
      paymentMethod: 'hybrid_approved',
    })

    await supabase
      .from('payment_sessions')
      .update({ purchase_transaction_id: purchase.purchase?.id })
      .eq('id', session.id)

    await paymentSessionService.transition(session.id, PAYMENT_STATUS.COMPLETED, {
      actorId: reviewerId,
    })

    await supabase
      .from('payment_reviews')
      .update({
        status: 'approved',
        reviewer_id: reviewerId,
        admin_note: note,
        reviewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', reviewId)

    await supabase.from('notifications').insert({
      user_id: session.user_id,
      type: 'PAYMENT_APPROVED',
      title: 'تمت الموافقة على دفعتك',
      body: 'تم تفعيل اشتراكك بنجاح',
    })

    await logAdminAction({
      actorId: reviewerId,
      action: 'PAYMENT_APPROVE',
      entity: 'payment_sessions',
      entityId: session.id,
      newValue: { reviewId, purchaseId: purchase.purchase?.id },
    })

    return { session, purchase }
  },

  async reject(reviewId, reviewerId, { note } = {}) {
    const { data: review } = await supabase
      .from('payment_reviews')
      .select('*, payment_sessions(*)')
      .eq('id', reviewId)
      .single()

    if (!review?.payment_sessions) throw Object.assign(new Error('Not found'), { status: 404 })

    const session = review.payment_sessions

    await walletLedgerService.releaseHolds(session.id)
    await paymentSessionService.transition(session.id, PAYMENT_STATUS.REJECTED, {
      actorId: reviewerId,
      reason: note,
    })

    await supabase
      .from('payment_reviews')
      .update({
        status: 'rejected',
        reviewer_id: reviewerId,
        admin_note: note,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', reviewId)

    await supabase.from('notifications').insert({
      user_id: session.user_id,
      type: 'PAYMENT_REJECTED',
      title: 'تم رفض إثبات الدفع',
      body: note || 'يرجى التواصل مع الدعم',
    })

    await logAdminAction({
      actorId: reviewerId,
      action: 'PAYMENT_REJECT',
      entity: 'payment_sessions',
      entityId: session.id,
      newValue: { note },
    })

    return { session }
  },

  async requestMoreProof(reviewId, reviewerId, { note } = {}) {
    const { data: review } = await supabase
      .from('payment_reviews')
      .select('*, payment_sessions(*)')
      .eq('id', reviewId)
      .single()

    if (!review?.payment_sessions) throw Object.assign(new Error('Not found'), { status: 404 })

    await supabase
      .from('payment_reviews')
      .update({
        status: 'needs_review',
        reviewer_id: reviewerId,
        admin_note: note,
        updated_at: new Date().toISOString(),
      })
      .eq('id', reviewId)

    await supabase.from('notifications').insert({
      user_id: review.payment_sessions.user_id,
      type: 'PAYMENT_NEEDS_INFO',
      title: 'مطلوب إثبات إضافي',
      body: note || 'يرجى رفع صورة أوضح لإثبات الدفع',
    })

    return { review }
  },
}
