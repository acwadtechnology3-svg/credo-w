import { supabase } from '../lib/supabase.js'
import { MAX_MEMBERSHIP_LEVEL } from '../lib/packageRules.js'

const rulesCache = {
  upgradeRules: null,
  loadedAt: 0,
}
const CACHE_TTL_MS = 60_000

function isRuleActive(rule, now = new Date()) {
  if (!rule.is_active) return false
  if (rule.starts_at && new Date(rule.starts_at) > now) return false
  if (rule.ends_at && new Date(rule.ends_at) < now) return false
  return true
}

async function loadUpgradeRules(force = false) {
  if (!force && rulesCache.upgradeRules && Date.now() - rulesCache.loadedAt < CACHE_TTL_MS) {
    return rulesCache.upgradeRules
  }

  const { data, error } = await supabase
    .from('package_upgrade_rules')
    .select('*, packages(*)')
    .eq('is_active', true)
    .order('priority', { ascending: false })

  if (error) {
    if (/package_upgrade_rules|42P01/i.test(error.message || '')) {
      return null
    }
    throw error
  }

  rulesCache.upgradeRules = data || []
  rulesCache.loadedAt = Date.now()
  return rulesCache.upgradeRules
}

export function invalidateRulesCache() {
  rulesCache.upgradeRules = null
}

export const rulesEngine = {
  async isFeatureEnabled(flagKey, { role = null, region = 'EG' } = {}) {
    const { data } = await supabase
      .from('feature_flags')
      .select('*')
      .eq('flag_key', flagKey)
      .maybeSingle()

    if (!data) return true
    if (!data.is_enabled) return false

    const now = new Date()
    if (data.starts_at && new Date(data.starts_at) > now) return false
    if (data.ends_at && new Date(data.ends_at) < now) return false

    if (data.target_roles?.length && role && !data.target_roles.includes(role)) {
      return false
    }
    if (data.target_regions?.length && !data.target_regions.includes(region)) {
      return false
    }

    return true
  },

  /**
   * Resolve purchasable options for user from DB rules (P2) with legacy fallback.
   */
  async getMembershipOptions(userId) {
    const { data: user } = await supabase
      .from('users')
      .select('current_package_level, current_slots, membership_status, direct_count')
      .eq('id', userId)
      .single()

    const currentLevel = user?.current_package_level || 0
    const rules = await loadUpgradeRules()

    const result = {
      currentLevel,
      currentSlots: user?.current_slots || 0,
      directPackages: [],
      upgradePackage: null,
      isFull: currentLevel === MAX_MEMBERSHIP_LEVEL,
      catalogEmpty: false,
      rulesDriven: !!rules?.length,
    }

    if (!rules?.length) {
      return { ...result, rulesDriven: false }
    }

    const now = new Date()
    const activeRules = rules.filter((r) => isRuleActive(r, now))

    for (const rule of activeRules) {
      const pkg = rule.packages
      if (!pkg?.is_active || pkg.is_visible === false) continue

      if (rule.rule_type === 'direct' && rule.from_membership_level === currentLevel) {
        if (currentLevel === 0) {
          result.directPackages.push({
            ...pkg,
            rule_id: rule.id,
            package_level: rule.resulting_level,
            upgrade_message: null,
          })
        }
      }

      if (rule.rule_type === 'upgrade' && rule.from_membership_level === currentLevel) {
        if (!result.upgradePackage || rule.priority > (result.upgradePackage._priority || 0)) {
          result.upgradePackage = {
            ...pkg,
            rule_id: rule.id,
            package_level: pkg.package_level,
            can_upgrade_to_level: rule.resulting_level,
            is_upgrade_only: true,
            required_current_level: rule.from_membership_level,
            _priority: rule.priority,
            upgrade_message: `ترقي إلى المستوى ${rule.resulting_level}`,
          }
        }
      }
    }

    result.directPackages.sort((a, b) => a.package_level - b.package_level)
    result.catalogEmpty =
      !result.directPackages.length && !result.upgradePackage && !result.isFull

    return result
  },

  /**
   * Validate purchase against dynamic rules.
   */
  async validatePurchase(user, packageId, normalizedPkg) {
    const purchasesEnabled = await this.isFeatureEnabled('package_purchases')
    if (!purchasesEnabled) {
      throw new Error('شراء الباقات غير متاح حالياً')
    }

    const currentLevel = user?.current_package_level || 0

    if (currentLevel === MAX_MEMBERSHIP_LEVEL) {
      throw new Error('لديك بالفعل الباقة الكاملة — السباعي')
    }

    if (!normalizedPkg?.is_active) {
      throw new Error('Package not found')
    }

    const rules = await loadUpgradeRules()
    if (!rules?.length) {
      return null
    }

    const now = new Date()
    const match = rules.find(
      (r) =>
        isRuleActive(r, now) &&
        r.via_package_id === packageId &&
        r.from_membership_level === currentLevel
    )

    if (!match) {
      throw new Error('مسار الترقية غير مسموح — راجع قواعد الباقات في لوحة التحكم')
    }

    if (match.required_directs > 0 && (user.direct_count || 0) < match.required_directs) {
      throw new Error(`يتطلب ${match.required_directs} إحالات مباشرة`)
    }

    const price =
      match.additional_cost_override != null
        ? match.additional_cost_override
        : normalizedPkg.price_egp

    return {
      rule: match,
      resultingLevel: match.resulting_level,
      expectedPrice: price,
    }
  },

  async getTeamPolicy(ruleKey, fallback = {}) {
    const { data } = await supabase
      .from('team_policy_rules')
      .select('value_json')
      .eq('rule_key', ruleKey)
      .eq('is_active', true)
      .maybeSingle()

    return data?.value_json ?? fallback
  },

  async getWalletRule(ruleKey, walletType = null, fallback = {}) {
    let q = supabase.from('wallet_rules_config').select('value_json').eq('rule_key', ruleKey).eq('is_active', true)
    if (walletType) q = q.eq('wallet_type', walletType)
    const { data } = await q.maybeSingle()
    return data?.value_json ?? fallback
  },

  async getActivePromotionsForPackage(packageId, userId = null) {
    const now = new Date().toISOString()
    const { data: promos } = await supabase
      .from('promotions')
      .select('*')
      .eq('is_active', true)
      .lte('starts_at', now)
      .gte('ends_at', now)

    if (!promos?.length) return []

    const enabled = await this.isFeatureEnabled('promotions_engine')
    if (!enabled) return []

    return promos.filter((p) => {
      const filter = p.target_filter || {}
      if (filter.package_ids?.length && !filter.package_ids.includes(packageId)) {
        return false
      }
      return true
    })
  },

  async getRankRequirements(rankId) {
    const { data } = await supabase
      .from('rank_requirements')
      .select('*')
      .eq('rank_id', rankId)
      .eq('is_active', true)

    return Object.fromEntries((data || []).map((r) => [r.requirement_key, parseFloat(r.requirement_value)]))
  },

  async getRankRewards(rankId) {
    const { data } = await supabase
      .from('rank_rewards')
      .select('*')
      .eq('rank_id', rankId)
      .eq('is_active', true)

    return data || []
  },
}
