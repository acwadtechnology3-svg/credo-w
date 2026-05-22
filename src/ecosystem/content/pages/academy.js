const next = (label, links) => ({ type: 'next', label, links })

export const academyPage = {
  slug: '/academy',
  loginRequired: false,
  goal: 'تحويل المستخدم لقائد — preview مجاني',
  hero: {
    eyebrow: 'الأكاديمية · Leadership Academy',
    title: 'مركز التعلّم والقيادة',
    subtitle:
      'Leadership Academy · Business Growth · Recruitment Psychology · Expansion Strategy · Digital Branding · Agency Management · AI Leadership — مع نظام تقدّم، شهادات، وgamification.',
    actions: [
      { label: 'معاينة المسارات', href: '/academy#tracks' },
      { label: 'الوصول الكامل', href: '/courses', requiresAuth: true, gateMessage: 'الدورات الكاملة بعد تسجيل الدخول.' },
    ],
  },
  sections: [
    {
      type: 'academy-tracks',
      id: 'tracks',
      title: 'مسارات التعلّم الكاملة',
      subtitle: 'كل مسار يبني جزءًا من قصة القائد في المنظومة',
      gamificationNote: 'نظام التقدّم: XP، شارات تعليمية، وشهادات رقمية عند إكمال المستويات. المعاينة هنا — التسجيل في الدورات بعد التفعيل.',
      tracks: [
        {
          title: 'Leadership Academy',
          levels: 6,
          progressPreview: 35,
          desc: 'أساسيات القيادة داخل منظومة توسع رقمية.',
          modules: ['الثقة والشرعية', 'اجتماعات الفريق', 'قراءة اللوحات', 'تفويض المهام'],
          certificate: 'شهادة قائد مبتدئ',
        },
        {
          title: 'Business Growth',
          levels: 5,
          progressPreview: 20,
          desc: 'نمو الأعمال: أهداف، مؤشرات، وخطط أسبوعية.',
          modules: ['OKRs للفريق', 'تحليل BV', 'تحسين التحويل'],
          certificate: 'شهادة نمو أعمال',
        },
        {
          title: 'Recruitment Psychology',
          levels: 4,
          progressPreview: 10,
          desc: 'علم نفس التواصل والإقناع الأخلاقي — بدون ضغط.',
          modules: ['الاستماع', 'قصة المنظومة', 'اعتراضات شائعة'],
          certificate: 'شهادة تواصل',
        },
        {
          title: 'Expansion Strategy',
          levels: 5,
          progressPreview: 15,
          desc: 'استراتيجية توسع: حملات، أحداث، وشراكات.',
          modules: ['خطة 90 يوم', 'توسع إقليمي', 'تحديات جماعية'],
          certificate: 'شهادة توسع',
        },
        {
          title: 'Digital Branding',
          levels: 4,
          progressPreview: 25,
          desc: 'علامتك كقائد: محتوى، هوية، وثقة رقمية.',
          modules: ['بروفايل احترافي', 'محتوى تعليمي', 'امتثال إعلاني'],
        },
        {
          title: 'Agency Management',
          levels: 6,
          progressPreview: 5,
          desc: 'إدارة وكالة: أعضاء، نزاعات، وأداء.',
          modules: ['onboarding أعضاء', 'لوحات الوكالة', 'قواعد النزاهة'],
          certificate: 'شهادة مدير وكالة',
        },
        {
          title: 'AI Leadership',
          levels: 3,
          progressPreview: 40,
          desc: 'استخدام Credo AI في القرار اليومي.',
          modules: ['برومبتات قيادة', 'تلخيص تقارير', 'تدريب الفريق على AI'],
          certificate: 'شهادة AI Leader',
        },
      ],
    },
    {
      type: 'grid',
      id: 'gamification',
      title: 'Progress · Certificates · Gamification',
      columns: 3,
      items: [
        { title: 'Progress System', text: 'شريط تقدّم لكل مسار ومهمة فرعية.', tag: 'XP' },
        { title: 'Certificates', text: 'شهادات رقمية قابلة للمشاركة (بدون مبالغة).', tag: '🎓' },
        { title: 'Gamification', text: 'تحديات تعليمية مرتبطة بسلوك نمو حقيقي.', tag: '🏆' },
      ],
    },
    {
      type: 'cta',
      id: 'enroll',
      title: 'ابدأ التعلّم',
      actions: [
        { label: 'معاينة الدورات', href: '/academy' },
        { label: 'سجّل للوصول الكامل', href: '/register' },
      ],
    },
    next('مجتمع', [{ href: '/community', title: 'المجتمع', subtitle: 'تعلّم مع قادة' }]),
  ],
}
