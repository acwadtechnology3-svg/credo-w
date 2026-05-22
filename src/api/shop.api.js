import client from './client'

export const getProducts = (params) =>
  client.get('/shop/products', { params }).then((r) => r.data)

export const getProduct = (id) =>
  client.get(`/shop/products/${id}`).then((r) => r.data)

export const getCart = () => client.get('/shop/cart').then((r) => r.data)

export const addToCart = (product_id, quantity = 1) =>
  client.post('/shop/cart/items', { product_id, quantity }).then((r) => r.data)

export const updateCartItem = (id, quantity) =>
  client.put(`/shop/cart/items/${id}`, { quantity }).then((r) => r.data)

export const removeCartItem = (id) =>
  client.delete(`/shop/cart/items/${id}`).then((r) => r.data)

export const checkout = (body) =>
  client.post('/shop/orders', body).then((r) => r.data)

export const getOrders = (params) =>
  client.get('/shop/orders', { params }).then((r) => r.data)

export const getOrder = (id) =>
  client.get(`/shop/orders/${id}`).then((r) => r.data)

export const getShipping = () => client.get('/shop/shipping').then((r) => r.data)

export const addShipping = (body) =>
  client.post('/shop/shipping', body).then((r) => r.data)

export const deleteShipping = (id) =>
  client.delete(`/shop/shipping/${id}`).then((r) => r.data)
