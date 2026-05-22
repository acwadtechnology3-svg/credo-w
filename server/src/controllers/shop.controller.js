import { supabase } from '../lib/supabase.js'
import { roundMoney } from '../lib/money.js'
import { cartSetupMessage, isCartRlsError, isMissingCartTable } from '../lib/dbErrors.js'
import { bvService } from '../services/bv.service.js'
import { rankService } from '../services/rank.service.js'
import { walletService } from '../services/wallet.service.js'
import { pearlsService } from '../services/pearls.service.js'

export const shopController = {
  async getProducts(req, res) {
    try {
      const { category, search, page = 1, limit = 20 } = req.query
      const offset = (page - 1) * limit

      let query = supabase
        .from('products')
        .select('*', { count: 'exact' })
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .range(offset, offset + parseInt(limit, 10) - 1)

      if (category && category !== 'ALL') query = query.eq('category', category)
      if (search) query = query.ilike('name', `%${search}%`)

      const { data, count } = await query
      return res.json({ data: data || [], total: count })
    } catch {
      return res.status(500).json({ error: 'Server error' })
    }
  },

  async getProduct(req, res) {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', req.params.id)
        .single()
      if (error) return res.status(404).json({ error: 'Product not found' })
      try {
        await pearlsService.triggerMission(req.user.userId, 'shop_visit')
        const { progressionEngine } = await import('../services/progressionEngine.service.js')
        await progressionEngine.triggerMission(req.user.userId, 'shop_visit')
      } catch {
        /* optional */
      }
      return res.json(data)
    } catch {
      return res.status(500).json({ error: 'Server error' })
    }
  },

  async getCart(req, res) {
    try {
      const userId = req.user.userId
      const { data: wallet } = await supabase
        .from('wallets')
        .select('balance')
        .eq('user_id', userId)
        .eq('type', 'CMONEY')
        .single()

      const { data: cartItems, error: cartErr } = await supabase
        .from('cart_items')
        .select('*, products(*)')
        .eq('user_id', userId)

      if (cartErr) {
        const status = isMissingCartTable(cartErr) || isCartRlsError(cartErr) ? 503 : 500
        return res.status(status).json({ error: cartSetupMessage(cartErr) })
      }

      const subtotal = roundMoney(
        (cartItems || []).reduce(
          (s, item) => s + roundMoney(parseFloat(item.products?.price_egp || 0)) * item.quantity,
          0
        )
      )
      const taxAmount = roundMoney(subtotal * 0.14)
      const total = roundMoney(subtotal + taxAmount)

      return res.json({
        items: cartItems || [],
        subtotal,
        taxAmount,
        total,
        cmoneyBalance: roundMoney(wallet?.balance || 0),
      })
    } catch {
      return res.status(500).json({ error: 'Server error' })
    }
  },

  async addToCart(req, res) {
    try {
      const { product_id, quantity = 1 } = req.body
      const userId = req.user.userId

      const { data: product } = await supabase
        .from('products')
        .select('id, name, is_active, stock')
        .eq('id', product_id)
        .single()

      if (!product || !product.is_active) {
        return res.status(404).json({ error: 'Product not found' })
      }

      const { data: existing, error: existErr } = await supabase
        .from('cart_items')
        .select('id, quantity')
        .eq('user_id', userId)
        .eq('product_id', product_id)
        .maybeSingle()

      if (existErr) {
        const status = isMissingCartTable(existErr) || isCartRlsError(existErr) ? 503 : 500
        return res.status(status).json({ error: cartSetupMessage(existErr) })
      }

      if (existing) {
        const { error: updErr } = await supabase
          .from('cart_items')
          .update({ quantity: existing.quantity + quantity })
          .eq('id', existing.id)
        if (updErr) {
          const status = isMissingCartTable(updErr) || isCartRlsError(updErr) ? 503 : 500
          return res.status(status).json({ error: cartSetupMessage(updErr) })
        }
      } else {
        const { error: insErr } = await supabase
          .from('cart_items')
          .insert({ user_id: userId, product_id, quantity })
        if (insErr) {
          console.error('addToCart insert:', insErr.message)
          const status = isMissingCartTable(insErr) || isCartRlsError(insErr) ? 503 : 500
          return res.status(status).json({ error: cartSetupMessage(insErr) })
        }
      }

      try {
        await pearlsService.triggerMission(userId, 'add_to_cart')
      } catch {
        /* optional */
      }

      return res.json({ message: 'Added to cart' })
    } catch {
      return res.status(500).json({ error: 'Server error' })
    }
  },

  async updateCartItem(req, res) {
    try {
      const { quantity } = req.body
      if (quantity < 1) {
        await supabase
          .from('cart_items')
          .delete()
          .eq('id', req.params.id)
          .eq('user_id', req.user.userId)
        return res.json({ message: 'Item removed' })
      }
      await supabase
        .from('cart_items')
        .update({ quantity })
        .eq('id', req.params.id)
        .eq('user_id', req.user.userId)
      return res.json({ message: 'Cart updated' })
    } catch {
      return res.status(500).json({ error: 'Server error' })
    }
  },

  async removeCartItem(req, res) {
    try {
      await supabase
        .from('cart_items')
        .delete()
        .eq('id', req.params.id)
        .eq('user_id', req.user.userId)
      return res.json({ message: 'Removed' })
    } catch {
      return res.status(500).json({ error: 'Server error' })
    }
  },

  async checkout(req, res) {
    try {
      const userId = req.user.userId
      const { shipping_addr_id, voucher_code } = req.body

      const { data: cartItems, error: cartErr } = await supabase
        .from('cart_items')
        .select('*, products(*)')
        .eq('user_id', userId)

      if (cartErr) {
        const status = isMissingCartTable(cartErr) || isCartRlsError(cartErr) ? 503 : 500
        return res.status(status).json({ error: cartSetupMessage(cartErr) })
      }

      if (!cartItems || cartItems.length === 0) {
        return res.status(400).json({ error: 'Cart is empty' })
      }

      const subtotal = roundMoney(
        cartItems.reduce(
          (s, item) => s + roundMoney(parseFloat(item.products.price_egp)) * item.quantity,
          0
        )
      )
      const taxAmount = roundMoney(subtotal * 0.14)
      let discountAmount = 0
      let voucherData = null

      if (voucher_code) {
        const { data: voucher } = await supabase
          .from('vouchers')
          .select('*')
          .eq('code', voucher_code)
          .eq('user_id', userId)
          .eq('status', 'available')
          .gt('expires_at', new Date().toISOString())
          .maybeSingle()

        if (voucher) {
          discountAmount = roundMoney(voucher.discount_amount)
          voucherData = voucher
        }
      }

      const total = roundMoney(subtotal + taxAmount - discountAmount)

      const { data: cmoneyWallet } = await supabase
        .from('wallets')
        .select('balance')
        .eq('user_id', userId)
        .eq('type', 'CMONEY')
        .single()

      if (roundMoney(cmoneyWallet?.balance || 0) < total) {
        return res.status(400).json({ error: 'Insufficient C Money balance' })
      }

      const { data: user } = await supabase
        .from('users')
        .select('user_code')
        .eq('id', userId)
        .single()

      const { count } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)

      const orderRef = `PO-${user.user_code}-${String((count || 0) + 1).padStart(4, '0')}`

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          order_ref: orderRef,
          user_id: userId,
          shipping_addr_id: shipping_addr_id || null,
          subtotal,
          tax_amount: taxAmount,
          discount_amount: discountAmount,
          total,
          status: 'processing',
          payment_method: 'cmoney',
        })
        .select()
        .single()

      if (orderError) throw orderError

      const orderItems = cartItems.map((item) => ({
        order_id: order.id,
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: roundMoney(item.products.price_egp),
        bv_points: item.products.bv_points,
      }))
      await supabase.from('order_items').insert(orderItems)

      try {
        await walletService.credit(
          userId,
          'CMONEY',
          -total,
          'PURCHASE',
          `Order ${orderRef}`,
          order.id
        )
      } catch (walletErr) {
        await supabase.from('order_items').delete().eq('order_id', order.id)
        await supabase.from('orders').delete().eq('id', order.id)
        if (walletErr.code === 'INSUFFICIENT_BALANCE') {
          return res.status(400).json({ error: 'Insufficient C Money balance' })
        }
        throw walletErr
      }

      if (voucherData) {
        await supabase
          .from('vouchers')
          .update({
            status: 'redeemed',
            redeemed_at: new Date().toISOString(),
            redeemed_by: userId,
          })
          .eq('id', voucherData.id)
      }

      const totalBV = cartItems.reduce(
        (s, item) => s + (item.products.bv_points || 0) * item.quantity,
        0
      )

      if (totalBV > 0) {
        await bvService.creditBV(userId, totalBV, order.id)
        await supabase.from('orders').update({ bv_credited: true }).eq('id', order.id)
      }

      const hasPackage = cartItems.some((item) => item.products.is_package)
      if (hasPackage) {
        const { data: userWithSponsor } = await supabase
          .from('users')
          .select('sponsor_id')
          .eq('id', userId)
          .single()

        if (userWithSponsor?.sponsor_id) {
          const { error: rpcErr } = await supabase.rpc('increment_direct_count', {
            user_id: userWithSponsor.sponsor_id,
          })
          if (rpcErr) console.warn('increment_direct_count:', rpcErr.message)
          else {
            try {
              await pearlsService.checkFastStartPearls(userWithSponsor.sponsor_id)
            } catch {
              /* optional */
            }
          }
        }
      }

      await rankService.checkAndUpdateRank(userId)

      try {
        await pearlsService.triggerMission(userId, 'order_complete')
      } catch {
        /* optional */
      }

      await supabase.from('cart_items').delete().eq('user_id', userId)

      await supabase.from('notifications').insert({
        user_id: userId,
        type: 'ORDER_STATUS',
        title: 'Order placed successfully',
        body: `Order ${orderRef} — EGP ${total.toFixed(2)}`,
      })

      return res.status(201).json({
        message: 'Order placed successfully',
        order: { id: order.id, order_ref: orderRef, total, bv_credited: totalBV > 0 },
      })
    } catch (err) {
      console.error('Checkout error:', err)
      return res.status(500).json({ error: 'Server error' })
    }
  },

  async getOrders(req, res) {
    try {
      const { page = 1, limit = 20, status } = req.query
      const offset = (page - 1) * limit

      let query = supabase
        .from('orders')
        .select('*, order_items(*, products(name, image_url))', { count: 'exact' })
        .eq('user_id', req.user.userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + parseInt(limit, 10) - 1)

      if (status) query = query.eq('status', status)

      const { data, count } = await query
      return res.json({ data: data || [], total: count })
    } catch {
      return res.status(500).json({ error: 'Server error' })
    }
  },

  async getOrder(req, res) {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*, order_items(*, products(*))')
        .eq('id', req.params.id)
        .eq('user_id', req.user.userId)
        .single()
      if (error) return res.status(404).json({ error: 'Order not found' })
      return res.json(data)
    } catch {
      return res.status(500).json({ error: 'Server error' })
    }
  },

  async getShipping(req, res) {
    try {
      const { data } = await supabase
        .from('shipping_addresses')
        .select('*')
        .eq('user_id', req.user.userId)
        .order('is_default', { ascending: false })
      return res.json(data || [])
    } catch {
      return res.status(500).json({ error: 'Server error' })
    }
  },

  async addShipping(req, res) {
    try {
      const {
        full_name,
        phone,
        country,
        governorate,
        city,
        zip_code,
        building_number,
        floor_number,
        apartment,
        address,
        delivery_notes,
        is_default,
      } = req.body

      if (is_default) {
        await supabase
          .from('shipping_addresses')
          .update({ is_default: false })
          .eq('user_id', req.user.userId)
      }

      const { data, error } = await supabase
        .from('shipping_addresses')
        .insert({
          user_id: req.user.userId,
          full_name,
          phone,
          country,
          governorate,
          city,
          zip_code,
          building_number,
          floor_number,
          apartment,
          address,
          delivery_notes,
          is_default: !!is_default,
        })
        .select()
        .single()

      if (error) throw error
      return res.status(201).json(data)
    } catch {
      return res.status(500).json({ error: 'Server error' })
    }
  },

  async deleteShipping(req, res) {
    try {
      await supabase
        .from('shipping_addresses')
        .delete()
        .eq('id', req.params.id)
        .eq('user_id', req.user.userId)
      return res.json({ message: 'Deleted' })
    } catch {
      return res.status(500).json({ error: 'Server error' })
    }
  },
}
