import rateLimit from 'express-rate-limit'

const isProd = process.env.NODE_ENV === 'production'

export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProd ? 5 : 50,
  message: { error: 'Too many login attempts. Try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
})

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProd ? 100 : 10_000,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    if (isProd) return false
    const p = req.path || ''
    return p.startsWith('/auth') || p === '/health' || p.startsWith('/health/')
  },
  handler: (_req, res) => {
    res.status(429).json({
      error: isProd
        ? 'Too many requests. Please slow down.'
        : 'طلبات كثيرة — انتظر دقيقة وحاول مرة أخرى',
    })
  },
})

export const financialLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: isProd ? 10 : 100,
  message: { error: 'Too many financial requests. Wait a moment.' },
  standardHeaders: true,
  legacyHeaders: false,
})
