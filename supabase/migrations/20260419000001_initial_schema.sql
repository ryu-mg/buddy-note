-- buddy-note initial schema
-- Source of truth: /Users/bao/.gstack/projects/new-project/bao-main-eng-review-20260419-235500.md
--   Section 1.2 (memory_update_queue concurrency)
--   Section 1.5 (RLS matrix)  -- policies live in the next migration
--   Section 1.6 (slug policy + reserved list)
--
-- This migration creates tables, indexes, triggers, and helper functions.
-- RLS policies are in 20260419000002_rls_policies.sql.

-- =====================================================================
-- Extensions
-- =====================================================================
CREATE EXTENSION IF NOT EXISTS "pgcrypto";  -- gen_random_uuid()

-- pg_net and pg_cron are used by the memory-updater pipeline (Eng review §1.2)
-- and are provided by hosted Supabase. They are NOT enabled by default in the
-- local CLI stack, so we try to load them and swallow the error if unavailable.
-- On hosted Supabase, enable them once via Studio → Database → Extensions, or
-- uncomment the raw CREATE EXTENSION statements below when running there.
DO $extensions$
BEGIN
  BEGIN
    EXECUTE 'CREATE EXTENSION IF NOT EXISTS "pg_net"';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'pg_net not available in this environment — memory-updater HTTP calls will need another transport';
  END;
  BEGIN
    EXECUTE 'CREATE EXTENSION IF NOT EXISTS "pg_cron"';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'pg_cron not available in this environment — schedule the memory-updater worker externally';
  END;
END;
$extensions$;

-- =====================================================================
-- Shared helpers
-- =====================================================================

-- Generic updated_at trigger function. Attached below to each table
-- that wants automatic updated_at bumps on row UPDATE.
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

-- =====================================================================
-- slug_reserved (referenced by slug validation on pets)
-- Seeded in supabase/seed.sql.
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.slug_reserved (
  slug text PRIMARY KEY
);

COMMENT ON TABLE public.slug_reserved IS
  'Reserved slugs that cannot be used as public pet profile handles.
   See Eng review §1.6.';

-- =====================================================================
-- pets
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.pets (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                 uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name                    text NOT NULL,
  species                 text NOT NULL CHECK (species IN ('dog', 'cat')),
  breed                   text,
  persona_answers         jsonb NOT NULL DEFAULT '{}'::jsonb,
  persona_prompt_fragment text,
  slug                    text NOT NULL UNIQUE,
  is_public               boolean NOT NULL DEFAULT false,
  deceased_at             timestamptz,  -- v2 memorial support; kept nullable so no future migration
  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now(),

  -- Slug format: lowercase alphanumerics + hyphen, 3-30 chars, must start with [a-z0-9].
  -- This mirrors lib/slug/generate.ts validation (Eng review §1.6).
  CONSTRAINT pets_slug_format_chk
    CHECK (slug ~ '^[a-z0-9][a-z0-9-]{2,29}$')
);

COMMENT ON COLUMN public.pets.persona_answers IS
  'Q1-Q5 MBTI answers for pet persona. Schema lives in docs/pet-mbti-questions-v0.md.';
COMMENT ON COLUMN public.pets.persona_prompt_fragment IS
  'Pre-assembled 1st-person 자기소개 snippet injected into the LLM system prompt.';
COMMENT ON COLUMN public.pets.deceased_at IS
  'v2 memorial: when non-null, pet is in memorial mode. Column present in v1 to avoid later migration.';

CREATE INDEX IF NOT EXISTS pets_user_id_idx ON public.pets(user_id);

-- updated_at auto-bump
DROP TRIGGER IF EXISTS pets_set_updated_at ON public.pets;
CREATE TRIGGER pets_set_updated_at
  BEFORE UPDATE ON public.pets
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Slug reserved-list enforcement. We also enforce format via the check above,
-- but reserved names are data, not regex.
CREATE OR REPLACE FUNCTION public.pets_slug_not_reserved()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.slug_reserved WHERE slug = NEW.slug) THEN
    RAISE EXCEPTION 'slug "%": reserved', NEW.slug
      USING ERRCODE = '23514';  -- check_violation
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS pets_slug_not_reserved_chk ON public.pets;
CREATE TRIGGER pets_slug_not_reserved_chk
  BEFORE INSERT OR UPDATE OF slug ON public.pets
  FOR EACH ROW EXECUTE FUNCTION public.pets_slug_not_reserved();

-- =====================================================================
-- logs
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.logs (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id             uuid NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
  photo_url          text NOT NULL,
  photo_storage_path text NOT NULL,
  tags               text[] NOT NULL DEFAULT '{}',
  memo               text,
  created_at         timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT logs_memo_length_chk CHECK (memo IS NULL OR char_length(memo) <= 200)
);

