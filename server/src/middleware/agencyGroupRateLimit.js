import rateLimit from 'express-rate-limit'

export const agencyGroupMessageLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 40,
  message: { error: 'رسائل كثيرة — انتظر دقيقة' },
  standardHeaders: true,
  legacyHeaders: false,
})

export const agencyGroupModerationLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  message: { error: 'محاولات إشراف كثيرة' },
  standardHeaders: true,
  legacyHeaders: false,
})
