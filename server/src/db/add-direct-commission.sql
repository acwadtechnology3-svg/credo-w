-- Run in Supabase SQL Editor
ALTER TABLE products
ADD COLUMN IF NOT EXISTS direct_commission_egp DECIMAL(12,2) DEFAULT 0;

UPDATE products SET direct_commission_egp = 400   WHERE price_egp = 5000  AND is_package = true;
UPDATE products SET direct_commission_egp = 1000  WHERE price_egp = 10000 AND is_package = true;
UPDATE products SET direct_commission_egp = 1800  WHERE price_egp = 22000 AND is_package = true;
