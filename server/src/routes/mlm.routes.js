import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.middleware.js'
import { mlmController } from '../controllers/mlm.controller.js'

export const mlmRouter = Router()
mlmRouter.use(authMiddleware)

mlmRouter.get('/dashboard', mlmController.getDashboard)
mlmRouter.get('/metrics', mlmController.getMetrics)
mlmRouter.get('/matching', mlmController.getMatching)
mlmRouter.get('/events', mlmController.getEvents)
