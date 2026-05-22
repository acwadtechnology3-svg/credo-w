import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import i18n, { changeLanguage, ensureNamespaces } from '../index.js'
import {
  LANGUAGES,
  DEFAULT_LOCALE,
  getLanguage,
  isRtlLocale,
  persistLocale,
  applyDocumentLocale,
  ROUTE_NAMESPACES,
} from '../config.js'

export function useLocale() {
  const [, inst, ready] = useTranslation()
  const instance = inst ?? i18n
  const locale = instance?.language ?? DEFAULT_LOCALE
  const lang = useMemo(() => getLanguage(locale), [locale])
  const dir = lang.dir
  const isRtl = isRtlLocale(locale)

  const setLocale = useCallback(async (code) => {
    persistLocale(code)
    await changeLanguage(code)
  }, [])

  return {
    locale,
    setLocale,
    lang,
    dir,
    isRtl,
    ready: ready && instance.isInitialized,
    languages: LANGUAGES,
  }
}

/** Preload namespaces for a route path */
export function useRouteNamespaces(pathname) {
  const { locale } = useLocale()

  useEffect(() => {
    const extra = []
    for (const [prefix, nsList] of Object.entries(ROUTE_NAMESPACES)) {
      if (pathname === prefix || (prefix !== '/' && pathname.startsWith(prefix))) {
        extra.push(...nsList)
      }
    }
    const unique = [...new Set(extra)]
    if (unique.length) ensureNamespaces(unique)
  }, [pathname, locale])
}

/** Sync document when locale changes outside React */
export function useDocumentLocale() {
  const { locale } = useLocale()
  useEffect(() => {
    applyDocumentLocale(locale)
  }, [locale])
}

/** Bridge for legacy landing locale API */
export function useLandingLocale() {
  const { locale, setLocale, lang, dir, ready } = useLocale()
  return { locale, setLocale, lang, dir, ready }
}

export { LANGUAGES }
