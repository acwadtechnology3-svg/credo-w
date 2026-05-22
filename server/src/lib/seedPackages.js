import { supabase } from './supabase.js'

/** Catalog from phase-d — used when packages table is empty. */
export const PACKAGE_SEED_ROWS = [
  {
    name: 'أحادي',
    package_level: 1,
    slots: 1,
    price_egp: 5000,
    bv_points: 500,
    pv_points: 500,
    direct_commission_egp: 400,
    is_upgrade_only: false,
    required_current_level: null,
    can_upgrade_to_level: 3,
    sort_order: 1,
    description: 'الباقة الأساسية — slot واحد في الشجرة',
    is_active: true,
    rules_version: 1,
    permissions_json: { can_create_team: false, max_team_members: 0 },
  },
  {
    name: 'ثنائي',
    package_level: 2,
    slots: 2,
    price_egp: 6000,
    bv_points: 600,
    pv_points: 600,
    direct_commission_egp: 500,
    is_upgrade_only: true,
    required_current_level: 1,
    can_upgrade_to_level: 3,
    sort_order: 2,
    description: 'ترقية من أحادي — يضيف 2 slots ليصبح ثلاثي',
    is_active: true,
    rules_version: 1,
    permissions_json: { can_create_team: false, max_team_members: 0 },
  },
  {
    name: 'ثلاثي',
    package_level: 3,
    slots: 3,
    price_egp: 10000,
    bv_points: 1000,
    pv_points: 1000,
    direct_commission_egp: 900,
    is_upgrade_only: false,
    required_current_level: null,
    can_upgrade_to_level: 7,
    sort_order: 3,
    description: 'الباقة المتوسطة — 3 slots في الشجرة',
    is_active: true,
    rules_version: 1,
    permissions_json: { can_create_team: true, max_team_members: 100 },
  },
  {
    name: 'رباعي',
    package_level: 4,
    slots: 4,
    price_egp: 12000,
    bv_points: 1200,
    pv_points: 1200,
    direct_commission_egp: 1000,
    is_upgrade_only: true,
    required_current_level: 3,
    can_upgrade_to_level: 7,
    sort_order: 4,
    description: 'ترقية من ثلاثي — يضيف 4 slots ليصبح سباعي',
    is_active: true,
    rules_version: 1,
    permissions_json: { can_create_team: true, max_team_members: 100 },
  },
  {
    name: 'سباعي',
    package_level: 7,
    slots: 7,
    price_egp: 20000,
    bv_points: 2000,
    pv_points: 2000,
    direct_commission_egp: 1800,
    is_upgrade_only: false,
    required_current_level: null,
    can_upgrade_to_level: null,
    sort_order: 5,
    description: 'الباقة الكاملة — 7 slots في الشجرة',
    is_active: true,
    rules_version: 1,
    permissions_json: { can_create_team: true, max_team_members: 500 },
  },
]

let seedPromise = null

/** Insert default packages when table is empty (e.g. after DELETE without INSERT). */
export async function ensurePackagesSeeded() {
  if (seedPromise) return seedPromise

  seedPromise = (async () => {
    const { count, error: countError } = await supabase
      .from('packages')
      .select('*', { count: 'exact', head: true })

    if (countError) {
      console.warn('[packages] seed skipped — cannot read packages:', countError.message)
      return false
    }

    if ((count ?? 0) > 0) return true

    const { error: insertError } = await supabase.from('packages').insert(PACKAGE_SEED_ROWS)

    if (insertError) {
      console.error(
        '[packages] auto-seed FAILED:',
        insertError.message,
        '\n  → Run server/src/db/phase-d-reseed-packages.sql in Supabase SQL Editor',
        '\n  → Or set SUPABASE_SERVICE_KEY to the real service_role secret (Settings → API)'
      )
      seedPromise = null
      return false
    }

    console.log(`[packages] auto-seeded ${PACKAGE_SEED_ROWS.length} packages (table was empty)`)
    return true
  })()

  return seedPromise
}
