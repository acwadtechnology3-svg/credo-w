-- شغّل هذا إذا الإضافة للسلة تفشل (RLS على cart_items)
-- Supabase → SQL Editor → Run

ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS backend_all ON public.cart_items;
CREATE POLICY backend_all ON public.cart_items
  FOR ALL
  USING (true)
  WITH CHECK (true);
