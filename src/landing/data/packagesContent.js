/** Evolution levels — ecosystem entry, not SaaS pricing */

export const PACKAGE_LEVELS = [
  {
    id: 'mono',
    level: 1,
    codename: 'STARTER NODE',
    title: 'أحادي',
    subtitle: 'بداية الدخول إلى المنظومة',
    slots: 1,
    features: [
      '1 Expansion Slot',
      'دخول الوكالات',
      'بدء نظام المكافآت',
      'Credo AI الأساسي',
      'فتح ملفك القيادي',
      'بداية بناء الشبكة',
    ],
    cta: 'ابدأ رحلتك',
    href: '/packages',
    badge: null,
    power: 1,
  },
  {
    id: 'triple',
    level: 3,
    codename: 'EXPANSION LEVEL',
    title: 'ثلاثي',
    subtitle: 'ابدأ التوسع وبناء فريقك',
    slots: 3,
    features: [
      '3 Expansion Slots',
      'توسع أسرع',
      'تتبع الأداء',
      'مكافآت أعلى',
      'أدوات قيادية',
      'توسيع الوكالة',
    ],
    cta: 'ابدأ التوسع',
    href: '/packages',
    badge: 'الأكثر توازناً',
    featured: true,
    power: 2,
  },
  {
    id: 'seven',
    level: 7,
    codename: 'LEGACY ACCESS',
    title: 'سباعي',
    subtitle: 'تحكم كامل داخل المنظومة',
    slots: 7,
    features: [
      '7 Expansion Slots',
      'أقصى قدرات التوسع',
      'صلاحيات قيادية متقدمة',
      'أدوات الوكالات الكاملة',
      'مكافآت موسعة',
      'Credo AI المتقدم',
      'مسار Legacy',
    ],
    cta: 'ادخل مستوى القادة',
    href: '/packages',
    badge: 'LEGACY LEVEL',
    power: 3,
  },
]

export const COMPARISON_ROWS = [
  {
    key: 'expansion',
    label: 'قدرة التوسع',
    values: ['1 Expansion Slot', '3 Expansion Slots', '7 Expansion Slots'],
  },
  {
    key: 'agency',
    label: 'وصول الوكالات',
    values: ['دخول أساسي', 'توسيع الوكالة', 'أدوات كاملة'],
  },
  {
    key: 'rewards',
    label: 'نظام المكافآت',
    values: ['بداية', 'مكافآت أعلى', 'مكافآت موسعة'],
  },
  {
    key: 'leadership',
    label: 'مسار القيادة',
    values: ['ملف قيادي', 'أدوات قيادية', 'صلاحيات متقدمة'],
  },
  {
    key: 'ai',
    label: 'Credo AI',
    values: ['أساسي', 'متقدم جزئي', 'متقدم كامل'],
  },
  {
    key: 'community',
    label: 'ميزات المجتمع',
    values: ['شبكة أولية', 'فريق وتتبع', 'منظومة كاملة'],
  },
  {
    key: 'analytics',
    label: 'التحليلات المتقدمة',
    values: ['—', 'تتبع الأداء', 'تحليلات موسعة'],
  },
  {
    key: 'legacy',
    label: 'مسار Legacy',
    values: ['—', '—', 'LEGACY ACCESS'],
  },
]

export const JOURNEY_STEPS = [
  {
    level: 'أحادي',
    phase: 'تبدأ',
    desc: 'تدخل المنظومة، تفتح ملفك القيادي، وتبني أول عقدة في شبكتك.',
  },
  {
    level: 'ثلاثي',
    phase: 'تتوسع',
    desc: 'توسّع بثلاث عقد، تبني فريقك، وتسرّع زخم الوكالة والمكافآت.',
  },
  {
    level: 'سباعي',
    phase: 'تقود',
    desc: 'تتحكم بأقصى قدرات التوسع، قيادة المنظومة، ومسار Legacy.',
  },
]
