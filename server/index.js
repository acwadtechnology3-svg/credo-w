import 'dotenv/config'
import { createServer } from 'http'
import { createApp } from './src/app.js'
import { initSocket } from './src/lib/socket.js'
import { startCommissionJob } from './src/jobs/commission.job.js'
import { startFinanceJob } from './src/jobs/finance.job.js'
import { startPurchaseMaintenanceJob } from './src/jobs/purchaseMaintenance.job.js'
import { startGamificationJob } from './src/jobs/gamification.job.js'
import { startMlmJob } from './src/jobs/mlm.job.js'
import { startProgressionJob } from './src/jobs/progression.job.js'

const app = createApp()
const httpServer = createServer(app)
const PORT = process.env.PORT || 3001

let server

if (!process.env.VERCEL) {
  initSocket(httpServer)

  server = httpServer.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`)
    if (process.env.NODE_ENV === 'production') {
      console.log('Serving frontend from /dist')
    }
    startCommissionJob()
    startFinanceJob()
    startPurchaseMaintenanceJob()
    startGamificationJob()
    startMlmJob()
    startProgressionJob()
  })

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(
        `\nPort ${PORT} is already in use. Stop the other process:\n  lsof -ti :${PORT} | xargs kill -9\n`
      )
      process.exit(1)
    }
    throw err
  })

  const shutdown = (signal) => {
    console.log(`\n${signal} — closing server...`)
    server.close((err) => {
      if (err) {
        console.error(err)
        process.exit(1)
      }
      process.exit(0)
    })
    setTimeout(() => process.exit(1), 5000).unref()
  }

  process.on('SIGTERM', () => shutdown('SIGTERM'))
  process.on('SIGINT', () => shutdown('SIGINT'))
}

export default app
