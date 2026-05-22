import { mlmAnalyticsService } from '../services/mlm/mlmAnalytics.service.js'
import { mlmEventService } from '../services/mlm/mlmEvent.service.js'
import { mlmMatchingService } from '../services/mlm/mlmMatching.service.js'
import { mlmMetricsService } from '../services/mlm/mlmMetrics.service.js'

export const mlmController = {
  async getDashboard(req, res) {
    try {
      const data = await mlmAnalyticsService.getUserDashboard(req.user.userId)
      res.json(data)
    } catch (e) {
      res.status(500).json({ error: e.message })
    }
  },

  async getMetrics(req, res) {
    try {
      const metrics = await mlmMetricsService.computeUserMetrics(req.user.userId)
      res.json({ metrics })
    } catch (e) {
      res.status(500).json({ error: e.message })
    }
  },

  async getMatching(req, res) {
    try {
      const matching = await mlmMatchingService.computeMatching(req.user.userId)
      res.json({ matching })
    } catch (e) {
      res.status(500).json({ error: e.message })
    }
  },

  async getEvents(req, res) {
    try {
      const events = await mlmEventService.listEvents({ userId: req.user.userId, limit: 30 })
      res.json({ events })
    } catch (e) {
      res.status(500).json({ error: e.message })
    }
  },
}
