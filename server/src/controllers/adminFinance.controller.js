import { paymentReviewService } from '../services/paymentReview.service.js'
import { financeAnalyticsService } from '../services/financeAnalytics.service.js'
import { refundEngine } from '../services/refundEngine.service.js'
import { walletLedgerService } from '../services/walletLedger.service.js'
import { supabase } from '../lib/supabase.js'

export const adminFinanceController = {
  async dashboard(req, res) {
    try {
      const overview = await financeAnalyticsService.getDashboard()
      const topSpenders = await financeAnalyticsService.getTopSpenders(10)
      return res.json({ success: true, overview, topSpenders })
    } catch (e) {
      return res.status(500).json({ error: e.message })
    }
  },

  async listPaymentReviews(req, res) {
    try {
      const queue = await paymentReviewService.listQueue({
        status: req.query.status || 'pending',
        limit: parseInt(req.query.limit, 10) || 50,
      })
      return res.json({ success: true, data: queue })
    } catch (e) {
      return res.status(500).json({ error: e.message })
    }
  },

  async approvePayment(req, res) {
    try {
      const result = await paymentReviewService.approve(req.params.id, req.user.userId, {
        note: req.body.note,
        idempotencyKey: req.body.idempotency_key,
      })
      return res.json({ success: true, ...result })
    } catch (e) {
      return res.status(e.status || 400).json({ error: e.message })
    }
  },

  async rejectPayment(req, res) {
    try {
      const result = await paymentReviewService.reject(req.params.id, req.user.userId, {
        note: req.body.note,
      })
      return res.json({ success: true, ...result })
    } catch (e) {
      return res.status(e.status || 400).json({ error: e.message })
    }
  },

  async listLedger(req, res) {
    try {
      let q = supabase
        .from('wallet_ledger_entries')
        .select('*, users(username, full_name)')
        .order('created_at', { ascending: false })
        .limit(Math.min(parseInt(req.query.limit, 10) || 100, 200))

      if (req.query.user_id) q = q.eq('user_id', req.query.user_id)

      const { data, error } = await q
      if (error) return res.status(500).json({ error: error.message })
      return res.json({ success: true, data: data || [] })
    } catch (e) {
      return res.status(500).json({ error: e.message })
    }
  },

  async listPaymentSessions(req, res) {
    try {
      let q = supabase
        .from('payment_sessions')
        .select('*, users(username, full_name)')
        .order('created_at', { ascending: false })
        .limit(100)

      if (req.query.status) q = q.eq('status', req.query.status)

      const { data, error } = await q
      if (error) return res.status(500).json({ error: error.message })
      return res.json({ success: true, data: data || [] })
    } catch (e) {
      return res.status(500).json({ error: e.message })
    }
  },

  async processRefund(req, res) {
    try {
      const refund = await refundEngine.processRefund(req.params.id, req.user.userId)
      return res.json({ success: true, refund })
    } catch (e) {
      return res.status(e.status || 400).json({ error: e.message })
    }
  },

  async createRefund(req, res) {
    try {
      const refund = await refundEngine.createRefund({
        userId: req.body.user_id,
        paymentSessionId: req.body.payment_session_id,
        purchaseTransactionId: req.body.purchase_transaction_id,
        amount: req.body.amount,
        refundType: req.body.refund_type,
        reason: req.body.reason,
        processedBy: req.user.userId,
      })
      return res.status(201).json({ success: true, refund })
    } catch (e) {
      return res.status(400).json({ error: e.message })
    }
  },

  async grantWallet(req, res) {
    try {
      const { user_id, wallet_type, amount, reason } = req.body
      const { walletTransferService } = await import('../services/walletTransfer.service.js')
      await walletTransferService.adminGrant({
        userId: user_id,
        walletType: wallet_type,
        amount,
        reason,
        adminId: req.user.userId,
      })
      return res.json({ success: true })
    } catch (e) {
      return res.status(400).json({ error: e.message })
    }
  },

  async listFraudSignals(req, res) {
    try {
      let q = supabase
        .from('fraud_signals')
        .select('*, users(username, full_name)')
        .eq('resolved', false)
        .order('created_at', { ascending: false })
        .limit(100)
      if (req.query.user_id) q = q.eq('user_id', req.query.user_id)
      const { data, error } = await q
      if (error) throw error
      return res.json({ success: true, data: data || [] })
    } catch (e) {
      return res.status(500).json({ error: e.message })
    }
  },

  async requestMoreProof(req, res) {
    try {
      const result = await paymentReviewService.requestMoreProof(req.params.id, req.user.userId, {
        note: req.body.note,
      })
      return res.json({ success: true, ...result })
    } catch (e) {
      return res.status(e.status || 400).json({ error: e.message })
    }
  },
}
