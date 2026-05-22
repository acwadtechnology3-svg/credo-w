import { gamificationAdminService } from '../services/gamificationAdmin.service.js'

export const gamificationAdminController = {
  async overview(req, res) {
    try {
      return res.json(await gamificationAdminService.getOverview())
    } catch (err) {
      return res.status(500).json({ error: err.message })
    }
  },

  async listXpRules(req, res) {
    return res.json(await gamificationAdminService.listXpRules())
  },

  async upsertXpRule(req, res) {
    try {
      const data = await gamificationAdminService.upsertXpRule(req.body, req.user.userId)
      return res.json(data)
    } catch (err) {
      return res.status(400).json({ error: err.message })
    }
  },

  async listMissions(req, res) {
    return res.json(await gamificationAdminService.listMissions())
  },

  async upsertMission(req, res) {
    try {
      return res.json(await gamificationAdminService.upsertMission(req.body, req.user.userId))
    } catch (err) {
      return res.status(400).json({ error: err.message })
    }
  },

  async listAchievements(req, res) {
    return res.json(await gamificationAdminService.listAchievements())
  },

  async upsertAchievement(req, res) {
    try {
      return res.json(
        await gamificationAdminService.upsertAchievement(req.body, req.user.userId)
      )
    } catch (err) {
      return res.status(400).json({ error: err.message })
    }
  },

  async listSeasons(req, res) {
    return res.json(await gamificationAdminService.listSeasons())
  },

  async upsertSeason(req, res) {
    try {
      return res.json(await gamificationAdminService.upsertSeason(req.body, req.user.userId))
    } catch (err) {
      return res.status(400).json({ error: err.message })
    }
  },

  async listEvents(req, res) {
    return res.json(await gamificationAdminService.listEvents())
  },

  async upsertEvent(req, res) {
    try {
      return res.json(await gamificationAdminService.upsertLimitedEvent(req.body, req.user.userId))
    } catch (err) {
      return res.status(400).json({ error: err.message })
    }
  },

  async updateConfig(req, res) {
    try {
      return res.json(await gamificationAdminService.updateConfig(req.body, req.user.userId))
    } catch (err) {
      return res.status(400).json({ error: err.message })
    }
  },

  async rollbackXp(req, res) {
    try {
      const { user_id, ledger_id, reason } = req.body
      return res.json(
        await gamificationAdminService.rollbackXp(user_id, ledger_id, req.user.userId, reason)
      )
    } catch (err) {
      return res.status(400).json({ error: err.message })
    }
  },
}
