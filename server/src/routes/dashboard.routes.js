import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.middleware.js'
import { dashboardController } from '../controllers/dashboard.controller.js'

const router = Router()
router.get('/', authMiddleware, dashboardController.getData)
export { router as dashboardRouter }
