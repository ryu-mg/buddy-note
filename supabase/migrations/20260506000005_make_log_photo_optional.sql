-- Allow text-only diary logs.
-- Photos remain supported, but logs can now exist with no uploaded image.

UPDATE public.logs
SET
  photo_url = NULLIF(photo_url, ''),
  photo_storage_path = NULLIF(photo_storage_path, '')
WHERE photo_url = '' OR photo_storage_path = '';

ALTER TABLE public.logs
  ALTER COLUMN photo_url DROP NOT NULL,
  ALTER COLUMN photo_storage_path DROP NOT NULL;

COMMENT ON COLUMN public.logs.photo_url IS
  'Nullable signed URL snapshot from the private photos bucket. Null for text-only diary logs.';

COMMENT ON COLUMN public.logs.photo_storage_path IS
  'Nullable storage key for re-sign/delete. Null for text-only diary logs. Format when present: photos/{user_id}/{log_id}.{ext}';
