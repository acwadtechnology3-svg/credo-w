import { Router } from 'express'
import { adminProductsController } from '../controllers/adminProducts.controller.js'

/** Routes mounted under /api/admin (auth applied by admin.routes.js) */
export const adminProductsRoutes = Router()

adminProductsRoutes.get('/categories', adminProductsController.getCategories)
adminProductsRoutes.post('/categories', adminProductsController.createCategory)
adminProductsRoutes.put('/categories/:id', adminProductsController.updateCategory)
adminProductsRoutes.delete('/categories/:id', adminProductsController.deleteCategory)

adminProductsRoutes.post('/products/upload-image', adminProductsController.uploadImage)
adminProductsRoutes.get('/products', adminProductsController.getProducts)
adminProductsRoutes.get('/products/:id', adminProductsController.getProduct)
adminProductsRoutes.post('/products', adminProductsController.createProduct)
adminProductsRoutes.put('/products/:id', adminProductsController.updateProduct)
adminProductsRoutes.delete('/products/:id', adminProductsController.deleteProduct)

adminProductsRoutes.get('/orders', adminProductsController.getOrders)
adminProductsRoutes.get('/orders/:id', adminProductsController.getOrder)
adminProductsRoutes.put('/orders/:id/status', adminProductsController.updateOrderStatus)

adminProductsRoutes.get('/coupons', adminProductsController.getCoupons)
adminProductsRoutes.post('/coupons', adminProductsController.createCoupon)
adminProductsRoutes.put('/coupons/:id', adminProductsController.updateCoupon)
adminProductsRoutes.delete('/coupons/:id', adminProductsController.deleteCoupon)

adminProductsRoutes.get('/banners', adminProductsController.getBanners)
adminProductsRoutes.post('/banners', adminProductsController.createBanner)
adminProductsRoutes.put('/banners/:id', adminProductsController.updateBanner)
adminProductsRoutes.delete('/banners/:id', adminProductsController.deleteBanner)

adminProductsRoutes.get('/reviews', adminProductsController.getReviews)
adminProductsRoutes.put('/reviews/:id/process', adminProductsController.processReview)
