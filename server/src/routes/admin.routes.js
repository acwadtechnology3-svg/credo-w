import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.middleware.js'
import { roleGuard } from '../middleware/role.middleware.js'
import { adminController } from '../controllers/admin.controller.js'
import { adminProductsRoutes } from './adminProducts.routes.js'

const router = Router()
router.use(authMiddleware)
router.use(roleGuard('admin', 'super_admin'))

router.get('/overview', adminController.getOverview)

router.get('/users', adminController.getUsers)
router.get('/users/:id/details', adminController.getUserDetails)
router.post('/users/:id/ban', adminController.banUser)
router.post('/users/:id/unban', adminController.unbanUser)
router.get('/users/:id', adminController.getUser)
router.put('/users/:id/status', adminController.updateUserStatus)
router.put('/users/:id/role', adminController.updateUserRole)
router.post('/users/:id/bonus', adminController.grantBonus)

router.get('/withdrawals', adminController.getWithdrawals)
router.put('/withdrawals/:id/process', adminController.processWithdrawal)

router.use(adminProductsRoutes)

router.post('/commission/run', adminController.runCommission)
router.get('/commission/cycles', adminController.getCommissionCycles)
router.get('/commission/cycles/:id', adminController.getCycleDetails)

router.get('/settings', adminController.getSettings)
router.put('/settings/:key', adminController.updateSetting)

router.get('/audit', adminController.getAuditLogs)

router.get('/deposits', adminController.getDeposits)
router.put('/deposits/:id/process', adminController.processDeposit)

router.get('/kyc', adminController.getKycRequests)
router.put('/kyc/:id/process', adminController.processKyc)

router.get('/reports', adminController.getReports)

router.post('/vouchers/generate', adminController.generateVouchers)
router.get('/vouchers', adminController.getVouchers)

export { router as adminRouter }
