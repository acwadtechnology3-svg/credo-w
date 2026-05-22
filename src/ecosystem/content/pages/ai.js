const next = (label, links) => ({ type: 'next', label, links })

export const aiPage = {
  slug: '/ai',
  loginRequired: false,
  goal: 'عرض الذكاء الاصطناعي — demo محدود · كامل بعد الدخول',
  hero: {
    eyebrow: 'Credo AI',
    title: 'مرشد المنظومة الذكي',
    subtitle:
      'onboarding · شرح الرتب · شرح المكافآت · شرح الوكالات · توصية باقة · تدريب قيادة · تحليلات وتنبؤات. للزائر: معاينة. للعضو: ربط كامل بحسابك ووكالتك.',
    actions: [
      { label: 'جرب الصوت', href: '/ai#voice' },
      { label: 'ابدأ رحلتك', href: '/start' },
    ],
  },
  sections: [
    {
      type: 'voice-demo',
      id: 'voice',
      title: 'Voice Interactive — تحدث مع AI',
      subtitle: 'محاكاة تجربة الصوت — المحادثة الحية بعد التفعيل',
      idleText: 'اضغط للبدء — Credo AI يستمع (معاينة).',
      activeText: '🎙️ «اسألني أي شيء عن المنظومة — الباقات، الوكالة، المحفظة، أو رتبتك القادمة.»',
      prompts: [
        'اشرح لي الفرق بين الباقات',
        'كيف أختار وكالة مناسبة؟',
        'ما شروط رتبة Team Leader؟',
        'هل يمكن سحب C Money اليوم؟',
      ],
      note: 'Multilingual: العربية، English، و لغات إضافية حسب الإعداد.',
    },
    {
      type: 'grid',
      id: 'does',
      title: 'What Credo AI Does',
      columns: 2,
      items: [
        { title: 'Onboarding', text: 'قائمة مهام ديناميكية، شرح كل خطوة، وتذكير بما تبقى.', tag: 'بداية' },
        { title: 'Explain Ranks', text: 'يفكك شروط الرتبة التالية بلغة بسيطة.', tag: 'رتب' },
        { title: 'Explain Rewards', text: 'من أين جاءت كل حركة في المحفظة.', tag: 'مكافآت' },
        { title: 'Explain Agencies', text: 'راعي، placement، وأنواع الوكالات.', tag: 'وكالات' },
        { title: 'Recommend Package', text: 'أسئلة عن هدفك → اقتراح 1/3/7.', tag: 'باقات' },
        { title: 'Growth Coaching', text: 'نصائح يومية حسب أداء PV/BV.', tag: 'تدريب' },
      ],
    },
    {
      type: 'rich',
      id: 'capabilities',
      title: 'AI Capabilities',
      blocks: [
        {
          heading: 'Analytics — تحليلات',
          paragraphs: ['قراءة اتجاهات الفريق، تنبيه عند انخفاض BV، ومقارنة بفترات سابقة.'],
        },
        {
          heading: 'Predictions — تنبؤات',
          paragraphs: ['تقدير أقرب رتبة، احتمال تحقيق هدف أسبوعي — تعليمي لا ضمان.'],
        },
        {
          heading: 'Smart Placement Help',
          paragraphs: ['شرح أين سيوضع العضو الجديد ولماذا — حسب سياسة الوكالة.'],
        },
        {
          heading: 'Leadership Guidance',
          paragraphs: ['اقتراح من تدرب، متى تعقد اجتماعًا، وكيف تشرح المنظومة بأخلاقية.'],
        },
      ],
    },
    {
      type: 'split',
      id: 'future',
      title: 'AI Future Vision',
      paragraphs: [
        'المستقبل: AI يعمل كـ «ضابط عمليات» للوكالة: يجهز تقارير، يلخص طلبات الانضمام، ويقترح حملات توسع.',
        'تكامل أعمق مع الصوت، الواقع المعزز للتدريب، وترجمة فورية للمجتمع العالمي.',
      ],
      panelTitle: 'الآن vs قريبًا',
      panelItems: [
        { label: 'الآن', value: 'نص + صوت معاينة' },
        { label: 'قريبًا', value: 'تنبؤات تشغيلية' },
        { label: 'للعضو', value: 'سياق حساب كامل' },
      ],
    },
    {
      type: 'cta',
      id: 'full-ai',
      title: 'الوصول الكامل',
      subtitle: 'Limited demo للزائر · Full usage بعد login + تفعيل',
      actions: [
        { label: 'إنشاء حساب', href: '/register' },
        { label: 'تسجيل دخول', href: '/login' },
      ],
    },
    next('تعلّم', [{ href: '/academy', title: 'الأكاديمية', subtitle: 'قيادة + AI' }]),
  ],
}
