import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.middleware.js'
import { shopController } from '../controllers/shop.controller.js'

const router = Router()
router.use(authMiddleware)

router.get('/products', shopController.getProducts)
router.get('/products/:id', shopController.getProduct)
router.get('/cart', shopController.getCart)
router.post('/cart/items', shopController.addToCart)
router.put('/cart/items/:id', shopController.updateCartItem)
router.delete('/cart/items/:id', shopController.removeCartItem)
router.post('/orders', shopController.checkout)
router.get('/orders', shopController.getOrders)
router.get('/orders/:id', shopController.getOrder)
router.get('/shipping', shopController.getShipping)
router.post('/shipping', shopController.addShipping)
router.delete('/shipping/:id', shopController.deleteShipping)

export { router as shopRouter }
