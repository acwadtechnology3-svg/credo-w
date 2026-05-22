import rateLimit from 'express-rate-limit'

export const supportMessageLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: { error: 'رسائل كثيرة — انتظر دقيقة' },
  standardHeaders: true,
  legacyHeaders: false,
})

export const supportTicketLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 15,
  message: { error: 'حد التذاكر — حاول لاحقاً' },
  standardHeaders: true,
  legacyHeaders: false,
})
