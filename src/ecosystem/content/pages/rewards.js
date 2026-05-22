const next = (label, links) => ({ type: 'next', label, links })

export const rewardsPage = {
  slug: '/rewards',
  loginRequired: false,
  goal: 'شرح الاقتصاد الداخلي بالكامل',
  hero: {
    eyebrow: 'المكافآت · الاقتصاد الداخلي',
    title: 'اقتصاد المكافآت في Credo W',
    subtitle:
      'عمولات · مكافآت رتب · قيادة · إنجازات · أمثلة حية · تدفق محفظة · حاسبة تعليمية. المعاينة للجميع — مكافآتك الشخصية بعد التفعيل.',
    actions: [{ label: 'حاسبة تقديرية', href: '/rewards#calc' }, { label: 'ابدأ', href: '/start' }],
  },
  sections: [
    {
      type: 'philosophy',
      id: 'philosophy',
      title: 'Reward Philosophy',
      lead: 'المكافأة نتيجة تنظيم ونشاط — لا وعدًا ثابتًا للجميع. الشفافية: تعرف القناة، القاعدة، والدورة قبل أن تتعب في التوسع.',
    },
    {
      type: 'grid',
      id: 'commission-types',
      title: 'Commission Types — أنواع العمولات',
      columns: 2,
      items: [
        { title: 'Retail Profit', text: 'ربح من بيع/نشاط تجزئة حيث ينطبق المنتج.', tag: 'تجزئة' },
        { title: 'Fast Start', text: 'حافز بداية سريعة عند أول نشاط مؤهل.', tag: 'بداية' },
        { title: 'Level Bonus', text: 'عمولة على مستويات عمق محددة في الشجرة.', tag: 'مستويات' },
        { title: 'Team Commission', text: 'نسبة من BV الفريق حسب رتبتك.', tag: 'فريق' },
        { title: 'Rank Bonus', text: 'مكافأة لمرة واحدة أو دورية عند رتبة.', tag: 'رتبة' },
        { title: 'Leadership Pool', text: 'حصة قادة من حجم وكالة أو منطقة.', tag: 'قيادة' },
      ],
    },
    {
      type: 'rich',
      id: 'rank-leadership',
      title: 'Rank Bonuses · Leadership Rewards',
      blocks: [
        {
          heading: 'Rank Bonuses',
          paragraphs: ['عند ترقية رتبة: مكافأة تُعلن مسبقًا + فتح نسب جديدة. الشروط في صفحة الرتب داخل التطبيق.'],
        },
        {
          heading: 'Leadership Rewards',
          paragraphs: ['قادة الوكالة: حوافز على أداء الفريق، تحديات جماعية، ومكافآت إطلاق.'],
        },
      ],
    },
    {
      type: 'grid',
      id: 'achievements',
      title: 'Achievement Unlocks',
      columns: 3,
      items: [
        { title: 'شارات البداية', text: 'أول دعوة، أول BV، أول تدريب.' },
        { title: 'شارات القيادة', text: '5 قادة، وكالة نشطة، حدث ناجح.' },
        { title: 'شارات النخبة', text: 'رتب عليا، توسع إقليمي.' },
      ],
    },
    {
      type: 'activity-feed',
      id: 'live-examples',
      title: 'Live Reward Examples — أمثلة حية',
      subtitle: 'بيانات توضيحية — الأمثلة الحقيقية في لوحتك',
      items: [
        { type: 'عمولة', text: 'عضو أكمل أول BV مؤهل — Level Bonus للراعي', time: 'منذ 3 د' },
        { type: 'رتبة', text: 'قائدة وصلت Team Leader — Rank Bonus', time: 'منذ 12 د' },
        { type: 'وكالة', text: 'وكالة Nova حققت هدف أسبوعي — Expansion Bonus', time: 'منذ 1 س' },
        { type: 'سحب', text: 'سحب C Money مكتمل بعد المراجعة', time: 'منذ 2 س' },
      ],
      note: 'الأسماء والمبالغ الحقيقية مخفية هنا — تظهر لك شخصيًا بعد الدخول.',
    },
    {
      type: 'rich',
      id: 'wallet-flow',
      title: 'Wallet Flow — تدفق المحفظة',
      blocks: [
        {
          heading: 'من المكافأة إلى السحب',
          list: [
            '1) احتساب حسب القناة (معلّق)',
            '2) متاح في Earnings Wallet',
            '3) تحويل لـ C Money أو سحب نقدي',
            '4) سجل حركات كامل',
          ],
        },
      ],
    },
    {
      type: 'calculator',
      id: 'calc',
      title: 'Reward Calculator — حاسبة تعليمية',
      subtitle: 'تقدير فقط — ليس التزامًا بدخل',
      disclaimer: 'الأرقام تعليمية. الدخل الفعلي يعتمد على نشاطك، فريقك، والقواعد السارية.',
    },
    {
      type: 'cta',
      id: 'my-rewards',
      title: 'مكافآتك',
      actions: [{ label: 'عرض محفظتي', href: '/earnings/wallet', requiresAuth: true }],
    },
    next('باقات', [{ href: '/packages', title: 'الباقات', subtitle: 'اربط المستوى بالدخل' }]),
  ],
}
