import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocale } from './useLocale.js'
import {
  NAV_GROUPS as NAV_GROUPS_BASE,
  SHOP_NAV as SHOP_NAV_BASE,
  CUSTOMER_NAV as CUSTOMER_NAV_BASE,
  FRANCHISE_NAV as FRANCHISE_NAV_BASE,
  ADMIN_NAV as ADMIN_NAV_BASE,
  SUPER_ADMIN_NAV as SUPER_ADMIN_NAV_BASE,
  SUPER_ADMIN_COURSE_NAV as SUPER_ADMIN_COURSE_NAV_BASE,
  ROUTE_HEADERS as ROUTE_HEADERS_BASE,
  getHeaderForPath as getHeaderForPathBase,
} from '../../config/franchiseNav.js'

function label(t, key, fallback) {
  const v = t(key, { defaultValue: '' })
  return v && v !== key ? v : fallback
}

function mapItems(t, items, prefix = 'items') {
  return items.map((item) => ({
    ...item,
    label: label(t, `dashboard:nav.${prefix}.${item.id}`, item.label),
  }))
}

export function useNavLabels() {
  const { t } = useTranslation(['dashboard', 'common'])
  const { locale } = useLocale()

  return useMemo(() => {
    const GROUP_KEYS = ['activity', 'finance', 'resources', 'account']
    const groups = NAV_GROUPS_BASE.map((g, i) => ({
      ...g,
      title: label(t, `dashboard:nav.groups.${GROUP_KEYS[i]}`, g.title),
      items: mapItems(t, g.items),
    }))

    const shop = {
      ...SHOP_NAV_BASE,
      label: label(t, 'dashboard:nav.shop.label', SHOP_NAV_BASE.label),
      children: mapItems(t, SHOP_NAV_BASE.children, 'shop'),
      subscriptions: {
        ...SHOP_NAV_BASE.subscriptions,
        label: label(
          t,
          'dashboard:nav.shop.subscriptions',
          SHOP_NAV_BASE.subscriptions.label
        ),
      },
    }

    const headers = {}
    for (const [path, meta] of Object.entries(ROUTE_HEADERS_BASE)) {
      const key = path.replace(/\//g, '_').replace(/^_/, '') || 'root'
      headers[path] = {
        title: label(t, `dashboard:headers.${key}.title`, meta.title),
        subtitle: meta.subtitle
          ? label(t, `dashboard:headers.${key}.subtitle`, meta.subtitle)
          : undefined,
        breadcrumbs: meta.breadcrumbs?.map((b, i) =>
          label(t, `dashboard:headers.${key}.breadcrumbs.${i}`, b)
        ),
      }
    }

    return {
      navGroups: groups,
      shopNav: shop,
      customerNav: mapItems(t, CUSTOMER_NAV_BASE, 'customer'),
      franchiseNav: mapItems(t, FRANCHISE_NAV_BASE, 'franchise'),
      adminNav: mapItems(t, ADMIN_NAV_BASE, 'admin'),
      superAdminNav: mapItems(t, SUPER_ADMIN_NAV_BASE, 'superAdmin'),
      superAdminCourseNav: mapItems(t, SUPER_ADMIN_COURSE_NAV_BASE, 'superAdminCourse'),
      routeHeaders: headers,
      getHeaderForPath: (pathname, user) => {
        const raw = getHeaderForPathBase(pathname, user)
        const matchKey =
          headers[pathname]
            ? pathname
            : Object.keys(headers).find((p) => p !== '/' && pathname.startsWith(p))
        const h = matchKey ? headers[matchKey] : {}
        return {
          ...raw,
          title: h.title || raw.title,
          subtitle: h.subtitle ?? raw.subtitle,
          breadcrumbs: h.breadcrumbs?.length ? h.breadcrumbs : raw.breadcrumbs,
        }
      },
    }
  }, [t, locale])
}
