import { useMemo } from 'react'
import { useLocale } from './useLocale.js'
import { getIntlLocale } from '../config.js'

export function useFormat() {
  const { locale } = useLocale()
  const intlLocale = getIntlLocale(locale)

  return useMemo(
    () => ({
      locale,
      intlLocale,
      number: (value, options = {}) =>
        new Intl.NumberFormat(intlLocale, {
          maximumFractionDigits: 2,
          ...options,
        }).format(value),
      currency: (value, currency = 'USD', options = {}) =>
        new Intl.NumberFormat(intlLocale, {
          style: 'currency',
          currency,
          ...options,
        }).format(value),
      percent: (value, options = {}) =>
        new Intl.NumberFormat(intlLocale, {
          style: 'percent',
          maximumFractionDigits: 1,
          ...options,
        }).format(value),
      date: (value, options = {}) =>
        new Intl.DateTimeFormat(intlLocale, {
          dateStyle: 'medium',
          ...options,
        }).format(value instanceof Date ? value : new Date(value)),
      dateTime: (value, options = {}) =>
        new Intl.DateTimeFormat(intlLocale, {
          dateStyle: 'medium',
          timeStyle: 'short',
          ...options,
        }).format(value instanceof Date ? value : new Date(value)),
      relative: (value) => {
        const rtf = new Intl.RelativeTimeFormat(intlLocale, { numeric: 'auto' })
        const diff = (value instanceof Date ? value : new Date(value)).getTime() - Date.now()
        const days = Math.round(diff / 86400000)
        if (Math.abs(days) < 1) return rtf.format(Math.round(diff / 3600000), 'hour')
        return rtf.format(days, 'day')
      },
    }),
    [locale, intlLocale]
  )
}
