-- buddy-note RLS policies
-- Source of truth: Eng review §1.5 (bao-main-eng-review-20260419-235500.md)
--
-- Policy matrix (read top-down per table):
--
--   pets                   owner RW; anon SELECT if is_public
--   logs                   owner RW only; NEVER public (memo is private)
--   diaries                owner RW; anon SELECT if parent pet is public;
--                          INSERT is service-role only (LLM pipeline)
--   pet_memory_summary     owner SELECT; mutations service-role only; never public
--   memory_update_queue    service-role only
--   slug_reserved          anon SELECT (pre-validation UX); mutations service-role only
--
-- Supabase convention: the anon and authenticated roles are subject to RLS;
-- the service_role key bypasses RLS entirely. We therefore do NOT create
-- policies FOR service_role — it is implicitly allowed.

-- =====================================================================
-- pets
-- =====================================================================
ALTER TABLE public.pets ENABLE ROW LEVEL SECURITY;

CREATE POLICY pets_select_own ON public.pets
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY pets_select_public ON public.pets
  FOR SELECT
  USING (is_public = true);

CREATE POLICY pets_insert_own ON public.pets
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY pets_update_own ON public.pets
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY pets_delete_own ON public.pets
  FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================================
-- logs (private — never public, even for public pets)
-- =====================================================================
ALTER TABLE public.logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY logs_select_own ON public.logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.pets
      WHERE pets.id = logs.pet_id AND pets.user_id = auth.uid()
    )
  );

CREATE POLICY logs_insert_own ON public.logs
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.pets
      WHERE pets.id = logs.pet_id AND pets.user_id = auth.uid()
    )
  );

CREATE POLICY logs_update_own ON public.logs
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.pets
      WHERE pets.id = logs.pet_id AND pets.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.pets
      WHERE pets.id = logs.pet_id AND pets.user_id = auth.uid()
    )
  );

CREATE POLICY logs_delete_own ON public.logs
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.pets
      WHERE pets.id = logs.pet_id AND pets.user_id = auth.uid()
    )
  );

-- =====================================================================
-- diaries
-- Owner SELECT + anon SELECT if parent pet is public.
-- INSERT is service-role only: clients never insert diaries directly — the
-- LLM pipeline does, via the admin client. UPDATE/DELETE owner-scoped so
-- users can correct is_fallback metadata or soft-delete their own diaries.
-- =====================================================================
ALTER TABLE public.diaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY diaries_select_own ON public.diaries
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.pets
      WHERE pets.id = diaries.pet_id AND pets.user_id = auth.uid()
    )
  );

CREATE POLICY diaries_select_public ON public.diaries
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.pets
      WHERE pets.id = diaries.pet_id AND pets.is_public = true
    )
  );

-- No INSERT policy → INSERT blocked for anon + authenticated.
-- service_role bypasses RLS, so the LLM pipeline (server-side admin client)
-- is the only path that can create diaries.

CREATE POLICY diaries_update_own ON public.diaries
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.pets
      WHERE pets.id = diaries.pet_id AND pets.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.pets
      WHERE pets.id = diaries.pet_id AND pets.user_id = auth.uid()
    )
  );

CREATE POLICY diaries_delete_own ON public.diaries
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.pets
      WHERE pets.id = diaries.pet_id AND pets.user_id = auth.uid()
    )
  );

-- =====================================================================
-- pet_memory_summary (strictly private)
-- Owner can SELECT (for debugging / settings UI later), but never mutate.
-- Only the memory-updater Edge Function (service_role) writes.
-- =====================================================================
ALTER TABLE public.pet_memory_summary ENABLE ROW LEVEL SECURITY;

CREATE POLICY pet_memory_summary_select_own ON public.pet_memory_summary
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.pets
      WHERE pets.id = pet_memory_summary.pet_id AND pets.user_id = auth.uid()
    )
  );

-- No INSERT/UPDATE/DELETE policies → all mutations are service-role only.

-- =====================================================================
-- memory_update_queue (fully internal)
-- =====================================================================
ALTER TABLE public.memory_update_queue ENABLE ROW LEVEL SECURITY;
-- No policies → all access is service-role only.

-- =====================================================================
-- slug_reserved
-- anon may read to pre-validate slugs in the onboarding UI.
-- Mutations are service-role only (reserved list is deployment-managed).
-- =====================================================================
ALTER TABLE public.slug_reserved ENABLE ROW LEVEL SECURITY;

CREATE POLICY slug_reserved_select_all ON public.slug_reserved
  FOR SELECT
  USING (true);

-- No INSERT/UPDATE/DELETE policies → service-role only.
