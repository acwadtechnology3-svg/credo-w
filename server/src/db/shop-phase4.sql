-- Run in Supabase SQL Editor (Phase 4 — Shop + Cart)

CREATE TABLE IF NOT EXISTS cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  quantity INT DEFAULT 1 CHECK (quantity > 0),
  added_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

CREATE OR REPLACE FUNCTION increment_direct_count(user_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE users SET direct_count = COALESCE(direct_count, 0) + 1 WHERE id = user_id;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'cart_items') THEN
    EXECUTE 'ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS backend_all ON public.cart_items';
    EXECUTE 'CREATE POLICY backend_all ON public.cart_items FOR ALL USING (true) WITH CHECK (true)';
  END IF;
END $$;
