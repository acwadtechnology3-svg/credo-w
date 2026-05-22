import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import cookieParser from 'cookie-parser'
import path from 'path'
import { fileURLToPath } from 'url'
import { healthRouter } from './routes/health.routes.js'
import { mailRouter } from './routes/mail.routes.js'
import { authRouter } from './routes/auth.routes.js'
import { dashboardRouter } from './routes/dashboard.routes.js'
import { teamRouter } from './routes/team.routes.js'
import { shopRouter } from './routes/shop.routes.js'
import { earningsRouter } from './routes/earnings.routes.js'
import { walletRouter } from './routes/wallet.routes.js'
import { withdrawalRouter } from './routes/withdrawal.routes.js'
import { adminRouter } from './routes/admin.routes.js'
import { notificationRouter } from './routes/notification.routes.js'
import { profileRouter } from './routes/profile.routes.js'
import { teamsRouter } from './routes/teams.routes.js'
import { agenciesRouter } from './routes/agencies.routes.js'
import { supportRouter } from './routes/support.routes.js'
import { customerRouter } from './routes/customer.routes.js'
import { marketingRouter } from './routes/marketing.routes.js'
import { franchiseRouter } from './routes/franchise.routes.js'
import { publicRouter } from './routes/public.routes.js'
import { superAdminRouter } from './routes/superAdmin.routes.js'
import { coursesRouter } from './routes/courses.routes.js'
import { packagesRouter } from './routes/packages.routes.js'
import { businessControlRouter } from './routes/businessControl.routes.js'
import { v2Router } from './routes/v2.routes.js'
import { v3Router } from './routes/v3.routes.js'
import { adminFinanceRouter } from './routes/adminFinance.routes.js'
import { pearlsRouter } from './routes/pearls.routes.js'
import { gamificationRouter } from './routes/gamification.routes.js'
import { gamificationAdminRouter } from './routes/gamificationAdmin.routes.js'
import { invitationsRouter } from './routes/invitations.routes.js'
import { treeRouter } from './routes/tree.routes.js'
import { organizationRouter } from './routes/organization.routes.js'
import { mlmRouter } from './routes/mlm.routes.js'
import { mlmAdminRouter } from './routes/mlmAdmin.routes.js'
import { progressionRouter } from './routes/progression.routes.js'
import { progressionAdminRouter } from './routes/progressionAdmin.routes.js'
import { supabase } from './lib/supabase.js'
import { ensurePackagesSeeded } from './lib/seedPackages.js'
import { loginLimiter, apiLimiter, financialLimiter } from './middleware/security.middleware.js'

const DEV_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
]

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const isProd = process.env.NODE_ENV === 'production'
const distPath = path.join(__dirname, '../../dist')

function resolveCorsOrigin() {
  const allowed = process.env.ALLOWED_ORIGIN || process.env.CLIENT_ORIGIN
  if (allowed) return [allowed, ...DEV_ORIGINS]
  return DEV_ORIGINS
}

export function createApp() {
  ensurePackagesSeeded().catch(() => {})

  const app = express()

  app.use(helmet({ contentSecurityPolicy: isProd ? undefined : false }))
  app.use(
    cors({
      origin(origin, callback) {
        if (!origin) return callback(null, true)
        const allowed = resolveCorsOrigin()
        if (allowed.includes(origin)) return callback(null, true)
        if (!isProd) return callback(null, true)
        callback(new Error('Not allowed by CORS'))
      },
      credentials: true,
    })
  )
  app.use(cookieParser())
  app.use(express.json({ limit: '15mb' }))

  app.use('/api/auth/login', loginLimiter)
  app.use('/api/auth/google', loginLimiter)
  app.use('/api/wallet/cmoney/transfer', financialLimiter)
  app.use('/api/withdrawal/request', financialLimiter)
  app.use('/api/v3/finance', financialLimiter)
  app.use('/api', apiLimiter)

  app.use(async (req, res, next) => {
    if (
      req.path.startsWith('/super-admin') ||
      req.path.startsWith('/auth') ||
      req.path === '/health'
    ) {
      return next()
    }
    try {
      const { data } = await supabase
        .from('system_settings')
        .select('value')
        .eq('key', 'maintenance_mode')
        .single()
      if (data?.value === 'true') {
        return res.status(503).json({
          error: 'Platform is under maintenance. Please try again later.',
        })
      }
    } catch {
      /* settings table may not exist yet */
    }
    next()
  })

  app.use('/api', healthRouter)
  app.use('/api', mailRouter)
  app.use('/api/public', publicRouter)
  app.use('/api/auth', authRouter)
  app.use('/api/dashboard', dashboardRouter)
  app.use('/api/team', teamRouter)
  app.use('/api/shop', shopRouter)
  app.use('/api/earnings', earningsRouter)
  app.use('/api/wallet', walletRouter)
  app.use('/api/withdrawal', withdrawalRouter)
  app.use('/api/admin', adminRouter)
  app.use('/api/super-admin', superAdminRouter)
  app.use('/api/super-admin/business', businessControlRouter)
  app.use('/api/notifications', notificationRouter)
  app.use('/api/profile', profileRouter)
  app.use('/api/teams', teamsRouter)
  app.use('/api/agencies', agenciesRouter)
  app.use('/api/support', supportRouter)
  app.use('/api/customer', customerRouter)
  app.use('/api/marketing', marketingRouter)
  app.use('/api/franchise', franchiseRouter)
  app.use('/api/courses', coursesRouter)
  app.use('/api/packages', packagesRouter)
  app.use('/api/v2', v2Router)
  app.use('/api/v3', v3Router)
  app.use('/api/admin/finance', adminFinanceRouter)
  app.use('/api/pearls', pearlsRouter)
  app.use('/api/gamification', gamificationRouter)
  app.use('/api/super-admin/gamification', gamificationAdminRouter)
  app.use('/api/invitations', invitationsRouter)
  app.use('/api/tree', treeRouter)
  app.use('/api/organization', organizationRouter)
  app.use('/api/mlm', mlmRouter)
  app.use('/api/super-admin/mlm', mlmAdminRouter)
  app.use('/api/progression', progressionRouter)
  app.use('/api/super-admin/progression', progressionAdminRouter)

  app.use('/api', (req, res) => {
    res.status(404).json({ error: `Route ${req.method} ${req.originalUrl} not found` })
  })

  if (isProd) {
    app.use(express.static(distPath))
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'))
    })
  }

  app.use((err, req, res, _next) => {
    console.error('Unhandled error:', err)
    res.status(err.status || 500).json({
      error: isProd ? 'Internal server error' : err.message,
    })
  })

  return app
}
