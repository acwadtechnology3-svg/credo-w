import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.middleware.js'
import { profileController } from '../controllers/profile.controller.js'

const router = Router()
router.use(authMiddleware)
router.get('/', profileController.getProfile)
router.get('/hub', profileController.getProfileHub)
router.patch('/identity', profileController.updateIdentitySettings)
router.put('/', profileController.updateProfile)
/** POST /api/profile/avatar — upload profile photo (base64 + filename) */
router.post('/avatar', profileController.uploadProfileImage)
router.post('/change-password', profileController.changePassword)
router.post('/set-pin', profileController.setCMoneyPin)
router.get('/has-pin', profileController.hasCMoneyPin)

export { router as profileRouter }
