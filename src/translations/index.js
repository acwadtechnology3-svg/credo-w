/**
 * Translation registry — locale files live in src/i18n/locales/{lang}/{namespace}.json
 */
export { LANGUAGES, DEFAULT_LOCALE, NAMESPACES, STORAGE_KEY } from '../i18n/config.js'
export { default as i18n, initPromise, changeLanguage, ensureNamespaces } from '../i18n/index.js'
