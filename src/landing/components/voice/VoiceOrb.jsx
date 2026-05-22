import { motion } from 'framer-motion'
import { Mic } from 'lucide-react'
import usePrefersReducedMotion from '../../hooks/usePrefersReducedMotion'

const BARS = 24

export default function VoiceOrb({ state = 'idle', onActivate }) {
  const reduced = usePrefersReducedMotion()
  const isListening = state === 'listening'
  const isSpeaking = state === 'speaking'
  const active = isListening || isSpeaking

  return (
    <button
      type="button"
      className={`ld-voice-orb-wrap ${active ? 'ld-voice-orb-wrap--active' : ''}`}
      onClick={onActivate}
      aria-label={isListening ? 'إيقاف الاستماع' : 'اسأل Credo AI'}
    >
      {/* Pulse rings */}
      {!reduced && (
        <>
          <span className="ld-voice-ring ld-voice-ring--1" />
          <span className="ld-voice-ring ld-voice-ring--2" />
          <span className="ld-voice-ring ld-voice-ring--3" />
        </>
      )}

      <motion.div
        className="ld-voice-orb"
        animate={
          reduced
            ? {}
            : {
                scale: isListening ? [1, 1.06, 1] : isSpeaking ? [1, 1.04, 1.02, 1] : [1, 1.02, 1],
                boxShadow: active
                  ? [
                      '0 0 60px rgba(168,85,247,0.5)',
                      '0 0 100px rgba(236,72,153,0.45)',
                      '0 0 60px rgba(168,85,247,0.5)',
                    ]
                  : '0 0 40px rgba(168,85,247,0.25)',
              }
        }
        transition={{ duration: isListening ? 1.2 : 2.5, repeat: Infinity, ease: 'easeInOut' }}
      >
        <div className="ld-voice-orb-core">
          <Mic size={28} strokeWidth={2} color="#fff" />
        </div>
      </motion.div>

      {/* Waveform */}
      <div className={`ld-voice-waveform ${active ? 'ld-voice-waveform--active' : ''}`} aria-hidden>
        {Array.from({ length: BARS }).map((_, i) => (
          <motion.span
            key={i}
            className="ld-voice-bar"
            animate={
              active && !reduced
                ? { scaleY: [0.25, 0.4 + Math.random() * 0.6, 0.3 + Math.sin(i) * 0.2, 0.25] }
                : { scaleY: 0.2 }
            }
            transition={{
              duration: isSpeaking ? 0.35 : 0.6,
              repeat: Infinity,
              delay: i * 0.03,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>
    </button>
  )
}
