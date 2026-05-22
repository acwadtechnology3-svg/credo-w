import { supabase } from '../lib/supabase.js'
import { defaultPermissions } from '../lib/packageRules.js'

/**
 * Freeze catalog row at purchase time — immune to future admin edits.
 */
export async function createPackageSnapshot(userId, normalizedPkg, purchaseTransactionId = null) {
  const permissions =
    normalizedPkg.permissions_json && Object.keys(normalizedPkg.permissions_json).length > 0
      ? normalizedPkg.permissions_json
      : defaultPermissions(normalizedPkg)

  const row = {
    package_id: normalizedPkg.id,
    user_id: userId,
    purchase_transaction_id: purchaseTransactionId,
    name: normalizedPkg.name,
    description: normalizedPkg.description ?? null,
    price_egp: normalizedPkg.price_egp,
    bv_points: normalizedPkg.bv_points ?? 0,
    pv_points: normalizedPkg.pv_points ?? 0,
    direct_commission_egp: normalizedPkg.direct_commission_egp ?? 0,
    package_level: normalizedPkg.package_level,
    slots: normalizedPkg.slots,
    is_upgrade_only: normalizedPkg.is_upgrade_only,
    required_current_level: normalizedPkg.required_current_level,
    can_upgrade_to_level: normalizedPkg.can_upgrade_to_level,
    rules_version: normalizedPkg.rules_version ?? 1,
    permissions_json: permissions,
  }

  const { data, error } = await supabase.from('package_snapshots').insert(row).select().single()
  if (error) throw error
  return data
}
