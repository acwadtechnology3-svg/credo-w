import { getDisplayFirstName } from '../lib/mapUser'

/** Arabic franchise sidebar — maps nav ids to routes */
export const NAV_ROUTE_MAP = {
  dashboard: '/dashboard',
  packages: '/packages',
  tree: '/team/placement-tree',
  'tree-join-requests': '/team/join-requests',
  organization: '/organization',
  mlm: '/mlm',
  team: '/team/referrals',
  'team-guild': '/agencies/discover',
  'agency-guild': '/agencies/discover',
  'agency-leaderboard': '/agencies/leaderboard',
  'agency-comms': '/agencies/comms',
  'team-found': '/agencies/discover',
  wallet: '/earnings/wallet',
  finance: '/finance',
  earnings: '/earnings/team-commission',
  'shop-buy': '/shop/buy',
  'shop-cart': '/shop/cart',
  'shop-orders': '/shop/orders',
  'shop-shipping': '/shop/shipping',
  'shop-subscriptions': '/shop/subscriptions',
  ranks: '/earnings/rank-bonus',
  academy: '/courses',
  leads: '/marketing',
  support: '/support',
  'admin-support': '/admin/support',
  'sa-support': '/super-admin/support',
  messages: '/messages/sent',
  admin: '/admin',
  'admin-users': '/admin/users',
  'admin-withdrawals': '/admin/withdrawals',
  'admin-commissions': '/admin/commissions',
  'admin-products': '/admin/products',
  'admin-orders': '/admin/orders',
  'admin-coupons': '/admin/coupons',
  'admin-banners': '/admin/banners',
  'admin-vouchers': '/admin/vouchers',
  'admin-settings': '/admin/settings',
  'admin-audit': '/admin/audit',
  'admin-finance': '/admin/finance',
  'admin-deposits': '/admin/deposits',
  'admin-kyc': '/admin/kyc',
  'admin-reports': '/admin/reports',
  'admin-courses': '/admin/courses',
  'admin-course-enrollments': '/admin/courses/enrollments',
  'sa-overview': '/super-admin',
  'sa-business': '/super-admin/business',
  'sa-packages': '/super-admin/packages',
  'sa-upgrades': '/super-admin/upgrades',
  'sa-ranks': '/super-admin/ranks',
  'sa-progression': '/super-admin/progression',
  'sa-payments': '/super-admin/payments',
  'sa-promotions': '/super-admin/promotions',
  'sa-feature-flags': '/super-admin/feature-flags',
  'sa-level-bonus': '/super-admin/level-bonus',
  'sa-settings': '/super-admin/settings',
  'sa-admins': '/super-admin/admins',
  'sa-operations': '/super-admin/operations',
  'sa-network': '/super-admin/network',
  'customer-pearls': '/customer/pearls',
  pearls: '/pearls',
  progression: '/progression',
  'career-path': '/progression/career',
  'customer-vouchers': '/customer/vouchers',
  'customer-community': '/customer/community',
  'customer-membership': '/customer/membership',
  franchise: '/franchise',
  settings: '/profile',
}

export const CUSTOMER_NAV = [
  { id: 'progression', label: '⚡ Progression', icon: 'rank' },
  { id: 'customer-pearls', label: '⬡ Pearls Wallet', icon: 'wallet' },
  { id: 'customer-vouchers', label: 'Vouchers', icon: 'leads' },
  { id: 'customer-community', label: 'Community', icon: 'team' },
  { id: 'customer-membership', label: 'Membership', icon: 'rank' },
]

export const FRANCHISE_NAV = [
  { id: 'franchise', label: 'Franchise Dashboard', icon: 'tree' },
]

