const next = (label, links) => ({ type: 'next', label, links })

export const supportPage = {
  slug: '/support',
  loginRequired: false,
  goal: 'مساعدة شاملة — بدون حاجز دخول للاستفسار',
  hero: {
    eyebrow: 'الدعم · Support',
    title: 'مركز المساعدة',
    subtitle:
      'Contact · Tickets · Live Chat · Voice AI Help · Video Tutorials · Onboarding Help · Agency Support — نخلي كل قناة واضحة قبل ما تحتاجها.',
    actions: [
      { label: 'الأسئلة الشائعة', href: '/faq' },
      { label: 'Credo AI', href: '/ai' },
    ],
  },
  sections: [
    {
      type: 'support-channels',
      id: 'channels',
      title: 'قنوات الدعم',
      channels: [
        {
          icon: 'mail',
          title: 'Contact — تواصل',
          text: 'شراكات، وكالات، مؤسسات، واستفسارات عامة: support@credow.com',
          availability: 'رد خلال 24–48 ساعة عمل',
        },
        {
          icon: 'ticket',
          title: 'Tickets — تذاكر',
          text: 'مشكلة تقنية، دفع، أو حساب — افتح تذكرة بعنوان ووصف واضح.',
          availability: 'بعد تسجيل الدخول — تتبع الحالة',
        },
        {
          icon: 'chat',
          title: 'Live Chat — دردشة حية',
          text: 'للأعضاء المفعّلين في ساعات الذروة — أولوية للدفع والتفعيل.',
          availability: '9ص–9م (توقيت القاهرة) تقريبي',
        },
        {
          icon: 'voice',
          title: 'Voice AI Help',
          text: 'اسأل بصوتك — AI يوجّهك للمقال أو الخطوة التالية.',
          availability: 'معاينة في /ai — كامل للعضو',
        },
      ],
    },
    {
      type: 'tutorials',
      id: 'tutorials',
      title: 'Video Tutorials',
      items: [
        { type: 'video', title: 'أول 10 دقائق في Credo', text: 'حساب، باقة، وهوية.', duration: '10:24' },
        { type: 'video', title: 'فهم PV و BV', text: 'مؤشرات بدون تعقيد.', duration: '8:05' },
        { type: 'video', title: 'الانضمام لوكالة', text: 'راعي، placement، QR.', duration: '12:40' },
        { type: 'voice', title: 'اسأل AI صوتيًا', text: 'كيف تستخدم الميكروفون في التطبيق.', duration: '4:15' },
        { type: 'chat', title: 'فتح تذكرة دعم', text: 'خطوة بخطوة.', duration: '3:50' },
      ],
    },
    {
      type: 'rich',
      id: 'onboarding-help',
      title: 'Onboarding Help',
      blocks: [
        {
          heading: 'قبل التفعيل',
          list: ['استكشف /ecosystem و /packages', 'استخدم /start لاختيار مسار', 'اقرأ /faq للشفافية'],
        },
        {
          heading: 'بعد التفعيل',
          list: ['اتبع قائمة AI', 'أكمل KYC', 'اختر وكالة', 'راقب أول مكافأة في المحفظة'],
        },
      ],
    },
    {
      type: 'rich',
      id: 'agency-support',
      title: 'Agency Support',
      blocks: [
        {
          heading: 'للقادة والمؤسسين',
          paragraphs: [
            'دعم خاص بصلاحيات الوكالة: دعوات، طلبات انضمام، نزاعات placement، وتقارير أداء.',
            'تواصل عبر تذكرة بفئة «وكالة» لأولوية أعلى.',
          ],
        },
      ],
    },
    {
      type: 'grid',
      id: 'enterprise',
      title: 'Enterprise & Partnerships',
      columns: 2,
      items: [
        { title: 'شراكات إقليمية', text: 'توسع مع Credo W باتفاقيات واضحة.' },
        { title: 'تكامل تقني', text: 'API و webhooks — للمستوى المؤسسي.' },
      ],
    },
    {
      type: 'cta',
      id: 'ticket-cta',
      title: 'تحتاج مساعدة الآن؟',
      actions: [
        { label: 'افتح تذكرة', href: '/support', requiresAuth: true },
        { label: 'اسأل AI', href: '/ai' },
        { label: 'الأسئلة', href: '/faq' },
      ],
    },
    next('فهم', [{ href: '/ecosystem', title: 'المنظومة', subtitle: 'صورة كاملة' }]),
  ],
}
