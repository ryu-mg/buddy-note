-- buddy-note Storage buckets + RLS
-- Sources of truth:
--   AGENTS.md "Supabase Storage buckets"
--   rules/architecture.md §4 (data flow) + §7 (7d signed URL)
--   rules/architecture.md §8 (security model)
--
-- Two buckets:
--   photos        — PRIVATE. Path: {user_id}/{log_id}.{ext}. Owner-only RLS.
--                    Signed URL (7d) is the only read path; writes are
--                    service-role only (via lib/storage/uploadPhoto).
--   diary-images  — PUBLIC. UUID filenames, service-role writes, anon read.
--                    Separate bucket so Supabase public-URL semantics don't
--                    leak to private photos.
--
-- Forward-only. Safe to re-apply (IF NOT EXISTS / idempotent policies).

-- =====================================================================
-- Buckets
-- =====================================================================

-- photos: private
INSERT INTO storage.buckets (id, name, public)
VALUES ('photos', 'photos', false)
ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public;

-- diary-images: public (CDN-served share images)
INSERT INTO storage.buckets (id, name, public)
VALUES ('diary-images', 'diary-images', true)
ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public;

-- =====================================================================
-- photos bucket RLS (storage.objects)
-- Owner-only: owner folder is the first path segment and must equal auth.uid().
-- All mutations are performed via service_role in the app, but we still set
-- owner-scoped policies so signed-URL generation works via the SSR client
-- (anon/authenticated roles are subject to RLS; service_role bypasses).
-- =====================================================================

DROP POLICY IF EXISTS photos_select_own ON storage.objects;
CREATE POLICY photos_select_own ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS photos_insert_own ON storage.objects;
CREATE POLICY photos_insert_own ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS photos_update_own ON storage.objects;
CREATE POLICY photos_update_own ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  )
  WITH CHECK (
    bucket_id = 'photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS photos_delete_own ON storage.objects;
CREATE POLICY photos_delete_own ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- =====================================================================
-- diary-images bucket RLS (storage.objects)
-- Public read for anon (share image CDN). Writes/deletes are service-role
-- only — no policies granted to anon/authenticated for mutations.
-- =====================================================================

DROP POLICY IF EXISTS diary_images_select_public ON storage.objects;
CREATE POLICY diary_images_select_public ON storage.objects
  FOR SELECT
  USING (bucket_id = 'diary-images');

-- No INSERT/UPDATE/DELETE policies for diary-images →
-- only service_role (which bypasses RLS) can write/delete.
