import cron from 'node-cron'
import { supabase } from '../lib/supabase.js'
import { progressionEngine } from '../services/progressionEngine.service.js'

export function startGamificationJob() {
  cron.schedule('*/15 * * * *', async () => {
    try {
      const { data: boards } = await supabase
        .from('game_leaderboard_definitions')
        .select('key')
        .eq('is_active', true)

      for (const b of boards || []) {
        await progressionEngine.refreshLeaderboard(b.key)
      }

      const { organizationGamificationService } = await import(
        '../services/organizationGamification.service.js'
      )
      const { data: agencyBoards } = await supabase
        .from('agency_leaderboards')
        .select('key')
        .eq('is_active', true)
      for (const b of agencyBoards || []) {
        await organizationGamificationService.refreshLeaderboard(b.key)
      }
    } catch (e) {
      console.warn('[gamification job]', e.message)
    }
  })

  console.log('[gamification] Leaderboard refresh scheduled every 15 min')
}