export const SUPER_ADMIN_NAV = [
  { id: 'sa-overview', label: 'نظرة المنصة', icon: 'trend-up' },
  { id: 'sa-business', label: 'مركز الأعمال', icon: 'settings' },
  { id: 'sa-packages', label: 'الباقات', icon: 'shop' },
  { id: 'sa-upgrades', label: 'مسارات الترقية', icon: 'tree' },
  { id: 'sa-ranks', label: 'الرتب', icon: 'rank' },
  { id: 'sa-payments', label: 'طرق الدفع', icon: 'wallet' },
  { id: 'sa-promotions', label: 'العروض', icon: 'leads' },
  { id: 'sa-feature-flags', label: 'مفاتيح الميزات', icon: 'support' },
  { id: 'sa-level-bonus', label: 'عمولة المستويات', icon: 'earnings' },
  { id: 'sa-settings', label: 'الإعدادات المالية', icon: 'settings' },
  { id: 'sa-admins', label: 'المشرفون', icon: 'admin' },
  { id: 'sa-operations', label: 'عمليات', icon: 'support' },
  { id: 'sa-network', label: 'محرك الشبكة', icon: 'tree' },
  { id: 'sa-support', label: 'مركز الدعم', icon: 'support' },
]

export const ADMIN_NAV = [
  { id: 'admin', label: 'Admin Dashboard', icon: 'admin' },
  { id: 'admin-users', label: 'Users', icon: 'team' },
  { id: 'admin-withdrawals', label: 'Withdrawals', icon: 'wallet' },
  { id: 'admin-commissions', label: 'Commissions', icon: 'trend-up' },
  { id: 'admin-products', label: 'Products', icon: 'shop' },
  { id: 'admin-orders', label: 'Orders', icon: 'shop' },
  { id: 'admin-coupons', label: 'Coupons', icon: 'leads' },
  { id: 'admin-banners', label: 'Banners', icon: 'academy' },
  { id: 'admin-vouchers', label: 'Vouchers', icon: 'leads' },
  { id: 'admin-settings', label: 'Settings', icon: 'settings' },
  { id: 'admin-audit', label: 'Audit Log', icon: 'support' },
  { id: 'admin-finance', label: 'Finance Hub', icon: 'wallet' },
  { id: 'admin-deposits', label: 'Deposits', icon: 'wallet' },
  { id: 'admin-kyc', label: 'KYC Review', icon: 'team' },
  { id: 'admin-reports', label: 'Reports', icon: 'trend-up' },
  { id: 'admin-support', label: 'Support Center', icon: 'support' },
  { id: 'admin-course-enrollments', label: 'Course Enrollments', icon: 'academy' },
]

export const SUPER_ADMIN_COURSE_NAV = [
  { id: 'admin-courses', label: 'Courses (Academy)', icon: 'academy' },
]

/** قسم المتجر القابل للطي (الشريط الجانبي) */
export const SHOP_NAV = {
  id: 'shop',
  label: 'تسوّق الآن',
  icon: 'shop',
  children: [
    { id: 'shop-buy', label: 'شراء' },
    { id: 'shop-cart', label: 'السلة' },
    { id: 'shop-orders', label: 'الطلبات' },
    { id: 'shop-shipping', label: 'عنوان الشحن' },
  ],
  subscriptions: { id: 'shop-subscriptions', label: 'الاشتراكات' },
}

export const SHOP_NAV_IDS = new Set([
  'shop',
  ...SHOP_NAV.children.map((c) => c.id),
  SHOP_NAV.subscriptions.id,
])

export const ROUTE_NAV_ID = Object.fromEntries(
  Object.entries(NAV_ROUTE_MAP).map(([id, path]) => [path, id])
)

export const NAV_GROUPS = [
  {
    title: 'النشاط',
    items: [
      { id: 'dashboard', label: 'الرئيسية', icon: 'home', hint: 'D' },
      { id: 'tree', label: 'شجرة الشبكة', icon: 'tree', hint: 'T' },
      { id: 'organization', label: '⚡ مركز المنظمة', icon: 'tree', badge: 'P5' },
      { id: 'mlm', label: 'ذكاء التعويضات', icon: 'trend-up', badge: 'P6' },
      { id: 'tree-join-requests', label: 'طلبات انضمام الشجرة', icon: 'team' },
      { id: 'team', label: 'الفريق والإحالات', icon: 'team' },
      { id: 'team-guild', label: 'مقر الفرق', icon: 'team', badge: 'P4' },
      { id: 'agency-comms', label: 'مقر التواصل', icon: 'message', badge: 'HQ' },
      { id: 'team-found', label: 'تأسيس الفريق', icon: 'rank' },
      { id: 'messages', label: 'الرسائل', icon: 'message' },
    ],
  },
  {
    title: 'المالية',
    items: [
      { id: 'packages', label: 'الباقات والترقية', icon: 'shop' },
      { id: 'wallet', label: 'المحفظة و C Money', icon: 'wallet', hint: 'W' },
      { id: 'finance', label: 'النظام المالي', icon: 'wallet', badge: 'P3' },
      { id: 'earnings', label: 'الأرباح والعمولات', icon: 'trend-up', hint: 'E' },
      { id: 'ranks', label: 'الرتب والمكافآت', icon: 'rank' },
    ],
  },
  {
    title: 'الموارد',
    items: [
      { id: 'academy', label: 'الأكاديمية', icon: 'academy' },
      { id: 'leads', label: 'شراء البيانات', icon: 'leads' },
      { id: 'support', label: 'الدعم الفني', icon: 'support' },
    ],
  },
  {
    title: 'الحساب',
    items: [{ id: 'settings', label: 'الإعدادات', icon: 'settings' }],
  },
]

