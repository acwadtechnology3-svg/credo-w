import { progressionV8Service } from '../services/progressionV8.service.js'
import { rankProgressionEngine } from '../services/rankProgressionEngine.service.js'
import { bonusEngine } from '../services/bonusEngine.service.js'

export const progressionController = {
  async getCareerHub(req, res) {
    try {
      const hub = await progressionV8Service.getFullHub(req.user.userId)
      await progressionV8Service.evaluateAchievements(req.user.userId)
      return res.json(hub)
    } catch (err) {
      console.error('career hub:', err)
      return res.status(500).json({ error: err.message || 'Server error' })
    }
  },

  async getCareerPath(req, res) {
    try {
      const path = await rankProgressionEngine.getCareerPath(req.user.userId)
      return res.json(path)
    } catch (err) {
      return res.status(500).json({ error: err.message || 'Server error' })
    }
  },

  async getRankHistory(req, res) {
    try {
      const history = await rankProgressionEngine.getRankHistory(req.user.userId)
      return res.json({ history })
    } catch (err) {
      return res.status(500).json({ error: 'Server error' })
    }
  },

  async getBonusHistory(req, res) {
    try {
      const history = await bonusEngine.getUserBonusHistory(req.user.userId)
      return res.json({ history })
    } catch (err) {
      return res.status(500).json({ error: 'Server error' })
    }
  },

  async getLeaderboard(req, res) {
    try {
      const { key } = req.params
      const period = req.query.period
      const data = await progressionV8Service.getLeaderboard(key, period)
      return res.json(data)
    } catch (err) {
      return res.status(500).json({ error: 'Server error' })
    }
  },

  async getPublicPrestige(req, res) {
    try {
      const { userId } = req.params
      const data = await rankProgressionEngine.getPublicPrestige(userId)
      return res.json(data)
    } catch (err) {
      return res.status(500).json({ error: 'Server error' })
    }
  },

  async refreshMyRank(req, res) {
    try {
      const result = await rankProgressionEngine.checkAndPromote(req.user.userId)
      return res.json({ success: true, result })
    } catch (err) {
      return res.status(500).json({ error: err.message || 'Server error' })
    }
  },
}
