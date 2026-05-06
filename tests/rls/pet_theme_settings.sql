-- RLS sanity checks for public.pet_theme_settings.
--
-- Run against a local Supabase database after `supabase db reset`:
--
--   psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f tests/rls/pet_theme_settings.sql

BEGIN;

CREATE TEMP TABLE rls_theme_users AS
SELECT
  gen_random_uuid() AS user_a,
  gen_random_uuid() AS user_b,
  gen_random_uuid() AS pet_a;

GRANT SELECT ON rls_theme_users TO authenticated;

INSERT INTO auth.users (id, email)
SELECT user_a, 'theme-a@example.test'
FROM rls_theme_users;

INSERT INTO auth.users (id, email)
SELECT user_b, 'theme-b@example.test'
FROM rls_theme_users;

INSERT INTO public.pets (
  id,
  user_id,
  name,
  species,
  breed,
  persona_answers,
  persona_prompt_fragment,
  slug
)
SELECT
  pet_a,
  user_a,
  '테마',
  'dog',
  '푸들',
  '{}'::jsonb,
  '나는 테마야.',
  'theme-test'
FROM rls_theme_users;

INSERT INTO public.memberships (
  user_id,
  status,
  plan_key,
  current_period_starts_at,
  current_period_ends_at
)
SELECT
  user_a,
  'active',
  'membership',
  now(),
  now() + interval '30 days'
FROM rls_theme_users;

SET LOCAL ROLE authenticated;

SELECT set_config('request.jwt.claim.sub', user_a::text, true)
FROM rls_theme_users;

SELECT set_config('request.jwt.claim.role', 'authenticated', true);

INSERT INTO public.pet_theme_settings (pet_id, theme_key)
SELECT pet_a, 'field_green'
FROM rls_theme_users;

DO $$
DECLARE
  visible_count integer;
BEGIN
  SELECT count(*) INTO visible_count
  FROM public.pet_theme_settings;

  IF visible_count <> 1 THEN
    RAISE EXCEPTION 'owner should read own pet theme setting';
  END IF;
END $$;

SELECT set_config('request.jwt.claim.sub', user_b::text, true)
FROM rls_theme_users;

DO $$
DECLARE
  visible_count integer;
BEGIN
  SELECT count(*) INTO visible_count
  FROM public.pet_theme_settings;

  IF visible_count <> 0 THEN
    RAISE EXCEPTION 'non-owner must not read private pet theme setting';
  END IF;
END $$;

DO $$
BEGIN
  INSERT INTO public.pet_theme_settings (pet_id, theme_key)
  SELECT pet_a, 'morning_gold'
  FROM rls_theme_users
  ON CONFLICT (pet_id) DO UPDATE SET theme_key = excluded.theme_key;

  RAISE EXCEPTION 'non-owner must not write pet theme setting';
EXCEPTION
  WHEN insufficient_privilege OR check_violation THEN
    NULL;
END $$;

ROLLBACK;
