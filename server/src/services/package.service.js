import { supabase } from '../lib/supabase.js'
import {
  DIRECT_PURCHASE_LEVELS,
  MAX_MEMBERSHIP_LEVEL,
  getLevelName,
  SLOTS_BY_LEVEL,
} from '../lib/packageRules.js'
import { rulesEngine } from './rulesEngine.service.js'

export { getLevelName }

/** Infer tier when DB columns from phase-d migration are missing. */
export function resolvePackageLevel(pkg) {
  if (pkg.package_level != null && pkg.package_level !== undefined) {
    return Number(pkg.package_level)
  }
  const price = Number(pkg.price_egp)
  if (price <= 6000) return 1
  if (price <= 15000) return 3
  return 7
}

export function normalizePackage(pkg) {
  const package_level = resolvePackageLevel(pkg)
  const is_upgrade_only =
    pkg.is_upgrade_only === true || package_level === 2 || package_level === 4
  const slots = pkg.slots ?? SLOTS_BY_LEVEL[package_level] ?? 1
  let can_upgrade_to_level = pkg.can_upgrade_to_level
  if (can_upgrade_to_level == null && is_upgrade_only) {
    can_upgrade_to_level = package_level === 2 ? 3 : 7
  }
  let required_current_level = pkg.required_current_level
  if (required_current_level == null && is_upgrade_only) {
    required_current_level = package_level === 2 ? 1 : 3
  }
  const permissions_json =
    pkg.permissions_json && typeof pkg.permissions_json === 'object'
      ? pkg.permissions_json
      : {}

  return {
    ...pkg,
    package_level,
    is_upgrade_only,
    slots,
    can_upgrade_to_level,
    required_current_level,
    permissions_json,
    rules_version: pkg.rules_version ?? 1,
  }
}

export const packageService = {
  async getAvailablePackages(userId) {
    const dynamic = await rulesEngine.getMembershipOptions(userId)
    if (dynamic.rulesDriven) {
      const { data: user } = await supabase
        .from('users')
        .select('membership_status')
        .eq('id', userId)
        .single()
      return {
        ...dynamic,
        membershipStatus: user?.membership_status || 'unsubscribed',
        directPackages: dynamic.directPackages.map((p) => normalizePackage(p)),
        upgradePackage: dynamic.upgradePackage
          ? normalizePackage(dynamic.upgradePackage)
          : null,
      }
    }
    return this.getAvailablePackagesLegacy(userId)
  },

  async getAvailablePackagesLegacy(userId) {
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('current_package_level, current_slots, membership_status')
      .eq('id', userId)
      .single()

    if (userError && !/column/i.test(userError.message || '')) throw userError

    const currentLevel = user?.current_package_level || 0

    const { data: allPackages, error: pkgError } = await supabase
      .from('packages')
      .select('*')
      .eq('is_active', true)
      .order('sort_order')

    if (pkgError) throw pkgError

    const catalogEmpty = !(allPackages || []).length

    const result = {
      catalogEmpty,
      currentLevel,
      currentSlots: user?.current_slots || 0,
      membershipStatus: user?.membership_status || 'unsubscribed',
      directPackages: [],
      upgradePackage: null,
      isFull: currentLevel === MAX_MEMBERSHIP_LEVEL,
      rulesDriven: false,
    }

    for (const raw of allPackages || []) {
      const pkg = normalizePackage(raw)
      if (pkg.is_upgrade_only) {
        if (pkg.required_current_level === currentLevel) {
          result.upgradePackage = {
            ...pkg,
            upgrade_message: `ترقي من ${getLevelName(currentLevel)} إلى ${getLevelName(pkg.can_upgrade_to_level)}`,
          }
        }
      } else if (currentLevel === 0 && DIRECT_PURCHASE_LEVELS.has(pkg.package_level)) {
        result.directPackages.push(pkg)
      }
    }

    result.directPackages.sort((a, b) => a.package_level - b.package_level)
    return result
  },

  async validatePurchase(user, pkg) {
    const normalized = normalizePackage(pkg)
    const ruleResult = await rulesEngine.validatePurchase(user, normalized.id, normalized)
    if (ruleResult) {
      return { normalized, ruleResult }
    }
    this.validatePurchaseLegacy(user, normalized)
    return { normalized, ruleResult: null }
  },

  validatePurchaseLegacy(user, pkg) {
    const normalized = normalizePackage(pkg)
    const currentLevel = user?.current_package_level || 0

    if (!normalized?.is_active) throw new Error('Package not found')
    if (currentLevel === MAX_MEMBERSHIP_LEVEL) {
      throw new Error('لديك بالفعل الباقة الكاملة — السباعي')
    }
    if (normalized.is_upgrade_only) {
      if (normalized.required_current_level !== currentLevel) {
        throw new Error(
          `يجب أن تكون في المستوى ${getLevelName(normalized.required_current_level)} للترقية`
        )
      }
      return normalized
    }
    if (currentLevel !== 0) throw new Error('لديك بالفعل باقة — استخدم الترقية المتاحة')
    if (!DIRECT_PURCHASE_LEVELS.has(normalized.package_level)) {
      throw new Error('هذه الباقة غير متاحة للشراء المباشر')
    }
    return normalized
  },

  /** Apply membership after payment (called only from purchase.service). */
  async applyMembership({
    userId,
    packageId,
    pkg,
    orderId,
    purchaseTransactionId,
    packageSnapshotId,
    currentLevel,
    newLevel,
  }) {
    const newSlots = (await this.getUserSlots(userId)) + pkg.slots
    const newTotalSlots = (await this.getUserTotalSlots(userId)) + pkg.slots

    const { error: userError } = await supabase
      .from('users')
      .update({
        current_package_level: newLevel,
        current_slots: newSlots,
        total_slots_purchased: newTotalSlots,
        membership_status: 'active',
      })
      .eq('id', userId)

    if (userError) throw userError

    const { error: histError } = await supabase.from('user_packages').insert({
      user_id: userId,
      package_id: packageId,
      order_id: orderId,
      purchase_transaction_id: purchaseTransactionId,
      package_snapshot_id: packageSnapshotId,
      package_level: pkg.package_level,
      slots_added: pkg.slots,
      is_upgrade: pkg.is_upgrade_only,
      previous_level: currentLevel,
      resulting_level: newLevel,
    })

    if (histError) throw histError

    return {
      previousLevel: currentLevel,
      newLevel,
      slotsAdded: pkg.slots,
      totalSlots: newSlots,
      packageName: pkg.name,
    }
  },

  async getUserSlots(userId) {
    const { data } = await supabase
      .from('users')
      .select('current_slots')
      .eq('id', userId)
      .single()
    return data?.current_slots || 0
  },

  async getUserTotalSlots(userId) {
    const { data } = await supabase
      .from('users')
      .select('total_slots_purchased')
      .eq('id', userId)
      .single()
    return data?.total_slots_purchased || 0
  },
}
