-- Minimal membership state needed for server-side premium entitlement checks.
-- Payment provider integration will append provider fields in later migrations.

CREATE TABLE IF NOT EXISTS public.memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'free',
  plan_key text NOT NULL DEFAULT 'free',
  trial_started_at timestamptz,
  trial_ends_at timestamptz,
  current_period_starts_at timestamptz,
  current_period_ends_at timestamptz,
  cancel_at_period_end boolean NOT NULL DEFAULT false,
  grace_ends_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT memberships_status_chk
    CHECK (status IN (
      'free',
      'trialing',
      'active',
      'past_due',
      'canceling',
      'ended',
      'refunded'
    )),
  CONSTRAINT memberships_user_unique UNIQUE (user_id)
);

DROP TRIGGER IF EXISTS memberships_set_updated_at
  ON public.memberships;

CREATE TRIGGER memberships_set_updated_at
  BEFORE UPDATE ON public.memberships
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;

CREATE POLICY memberships_select_own
  ON public.memberships
  FOR SELECT
  USING (auth.uid() = user_id);

-- Direct user writes are intentionally omitted. Server Actions and webhooks
-- must update membership rows through the service role.

CREATE INDEX IF NOT EXISTS memberships_user_id_idx
  ON public.memberships (user_id);
