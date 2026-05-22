-- Phase B — E-commerce Admin (run in Supabase SQL Editor)
-- Also create Storage bucket: credo-w-media (public)

-- 1. Categories table (tree structure)
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR NOT NULL,
  slug VARCHAR UNIQUE NOT NULL,
  description TEXT,
  image_url VARCHAR,
  parent_id UUID REFERENCES categories(id),
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_categories_parent ON categories(parent_id);

-- 2. Product variants table
CREATE TABLE IF NOT EXISTS product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  name VARCHAR NOT NULL,
  value VARCHAR NOT NULL,
  price_adjustment DECIMAL(12,2) DEFAULT 0,
  stock INT DEFAULT -1,
  image_url VARCHAR,
  is_active BOOLEAN DEFAULT true
);

-- 3. Product images table (multiple images per product)
CREATE TABLE IF NOT EXISTS product_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  image_url VARCHAR NOT NULL,
  sort_order INT DEFAULT 0,
  is_primary BOOLEAN DEFAULT false
);

-- 4. Add category_id and e-commerce fields to products
ALTER TABLE products
ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES categories(id),
ADD COLUMN IF NOT EXISTS discount_pct DECIMAL(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS original_price_egp DECIMAL(12,2),
ADD COLUMN IF NOT EXISTS low_stock_alert INT DEFAULT 10,
ADD COLUMN IF NOT EXISTS slug VARCHAR UNIQUE,
ADD COLUMN IF NOT EXISTS meta_description TEXT,
ADD COLUMN IF NOT EXISTS tags TEXT[],
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 5. Coupons table
CREATE TABLE IF NOT EXISTS coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR UNIQUE NOT NULL,
  type VARCHAR NOT NULL CHECK (type IN ('fixed', 'percentage')),
  value DECIMAL(12,2) NOT NULL,
  min_order_amount DECIMAL(12,2) DEFAULT 0,
  max_uses INT DEFAULT -1,
  used_count INT DEFAULT 0,
  max_uses_per_user INT DEFAULT 1,
  applicable_to VARCHAR DEFAULT 'all' CHECK (applicable_to IN ('all','category','product')),
  applicable_id UUID,
  starts_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Coupon usage tracking
CREATE TABLE IF NOT EXISTS coupon_uses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id UUID NOT NULL REFERENCES coupons(id),
  user_id UUID NOT NULL REFERENCES users(id),
  order_id UUID REFERENCES orders(id),
  discount_amount DECIMAL(12,2),
  used_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Hero banners table
CREATE TABLE IF NOT EXISTS banners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR,
  subtitle VARCHAR,
  image_url VARCHAR NOT NULL,
  link_url VARCHAR,
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Product reviews table
CREATE TABLE IF NOT EXISTS product_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  status VARCHAR DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  admin_reply TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Seed categories
INSERT INTO categories (name, slug, sort_order) VALUES
('Beauty', 'beauty', 1),
('Supplements', 'supplements', 2),
('Clothing', 'clothing', 3),
('Packages', 'packages', 4),
('Courses', 'courses', 5),
('Travel', 'travel', 6)
ON CONFLICT (slug) DO NOTHING;

-- 10. Order fulfillment fields
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS tracking_number VARCHAR,
ADD COLUMN IF NOT EXISTS shipping_company VARCHAR,
ADD COLUMN IF NOT EXISTS cancellation_reason VARCHAR,
ADD COLUMN IF NOT EXISTS admin_note VARCHAR;

-- Storage policies (bucket: credo-w-media, public read)
-- CREATE POLICY "Authenticated users can upload"
-- ON storage.objects FOR INSERT TO authenticated
-- WITH CHECK (bucket_id = 'credo-w-media');
-- CREATE POLICY "Public read access"
-- ON storage.objects FOR SELECT TO public
-- USING (bucket_id = 'credo-w-media');
