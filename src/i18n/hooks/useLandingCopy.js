import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocale } from './useLocale.js'
import { asArray } from '../../lib/safeData.js'

/** Structured landing copy from i18n landing namespace */
export function useLandingCopy() {
  const { t } = useTranslation(['landing', 'navbar', 'ai', 'rewards'])
  const { locale } = useLocale()

  return useMemo(() => {
    const get = (key, opts) => {
      const v = t(key, { returnObjects: true, ns: 'landing', ...opts })
      return Array.isArray(v) || (v && typeof v === 'object') ? v : asArray(v)
    }
    const getList = (key, opts) => asArray(get(key, opts))

    return {
      storyBeats: getList('storyBeats'),
      navSections: [
        { id: 'ecosystem', label: t('navbar:sections.ecosystem') },
        { id: 'vision', label: t('navbar:sections.vision') },
        { id: 'organization', label: t('navbar:sections.organization') },
        { id: 'progression', label: t('navbar:sections.progression') },
        { id: 'credo-ai', label: t('navbar:sections.credoAi') },
        { id: 'cta', label: t('navbar:sections.cta') },
      ],
      hero: {
        ...get('hero'),
        eyebrow: t('hero.eyebrow'),
        title: t('hero.title'),
        titleEn: t('hero.titleEn'),
        lead: t('hero.lead'),
        sub: t('hero.sub'),
      },
      heroStats: getList('hero.stats'),
      ecosystemLayers: getList('ecosystem.layers'),
      vision: (() => {
        const v = get('vision')
        return typeof v === 'object' && v ? { ...v, tags: asArray(v.tags) } : { tags: [] }
      })(),
      leadershipPillars: getList('leadership.pillars'),
      orgFeatures: getList('organization.features'),
      growthSteps: getList('growth.steps'),
      ranks: getList('ranks'),
      rewards: getList('rewards'),
      liveMetrics: getList('metrics'),
      testimonials: getList('testimonials'),
      voiceAi: {
        eyebrow: t('ai:voice.eyebrow', { ns: 'ai' }),
        title: t('ai:voice.title', { ns: 'ai' }),
        titleAr: t('ai:voice.titleSub', { ns: 'ai' }),
        subtitle: t('ai:voice.subtitle', { ns: 'ai' }),
        prompts: asArray(t('ai:voice.prompts', { returnObjects: true, ns: 'ai' })),
        introLines: asArray(t('ai:voice.introLines', { returnObjects: true, ns: 'ai' })),
      },
      progressionStats: [
        { label: t('rewards:progression.achievements', { ns: 'rewards' }), value: 84 },
        { label: t('rewards:progression.unlocks', { ns: 'rewards' }), value: 62 },
        { label: t('rewards:progression.challenges', { ns: 'rewards' }), value: 45 },
        { label: t('rewards:progression.elite', { ns: 'rewards' }), value: 12, locked: true },
      ],
      cta: get('cta'),
      footer: get('footer'),
      faq: get('faq'),
      locale,
    }
  }, [t, locale])
}
