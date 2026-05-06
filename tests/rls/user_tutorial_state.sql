-- RLS sanity checks for public.user_tutorial_state.
--
-- Run against a local Supabase database after `supabase db reset`:
--
--   psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f tests/rls/user_tutorial_state.sql
--
-- The script switches to the authenticated role and sets Supabase JWT claims
-- to verify owner-only read/write behavior.

BEGIN;

CREATE TEMP TABLE rls_tutorial_users AS
SELECT
  gen_random_uuid() AS user_a,
  gen_random_uuid() AS user_b;

GRANT SELECT ON rls_tutorial_users TO authenticated;

INSERT INTO auth.users (id, email)
SELECT user_a, 'tutorial-a@example.test'
FROM rls_tutorial_users;

INSERT INTO auth.users (id, email)
SELECT user_b, 'tutorial-b@example.test'
FROM rls_tutorial_users;

SET LOCAL ROLE authenticated;

SELECT set_config('request.jwt.claim.sub', user_a::text, true)
FROM rls_tutorial_users;

SELECT set_config('request.jwt.claim.role', 'authenticated', true);

INSERT INTO public.user_tutorial_state (
  user_id,
  tutorial_version,
  completed_at
)
SELECT
  user_a,
  'first-entry-v1',
  now()
FROM rls_tutorial_users;

DO $$
DECLARE
  visible_count integer;
BEGIN
  SELECT count(*) INTO visible_count
  FROM public.user_tutorial_state
  WHERE tutorial_version = 'first-entry-v1';

  IF visible_count <> 1 THEN
    RAISE EXCEPTION 'owner should be able to read own tutorial state';
  END IF;
END $$;

SELECT set_config('request.jwt.claim.sub', user_b::text, true)
FROM rls_tutorial_users;

DO $$
DECLARE
  visible_count integer;
BEGIN
  SELECT count(*) INTO visible_count
  FROM public.user_tutorial_state
  WHERE tutorial_version = 'first-entry-v1';

  IF visible_count <> 0 THEN
    RAISE EXCEPTION 'other users must not read tutorial state';
  END IF;
END $$;

DO $$
BEGIN
  INSERT INTO public.user_tutorial_state (
    user_id,
    tutorial_version,
    dismissed_at
  )
  SELECT
    user_a,
    'first-entry-v2',
    now()
  FROM rls_tutorial_users;

  RAISE EXCEPTION 'other users must not insert tutorial state for user_a';
EXCEPTION
  WHEN insufficient_privilege OR check_violation THEN
    NULL;
END $$;

ROLLBACK;