export const ROUTE_HEADERS = {
  '/dashboard': {
    title: 'مرحباً',
    breadcrumbs: ['Credo W', 'لوحة المسوّق', 'الرئيسية'],
  },
  '/packages': {
    title: 'الباقات والترقية',
    breadcrumbs: ['Credo W', 'المالية', 'الباقات'],
  },
  '/team/placement-tree': {
    title: 'شجرة الشبكة',
    breadcrumbs: ['Credo W', 'الفريق', 'شجرة الشبكة'],
  },
  '/team/referrals': {
    title: 'الفريق والإحالات',
    breadcrumbs: ['Credo W', 'الفريق', 'الإحالات'],
  },
  '/agencies/discover': {
    title: 'الوكالات',
    subtitle: 'منظمات رسمية',
  },
  '/agencies/comms': {
    title: 'مقر التواصل',
    breadcrumbs: ['Credo W', 'الوكالة', 'مقر التواصل'],
  },
  '/agencies/leaderboard': {
    title: 'تصنيف الوكالات',
    subtitle: 'أفضل المنظمات',
  },
  '/teams/discover': {
    title: 'اكتشف الفرق',
    breadcrumbs: ['Credo W', 'الفريق', 'مقر الفرق'],
  },
  '/teams/found': {
    title: 'تأسيس فريقك',
    breadcrumbs: ['Credo W', 'الفريق', 'التأسيس'],
  },
  '/teams/profile/': {
    title: 'ملف الفريق',
    breadcrumbs: ['Credo W', 'الفريق', 'الملف'],
  },
  '/earnings/wallet': {
    title: 'المحفظة الذكية',
    breadcrumbs: ['Credo W', 'المالية', 'المحفظة'],
  },
  '/earnings/team-commission': {
    title: 'الأرباح والعمولات',
    breadcrumbs: ['Credo W', 'المالية', 'العمولات'],
  },
  '/shop/buy': {
    title: 'شراء',
    breadcrumbs: ['Credo W', 'المتجر', 'شراء'],
  },
  '/shop/cart': {
    title: 'السلة',
    breadcrumbs: ['Credo W', 'المتجر', 'السلة'],
  },
  '/shop/orders': {
    title: 'الطلبات',
    breadcrumbs: ['Credo W', 'المتجر', 'الطلبات'],
  },
  '/shop/shipping': {
    title: 'عنوان الشحن',
    breadcrumbs: ['Credo W', 'المتجر', 'عنوان الشحن'],
  },
  '/shop/subscriptions': {
    title: 'الاشتراكات',
    breadcrumbs: ['Credo W', 'المتجر', 'الاشتراكات'],
  },
  '/earnings/rank-bonus': {
    title: 'الرتب والمكافآت',
    breadcrumbs: ['Credo W', 'الرتب'],
  },
  '/courses': {
    title: 'Credo Academy',
    breadcrumbs: ['Credo W', 'الموارد', 'الأكاديمية'],
  },
  '/marketing': {
    title: 'أدوات التسويق',
    breadcrumbs: ['Credo W', 'الموارد'],
  },
  '/support': {
    title: 'مركز دعم Credo W',
    breadcrumbs: ['Credo W', 'الدعم'],
  },
  '/help-center': {
    title: 'مركز دعم Credo W',
    breadcrumbs: ['Credo W', 'الدعم'],
  },
  '/admin/support': {
    title: 'إدارة الدعم',
    breadcrumbs: ['Credo W', 'Admin', 'Support'],
  },
  '/super-admin/support': {
    title: 'إدارة الدعم',
    breadcrumbs: ['Credo W', 'Super Admin', 'Support'],
  },
  '/messages/sent': {
    title: 'رسائلي المرسلة',
    breadcrumbs: ['Credo W', 'الفريق', 'الرسائل'],
  },
  '/admin': {
    title: 'Admin Dashboard',
    breadcrumbs: ['Credo W', 'Admin'],
  },
  '/admin/users': {
    title: 'Users Management',
    breadcrumbs: ['Credo W', 'Admin', 'Users'],
  },
  '/admin/users/': {
    title: 'ملف المستخدم',
    breadcrumbs: ['Credo W', 'Admin', 'Users', 'التفاصيل'],
  },
  '/admin/withdrawals': {
    title: 'Withdrawals',
    breadcrumbs: ['Credo W', 'Admin', 'Withdrawals'],
  },
  '/admin/commissions': {
    title: 'Commission Cycles',
    breadcrumbs: ['Credo W', 'Admin', 'Commissions'],
  },
  '/admin/products': {
    title: 'Products',
    breadcrumbs: ['Credo W', 'Admin', 'Products'],
  },
  '/admin/products/new': {
    title: 'New Product',
    breadcrumbs: ['Credo W', 'Admin', 'Products', 'New'],
  },
  '/admin/products/': {
    title: 'Edit Product',
    breadcrumbs: ['Credo W', 'Admin', 'Products', 'Edit'],
  },
  '/admin/orders': {
    title: 'Orders',
    breadcrumbs: ['Credo W', 'Admin', 'Orders'],
  },
  '/admin/coupons': {
    title: 'Coupons',
    breadcrumbs: ['Credo W', 'Admin', 'Coupons'],
  },
  '/admin/banners': {
    title: 'Banners',
    breadcrumbs: ['Credo W', 'Admin', 'Banners'],
  },
  '/admin/vouchers': {
    title: 'Vouchers',
    breadcrumbs: ['Credo W', 'Admin', 'Vouchers'],
  },
  '/admin/settings': {
    title: 'System Settings',
    breadcrumbs: ['Credo W', 'Admin', 'Settings'],
  },
  '/admin/audit': {
    title: 'Audit Log',
    breadcrumbs: ['Credo W', 'Admin', 'Audit'],
  },
  '/admin/deposits': {
    title: 'Deposit Requests',
    breadcrumbs: ['Credo W', 'Admin', 'Deposits'],
  },
  '/admin/kyc': {
    title: 'KYC Review',
    breadcrumbs: ['Credo W', 'Admin', 'KYC'],
  },
  '/admin/reports': {
    title: 'Reports & Analytics',
    breadcrumbs: ['Credo W', 'Admin', 'Reports'],
  },
  '/admin/courses': {
    title: 'Credo Academy — Courses',
    breadcrumbs: ['Credo W', 'Admin', 'Courses'],
  },
  '/admin/courses/enrollments': {
    title: 'Course Enrollments',
    breadcrumbs: ['Credo W', 'Admin', 'Enrollments'],
  },
  '/profile': {
    title: 'الإعدادات',
    breadcrumbs: ['Credo W', 'الحساب'],
  },
  '/customer/pearls': {
    title: 'Pearls Wallet',
    breadcrumbs: ['Credo W', 'العملاء', 'Pearls'],
  },
  '/progression': {
    title: 'Progression Hub',
    breadcrumbs: ['Credo W', 'Progression'],
  },
  '/customer/vouchers': {
    title: 'Vouchers',
    breadcrumbs: ['Credo W', 'العملاء', 'Vouchers'],
  },
  '/customer/community': {
    title: 'Customer Community',
    breadcrumbs: ['Credo W', 'العملاء', 'Community'],
  },
  '/customer/membership': {
    title: 'Membership',
    breadcrumbs: ['Credo W', 'العملاء', 'Membership'],
  },
  '/franchise': {
    title: 'Franchise Dashboard',
    breadcrumbs: ['Credo W', 'Franchise'],
  },
  '/super-admin': {
    title: 'Super Admin',
    breadcrumbs: ['Credo W', 'Super Admin', 'نظرة المنصة'],
  },
  '/super-admin/packages': {
    title: 'إدارة الباقات',
    breadcrumbs: ['Credo W', 'Super Admin', 'الباقات'],
  },
  '/super-admin/ranks': {
    title: 'إدارة الرتب',
    breadcrumbs: ['Credo W', 'Super Admin', 'الرتب'],
  },
  '/super-admin/level-bonus': {
    title: 'عمولة المستويات',
    breadcrumbs: ['Credo W', 'Super Admin', 'المستويات'],
  },
  '/super-admin/settings': {
    title: 'الإعدادات المالية',
    breadcrumbs: ['Credo W', 'Super Admin', 'الإعدادات'],
  },
  '/super-admin/admins': {
    title: 'المشرفون',
    breadcrumbs: ['Credo W', 'Super Admin', 'المشرفون'],
  },
  '/super-admin/operations': {
    title: 'عمليات النظام',
    breadcrumbs: ['Credo W', 'Super Admin', 'عمليات'],
  },
}

