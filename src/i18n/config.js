/** @typedef {{ code: string; label: string; flag: string; dir: 'rtl' | 'ltr'; name: string; locale: string }} LanguageDef */

export const STORAGE_KEY = 'credo-locale'
export const LEGACY_STORAGE_KEY = 'credo-landing-locale'
export const DEFAULT_LOCALE = 'ar'

/** @type {LanguageDef[]} */
export const LANGUAGES = [
  { code: 'ar', label: 'AR', flag: '🇸🇦', dir: 'rtl', name: 'العربية', locale: 'ar-SA' },
  { code: 'en', label: 'EN', flag: '🇺🇸', dir: 'ltr', name: 'English', locale: 'en-US' },
  { code: 'fr', label: 'FR', flag: '🇫🇷', dir: 'ltr', name: 'Français', locale: 'fr-FR' },
  { code: 'es', label: 'ES', flag: '🇪🇸', dir: 'ltr', name: 'Español', locale: 'es-ES' },
  { code: 'hi', label: 'HI', flag: '🇮🇳', dir: 'ltr', name: 'हिन्दी', locale: 'hi-IN' },
  { code: 'zh', label: 'ZH', flag: '🇨🇳', dir: 'ltr', name: '中文', locale: 'zh-CN' },
  { code: 'fa', label: 'FA', flag: '🇮🇷', dir: 'rtl', name: 'فارسی', locale: 'fa-IR' },
  { code: 'nl', label: 'NL', flag: '🇳🇱', dir: 'ltr', name: 'Nederlands', locale: 'nl-NL' },
]

export const RTL_LOCALES = new Set(['ar', 'fa'])

export const NAMESPACES = [
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

/** Namespaces loaded before first paint */
export const BOOT_NAMESPACES = ['common', 'navbar']

/** Route → extra namespaces to preload */
export const ROUTE_NAMESPACES = {
  '/': ['landing'],
  '/login': ['auth'],
  '/register': ['auth', 'onboarding'],
  '/dashboard': ['dashboard', 'packages'],
  '/packages': ['packages'],
  '/agencies': ['agencies'],
  '/rewards': ['rewards'],
  '/ai': ['ai'],
  '/faq': ['landing'],
  '/ecosystem': ['landing', 'agencies'],
  '/support': ['navbar'],
}

export const HREFLANG_LOCALES = LANGUAGES.map((l) => l.code)

export function isRtlLocale(code) {
  return RTL_LOCALES.has(code)
}

export function getLanguage(code) {
  return LANGUAGES.find((l) => l.code === code) || LANGUAGES[0]
}

export function getIntlLocale(code) {
  return getLanguage(code).locale
}

export function readStoredLocale() {
  if (typeof window === 'undefined') return DEFAULT_LOCALE
  try {
    const stored = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY)
    if (stored && LANGUAGES.some((l) => l.code === stored)) return stored
  } catch {
    /* ignore */
  }
  return DEFAULT_LOCALE
}

export function persistLocale(code) {
  try {
    localStorage.setItem(STORAGE_KEY, code)
    localStorage.removeItem(LEGACY_STORAGE_KEY)
  } catch {
    /* ignore */
  }
}

export function applyDocumentLocale(code) {
  const lang = getLanguage(code)
  const root = document.documentElement
  root.lang = code
  root.dir = lang.dir
  root.dataset.locale = code
  root.classList.toggle('rtl', lang.dir === 'rtl')
  root.classList.toggle('ltr', lang.dir === 'ltr')
}
