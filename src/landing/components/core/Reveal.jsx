import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import { fadeUp } from '../../motion/variants'
import usePrefersReducedMotion from '../../hooks/usePrefersReducedMotion'

export default function Reveal({
  children,
  className = '',
  delay = 0,
  as: Tag = 'div',
  once = true,
  amount = 0.2,
}) {
  const ref = useRef(null)
  const inView = useInView(ref, { once, amount })
  const reduced = usePrefersReducedMotion()
  if (reduced) {
    return (
      <div ref={ref} className={className}>
        {children}
      </div>
    )
  }

  return (
    <motion.div
      ref={ref}
      className={className}
      initial="hidden"
      animate={inView ? 'visible' : 'hidden'}
      variants={fadeUp}
      custom={delay}
    >
      {children}
    </motion.div>
  )
}
