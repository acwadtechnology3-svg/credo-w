import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocale } from './useLocale.js'

/** Structured landing copy from i18n landing namespace */
export function useLandingCopy() {
  const { t } = useTranslation(['landing', 'navbar', 'ai', 'rewards'])
  const { locale } = useLocale()

  return useMemo(() => {
    const get = (key, opts) => t(key, { returnObjects: true, ns: 'landing', ...opts })

    return {
      storyBeats: get('storyBeats'),
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
      heroStats: get('hero.stats'),
      ecosystemLayers: get('ecosystem.layers'),
      vision: get('vision'),
      leadershipPillars: get('leadership.pillars'),
      orgFeatures: get('organization.features'),
      growthSteps: get('growth.steps'),
      ranks: get('ranks'),
      rewards: get('rewards'),
      liveMetrics: get('metrics'),
      testimonials: get('testimonials'),
      voiceAi: {
        eyebrow: t('ai:voice.eyebrow', { ns: 'ai' }),
        title: t('ai:voice.title', { ns: 'ai' }),
        titleAr: t('ai:voice.titleSub', { ns: 'ai' }),
        subtitle: t('ai:voice.subtitle', { ns: 'ai' }),
        prompts: t('ai:voice.prompts', { returnObjects: true, ns: 'ai' }),
        introLines: t('ai:voice.introLines', { returnObjects: true, ns: 'ai' }),
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
