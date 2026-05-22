-- Storage policies for bucket: credo-w-media
-- Run in Supabase SQL Editor (do NOT run ALTER TABLE on storage.objects — not allowed on hosted Supabase).
-- Best fix: set SUPABASE_SERVICE_KEY (service_role) in server .env — bypasses RLS, no SQL needed.
--
-- Prerequisite: Storage → create bucket "credo-w-media" → Public bucket ON

-- Public read
DROP POLICY IF EXISTS "credo_w_media_public_read" ON storage.objects;
CREATE POLICY "credo_w_media_public_read"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'credo-w-media');

-- Upload (server uses anon or authenticated key)
DROP POLICY IF EXISTS "credo_w_media_insert" ON storage.objects;
CREATE POLICY "credo_w_media_insert"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'credo-w-media');

-- Replace / upsert
DROP POLICY IF EXISTS "credo_w_media_update" ON storage.objects;
CREATE POLICY "credo_w_media_update"
ON storage.objects FOR UPDATE
TO public
USING (bucket_id = 'credo-w-media')
WITH CHECK (bucket_id = 'credo-w-media');

-- Delete
DROP POLICY IF EXISTS "credo_w_media_delete" ON storage.objects;
CREATE POLICY "credo_w_media_delete"
ON storage.objects FOR DELETE
TO public
USING (bucket_id = 'credo-w-media');
