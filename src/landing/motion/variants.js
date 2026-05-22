export const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.7,
      delay: i,
      ease: [0.22, 1, 0.36, 1],
    },
  }),
}

export const fadeIn = {
  hidden: { opacity: 0 },
  visible: (i = 0) => ({
    opacity: 1,
    transition: { duration: 0.6, delay: i, ease: 'easeOut' },
  }),
}

export const staggerContainer = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.12, delayChildren: 0.08 },
  },
}

export const floatY = (duration = 4, distance = 10) => ({
  y: [-distance, distance, -distance],
  transition: {
    duration,
    repeat: Infinity,
    ease: 'easeInOut',
  },
})
