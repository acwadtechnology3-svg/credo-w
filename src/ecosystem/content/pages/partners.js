const next = (label, links) => ({ type: 'next', label, links })

export const partnersPage = {
  slug: '/partners',
  loginRequired: false,
  goal: 'تحويل المستخدم لشريك توسع',
  hero: {
    eyebrow: 'الشركاء · Expansion Leaders',
    title: 'كن شريك توسع في المنظومة',
    subtitle:
      'الشريك ليس مجرد «عضو كبير» — قائد منظومة: يبني وكالة أو يقود توسعًا إقليميًا، يستفيد من عمولات وتحليلات وصلاحيات، ويمثل ثقافة Credo W.',
    actions: [
      { label: 'ابدأ رحلة الشريك', href: '/start' },
      { label: 'دخول الشريك', href: '/login' },
    ],
  },
  sections: [
    {
      type: 'split',
      id: 'become',
      title: 'Become A Partner',
      subtitle: 'Ecosystem Partner · Expansion Leader',
      paragraphs: [
        'شريك التوسع يمتلك رؤية لبناء منظمة رقمية داخل Credo W: يجذب قادة، يدير أداءً، ويتشارك في اقتصاد المكافآت بشفافية.',
        'ليس مطلوبًا أن تبدأ بأكبر باقة — المهم الفهم، الالتزام بالقواعد، واستخدام AI والأكاديمية.',
      ],
      panelTitle: 'من المؤهل؟',
      panelItems: [
        { label: 'الخبرة', value: 'قيادة أو مبيعات شبكية' },
        { label: 'الباقة', value: '3 أو 7 غالبًا' },
        { label: 'الالتزام', value: 'تدريب + امتثال' },
      ],
    },
    {
      type: 'grid',
      id: 'benefits',
      title: 'Partner Benefits — مزايا الشريك',
      columns: 2,
      items: [
        { title: 'Leadership — قيادة', text: 'رتب عليا، تمثيل في أحداث، وتأثير على ثقافة الوكالة.', tag: 'قيادة' },
        { title: 'Commissions — عمولات', text: 'قنوات دخل متعددة مع تفصيل في المحفظة.', tag: 'دخل' },
        { title: 'Rewards — مكافآت', text: 'حوافز توسع، مكافآت رتب، وتحديات جماعية.', tag: 'مكافآت' },
        { title: 'Analytics — تحليلات', text: 'لوحات وكالة، تنبؤات، وتقارير PV/BV/CV.', tag: 'بيانات' },
        { title: 'Agency Access — وصول الوكالات', text: 'إنشاء أو إدارة كيان توسع بصلاحيات كاملة.', tag: 'وكالة' },
        { title: 'Marketing Tools', text: 'روابط دعوة، QR، ومواد رقمية (حسب الرتبة).', tag: 'أدوات' },
      ],
    },
    {
      type: 'flow',
      id: 'journey',
      title: 'Partner Journey — رحلة الشريك',
      steps: [
        { title: 'Register', text: 'حساب، تحقق بريد، وربط راعٍ إن وُجد.' },
        { title: 'Activate Package', text: 'اختيار 3 أو 7 غالبًا — تفعيل مالي وKYC.' },
        { title: 'Onboarding', text: 'AI + فيديو + قائمة مهام حتى أول إنجاز.' },
        { title: 'Join / Build Agency', text: 'انضم لوكالة قوية أو أسّس كيانك.' },
        { title: 'Recruit', text: 'دعوات أخلاقية — شرح المنظومة لا الوعود الكاذبة.' },
        { title: 'Scale', text: 'BV، قادة، رتب، وشريك توسع إقليمي.' },
      ],
    },
    {
      type: 'rich',
      id: 'leadership-system',
      title: 'Leadership System — نظام القيادة',
      blocks: [
        {
          heading: 'الرتب (Ranks)',
          paragraphs: ['كل رتبة شروط: PV/BV، عدد قادة، تدريب إلزامي. الترقية تفتح نسبًا وأدوات.'],
          list: ['شفافية الشروط في لوحتك', 'إشعار AI عند اقتراب الترقية'],
        },
        {
          heading: 'الفتح (Unlocks)',
          paragraphs: ['تقارير متقدمة، حدود سحب أعلى، أحداث خاصة، وموافقة على قادة فرعيين.'],
        },
        {
          heading: 'الإنجازات (Achievements)',
          paragraphs: ['شارات، تحديات، ولوحات صدارة — تحفيز سلوك نمو إيجابي.'],
        },
      ],
    },
    {
      type: 'faq',
      id: 'partner-faq',
      title: 'Partner FAQ',
      items: [
        { category: 'شريك', q: 'هل أحتاج وكالة خاصة؟', a: 'ليس دائمًا — يمكنك البدء كقائد داخل وكالة ثم التأسيس لاحقًا عند استيفاء الشروط.' },
        { category: 'شريك', q: 'ما الفرق بين الشريك والمؤسس؟', a: 'المؤسس يملك علامة الوكالة والمسؤولية الكاملة؛ الشريك قد يقود توسعًا دون تأسيس فوري.' },
        { category: 'شريك', q: 'هل يمكنني الدخول بدون فريق؟', a: 'نعم في البداية — لكن قيمة المنظومة في التوسع المنظم مع الوقت.' },
        { category: 'دخل', q: 'متى أرى أول عمولة؟', a: 'بعد التفعيل، أول نشاط مؤهل، ودورة احتساب المكافآت — تظهر في المحفظة.' },
      ],
    },
    {
      type: 'cta',
      id: 'login-cta',
      title: 'Partner Login CTA',
      actions: [
        { label: 'Partner Login — دخول', href: '/login' },
        { label: 'ابدأ كشريك جديد', href: '/start' },
        { label: 'لوحة الشريك', href: '/dashboard', requiresAuth: true },
      ],
    },
    next('تالي', [
      { href: '/agencies', title: 'الوكالات', subtitle: 'نموذج التوسع' },
      { href: '/academy', title: 'الأكاديمية', subtitle: 'تدريب القادة' },
    ]),
  ],
}
