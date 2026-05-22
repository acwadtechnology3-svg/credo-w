import { useEffect, useState } from 'react'
import { I18nextProvider } from 'react-i18next'
import i18n, { initPromise } from '../../i18n/index.js'
import { useDocumentLocale, useRouteNamespaces } from '../../i18n/hooks/useLocale.js'
import { useLocation } from 'react-router-dom'
import LocaleTransition from './LocaleTransition.jsx'
import SeoHead from './SeoHead.jsx'

function I18nReady({ children }) {
  const [ready, setReady] = useState(i18n.isInitialized)
  const location = useLocation()

  useDocumentLocale()
  useRouteNamespaces(location.pathname)

  useEffect(() => {
    if (i18n.isInitialized) {
      setReady(true)
      return
    }
    initPromise.then(() => setReady(true))
  }, [])

  if (!ready) {
    return (
      <div className="i18n-boot" aria-hidden="true" style={{ minHeight: '100vh', opacity: 0 }} />
    )
  }

  return (
    <LocaleTransition>
      <SeoHead />
      {children}
    </LocaleTransition>
  )
}

export default function I18nProvider({ children }) {
  return (
    <I18nextProvider i18n={i18n}>
      <I18nReady>{children}</I18nReady>
    </I18nextProvider>
  )
}