export function getNavIdFromPath(pathname) {
  if (pathname.startsWith('/customer')) {
    const match = Object.entries(NAV_ROUTE_MAP).find(([, path]) => pathname === path)
    return match?.[0] ?? 'customer-pearls'
  }
  if (pathname.startsWith('/franchise')) return 'franchise'
  if (pathname.startsWith('/super-admin')) {
    const saMatch = Object.entries(NAV_ROUTE_MAP).find(
      ([, path]) => pathname === path || (path !== '/super-admin' && pathname.startsWith(path))
    )
    if (saMatch) return saMatch[0]
    return 'sa-overview'
  }
  if (pathname.startsWith('/admin')) {
    const adminMatch = Object.entries(NAV_ROUTE_MAP)
      .filter(([, path]) => path.startsWith('/admin'))
      .sort((a, b) => b[1].length - a[1].length)
      .find(([, path]) => pathname === path || (path !== '/admin' && pathname.startsWith(path)))
    if (adminMatch) return adminMatch[0]
    return 'admin'
  }
  if (pathname.startsWith('/courses')) return 'academy'
  if (pathname.startsWith('/agencies/comms')) return 'agency-comms'
  if (pathname.startsWith('/agencies')) return 'agency-guild'
  if (pathname.startsWith('/teams/profile')) return 'team-guild'
  if (pathname.startsWith('/teams')) {
    const teamMatch = Object.entries(NAV_ROUTE_MAP).find(
      ([, path]) => path.startsWith('/teams') && pathname === path
    )
    if (teamMatch) return teamMatch[0]
  }
  if (ROUTE_NAV_ID[pathname]) return ROUTE_NAV_ID[pathname]
  if (pathname.startsWith('/shop/')) {
    const shopMatch = Object.entries(NAV_ROUTE_MAP).find(
      ([id, path]) => SHOP_NAV_IDS.has(id) && pathname === path
    )
    if (shopMatch) return shopMatch[0]
    return 'shop-buy'
  }
  const match = Object.entries(NAV_ROUTE_MAP).find(([, path]) => pathname.startsWith(path))
  return match?.[0] ?? 'dashboard'
}

export function isShopPath(pathname) {
  return pathname.startsWith('/shop')
}

export function getHeaderForPath(pathname, user) {
  const resolve = (header) => {
    if (!header) return ROUTE_HEADERS['/dashboard']
    if (pathname === '/dashboard' || pathname === '/') {
      const first = getDisplayFirstName(user)
      return {
        ...header,
        title: first ? `مرحباً، ${first}` : header.title || 'مرحباً',
      }
    }
    return header
  }

  if (ROUTE_HEADERS[pathname]) return resolve(ROUTE_HEADERS[pathname])
  const match = Object.keys(ROUTE_HEADERS)
    .filter((p) => pathname.startsWith(p))
    .sort((a, b) => b.length - a.length)[0]
  return resolve(ROUTE_HEADERS[match] || ROUTE_HEADERS['/dashboard'])
}
