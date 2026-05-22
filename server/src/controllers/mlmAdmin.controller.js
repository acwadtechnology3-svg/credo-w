import { supabase } from '../lib/supabase.js'
import {
  mlmAnalyticsService,
  mlmReplayService,
  mlmReversalService,
  mlmConfigService,
  mlmQueueService,
} from '../services/mlm/index.js'
import { mlmCommissionEngine } from '../services/mlm/mlmCommissionEngine.service.js'

export const mlmAdminController = {
  async getOverview(req, res) {
    try {
      const overview = await mlmAnalyticsService.getPlatformOverview()
      res.json(overview)
    } catch (e) {
      res.status(500).json({ error: e.message })
    }
  },

  async listRules(req, res) {
    const { data } = await supabase.from('mlm_compensation_rules').select('*').order('category')
    res.json({ rules: data })
  },

  async updateRule(req, res) {
    const { rule_key, config_json, is_active, label } = req.body
    const { data, error } = await supabase
      .from('mlm_compensation_rules')
      .upsert(
        {
          rule_key,
          label: label || rule_key,
          category: req.body.category || 'binary',
          config_json: config_json || {},
          is_active: is_active !== false,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'rule_key' }
      )
      .select()
      .single()
    if (error) return res.status(500).json({ error: error.message })
    mlmConfigService.invalidate()
    res.json({ rule: data })
  },

  async listFraudFlags(req, res) {
    const { data } = await supabase
      .from('fraud_flags')
      .select('*, users(username, user_code, full_name)')
      .in('status', ['open', 'reviewing'])
      .order('risk_score', { ascending: false })
      .limit(50)
    res.json({ flags: data })
  },

  async replayEvent(req, res) {
    try {
      const result = await mlmReplayService.replayEvent(req.params.eventId, { force: true })
      res.json(result)
    } catch (e) {
      res.status(500).json({ error: e.message })
    }
  },

  async rebuildUser(req, res) {
    try {
      const metrics = await mlmReplayService.rebuildUserMetrics(req.params.userId)
      res.json({ metrics })
    } catch (e) {
      res.status(500).json({ error: e.message })
    }
  },

  async reverseOrder(req, res) {
    try {
      const result = await mlmReversalService.reversePackagePurchase({
        orderId: req.params.orderId,
        reason: req.body?.reason,
      })
      res.json(result)
    } catch (e) {
      res.status(e.status || 500).json({ error: e.message })
    }
  },

  async processQueue(req, res) {
    const n = await mlmQueueService.processPending(25)
    res.json({ processed: n })
  },

  async approvePayout(req, res) {
    try {
      const { calculationId } = req.body
      const { data: calc } = await supabase
        .from('commission_calculations')
        .select('*')
        .eq('id', calculationId)
        .single()
      if (!calc) return res.status(404).json({ error: 'Not found' })

      const amount = parseFloat(calc.capped_amount ?? calc.calculated_amount)
      const payout = await mlmCommissionEngine.createPayout(
        calculationId,
        calc.user_id,
        amount,
        { approvedBy: req.user.userId, auto: true }
      )
      res.json({ payout })
    } catch (e) {
      res.status(500).json({ error: e.message })
    }
  },
}
