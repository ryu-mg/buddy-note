-- RLS sanity check for removed public profile access.
--
-- Run against a local Supabase database after `supabase db reset`:
--
--   psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f tests/rls/no_public_profile_access.sql

BEGIN;

CREATE TEMP TABLE rls_public_profile_removed AS
SELECT
  gen_random_uuid() AS user_id,
  gen_random_uuid() AS pet_id,
  gen_random_uuid() AS log_id,
  gen_random_uuid() AS diary_id;

INSERT INTO auth.users (id, email)
SELECT user_id, 'public-removed@example.test'
FROM rls_public_profile_removed;

INSERT INTO public.pets (
  id,
  user_id,
  name,
  species,
  breed,
  persona_answers,
  persona_prompt_fragment,
  slug,
  is_public
)
SELECT
  pet_id,
  user_id,
  '마루',
  'dog',
  '푸들',
  '{}'::jsonb,
  '나는 마루야.',
  'public-removed-test',
  true
FROM rls_public_profile_removed;

INSERT INTO public.logs (id, pet_id, photo_url, photo_storage_path, tags, memo)
SELECT log_id, pet_id, '', '', '{}'::text[], null
FROM rls_public_profile_removed;

INSERT INTO public.diaries (id, log_id, pet_id, title, body, model_used)
SELECT diary_id, log_id, pet_id, '오늘', '오늘도 잘 지냈어.', 'test'
FROM rls_public_profile_removed;

INSERT INTO public.pet_theme_settings (pet_id, theme_key)
SELECT pet_id, 'classic_terracotta'
FROM rls_public_profile_removed;

SET LOCAL ROLE anon;

DO $$
DECLARE
  visible_count integer;
BEGIN
  SELECT count(*) INTO visible_count FROM public.pets;
  IF visible_count <> 0 THEN
    RAISE EXCEPTION 'anon must not read pets after public profile removal';
  END IF;

  SELECT count(*) INTO visible_count FROM public.diaries;
  IF visible_count <> 0 THEN
    RAISE EXCEPTION 'anon must not read diaries after public profile removal';
  END IF;

  SELECT count(*) INTO visible_count FROM public.pet_theme_settings;
  IF visible_count <> 0 THEN
    RAISE EXCEPTION 'anon must not read pet theme settings after public profile removal';
  END IF;
END $$;

ROLLBACK;
