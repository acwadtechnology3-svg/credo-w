import cron from 'node-cron'
import { supabase } from '../lib/supabase.js'
import { bonusEngine } from '../services/bonusEngine.service.js'
import { progressionV8Service } from '../services/progressionV8.service.js'
import { rankProgressionEngine } from '../services/rankProgressionEngine.service.js'

export function startProgressionJob() {
  cron.schedule('0 2 * * 1', async () => {
    try {
      await bonusEngine.runPeriodicBonuses('weekly')
      console.log('[progression] Weekly binary bonuses processed')
    } catch (e) {
      console.warn('[progression] weekly bonuses:', e.message)
    }
  })

  cron.schedule('0 3 1 * *', async () => {
    try {
      await bonusEngine.runPeriodicBonuses('monthly')
      console.log('[progression] Monthly bonuses processed')
    } catch (e) {
      console.warn('[progression] monthly bonuses:', e.message)
    }
  })

  cron.schedule('*/30 * * * *', async () => {
    try {
      const { data: boards } = await supabase.from('leaderboards').select('board_key').eq('is_active', true)
      for (const b of boards || []) {
        await progressionV8Service.refreshLeaderboard(b.board_key)
      }
    } catch (e) {
      console.warn('[progression] leaderboard refresh:', e.message)
    }
  })

  cron.schedule('0 */6 * * *', async () => {
    try {
      const { data: users } = await supabase
        .from('users')
        .select('id')
        .eq('status', 'active')
        .order('last_login_at', { ascending: false })
        .limit(200)

      for (const u of users || []) {
        await rankProgressionEngine.checkAndPromote(u.id)
        await progressionV8Service.evaluateAchievements(u.id)
      }
    } catch (e) {
      console.warn('[progression] rank sweep:', e.message)
    }
  })

  console.log('[progression] P8 jobs: weekly/monthly bonuses, leaderboards, rank sweep')
}
