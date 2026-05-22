import { gamificationService } from '../services/gamification.service.js'
import { progressionEngine } from '../services/progressionEngine.service.js'

export const gamificationController = {
  async getHub(req, res) {
    try {
      const hub = await gamificationService.getHub(req.user.userId)
      return res.json(hub)
    } catch (err) {
      console.error('gamification hub:', err)
      return res.status(500).json({ error: err.message || 'Server error' })
    }
  },

  async getLeaderboards(req, res) {
    try {
      const list = await gamificationService.listLeaderboards()
      return res.json(list)
    } catch (err) {
      return res.status(500).json({ error: 'Server error' })
    }
  },

  async getLeaderboard(req, res) {
    try {
      const { key } = req.params
      const periodKey = req.query.period || 'all'
      const entries = await gamificationService.getLeaderboard(key, periodKey)
      return res.json({ key, period_key: periodKey, entries })
    } catch (err) {
      return res.status(500).json({ error: 'Server error' })
    }
  },

  async compare(req, res) {
    try {
      const { userId } = req.params
      const data = await gamificationService.compareUsers(req.user.userId, userId)
      return res.json(data)
    } catch (err) {
      return res.status(400).json({ error: err.message })
    }
  },

  async equipCosmetic(req, res) {
    try {
      const { cosmetic_key } = req.body
      const result = await gamificationService.equipCosmetic(req.user.userId, cosmetic_key)
      return res.json(result)
    } catch (err) {
      return res.status(400).json({ error: err.message })
    }
  },

  async equipTitle(req, res) {
    try {
      const { title_key } = req.body
      const result = await gamificationService.equipTitle(req.user.userId, title_key)
      return res.json(result)
    } catch (err) {
      return res.status(400).json({ error: err.message })
    }
  },

  async purchaseCosmetic(req, res) {
    try {
      const { cosmetic_key } = req.body
      const def = await gamificationService.purchaseCosmetic(req.user.userId, cosmetic_key)
      return res.json({ cosmetic: def })
    } catch (err) {
      return res.status(400).json({ error: err.message })
    }
  },

  async triggerAction(req, res) {
    try {
      const { action } = req.body
      const userId = req.user.userId
      const allowed = [
        'referral_share',
        'shop_visit',
        'onboarding_complete',
        'lesson_complete',
      ]
      if (!allowed.includes(action)) {
        return res.status(400).json({ error: 'Invalid action' })
      }
      const completed = await progressionEngine.triggerMission(userId, action)
      return res.json({ completed })
    } catch (err) {
      return res.status(500).json({ error: 'Server error' })
    }
  },

  async getCosmeticsCatalog(req, res) {
    try {
      const { supabase } = await import('../lib/supabase.js')
      const { data } = await supabase
        .from('game_cosmetic_definitions')
        .select('*')
        .eq('is_active', true)
        .order('sort_order')
      return res.json(data || [])
    } catch (err) {
      return res.status(500).json({ error: 'Server error' })
    }
  },
}
