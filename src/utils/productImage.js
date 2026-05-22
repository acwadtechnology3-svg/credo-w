/** صور مبدئية حسب التصنيف عندما لا يوجد image_url للمنتج */
const CATEGORY_PLACEHOLDERS = {
  LICENSES:
    'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=440&h=280&fit=crop&q=80',
  PACKAGES:
    'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=440&h=280&fit=crop&q=80',
  VOUCHERS:
    'https://images.unsplash.com/photo-1549465220-1a35b1a4ab86?w=440&h=280&fit=crop&q=80',
  RZN_BEAUTY:
    'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=440&h=280&fit=crop&q=80',
  DEETS:
    'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=440&h=280&fit=crop&q=80',
  QUICK_COACH:
    'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50c?w=440&h=280&fit=crop&q=80',
  ELEVATE:
    'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=440&h=280&fit=crop&q=80',
  DEFAULT:
    'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=440&h=280&fit=crop&q=80',
}

export function getProductImageUrl(product) {
  if (product?.image_url) return product.image_url
  return CATEGORY_PLACEHOLDERS[product?.category] || CATEGORY_PLACEHOLDERS.DEFAULT
}
