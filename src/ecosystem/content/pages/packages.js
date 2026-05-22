const next = (label, links) => ({ type: 'next', label, links })

export const packagesPage = {
  slug: '/packages',
  loginRequired: false,
  goal: 'اختيار مسار الدخول — فهم 1 · 3 · 7 بالتفصيل',
  hero: {
    eyebrow: 'مسارات الدخول · Access Levels',
    title: 'الباقات — جاهزية للتوسع',
    subtitle:
      'ليست «اشتراك شهري» ولا شراء اندفاعي. كل باقة مستوى وصول: عدد slots، مكافآت، BV، ما يُفتح من onboarding وقيادة ووكالات. المعاينة هنا كاملة — الشراء والتفعيل بعد الحساب.',
    actions: [
      { label: 'ابدأ بالأحادي', href: '/start' },
      { label: 'قارن الجدول', href: '/packages#compare' },
    ],
  },
  sections: [
    {
      type: 'philosophy',
      id: 'philosophy',
      title: 'فلسفة الباقات',
      subtitle: 'Access Level — وليس Subscription',
      lead: 'أنت تشتري جاهزية للدخول في منظومة توسع رقمية: هوية، AI، تحليلات، أهلية وكالة، وطبقات مكافآت. الترقية 1→3→7 مسار طبيعي عندما ينمو تنظيمك — وليس ضغطًا للبيع.',
    },
    {
      type: 'package-cards',
      id: 'grid',
      title: 'الباقات — تفاصيل كل طبقة',
      subtitle: 'slots · مكافآت · BV · فتح أنظمة · onboarding · قيادة',
      packages: [
        {
          tier: '1',
          name: 'أحادي — Single Tier',
          tagline: 'دخول شخصي · بداية ذكية · تعلّم المنظومة',
          specs: [
            { label: 'Slots', value: '1 موقع' },
            { label: 'BV أساسي', value: 'حد أدنى للبداية' },
            { label: 'Onboarding', value: 'مسار أساسي + AI' },
            { label: 'قيادة', value: 'عضو → مرشح قائد' },
          ],
          unlocks: ['Credo AI أساسي', 'محفظة C Money', 'تقارير PV', 'أهلية انضمام وكالة'],
          cta: { label: 'ابدأ بالأحادي', href: '/start' },
        },
        {
          tier: '3',
          name: 'ثلاثي — Triple Tier',
          tagline: 'بداية قيادة · نمو فريق · 3 slots',
          specs: [
            { label: 'Slots', value: '3 مواقع' },
            { label: 'BV', value: 'أعلى من طبقة 1' },
            { label: 'Onboarding', value: 'متقدم + أولوية دعم' },
            { label: 'قيادة', value: 'قائد فريق مبكر' },
          ],
          unlocks: ['تحليلات فريق', 'مكافآت Level أوسع', 'أدوات دعوة', 'أهلية وكالة أقوى'],
          cta: { label: 'استكشف الثلاثي', href: '/start' },
        },
        {
          tier: '7',
          name: 'سباعي — Seven Tier',
          tagline: 'وصول كامل · توسع متقدم · 7 slots',
          specs: [
            { label: 'Slots', value: '7 مواقع' },
            { label: 'BV', value: 'أقصى جاهزية' },
            { label: 'Onboarding', value: 'كامل + مرشد مخصص' },
            { label: 'قيادة', value: 'جاهزية شريك توسع' },
          ],
          unlocks: ['كل أنظمة التحليل', 'أقصى عمولات مؤهلة', 'أولوية أحداث', 'مسار شريك'],
          cta: { label: 'الوصول الكامل', href: '/start' },
        },
      ],
    },
    {
      type: 'compare-table',
      id: 'compare',
      title: 'جدول مقارنة الخطط',
      subtitle: 'features · growth potential · agency eligibility · reward levels',
      columns: ['الميزة', 'أحادي (1)', 'ثلاثي (3)', 'سباعي (7)'],
      rows: [
        { feature: 'عدد Slots', values: ['1', '3', '7'] },
        { feature: 'إمكانية النمو (BV)', values: ['أساسي', 'متوسط', 'عالي'] },
        { feature: 'أهلية الوكالة', values: ['انضمام', 'قيادة مبكرة', 'بناء/شريك'] },
        { feature: 'مستوى المكافآت', values: ['بداية', 'متوسطة', 'كاملة'] },
        { feature: 'Credo AI', values: ['أساسي', 'متقدم', 'كامل + صوت'] },
        { feature: 'التحليلات', values: ['PV', 'فريق', 'تنبؤات'] },
        { feature: 'Onboarding', values: ['قياسي', 'أولوية', 'مخصص'] },
        { feature: 'مسار الترقية', values: ['→ 3', '→ 7', 'نخبة'] },
      ],
    },
    {
      type: 'journey-visual',
      id: 'upgrade',
      title: 'رحلة الترقية 1 → 3 → 7',
      subtitle: 'تقدم طبيعي — ليس قفزة عشوائية',
      stages: [
        { tier: '1', title: 'فهم المنظومة', text: 'تعلّم، أول PV، انضمام وكالة، أول مكافآت.' },
        { tier: '3', title: 'قيادة الفريق', text: 'توسيع slots، BV جماعي، أدوات دعوة.' },
        { tier: '7', title: 'توسع كامل', text: 'أقصى أهلية، شريك، تحليلات متقدمة.' },
      ],
      note: 'قواعد الترقية الفعلية (سعر الفرق، شروط BV، فترة الانتظار) تظهر في حسابك بعد التفعيل.',
    },
    {
      type: 'rich',
      id: 'wallet',
      title: 'نظام المحافظ والدفع',
      blocks: [
        {
          heading: 'C Money',
          paragraphs: [
            'عملة داخلية للمنظومة: استلام مكافآت، شراء داخل المنصة، وتحويلات حيث يسمح النظام.',
            'رصيدك مرئي مع سجل حركات — لا أرقام مخفية.',
          ],
        },
        {
          heading: 'محفظة الأرباح (Earnings Wallet)',
          paragraphs: [
            'عمولات، مكافآت رتب، Fast Start، Level Bonus — تتجمع هنا قبل السحب.',
            'كل حركة مصنّفة: المصدر، التاريخ، الحالة (معلّق / متاح / مسحوب).',
          ],
        },
        {
          heading: 'الدفع الخارجي',
          paragraphs: [
            'تفعيل الباقة عبر قنوات معتمدة (بطاقة، تحويل، محافظ محلية حسب المنطقة).',
            'دفع هجين: جزء C Money + جزء نقدي حيث متاح.',
          ],
        },
        {
          heading: 'FAQ مالي سريع',
          list: [
            'الاسترجاع: حسب سياسة التفعيل المعروضة عند الشراء — لا وعود خارج السياسة.',
            'الترقية: دفع فرق بين المستويات مع احتساب ما دُفع مسبقًا حيث ينطبق.',
            'التفعيل: الباقة لا تعمل كاملة قبل اكتمال KYC والتفعيل.',
            'الحدود: سقف سحب يومي/شهري حسب الرتبة والتحقق — للأمان.',
          ],
        },
      ],
    },
    {
      type: 'cta',
      id: 'buy',
      title: 'جاهز للتفعيل؟',
      subtitle: 'Start With Single · Explore Full Access — الشراء يتطلب حسابًا.',
      actions: [
        { label: 'Start With Single', href: '/start' },
        { label: 'Explore Full Access (7)', href: '/start' },
        { label: 'تفعيل وشراء', href: '/packages', requiresAuth: true, gateMessage: 'سجّل دخولك لإتمام الشراء والتفعيل.' },
      ],
    },
    next('تابع', [
      { href: '/rewards', title: 'المكافآت', subtitle: 'ماذا تكسب' },
      { href: '/ecosystem', title: 'المنظومة', subtitle: 'الصورة الكاملة' },
    ]),
  ],
}
