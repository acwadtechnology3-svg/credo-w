/**
 * @deprecated Use I18nProvider + useLocale from src/i18n/hooks/useLocale.js
 * Kept for backward compatibility with ecosystem pages.
 */
import { createContext, useContext } from 'react'
import { LANGUAGES, useLandingLocale as useGlobalLandingLocale } from '../../i18n/hooks/useLocale.js'

export { LANGUAGES }

const LandingLocaleContext = createContext(null)

/** Wraps children — prefer root I18nProvider in App */
export function LandingLocaleProvider({ children }) {
  const value = useGlobalLandingLocale()
  return (
    <LandingLocaleContext.Provider value={value}>{children}</LandingLocaleContext.Provider>
  )
}

export function useLandingLocale() {
  const ctx = useContext(LandingLocaleContext)
  if (ctx) return ctx
  return useGlobalLandingLocale()
}
