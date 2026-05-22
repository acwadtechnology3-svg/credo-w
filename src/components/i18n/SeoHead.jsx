import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation } from 'react-router-dom'
import { HREFLANG_LOCALES } from '../../i18n/config.js'
import { useLocale } from '../../i18n/hooks/useLocale.js'

export default function SeoHead({ titleKey, descriptionKey, title, description }) {
  const { t } = useTranslation('common')
  const { locale } = useLocale()
  const { pathname } = useLocation()

  const pageTitle = title ?? (titleKey ? t(titleKey) : t('seo.defaultTitle'))
  const pageDesc = description ?? (descriptionKey ? t(descriptionKey) : t('seo.defaultDescription'))

  useEffect(() => {
    document.title = pageTitle

    let meta = document.querySelector('meta[name="description"]')
    if (!meta) {
      meta = document.createElement('meta')
      meta.setAttribute('name', 'description')
      document.head.appendChild(meta)
    }
    meta.setAttribute('content', pageDesc)

    let ogTitle = document.querySelector('meta[property="og:title"]')
    if (ogTitle) ogTitle.setAttribute('content', pageTitle)

    document.querySelectorAll('link[rel="alternate"][data-i18n]').forEach((el) => el.remove())

    const origin = window.location.origin
    for (const code of HREFLANG_LOCALES) {
      const link = document.createElement('link')
      link.rel = 'alternate'
      link.hreflang = code
      link.href = `${origin}${pathname}?lang=${code}`
      link.dataset.i18n = '1'
      document.head.appendChild(link)
    }
    const xDefault = document.createElement('link')
    xDefault.rel = 'alternate'
    xDefault.hreflang = 'x-default'
    xDefault.href = `${origin}${pathname}`
    xDefault.dataset.i18n = '1'
    document.head.appendChild(xDefault)
  }, [pageTitle, pageDesc, pathname, locale])

  return null
}
