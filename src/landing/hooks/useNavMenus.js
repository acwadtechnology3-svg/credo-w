import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { buildMenus, getNavCopyLegacy } from '../data/navMenu'
import { useLocale } from '../../i18n/hooks/useLocale.js'

function contentLocale(code) {
  if (code === 'ar' || code === 'fa') return 'ar'
  return 'en'
}

export function useNavMenus() {
  const { locale } = useLocale()
  const { t } = useTranslation('navbar')
  const l = contentLocale(locale)

  return useMemo(() => {
    const legacy = getNavCopyLegacy(l)
    const copy = {
      new: t('badges.new', { defaultValue: legacy.new }),
      login: t('login', { defaultValue: legacy.login }),
      start: t('start', { defaultValue: legacy.start }),
      dashboard: t('dashboard', { defaultValue: legacy.dashboard }),
      explore: t('explore', { defaultValue: legacy.explore }),
      menuTitle: t('menuTitle', { defaultValue: legacy.menuTitle }),
      loginHint: t('loginHint', { defaultValue: legacy.loginHint }),
    }
    return { copy, menus: buildMenus(l) }
  }, [locale, l, t])
}
