/**
 * Seeds locale JSON from Arabic master (src/i18n/locales/ar).
 * Run: node scripts/seed-i18n-locales.mjs
 * Other languages use bundled premium translations in LOCALE_OVERRIDES.
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '../src/i18n/locales')
const NS = [
  'common',
  'navbar',
  'landing',
  'packages',
  'agencies',
  'onboarding',
  'rewards',
  'dashboard',
  'auth',
  'errors',
  'ai',
]

const TARGETS = ['fr', 'es', 'hi', 'zh', 'fa', 'nl']

function deepMerge(base, patch) {
  if (patch == null) return base
  if (typeof patch !== 'object' || Array.isArray(patch)) return patch
  const out = { ...base }
  for (const k of Object.keys(patch)) {
    out[k] =
      typeof patch[k] === 'object' && !Array.isArray(patch[k]) && patch[k] != null
        ? deepMerge(base?.[k] ?? {}, patch[k])
        : patch[k]
  }
  return out
}

async function loadOverrides() {
  const p = path.join(__dirname, 'i18n-locale-overrides.json')
  if (!fs.existsSync(p)) return {}
  return JSON.parse(fs.readFileSync(p, 'utf8'))
}

async function main() {
  const overrides = await loadOverrides()
  for (const lng of TARGETS) {
    const dir = path.join(ROOT, lng)
    fs.mkdirSync(dir, { recursive: true })
    for (const ns of NS) {
      const enPath = path.join(ROOT, 'en', `${ns}.json`)
      const en = JSON.parse(fs.readFileSync(enPath, 'utf8'))
      const patch = overrides[lng]?.[ns] ?? {}
      const merged = deepMerge(en, patch)
      fs.writeFileSync(path.join(dir, `${ns}.json`), JSON.stringify(merged, null, 2) + '\n')
    }
    console.log(`Seeded ${lng}`)
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
