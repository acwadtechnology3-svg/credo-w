/**
 * End-to-end shop flow smoke test (run: node scripts/test-shop-flow.mjs)
 * Requires server on PORT (default 3001) and Supabase configured.
 */
import 'dotenv/config'

const BASE = `http://localhost:${process.env.PORT || 3001}/api`

async function req(method, path, { token, body } = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  const text = await res.text()
  let data
  try {
    data = text ? JSON.parse(text) : null
  } catch {
    data = text
  }
  return { status: res.status, data }
}

function assert(cond, msg) {
  if (!cond) throw new Error(`FAIL: ${msg}`)
}

async function main() {
  console.log('=== Shop flow smoke test ===\n')

  const login = await req('POST', '/auth/login', {
    body: { username_or_email: 'admin', password: 'Admin@1234' },
  })
  assert(login.status === 200, `login ${login.status} ${JSON.stringify(login.data)}`)
  const token = login.data.accessToken
  const userId = login.data.user?.id
  console.log('✓ Login as admin')

  const dashBefore = await req('GET', '/dashboard', { token })
  assert(dashBefore.status === 200, `dashboard ${dashBefore.status}`)
  const bvBeforeA = dashBefore.data.bv?.sideA || 0
  const bvBeforeB = dashBefore.data.bv?.sideB || 0
  const cmoneyBefore = parseFloat(dashBefore.data.wallets?.cmoney || 0)
  console.log(`  BV before: A=${bvBeforeA} B=${bvBeforeB}, CMONEY=${cmoneyBefore}`)

  const products = await req('GET', '/shop/products?limit=5', { token })
  assert(products.status === 200, `products ${products.status} ${JSON.stringify(products.data)}`)
  assert((products.data.data || []).length > 0, 'no products returned')
  const withBv = (products.data.data || []).filter((p) => p.bv_points > 0)
  const product =
    withBv.sort((a, b) => parseFloat(a.price_egp) - parseFloat(b.price_egp))[0] ||
    products.data.data[0]
  console.log(`✓ Products (${products.data.total} total), using: ${product.name}`)

  await req('DELETE', '/shop/cart/items/clear-stub', { token }).catch(() => {})

  const { supabase } = await import('../server/src/lib/supabase.js')
  await supabase.from('cart_items').delete().eq('user_id', userId)

  const add = await req('POST', '/shop/cart/items', {
    token,
    body: { product_id: product.id, quantity: 1 },
  })
  assert(add.status === 200, `addToCart ${add.status} ${JSON.stringify(add.data)}`)
  console.log('✓ Add to cart')

  const cart = await req('GET', '/shop/cart', { token })
  assert(cart.status === 200, `cart ${cart.status}`)
  assert((cart.data.items || []).length > 0, 'cart empty')
  const cartItem = cart.data.items[0]
  console.log(`✓ Cart has ${cart.data.items.length} item(s), total=${cart.data.total}`)

  const needTopUp = parseFloat(cart.data.total) > parseFloat(cart.data.cmoneyBalance || 0)
  if (needTopUp) {
    const topUp = parseFloat(cart.data.total) + 5000
    const { walletService } = await import('../server/src/services/wallet.service.js')
    await walletService.credit(userId, 'CMONEY', topUp, 'TEST_TOPUP', 'Shop flow test')
    console.log(`✓ Topped up CMONEY by ${topUp}`)
  }

  const checkout = await req('POST', '/shop/orders', { token, body: {} })
  assert(checkout.status === 201, `checkout ${checkout.status} ${JSON.stringify(checkout.data)}`)
  console.log(`✓ Checkout order ${checkout.data.order?.order_ref}`)

  const dashAfter = await req('GET', '/dashboard', { token })
  const bvAfterA = dashAfter.data.bv?.sideA || 0
  const bvAfterB = dashAfter.data.bv?.sideB || 0
  const cmoneyAfter = parseFloat(dashAfter.data.wallets?.cmoney || 0)
  console.log(`  BV after: A=${bvAfterA} B=${bvAfterB}, CMONEY=${cmoneyAfter}`)

  if (product.bv_points > 0) {
    assert(bvAfterA + bvAfterB > bvBeforeA + bvBeforeB, 'BV did not increase after purchase')
    console.log('✓ Dashboard BV increased')
  } else {
    console.log('⚠ Product has 0 BV — skipped BV increase check')
  }

  assert(cmoneyAfter < cmoneyBefore || needTopUp, 'CMONEY was not deducted')
  console.log('✓ CMONEY deducted')

  const orders = await req('GET', '/shop/orders?limit=5', { token })
  assert(orders.status === 200, `orders ${orders.status}`)
  assert(
    (orders.data.data || []).some((o) => o.order_ref === checkout.data.order?.order_ref),
    'order not in list'
  )
  console.log(`✓ Orders list (${orders.data.total} total)`)

  const { data: bvLogs } = await supabase
    .from('bv_logs')
    .select('amount, order_id')
    .eq('user_id', userId)
    .eq('order_id', checkout.data.order?.id)
  if (product.bv_points > 0) {
    assert((bvLogs || []).length > 0, 'no bv_logs for order')
    console.log(`✓ BV logs created (${bvLogs.length} entries)`)
  }

  const { data: orderRow } = await supabase
    .from('orders')
    .select('bv_credited, total')
    .eq('id', checkout.data.order?.id)
    .single()
  if (product.bv_points > 0) {
    assert(orderRow?.bv_credited === true, 'order.bv_credited not set')
  }
  console.log('✓ Order row verified')

  const cartAfter = await req('GET', '/shop/cart', { token })
  assert((cartAfter.data.items || []).length === 0, 'cart not cleared after checkout')
  console.log('✓ Cart cleared after checkout')

  console.log('\n=== All checks passed ===')
}

main().catch((e) => {
  console.error('\n', e.message)
  process.exit(1)
})
