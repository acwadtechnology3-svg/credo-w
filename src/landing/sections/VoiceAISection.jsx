import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import SectionHeader from '../components/core/SectionHeader'
import SectionShell from '../components/core/SectionShell'
import VoiceOrb from '../components/voice/VoiceOrb'
import { useLandingCopy } from '../../i18n/hooks/useLandingCopy'
import { useTranslation } from 'react-i18next'
import usePrefersReducedMotion from '../hooks/usePrefersReducedMotion'
import { asArray } from '../../lib/safeData.js'

export default function VoiceAISection() {
  const { voiceAi } = useLandingCopy()
  const { t } = useTranslation('ai')
  const intro = voiceAi.introLines?.[0] || ''
  const replies = t('replies', { returnObjects: true })
  const [state, setState] = useState('idle') // idle | listening | speaking
  const [transcript, setTranscript] = useState(intro)
  const [activePrompt, setActivePrompt] = useState(null)
  const reduced = usePrefersReducedMotion()

  const speak = useCallback(
    (text) => {
      setTranscript(text)
      setState('speaking')
      const duration = reduced ? 0 : Math.min(4000, 800 + text.length * 35)
      window.clearTimeout(speak._t)
      speak._t = window.setTimeout(() => setState('idle'), duration)
    },
    [reduced]
  )

  const toggleListen = () => {
    if (state === 'listening') {
      setState('idle')
      setTranscript(intro)
      return
    }
    setState('listening')
    setTranscript(t('listeningHint'))
    window.clearTimeout(toggleListen._t)
    toggleListen._t = window.setTimeout(() => {
      speak(t('choosePrompt'))
    }, reduced ? 0 : 2200)
  }

  const onPrompt = (prompt, i) => {
    setActivePrompt(i)
    const list = Array.isArray(replies) ? replies : []
    speak(list[i] || voiceAi.introLines?.[1] || intro)
  }

  useEffect(() => () => {
    window.clearTimeout(speak._t)
    window.clearTimeout(toggleListen._t)
  }, [speak])

  return (
    <SectionShell id="credo-ai" glow="focal" beat="مرشد ذكي">
      <div className="ld-container ld-voice-section">
        <SectionHeader
          eyebrow={voiceAi.eyebrow}
          title={voiceAi.titleAr}
          titleEn={voiceAi.title}
          subtitle={voiceAi.subtitle}
          align="center"
        />

        <div className="ld-voice-layout">
          <div className="ld-voice-stage">
            <VoiceOrb state={state} onActivate={toggleListen} />
            <p style={{ fontSize: 12, color: 'var(--ld-text-dim)', marginTop: 8, zIndex: 2 }}>
              {state === 'listening' ? t('states.listening') : state === 'speaking' ? t('states.speaking') : t('states.idle')}
            </p>
          </div>

          <div className="ld-voice-prompts">
            <div className="ld-voice-transcript">
              <AnimatePresence mode="wait">
                <motion.p
                  key={transcript}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.35 }}
                  style={{ margin: 0 }}
                >
                  {transcript}
                </motion.p>
              </AnimatePresence>
            </div>

            <p className="ld-eyebrow" style={{ marginTop: 24 }}>
              {t('askLabel')}
            </p>
            {asArray(voiceAi?.prompts).map((prompt, i) => (
              <button
                key={prompt}
                type="button"
                className={`ld-voice-prompt ${activePrompt === i ? 'ld-voice-prompt--active' : ''}`}
                onClick={() => onPrompt(prompt, i)}
              >
                {prompt}
              </button>
            ))}

            <p style={{ fontSize: 11, color: 'var(--ld-text-dim)', marginTop: 16, lineHeight: 1.6 }}>
              جاهز للتكامل: OpenAI Realtime · ElevenLabs · دعم متعدد اللغات
            </p>
          </div>
        </div>
      </div>
    </SectionShell>
  )
}
