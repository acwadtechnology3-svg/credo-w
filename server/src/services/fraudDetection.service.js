import crypto from 'crypto'
import { supabase } from '../lib/supabase.js'

export const fraudDetectionService = {
  hashBuffer(buffer) {
    return crypto.createHash('sha256').update(buffer).digest('hex')
  },

  async checkDuplicateProof(fileHash, userId) {
    if (!fileHash) return { duplicate: false, score: 0 }

    const { data } = await supabase
      .from('payment_proofs')
      .select('id, user_id, payment_session_id')
      .eq('file_hash', fileHash)
      .limit(5)

    const others = (data || []).filter((p) => p.user_id !== userId)
    if (others.length) {
      return {
        duplicate: true,
        score: 40,
        flags: ['duplicate_receipt_hash'],
        matches: others,
      }
    }
    return { duplicate: false, score: 0, flags: [] }
  },

  async checkVelocity(userId) {
    const since = new Date(Date.now() - 3600000).toISOString()
    const flags = []
    let score = 0

    const { count: sessionCount } = await supabase
      .from('payment_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', since)

    if ((sessionCount || 0) >= 5) {
      flags.push('rapid_payment_sessions')
      score += 25
    }

    const { count: proofCount } = await supabase
      .from('payment_proofs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', since)

    if ((proofCount || 0) >= 8) {
      flags.push('rapid_proof_uploads')
      score += 20
    }

    return { score, flags }
  },

  async recordSignal({ userId, paymentSessionId, signalType, severity = 'medium', scoreDelta = 10, payload = {} }) {
    await supabase.from('fraud_signals').insert({
      user_id: userId,
      payment_session_id: paymentSessionId,
      signal_type: signalType,
      severity,
      score_delta: scoreDelta,
      payload_json: payload,
    })
  },

  async assessPaymentSession(session, proofMeta = {}) {
    let score = 0
    const flags = []

    const velocity = await this.checkVelocity(session.user_id)
    score += velocity.score
    flags.push(...velocity.flags)

    if (proofMeta.duplicate) {
      score += 40
      flags.push('duplicate_receipt')
    }

    if (session.external_amount > session.total_amount) {
      score += 50
      flags.push('amount_mismatch')
    }

    const riskLevel = score >= 50 ? 'high' : score >= 25 ? 'medium' : 'low'
    const reviewStatus = score >= 50 ? 'fraud_suspected' : score >= 25 ? 'needs_review' : 'pending'

    return { risk_score: score, fraud_flags: flags, risk_level: riskLevel, review_status: reviewStatus }
  },
}
