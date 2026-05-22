import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabaseUrl = process.env.SUPABASE_URL

function isPlaceholderKey(k) {
  return !k || /^your_/i.test(k) || /paste_/i.test(k) || k === 'your_service_role_key'
}

/** Publishable/anon keys do not bypass RLS — must not be used as SUPABASE_SERVICE_KEY */
function isServiceRoleKey(k) {
  if (!k || isPlaceholderKey(k)) return false
  if (/^sb_publishable_/i.test(k)) return false
  if (/^eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\./.test(k) && k.length < 400) return false
  return true
}

function resolveKey() {
  const service = process.env.SUPABASE_SERVICE_KEY?.trim()
  const anon = process.env.SUPABASE_ANON_KEY?.trim()

  if (service && isServiceRoleKey(service)) return service
  if (service && !isPlaceholderKey(service) && process.env.NODE_ENV !== 'production') {
    console.warn(
      '[supabase] SUPABASE_SERVICE_KEY looks like a publishable/anon key — RLS will apply. ' +
        'Use the service_role secret from Dashboard → API, or run server/src/db/fix-support-messages-rls.sql'
    )
  }
  if (anon && !isPlaceholderKey(anon)) return anon
  if (service && !isPlaceholderKey(service)) return service
  return null
}

const supabaseKey = resolveKey()

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    'Missing Supabase config: set SUPABASE_URL and SUPABASE_SERVICE_KEY (or SUPABASE_ANON_KEY) in .env'
  )
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

let _storageClient = null

/** Prefer service_role for storage (bypasses RLS). Falls back to main client if policies allow. */
export function getStorageSupabase() {
  const service = process.env.SUPABASE_SERVICE_KEY?.trim()
  if (service && isServiceRoleKey(service)) {
    if (!_storageClient) {
      _storageClient = createClient(supabaseUrl, service, {
        auth: { autoRefreshToken: false, persistSession: false },
      })
    }
    return _storageClient
  }
  if (process.env.NODE_ENV !== 'production') {
    console.warn(
      '[storage] SUPABASE_SERVICE_KEY not set — using anon key. Add service_role to .env or run phase-storage-policies.sql'
    )
  }
  return supabase
}
