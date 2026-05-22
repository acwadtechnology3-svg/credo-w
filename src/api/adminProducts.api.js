import client from './client'

export const getAdminCategories = () => client.get('/admin/categories').then((r) => r.data)
export const createAdminCategory = (body) => client.post('/admin/categories', body).then((r) => r.data)
export const updateAdminCategory = (id, body) =>
  client.put(`/admin/categories/${id}`, body).then((r) => r.data)
export const deleteAdminCategory = (id) => client.delete(`/admin/categories/${id}`).then((r) => r.data)

export const getAdminProducts = (params) => client.get('/admin/products', { params }).then((r) => r.data)
export const getAdminProduct = (id) => client.get(`/admin/products/${id}`).then((r) => r.data)
export const createAdminProduct = (body) => client.post('/admin/products', body).then((r) => r.data)
export const updateAdminProduct = (id, body) =>
  client.put(`/admin/products/${id}`, body).then((r) => r.data)
export const deleteAdminProduct = (id) => client.delete(`/admin/products/${id}`).then((r) => r.data)
export const uploadProductImage = (body) =>
  client.post('/admin/products/upload-image', body).then((r) => r.data)

export const getAdminOrders = (params) => client.get('/admin/orders', { params }).then((r) => r.data)
export const getAdminOrder = (id) => client.get(`/admin/orders/${id}`).then((r) => r.data)
export const updateOrderStatus = (id, body) =>
  client.put(`/admin/orders/${id}/status`, body).then((r) => r.data)

export const getAdminCoupons = () => client.get('/admin/coupons').then((r) => r.data)
export const createAdminCoupon = (body) => client.post('/admin/coupons', body).then((r) => r.data)
export const updateAdminCoupon = (id, body) => client.put(`/admin/coupons/${id}`, body).then((r) => r.data)
export const deleteAdminCoupon = (id) => client.delete(`/admin/coupons/${id}`).then((r) => r.data)

export const getAdminBanners = () => client.get('/admin/banners').then((r) => r.data)
export const createAdminBanner = (body) => client.post('/admin/banners', body).then((r) => r.data)
export const updateAdminBanner = (id, body) => client.put(`/admin/banners/${id}`, body).then((r) => r.data)
export const deleteAdminBanner = (id) => client.delete(`/admin/banners/${id}`).then((r) => r.data)

export const getAdminReviews = (params) => client.get('/admin/reviews', { params }).then((r) => r.data)
export const processAdminReview = (id, body) =>
  client.put(`/admin/reviews/${id}/process`, body).then((r) => r.data)
