import { getStorageSupabase } from '../../lib/supabase.js'
import { hybridPaymentService } from '../../services/hybridPayment.service.js'
import { paymentSessionService } from '../../services/paymentSession.service.js'
import { walletLedgerService } from '../../services/walletLedger.service.js'
import { fraudDetectionService } from '../../services/fraudDetection.service.js'
import { walletTransferService } from '../../services/walletTransfer.service.js'

export const financeController = {
  async getWallets(req, res) {
    try {
      const ecosystem = await walletLedgerService.getEcosystem(req.user.userId)
      return res.json({ success: true, wallets: ecosystem })
    } catch (e) {
      return res.status(500).json({ error: e.message })
    }
  },

  async getLedger(req, res) {
    try {
      const ledger = await walletLedgerService.getLedger(req.user.userId, {
        limit: parseInt(req.query.limit, 10) || 50,
        walletType: req.query.wallet_type,
      })
      return res.json({ success: true, ledger })
    } catch (e) {
      return res.status(500).json({ error: e.message })
    }
  },

  async getPaymentMethods(req, res) {
    try {
      const methods = await hybridPaymentService.getActivePaymentMethods(req.query.region || 'EG')
      return res.json({ success: true, methods })
    } catch (e) {
      return res.status(500).json({ error: e.message })
    }
  },

  async quoteHybrid(req, res) {
    try {
      const { total_amount, allocations, checkout_session_id } = req.body
      let total = total_amount

      if (checkout_session_id) {
        const { checkoutService } = await import('../../services/checkout.service.js')
        const chk = await checkoutService.getSession(req.user.userId, checkout_session_id)
        total = chk.session.amount_locked
      }

      const split = await hybridPaymentService.calculateSplit(
        req.user.userId,
        total,
        allocations
      )
      return res.json({ success: true, ...split })
    } catch (e) {
      return res.status(e.status || 400).json({ error: e.message })
    }
  },

  async createPaymentSession(req, res) {
    try {
      const { checkout_session_id, allocations, payment_method_id, idempotency_key } = req.body
      if (!checkout_session_id) {
        return res.status(400).json({ error: 'checkout_session_id مطلوب' })
      }

      const result = await paymentSessionService.createSession(req.user.userId, {
        checkoutSessionId: checkout_session_id,
        allocations,
        paymentMethodId: payment_method_id,
        idempotencyKey: idempotency_key,
      })

      return res.status(201).json({ success: true, ...result })
    } catch (e) {
      return res.status(e.status || 400).json({ error: e.message })
    }
  },

  async getPaymentSession(req, res) {
    try {
      const data = await paymentSessionService.getSession(req.params.id, req.user.userId)
      return res.json({ success: true, ...data })
    } catch (e) {
      return res.status(e.status || 404).json({ error: e.message })
    }
  },

  async reserveWallets(req, res) {
    try {
      const session = await paymentSessionService.reserveWallets(req.params.id, req.user.userId)
      return res.json({ success: true, session })
    } catch (e) {
      return res.status(e.status || 400).json({ error: e.message })
    }
  },

  async completeWalletPayment(req, res) {
    try {
      const { idempotency_key } = req.body
      const purchase = await paymentSessionService.completeWalletOnly(
        req.params.id,
        req.user.userId,
        { idempotencyKey: idempotency_key }
      )
      return res.json({ success: true, ...purchase })
    } catch (e) {
      return res.status(e.status || 400).json({ error: e.message, code: e.code })
    }
  },

  async uploadProof(req, res) {
    try {
      const { image_base64, filename, proof_type, external_reference, amount_claimed } = req.body
      if (!image_base64) return res.status(400).json({ error: 'image_base64 مطلوب' })

      const buffer = Buffer.from(
        image_base64.replace(/^data:image\/\w+;base64,/, ''),
        'base64'
      )
      if (buffer.length > 8 * 1024 * 1024) {
        return res.status(400).json({ error: 'حجم الملف كبير جداً' })
      }

      const fileHash = fraudDetectionService.hashBuffer(buffer)
      const ext = (filename || 'proof.jpg').split('.').pop() || 'jpg'
      const path = `payment-proofs/${req.user.userId}/${req.params.id}/${Date.now()}.${ext}`

      const storage = getStorageSupabase()
      const { error: uploadErr } = await storage.storage
        .from('credo-w-media')
        .upload(path, buffer, { contentType: `image/${ext === 'png' ? 'png' : 'jpeg'}` })

      if (uploadErr) return res.status(500).json({ error: uploadErr.message })

      const result = await paymentSessionService.submitProof(req.params.id, req.user.userId, {
        proof_type: proof_type || 'screenshot',
        storage_path: path,
        file_hash: fileHash,
        external_reference,
        amount_claimed,
      })

      return res.json({ success: true, ...result })
    } catch (e) {
      return res.status(e.status || 400).json({ error: e.message })
    }
  },

  async transfer(req, res) {
    try {
      const { receiver_id, from_wallet_type, to_wallet_type, amount, note } = req.body
      if (!receiver_id || !from_wallet_type || !amount) {
        return res.status(400).json({ error: 'receiver_id, from_wallet_type, amount required' })
      }
      const row = await walletTransferService.transferBetweenUsers({
        senderId: req.user.userId,
        receiverId: receiver_id,
        fromWalletType: from_wallet_type,
        toWalletType: to_wallet_type || 'CMONEY',
        amount,
        note,
      })
      return res.json({ success: true, transfer: row })
    } catch (e) {
      return res.status(e.status || 400).json({ error: e.message, code: e.code })
    }
  },
}
