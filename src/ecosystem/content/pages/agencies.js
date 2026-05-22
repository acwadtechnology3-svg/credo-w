const next = (label, links) => ({ type: 'next', label, links })

export const agenciesPage = {
  slug: '/agencies',
  loginRequired: false,
  goal: 'تحويل الزائر إلى شريك — فهم الوكالة كنموذج توسع',
  hero: {
    eyebrow: 'وحدات التوسع الرقمية',
    title: 'عالم الوكالات في Credo W',
    subtitle:
      'الوكالة منظمة نمو رقمية: مؤسس، قادة، أعضاء، إنجازات، ونشاط حي. ليست فرق MLM عشوائية — بنية قيادة قابلة للتوسع مع قواعد رعاية و placement واضحة.',
    actions: [
      { label: 'كن شريك توسع', href: '/partners' },
      { label: 'طرق الانضمام', href: '/agencies#join' },
    ],
  },
  sections: [
    {
      type: 'philosophy',
      id: 'what',
      title: 'ما هي الوكالة؟',
      subtitle: 'تعريف يخدم الثقة — لا التضليل.',
      lead: 'الوكالة = كيان توسع داخل المنظومة: تجمع أشخاصًا تحت رؤية واحدة، تتتبع النمو (PV/BV)، توزّع المكافآت حسب القواعد، وتمنح القادة أدوات إدارة وتحليلات. فيها مؤسس يحمل الرؤية، قادة يديرون الفرق، وأعضاء ينمون ضمن شجرة منظمة.',
    },
    {
      type: 'grid',
      id: 'types',
      title: 'أنواع الوكالات',
      subtitle: 'نماذج مختلفة لمراحل مختلفة من التوسع.',
      columns: 2,
      items: [
        {
          title: 'Founder Agency — وكالة مؤسس',
          text: 'تُبنى من الصفر بعلامة ورؤية المؤسس. مسؤولة عن الثقافة، التوظيف الأولي، وضبط معايير النمو.',
          bullets: ['إنشاء هوية الوكالة', 'تعيين قادة أول', 'ربط بقواعد المنظومة العليا'],
          tag: 'مؤسس',
        },
        {
          title: 'Regional Agency — وكالة إقليمية',
          text: 'إدارة منطقة جغرافية أو قطاع: عدة فرق، مؤشرات نمو إقليمية، وتنسيق مع وكالات أخرى.',
          bullets: ['تقارير إقليمية', 'أحداث محلية', 'توسع متعدد الفرق'],
          tag: 'إقليمي',
        },
        {
          title: 'Leadership Agency — وكالة قيادة',
          text: 'تركّز على تطوير القادة وطبقات الإنجاز — أقل تركيز على العدد وأكثر على جودة التنظيم.',
          bullets: ['برامج تدريب', 'رتب قيادية', 'مكافآت إنجاز'],
          tag: 'قيادة',
        },
        {
          title: 'Expansion Unit — وحدة توسع',
          text: 'خلية سريعة النمو داخل شبكة أكبر — مهام محددة، أهداف زمنية، ودمج مع شجرة الأم.',
          bullets: ['حملات توسع', 'أهداف BV', 'تكامل مع الوكالة الأم'],
          tag: 'وحدة',
        },
      ],
    },
    {
      type: 'rich',
      id: 'structure',
      title: 'بنية التوسع — Sponsor · Placement · Hierarchy',
      blocks: [
        {
          heading: 'نظام الراعي (Sponsor)',
          paragraphs: [
            'الراعي من دعاك للمنظومة ويرشدك — علاقة إرشاد ومساءلة. قد يختلف عن موقعك في الشجرة.',
            'يدعم onboarding، يشرح القواعد، ويُسجل في نظام الدعوات.',
          ],
          list: ['دعوة برمز إحالة', 'دعوة باسم مستخدم الراعي', 'تتبع في لوحة الإحالات'],
        },
        {
          heading: 'Placement — يسار / يمين',
          paragraphs: [
            'موقعك في شجرة التنظيم (غالبًا Binary): فرع يسار وفرع يمين. يحدد توزيع BV وأحيانًا قواعد التوازن.',
            'الفرانشايز أو النظام يحدد سياسة الـ placement عند التسجيل.',
          ],
        },
        {
          heading: 'التسلسل الهرمي للقيادة',
          paragraphs: [
            'عضو → قائد فريق → قائد وكالة → شريك توسع. كل مستوى صلاحيات ومكافآت مختلفة.',
            'الشجرة (Genealogy / Placement Tree) مرئية بعد التفعيل — للشفافية لا للإحراج.',
          ],
        },
        {
          heading: 'شجرة النمو (Growth Tree)',
          paragraphs: [
            'تمثيل بصري للتنظيم: من أنت، من تحتك، وأين يتدفق الحجم. أدوات ذكية تساعد على قراءة الضعف والقوة في الفريق.',
          ],
        },
      ],
    },
    {
      type: 'join-methods',
      id: 'join',
      title: 'طرق الانضمام لوكالة',
      subtitle: 'كل الطرق تتطلب حسابًا مفعّلًا — المعاينة هنا للشفافية فقط.',
      methods: [
        { icon: 'code', title: 'رمز دعوة (Invite Code)', text: 'كود قصير من القائد أو الوكالة — يملأ تلقائيًا عند التسجيل.', example: 'CREDO-AG-2044' },
        { icon: 'sponsor', title: 'اسم مستخدم الراعي', text: 'إدخال @username للراعي لربط علاقة الإرشاد والدعوة.', example: '@leader_amira' },
        { icon: 'id', title: 'معرّف الوكالة (Agency ID)', text: 'للانضمام لوكالة محددة مباشرة من صفحة الوكالة أو الرابط.', example: 'AGY-7F2K' },
        { icon: 'qr', title: 'دعوة QR', text: 'مسح رمز من حدث أو مادة تسويق — ينقلك لتسجيل مسبق الربط.', example: 'QR Dynamic Link' },
      ],
      note: 'لا يمكن إتمام الانضمام الفعلي، فتح الشجرة، أو استلام مكافآت شخصية بدون تسجيل وتفعيل باقة.',
    },
    {
      type: 'featured-agencies',
      id: 'featured',
      title: 'وكالات مميزة (معاينة)',
      subtitle: 'بيانات توضيحية — القائمة الحية من التطبيق بعد الدخول.',
      agencies: [
        {
          initials: 'CR',
          name: 'Credo Rising',
          founder: 'قائد توسع إقليمي',
          growth: '+24% شهري',
          achievements: '12 شارة',
          activity: 'نشط الآن',
          desc: 'تركّز على تدريب القادة الجدد و onboarding سريع بلغتين.',
        },
        {
          initials: 'NV',
          name: 'Nova Leaders',
          founder: 'مؤسس وكالة',
          growth: '+18% شهري',
          achievements: '9 شارات',
          activity: 'حدث مباشر',
          desc: 'وكالة قيادة — أهداف BV أسبوعية وتحديات جماعية.',
        },
        {
          initials: 'EX',
          name: 'Expansion X',
          founder: 'وحدة توسع',
          growth: '+31% شهري',
          achievements: '15 شارة',
          activity: 'فوز وكالة',
          desc: 'خلية توسع سريعة متكاملة مع شبكة إقليمية أكبر.',
        },
      ],
      previewNote: 'لعرض الوكالات الحقيقية، المؤسسين، والانضمام: سجّل دخولك ثم /agencies/discover',
    },
    {
      type: 'rich',
      id: 'agency-rewards',
      title: 'مكافآت الوكالة',
      blocks: [
        {
          heading: 'العمولات (Commissions)',
          paragraphs: ['عمولات مرتبطة بحجم الفريق والقناة (تجزئة، فريق، رتبة). تظهر في محفظة الأرباح مع تفصيل المصدر.'],
        },
        {
          heading: 'الرتب (Ranks)',
          paragraphs: ['كل رتبة تفتح نسبًا أو مكافآت إضافية. شروط الترقية: PV/BV، تدريب، زمن، وأحيانًا عدد قادة.'],
        },
        {
          heading: 'مكافآت التوسع (Expansion Bonuses)',
          paragraphs: ['حوافز عند إنجاز أهداف توسع جماعية — حملات، أسبوع BV، أو إطلاق وحدة جديدة.'],
        },
        {
          heading: 'فتح الطبقات (Unlocks)',
          paragraphs: ['أدوات تسويق، تقارير متقدمة، صلاحيات دعوة، وإدارة وكالة — حسب الرتبة والباقة.'],
        },
      ],
    },
    {
      type: 'cta',
      id: 'apply',
      title: 'انضم أو ابنِ',
      subtitle: 'تحويل الزائر إلى شريك — وليس مجرد زيارة.',
      actions: [
        { label: 'Become Partner — كن شريكًا', href: '/partners' },
        { label: 'Join Existing Agency', href: '/register', requiresAuth: true, gateMessage: 'أنشئ حسابًا ثم اختر وكالتك من onboarding.' },
        { label: 'استكشف داخل التطبيق', href: '/agencies/discover', requiresAuth: true },
      ],
    },
    next('تابع', [
      { href: '/partners', title: 'الشركاء', subtitle: 'بناء كيانك' },
      { href: '/packages', title: 'الباقات', subtitle: 'جاهزية الدخول' },
      { href: '/faq', title: 'أسئلة الوكالات', subtitle: 'شفافية' },
    ]),
  ],
}
