import { supabase } from '../../lib/supabase.js'

const cache = { at: 0, rules: null }
const CACHE_MS = 60_000

export const mlmConfigService = {
  async getRules() {
    if (cache.rules && Date.now() - cache.at < CACHE_MS) return cache.rules
    const { data } = await supabase.from('mlm_compensation_rules').select('*').eq('is_active', true)
    const map = Object.fromEntries((data || []).map((r) => [r.rule_key, r.config_json || {}]))
    cache.rules = map
    cache.at = Date.now()
    return map
  },

  async getRule(key, fallback = {}) {
    const rules = await this.getRules()
    return rules[key] || fallback
  },

  invalidate() {
    cache.at = 0
    cache.rules = null
  },
}