COMMENT ON COLUMN public.logs.photo_url IS
  'Signed URL (7d TTL) from the private photos bucket. Regenerated on expiry — do not treat as permanent.';
COMMENT ON COLUMN public.logs.photo_storage_path IS
  'bucket + key so we can re-sign, re-upload, or delete. Format: photos/{user_id}/{log_id}.{ext}';
COMMENT ON COLUMN public.logs.tags IS
  'Enum subset: meal, walk, bathroom, play, sleep, outing, bath, snack.
   Not enforced at DB level — the LLM tool_use schema (lib/llm/schema.ts) is the validation boundary.';

CREATE INDEX IF NOT EXISTS logs_pet_id_created_at_idx
  ON public.logs(pet_id, created_at DESC);

-- =====================================================================
-- diaries
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.diaries (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  log_id        uuid NOT NULL UNIQUE REFERENCES public.logs(id) ON DELETE CASCADE,
  pet_id        uuid NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
  title         text NOT NULL,
  body          text NOT NULL,
  image_url_916 text,
  image_url_45  text,
  image_url_11  text,
  is_fallback   boolean NOT NULL DEFAULT false,
  model_used    text,
  latency_ms    integer,
  tokens_input  integer,
  tokens_output integer,
  created_at    timestamptz NOT NULL DEFAULT now()
);

COMMENT ON COLUMN public.diaries.is_fallback IS
  'True when the diary was produced by the template fallback path (Eng review §1.3).
   Cron can later re-run generation and flip this back to false.';
COMMENT ON COLUMN public.diaries.model_used IS
  'e.g. claude-sonnet-4-6, gpt-4o, gemini-2.5-flash, fallback-template.';

CREATE INDEX IF NOT EXISTS diaries_pet_id_created_at_idx
  ON public.diaries(pet_id, created_at DESC);

-- =====================================================================
-- pet_memory_summary (1:1 with pet)
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.pet_memory_summary (
  pet_id            uuid PRIMARY KEY REFERENCES public.pets(id) ON DELETE CASCADE,
  tone_description  text,
  recurring_habits  text[] NOT NULL DEFAULT '{}',
  favorite_things   text[] NOT NULL DEFAULT '{}',
  recent_callbacks  jsonb  NOT NULL DEFAULT '[]'::jsonb,
  version           integer NOT NULL DEFAULT 1,  -- optimistic lock
  updated_at        timestamptz NOT NULL DEFAULT now()
);

COMMENT ON COLUMN public.pet_memory_summary.recent_callbacks IS
  'Array of {date: timestamptz, detail: text}. Used by the diary LLM prompt for callbacks.';
COMMENT ON COLUMN public.pet_memory_summary.version IS
  'Optimistic lock. memory-updater worker bumps this by 1 on every successful UPDATE.
   See Eng review §1.2 race-window mitigation.';

DROP TRIGGER IF EXISTS pet_memory_summary_set_updated_at ON public.pet_memory_summary;
CREATE TRIGGER pet_memory_summary_set_updated_at
  BEFORE UPDATE ON public.pet_memory_summary
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =====================================================================
-- memory_update_queue (Eng review §1.2)
-- Async pipeline: log INSERT → trigger enqueues → pg_cron worker drains
-- per pet_id with advisory lock.
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.memory_update_queue (
  id            bigserial PRIMARY KEY,
  pet_id        uuid NOT NULL REFERENCES public.pets(id)  ON DELETE CASCADE,
  log_id        uuid NOT NULL REFERENCES public.logs(id)  ON DELETE CASCADE,
  status        text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'processing', 'done', 'failed')),
  attempts      integer NOT NULL DEFAULT 0,
  last_error    text,
  locked_until  timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now()
);

COMMENT ON COLUMN public.memory_update_queue.locked_until IS
  'Advisory lock TTL. Worker sets this when claiming a row; stale rows (locked_until < now())
   can be reclaimed to recover from crashed workers.';

-- Partial index: the worker only ever selects status = ''pending''.
-- Keeping the index narrow keeps drain scans cheap even after millions of done rows.
CREATE INDEX IF NOT EXISTS memory_update_queue_pending_idx
  ON public.memory_update_queue(status, locked_until)
  WHERE status = 'pending';

-- Trigger: enqueue on every log insert. The worker coalesces per pet_id.
CREATE OR REPLACE FUNCTION public.enqueue_memory_update()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.memory_update_queue (pet_id, log_id)
  VALUES (NEW.pet_id, NEW.id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS logs_enqueue_memory_update ON public.logs;
CREATE TRIGGER logs_enqueue_memory_update
  AFTER INSERT ON public.logs
  FOR EACH ROW EXECUTE FUNCTION public.enqueue_memory_update();
