-- buddy-note memory-updater worker helpers
-- Source of truth: AGENTS.md "LLM pipeline step 5" + rules/architecture.md §9
--
-- These functions are called by the Next.js Route Handler at
-- app/api/memory/process/route.ts via the service_role key. They:
--
--   1. claim_memory_queue_batch  — atomically pick N pending rows with
--      FOR UPDATE SKIP LOCKED so concurrent workers don't double-claim.
--   2. try_advisory_lock_pet / release_advisory_lock_pet — per-pet session
--      advisory lock so two logs for the same pet can't race each other
--      into pet_memory_summary.
--   3. mark_queue_done / mark_queue_failed / mark_queue_retry — typed
--      status transitions the worker uses instead of inline UPDATEs, so the
--      state machine (architecture.md §5) lives in one place.
--
-- All functions are service_role only — EXECUTE revoked from anon + authenticated.
-- service_role bypasses RLS and retains EXECUTE via default Postgres grants.

-- =====================================================================
-- claim_memory_queue_batch
-- Atomic batch claim with FOR UPDATE SKIP LOCKED (PostgREST builder can't
-- express this, so we wrap it here).
-- =====================================================================
CREATE OR REPLACE FUNCTION public.claim_memory_queue_batch(p_batch_size integer)
RETURNS TABLE (queue_id bigint, pet_id uuid, log_id uuid, attempts integer)
LANGUAGE sql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH claimed AS (
    SELECT id
    FROM public.memory_update_queue
    WHERE status = 'pending'
      AND (locked_until IS NULL OR locked_until < now())
    ORDER BY created_at
    LIMIT GREATEST(p_batch_size, 1)
    FOR UPDATE SKIP LOCKED
  )
  UPDATE public.memory_update_queue q
  SET status = 'processing',
      locked_until = now() + interval '5 minutes',
      attempts = q.attempts + 1
  FROM claimed
  WHERE q.id = claimed.id
  RETURNING q.id AS queue_id, q.pet_id, q.log_id, q.attempts;
$$;

REVOKE EXECUTE ON FUNCTION public.claim_memory_queue_batch(integer) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.claim_memory_queue_batch(integer) FROM anon, authenticated;

COMMENT ON FUNCTION public.claim_memory_queue_batch(integer) IS
  'Atomic batch claim for the memory-updater worker. Picks up to p_batch_size
   pending rows, marks them processing with a 5-minute lease, and bumps attempts.
   Called via service_role from app/api/memory/process/route.ts.';

-- =====================================================================
-- Per-pet advisory lock helpers
-- Session-level advisory lock (not xact) so the Next.js route can acquire
-- and release across separate round-trips. hashtextextended gives us a
-- stable int8 key from 'memory:<pet_id>'.
-- =====================================================================
CREATE OR REPLACE FUNCTION public.try_advisory_lock_pet(p_pet_id uuid)
RETURNS boolean
LANGUAGE sql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT pg_try_advisory_lock(hashtextextended('memory:' || p_pet_id::text, 0));
$$;

REVOKE EXECUTE ON FUNCTION public.try_advisory_lock_pet(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.try_advisory_lock_pet(uuid) FROM anon, authenticated;

COMMENT ON FUNCTION public.try_advisory_lock_pet(uuid) IS
  'Non-blocking session advisory lock keyed by pet_id. Returns false when another
   worker already holds it — caller should release its queue claim and move on.';

CREATE OR REPLACE FUNCTION public.release_advisory_lock_pet(p_pet_id uuid)
RETURNS boolean
LANGUAGE sql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT pg_advisory_unlock(hashtextextended('memory:' || p_pet_id::text, 0));
$$;

REVOKE EXECUTE ON FUNCTION public.release_advisory_lock_pet(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.release_advisory_lock_pet(uuid) FROM anon, authenticated;

COMMENT ON FUNCTION public.release_advisory_lock_pet(uuid) IS
  'Session advisory lock release. MUST be called in a finally-style block so we
   do not starve later workers if the route handler throws mid-process.';

-- =====================================================================
-- Queue status transitions — typed RPCs the worker uses in place of
-- inline UPDATEs. One place to change state semantics.
-- =====================================================================
CREATE OR REPLACE FUNCTION public.mark_queue_done(p_queue_id bigint)
RETURNS void
LANGUAGE sql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.memory_update_queue
  SET status = 'done',
      locked_until = NULL,
      last_error = NULL
  WHERE id = p_queue_id;
$$;

REVOKE EXECUTE ON FUNCTION public.mark_queue_done(bigint) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.mark_queue_done(bigint) FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.mark_queue_failed(p_queue_id bigint, p_error text DEFAULT NULL)
RETURNS void
LANGUAGE sql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.memory_update_queue
  SET status = 'failed',
      locked_until = NULL,
      last_error = p_error
  WHERE id = p_queue_id;
$$;

REVOKE EXECUTE ON FUNCTION public.mark_queue_failed(bigint, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.mark_queue_failed(bigint, text) FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.mark_queue_retry(p_queue_id bigint, p_error text DEFAULT NULL)
RETURNS void
LANGUAGE sql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
  -- Put the row back on the queue. locked_until cleared so it is picked up
  -- on the next tick. attempts is NOT decremented — claim_memory_queue_batch
  -- already bumped it, and we want the retry budget to shrink monotonically.
  UPDATE public.memory_update_queue
  SET status = 'pending',
      locked_until = NULL,
      last_error = p_error
  WHERE id = p_queue_id;
$$;

REVOKE EXECUTE ON FUNCTION public.mark_queue_retry(bigint, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.mark_queue_retry(bigint, text) FROM anon, authenticated;

COMMENT ON FUNCTION public.mark_queue_done(bigint) IS
  'Mark a queue row done. Used on success AND on LLM fallback (fallback keeps
   the previous summary — a valid terminal state, architecture.md §9).';
COMMENT ON FUNCTION public.mark_queue_failed(bigint, text) IS
  'Terminal failure. Worker uses this when attempts >= 3 or the pet is missing.';
COMMENT ON FUNCTION public.mark_queue_retry(bigint, text) IS
  'Release a row back to pending without terminating — used when the per-pet
   advisory lock is held by another worker, or a transient error occurred.';
