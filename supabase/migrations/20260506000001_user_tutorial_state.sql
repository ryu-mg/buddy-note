-- User-scoped tutorial state for versioned first-entry education.
-- Forward-only migration. Do not drop or rename existing columns.

CREATE TABLE IF NOT EXISTS public.user_tutorial_state (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tutorial_version text NOT NULL,
  completed_at timestamptz,
  dismissed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT user_tutorial_state_single_terminal_state
    CHECK (completed_at IS NULL OR dismissed_at IS NULL),
  CONSTRAINT user_tutorial_state_user_version_unique
    UNIQUE (user_id, tutorial_version)
);

DROP TRIGGER IF EXISTS user_tutorial_state_set_updated_at
  ON public.user_tutorial_state;

CREATE TRIGGER user_tutorial_state_set_updated_at
  BEFORE UPDATE ON public.user_tutorial_state
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.user_tutorial_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY user_tutorial_state_select_own
  ON public.user_tutorial_state
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY user_tutorial_state_insert_own
  ON public.user_tutorial_state
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY user_tutorial_state_update_own
  ON public.user_tutorial_state
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
