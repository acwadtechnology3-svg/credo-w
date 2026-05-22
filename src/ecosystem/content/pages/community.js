const next = (label, links) => ({ type: 'next', label, links })

export const communityPage = {
  slug: '/community',
  loginRequired: false,
  goal: 'خلق انتماء — partial بدون login',
  hero: {
    eyebrow: 'المجتمع · Community',
    title: 'مجتمع Credo W',
    subtitle:
      'Live Activity · Agency Wins · Events · Community Feed · Leaderboards · Success Stories · Challenges — انتماء يبني ثقة واستمرارية.',
    actions: [
      { label: 'شاهد النشاط', href: '/community#live' },
      { label: 'تفاعل كامل', href: '/customer/community', requiresAuth: true },
    ],
  },
  sections: [
    {
      type: 'activity-feed',
      id: 'live',
      title: 'Live Activity — نشاط حي',
      items: [
        { type: 'فوز', text: 'وكالة Credo Rising أنهت تحدي BV أسبوعي', time: 'الآن' },
        { type: 'رتبة', text: 'عضو جديد وصل Rank Bronze', time: 'منذ 5 د' },
        { type: 'حدث', text: 'بث مباشر: قيادة رقمية الليلة 8م', time: 'منذ 20 د' },
        { type: 'إنجاز', text: '1000 ساعة تعلّم مجتمعية هذا الشهر', time: 'منذ 1 س' },
      ],
      note: 'التفاعل (تعليق، مشاركة، دعوة لحدث) يتطلب حسابًا مفعّلًا.',
    },
    {
      type: 'grid',
      id: 'wins',
      title: 'Agency Wins — انتصارات الوكالات',
      columns: 3,
      items: [
        { title: 'Nova Leaders', text: 'أفضل نمو BV إقليمي — الأسبوع الماضي.' },
        { title: 'Expansion X', text: 'أكبر عدد قادة جدد مؤهلين.' },
        { title: 'Credo Rising', text: 'أعلى نسبة إكمال onboarding.' },
      ],
    },
    {
      type: 'grid',
      id: 'events',
      title: 'Events — أحداث',
      columns: 2,
      items: [
        { title: 'مؤتمر قادة رقمي', text: 'جلسات AI + توسع — تسجيل مسبق.', tag: 'قريبًا' },
        { title: 'لقاء مؤسسي', text: 'Q&A مع فريق Credo — شفافية وأسئلة مفتوحة.', tag: 'شهري' },
        { title: 'تحدي وكالة', text: '30 يوم BV — جوائز مجتمعية.', tag: 'تحدي' },
      ],
    },
    {
      type: 'rich',
      id: 'feed',
      title: 'Community Feed — خلاصة المجتمع',
      blocks: [
        {
          heading: 'ماذا يُنشر؟',
          paragraphs: ['قصص نجاح، نصائح قيادة، إعلانات أحداث، وتحديثات وكالات — بإشراف للجودة.'],
          list: ['لا وعود دخل مضللة', 'احترام الخصوصية', 'دعم الأعضاء الجدد'],
        },
      ],
    },
    {
      type: 'leaderboard',
      id: 'leaderboards',
      title: 'Leaderboards',
      subtitle: 'تحفيز صحي — ليس استنزافًا',
      entries: [
        { name: 'قائدة أميرة', metric: 'BV +12.4k' },
        { name: 'وكالة Nova', metric: 'قادة جدد 18' },
        { name: 'فريق Rising', metric: 'onboarding 94%' },
        { name: 'تحدي مارس', metric: 'إكمال 87%' },
      ],
    },
    {
      type: 'grid',
      id: 'stories',
      title: 'Success Stories · Challenges',
      columns: 2,
      items: [
        {
          title: 'قصة: من 1 إلى 3 في 90 يوم',
          text: 'عضو بدأ أحادي، فهم المنظومة عبر AI، انضم لوكالة، وبنى فريقًا صغيرًا منظمًا.',
        },
        {
          title: 'تحدي: أسبوع الدعوات الأخلاقية',
          text: 'شارك قصتك لا ضغطك — جوائز تعليمية وشارات.',
        },
      ],
    },
    {
      type: 'cta',
      id: 'join-community',
      title: 'كن جزءًا من المجتمع',
      actions: [
        { label: 'ابدأ', href: '/start' },
        { label: 'دخول للتفاعل', href: '/login' },
      ],
    },
    next('تالي', [{ href: '/about', title: 'حول كريدو', subtitle: 'الحركة' }]),
  ],
}
