import { supabase, getStorageSupabase } from '../lib/supabase.js'

export const adminProductsController = {
  async getCategories(req, res) {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*, parent:categories!parent_id(name)')
        .order('sort_order')
      if (error) throw error
      return res.json(data || [])
    } catch (err) {
      console.error('getCategories error:', err)
      return res.status(500).json({ error: 'Server error' })
    }
  },

  async createCategory(req, res) {
    try {
      const { name, description, image_url, parent_id, sort_order } = req.body
      if (!name) return res.status(400).json({ error: 'Name required' })
      const slug =
        name
          .toLowerCase()
          .replace(/\s+/g, '-')
          .replace(/[^a-z0-9-]/g, '') +
        '-' +
        Date.now()
      const { data, error } = await supabase
        .from('categories')
        .insert({
          name,
          slug,
          description,
          image_url,
          parent_id: parent_id || null,
          sort_order: sort_order || 0,
        })
        .select()
        .single()
      if (error) throw error
      return res.status(201).json(data)
    } catch (err) {
      console.error('createCategory error:', err)
      return res.status(500).json({ error: 'Server error' })
    }
  },

  async updateCategory(req, res) {
    try {
      const { data, error } = await supabase
        .from('categories')
        .update(req.body)
        .eq('id', req.params.id)
        .select()
        .single()
      if (error) throw error
      return res.json(data)
    } catch (err) {
      console.error('updateCategory error:', err)
      return res.status(500).json({ error: 'Server error' })
    }
  },

  async deleteCategory(req, res) {
    try {
      await supabase.from('categories').update({ is_active: false }).eq('id', req.params.id)
      return res.json({ message: 'Category deactivated' })
    } catch (err) {
      console.error('deleteCategory error:', err)
      return res.status(500).json({ error: 'Server error' })
    }
  },

  async getProducts(req, res) {
    try {
      const { page = 1, limit = 20, search, category_id, is_active } = req.query
      const offset = (Number(page) - 1) * Number(limit)
      let query = supabase
        .from('products')
        .select('*, categories(name), product_images(image_url, is_primary)', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + parseInt(limit, 10) - 1)
      if (search) query = query.ilike('name', `%${search}%`)
      if (category_id) query = query.eq('category_id', category_id)
      if (is_active !== undefined) query = query.eq('is_active', is_active === 'true')
      const { data, count, error } = await query
      if (error) throw error
      return res.json({ data: data || [], total: count })
    } catch (err) {
      console.error('getProducts error:', err)
      return res.status(500).json({ error: 'Server error' })
    }
  },

  async getProduct(req, res) {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*, categories(name), product_images(*), product_variants(*)')
        .eq('id', req.params.id)
        .single()
      if (error) throw error
      if (!data) return res.status(404).json({ error: 'Product not found' })
      return res.json(data)
    } catch (err) {
      console.error('getProduct error:', err)
      return res.status(500).json({ error: 'Server error' })
    }
  },

  async createProduct(req, res) {
    try {
      const {
        name,
        description,
        category_id,
        price_egp,
        original_price_egp,
        discount_pct,
        tax_rate,
        bv_points,
        pv_points,
        direct_commission_egp,
        is_package,
        stock,
        low_stock_alert,
        tags,
        meta_description,
        images,
        variants,
      } = req.body

      if (!name || price_egp === undefined || price_egp === '') {
        return res.status(400).json({ error: 'Name and price required' })
      }

      const slug =
        name
          .toLowerCase()
          .replace(/\s+/g, '-')
          .replace(/[^a-z0-9-]/g, '') +
        '-' +
        Date.now()

      const { data: product, error } = await supabase
        .from('products')
        .insert({
          name,
          description,
          category_id: category_id || null,
          price_egp,
          original_price_egp: original_price_egp || null,
          discount_pct: discount_pct || 0,
          tax_rate: tax_rate || 14,
          bv_points: bv_points || 0,
          pv_points: pv_points || 0,
          direct_commission_egp: direct_commission_egp || 0,
          is_package: !!is_package,
          stock: stock ?? -1,
          low_stock_alert: low_stock_alert || 10,
          tags,
          meta_description,
          slug,
          is_active: true,
        })
        .select()
        .single()
      if (error) throw error

      if (images?.length > 0) {
        const imgRows = images.map((url, i) => ({
          product_id: product.id,
          image_url: url,
          sort_order: i,
          is_primary: i === 0,
        }))
        await supabase.from('product_images').insert(imgRows)
      }

      if (variants?.length > 0) {
        const varRows = variants.map((v) => ({
          product_id: product.id,
          name: v.name,
          value: v.value,
          price_adjustment: v.price_adjustment ?? 0,
          stock: v.stock ?? -1,
          image_url: v.image_url || null,
          is_active: v.is_active !== false,
        }))
        await supabase.from('product_variants').insert(varRows)
      }

      await supabase.from('audit_logs').insert({
        actor_id: req.user.userId,
        action: 'CREATE_PRODUCT',
        entity: 'products',
        entity_id: product.id,
        new_value: { name, price_egp },
        ip_address: req.ip,
      })

      return res.status(201).json(product)
    } catch (err) {
      console.error('createProduct error:', err)
      return res.status(500).json({ error: 'Server error' })
    }
  },

  async updateProduct(req, res) {
    try {
      const { images, variants, ...productData } = req.body
      const { data, error } = await supabase
        .from('products')
        .update({ ...productData, updated_at: new Date().toISOString() })
        .eq('id', req.params.id)
        .select()
        .single()
      if (error) throw error

      if (images !== undefined) {
        await supabase.from('product_images').delete().eq('product_id', req.params.id)
        if (images.length > 0) {
          await supabase.from('product_images').insert(
            images.map((url, i) => ({
              product_id: req.params.id,
              image_url: url,
              sort_order: i,
              is_primary: i === 0,
            }))
          )
        }
      }

      if (variants !== undefined) {
        await supabase.from('product_variants').delete().eq('product_id', req.params.id)
        if (variants.length > 0) {
          await supabase.from('product_variants').insert(
            variants.map((v) => ({
              product_id: req.params.id,
              name: v.name,
              value: v.value,
              price_adjustment: v.price_adjustment ?? 0,
              stock: v.stock ?? -1,
              image_url: v.image_url || null,
              is_active: v.is_active !== false,
            }))
          )
        }
      }

      await supabase.from('audit_logs').insert({
        actor_id: req.user.userId,
        action: 'UPDATE_PRODUCT',
        entity: 'products',
        entity_id: req.params.id,
        new_value: productData,
        ip_address: req.ip,
      })

      return res.json(data)
    } catch (err) {
      console.error('updateProduct error:', err)
      return res.status(500).json({ error: 'Server error' })
    }
  },

  async deleteProduct(req, res) {
    try {
      await supabase.from('products').update({ is_active: false }).eq('id', req.params.id)
      return res.json({ message: 'Product deactivated' })
    } catch (err) {
      console.error('deleteProduct error:', err)
      return res.status(500).json({ error: 'Server error' })
    }
  },

  async uploadImage(req, res) {
    try {
      const { base64, filename, folder } = req.body
      if (!base64 || !filename) return res.status(400).json({ error: 'base64 and filename required' })
      const buffer = Buffer.from(base64.split(',')[1] || base64, 'base64')
      const ext = (filename.split('.').pop() || 'jpg').toLowerCase()
      const mime =
        ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : ext === 'gif' ? 'image/gif' : 'image/jpeg'
      const storage = getStorageSupabase()
      const path = `${folder || 'products'}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const { error } = await storage.storage
        .from('credo-w-media')
        .upload(path, buffer, { contentType: mime, upsert: false })
      if (error) throw error
      const { data: urlData } = storage.storage.from('credo-w-media').getPublicUrl(path)
      return res.json({ url: urlData.publicUrl, path })
    } catch (err) {
      console.error('uploadImage error:', err)
      return res.status(500).json({ error: 'Upload failed' })
    }
  },

  async getOrders(req, res) {
    try {
      const { page = 1, limit = 20, status, search, from, to } = req.query
      const offset = (Number(page) - 1) * Number(limit)
      let query = supabase
        .from('orders')
        .select(
          '*, users(username, full_name, email, phone), order_items(quantity, unit_price, products(name))',
          { count: 'exact' }
        )
        .order('created_at', { ascending: false })
        .range(offset, offset + parseInt(limit, 10) - 1)
      if (status) query = query.eq('status', status)
      if (from) query = query.gte('created_at', from)
      if (to) query = query.lte('created_at', to)
      if (search) query = query.ilike('order_ref', `%${search}%`)
      const { data, count, error } = await query
      if (error) throw error
      return res.json({ data: data || [], total: count })
    } catch (err) {
      console.error('getOrders error:', err)
      return res.status(500).json({ error: 'Server error' })
    }
  },

  async getOrder(req, res) {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(
          '*, users(username, full_name, email, phone), order_items(*, products(name, image_url)), shipping_addresses!shipping_addr_id(*)'
        )
        .eq('id', req.params.id)
        .single()
      if (error) throw error
      if (!data) return res.status(404).json({ error: 'Order not found' })
      return res.json(data)
    } catch (err) {
      console.error('getOrder error:', err)
      return res.status(500).json({ error: 'Server error' })
    }
  },

  async updateOrderStatus(req, res) {
    try {
      const { status, tracking_number, shipping_company, admin_note, cancellation_reason } = req.body
      const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded']
      if (!validStatuses.includes(status)) return res.status(400).json({ error: 'Invalid status' })

      const { data: order, error: fetchErr } = await supabase
        .from('orders')
        .select('user_id, order_ref, status')
        .eq('id', req.params.id)
        .single()
      if (fetchErr || !order) return res.status(404).json({ error: 'Order not found' })

      const updateData = { status, updated_at: new Date().toISOString() }
      if (tracking_number) updateData.tracking_number = tracking_number
      if (shipping_company) updateData.shipping_company = shipping_company
      if (admin_note) updateData.admin_note = admin_note
      if (cancellation_reason) updateData.cancellation_reason = cancellation_reason

      await supabase.from('orders').update(updateData).eq('id', req.params.id)

      const statusMessages = {
        processing: 'Your order is being processed',
        shipped: `Your order has been shipped${tracking_number ? `. Tracking: ${tracking_number}` : ''}`,
        delivered: 'Your order has been delivered',
        cancelled: `Your order has been cancelled${cancellation_reason ? '. Reason: ' + cancellation_reason : ''}`,
        refunded: 'Your order has been refunded',
      }

      if (statusMessages[status]) {
        await supabase.from('notifications').insert({
          user_id: order.user_id,
          type: 'ORDER_STATUS',
          title: `Order ${order.order_ref} — ${status}`,
          body: statusMessages[status],
        })
      }

      await supabase.from('audit_logs').insert({
        actor_id: req.user.userId,
        action: 'UPDATE_ORDER_STATUS',
        entity: 'orders',
        entity_id: req.params.id,
        old_value: { status: order.status },
        new_value: { status, tracking_number },
        ip_address: req.ip,
      })

      return res.json({ message: `Order status updated to ${status}` })
    } catch (err) {
      console.error('updateOrderStatus error:', err)
      return res.status(500).json({ error: 'Server error' })
    }
  },

  async getCoupons(req, res) {
    try {
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      return res.json(data || [])
    } catch (err) {
      console.error('getCoupons error:', err)
      return res.status(500).json({ error: 'Server error' })
    }
  },

  async createCoupon(req, res) {
    try {
      const {
        code,
        type,
        value,
        min_order_amount,
        max_uses,
        max_uses_per_user,
        applicable_to,
        applicable_id,
        starts_at,
        expires_at,
      } = req.body
      if (!code || !type || value === undefined) {
        return res.status(400).json({ error: 'code, type and value required' })
      }
      const { data: exists } = await supabase
        .from('coupons')
        .select('id')
        .eq('code', code.toUpperCase())
        .maybeSingle()
      if (exists) return res.status(409).json({ error: 'Coupon code already exists' })
      const { data, error } = await supabase
        .from('coupons')
        .insert({
          code: code.toUpperCase(),
          type,
          value,
          min_order_amount: min_order_amount || 0,
          max_uses: max_uses ?? -1,
          max_uses_per_user: max_uses_per_user || 1,
          applicable_to: applicable_to || 'all',
          applicable_id: applicable_id || null,
          starts_at: starts_at || undefined,
          expires_at: expires_at || null,
          created_by: req.user.userId,
        })
        .select()
        .single()
      if (error) throw error
      return res.status(201).json(data)
    } catch (err) {
      console.error('createCoupon error:', err)
      return res.status(500).json({ error: 'Server error' })
    }
  },

  async updateCoupon(req, res) {
    try {
      const { data, error } = await supabase
        .from('coupons')
        .update(req.body)
        .eq('id', req.params.id)
        .select()
        .single()
      if (error) throw error
      return res.json(data)
    } catch (err) {
      console.error('updateCoupon error:', err)
      return res.status(500).json({ error: 'Server error' })
    }
  },

  async deleteCoupon(req, res) {
    try {
      await supabase.from('coupons').update({ is_active: false }).eq('id', req.params.id)
      return res.json({ message: 'Coupon deactivated' })
    } catch (err) {
      console.error('deleteCoupon error:', err)
      return res.status(500).json({ error: 'Server error' })
    }
  },

  async getBanners(req, res) {
    try {
      const { data, error } = await supabase.from('banners').select('*').order('sort_order')
      if (error) throw error
      return res.json(data || [])
    } catch (err) {
      console.error('getBanners error:', err)
      return res.status(500).json({ error: 'Server error' })
    }
  },

  async createBanner(req, res) {
    try {
      const { title, subtitle, image_url, link_url, sort_order, starts_at, ends_at } = req.body
      if (!image_url) return res.status(400).json({ error: 'image_url required' })
      const { data, error } = await supabase
        .from('banners')
        .insert({
          title,
          subtitle,
          image_url,
          link_url,
          sort_order: sort_order || 0,
          starts_at: starts_at || null,
          ends_at: ends_at || null,
        })
        .select()
        .single()
      if (error) throw error
      return res.status(201).json(data)
    } catch (err) {
      console.error('createBanner error:', err)
      return res.status(500).json({ error: 'Server error' })
    }
  },

  async updateBanner(req, res) {
    try {
      const { data, error } = await supabase
        .from('banners')
        .update(req.body)
        .eq('id', req.params.id)
        .select()
        .single()
      if (error) throw error
      return res.json(data)
    } catch (err) {
      console.error('updateBanner error:', err)
      return res.status(500).json({ error: 'Server error' })
    }
  },

  async deleteBanner(req, res) {
    try {
      await supabase.from('banners').delete().eq('id', req.params.id)
      return res.json({ message: 'Banner deleted' })
    } catch (err) {
      console.error('deleteBanner error:', err)
      return res.status(500).json({ error: 'Server error' })
    }
  },

  async getReviews(req, res) {
    try {
      const { status } = req.query
      let query = supabase
        .from('product_reviews')
        .select('*, users(username), products(name)', { count: 'exact' })
        .order('created_at', { ascending: false })
      if (status) query = query.eq('status', status)
      const { data, count, error } = await query
      if (error) throw error
      return res.json({ data: data || [], total: count })
    } catch (err) {
      console.error('getReviews error:', err)
      return res.status(500).json({ error: 'Server error' })
    }
  },

  async processReview(req, res) {
    try {
      const { action, admin_reply } = req.body
      if (!['approved', 'rejected'].includes(action)) {
        return res.status(400).json({ error: 'Invalid action' })
      }
      await supabase
        .from('product_reviews')
        .update({ status: action, admin_reply: admin_reply || null })
        .eq('id', req.params.id)
      return res.json({ message: `Review ${action}` })
    } catch (err) {
      console.error('processReview error:', err)
      return res.status(500).json({ error: 'Server error' })
    }
  },
}
