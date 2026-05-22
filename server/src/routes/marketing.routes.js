import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.middleware.js'
import { roleGuard } from '../middleware/role.middleware.js'
import { marketingController } from '../controllers/marketing.controller.js'

const router = Router()
router.use(authMiddleware)

router.get('/', marketingController.getAssets)
router.post('/', roleGuard('admin', 'super_admin'), marketingController.createAsset)
router.delete('/:id', roleGuard('admin', 'super_admin'), marketingController.deleteAsset)

export { router as marketingRouter }
