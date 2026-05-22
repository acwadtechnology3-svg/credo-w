import { rankProgressionEngine } from './rankProgressionEngine.service.js'

/** Legacy facade — delegates to Phase P8 rank progression engine */
export const rankService = {
  async checkAndUpdateRank(userId) {
    const result = await rankProgressionEngine.checkAndPromote(userId)
    return result?.rank ?? null
  },
}
