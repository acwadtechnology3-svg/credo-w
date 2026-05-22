import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import {
  DEFAULT_LOCALE,
  NAMESPACES,
  BOOT_NAMESPACES,
  readStoredLocale,
  persistLocale,
  applyDocumentLocale,
} from './config.js'

const localeModules = import.meta.glob('./locales/*/*.json')

function loadResource(language, namespace) {
  const path = `./locales/${language}/${namespace}.json`
  const loader = localeModules[path]
  if (!loader) return Promise.reject(new Error(`Missing locale: ${path}`))
  return loader().then((mod) => mod.default ?? mod)
}

const lazyBackend = {
  type: 'backend',
  init() {},
  read(language, namespace, callback) {
    loadResource(language, namespace)
      .then((data) => callback(null, data))
      .catch((err) => {
        if (language !== DEFAULT_LOCALE) {
          loadResource(DEFAULT_LOCALE, namespace)
            .then((data) => callback(null, data))
            .catch(() => callback(err, null))
        } else {
          callback(err, null)
        }
      })
  },
}

function resolveInitialLocale() {
  if (typeof window !== 'undefined') {
    try {
      const q = new URLSearchParams(window.location.search).get('lang')
      if (q && ['ar', 'en', 'fr', 'es', 'hi', 'zh', 'fa', 'nl'].includes(q)) {
        persistLocale(q)
        return q
      }
    } catch {
      /* ignore */
    }
  }
  return readStoredLocale()
}

const initialLocale = resolveInitialLocale()
applyDocumentLocale(initialLocale)

const initPromise = i18n
  .use(lazyBackend)
  .use(initReactI18next)
  .init({
    lng: initialLocale,
    fallbackLng: DEFAULT_LOCALE,
    supportedLngs: ['ar', 'en', 'fr', 'es', 'hi', 'zh', 'fa', 'nl'],
    ns: NAMESPACES,
    defaultNS: 'common',
    fallbackNS: 'common',
    partialBundledLanguages: true,
    load: 'currentOnly',
    interpolation: { escapeValue: false },
    react: { useSuspense: false },
    returnEmptyString: false,
  })
  .then(() =>
    Promise.all(BOOT_NAMESPACES.map((ns) => i18n.loadNamespaces(ns)))
  )

export { initPromise }
export default i18n

export async function ensureNamespaces(namespaces) {
  const missing = namespaces.filter((ns) => !i18n.hasResourceBundle(i18n.language, ns))
  if (missing.length) await i18n.loadNamespaces(missing)
}

export async function changeLanguage(code) {
  await initPromise
  await i18n.changeLanguage(code)
  applyDocumentLocale(code)
}
