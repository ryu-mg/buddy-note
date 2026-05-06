-- Pet-level premium theme preset settings.

CREATE TABLE IF NOT EXISTS public.pet_theme_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id uuid NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
  theme_key text NOT NULL DEFAULT 'classic_terracotta',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT pet_theme_settings_pet_unique UNIQUE (pet_id),
  CONSTRAINT pet_theme_settings_theme_key_chk
    CHECK (theme_key IN (
      'classic_terracotta',
      'field_green',
      'morning_gold',
      'quiet_umber',
      'mist_blue'
    ))
);

DROP TRIGGER IF EXISTS pet_theme_settings_set_updated_at
  ON public.pet_theme_settings;

CREATE TRIGGER pet_theme_settings_set_updated_at
  BEFORE UPDATE ON public.pet_theme_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.pet_theme_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY pet_theme_settings_select_owner
  ON public.pet_theme_settings
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.pets
      WHERE pets.id = pet_theme_settings.pet_id
        AND pets.user_id = auth.uid()
    )
  );

CREATE POLICY pet_theme_settings_select_public_pet
  ON public.pet_theme_settings
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.pets
      WHERE pets.id = pet_theme_settings.pet_id
        AND pets.is_public = true
    )
  );

CREATE POLICY pet_theme_settings_insert_owner
  ON public.pet_theme_settings
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.pets
      WHERE pets.id = pet_theme_settings.pet_id
        AND pets.user_id = auth.uid()
    )
    AND EXISTS (
      SELECT 1
      FROM public.memberships
      WHERE memberships.user_id = auth.uid()
        AND (
          memberships.status IN ('trialing', 'active', 'canceling')
          OR (
            memberships.status = 'past_due'
            AND memberships.grace_ends_at > now()
          )
        )
    )
  );

CREATE POLICY pet_theme_settings_update_owner
  ON public.pet_theme_settings
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM public.pets
      WHERE pets.id = pet_theme_settings.pet_id
        AND pets.user_id = auth.uid()
    )
    AND EXISTS (
      SELECT 1
      FROM public.memberships
      WHERE memberships.user_id = auth.uid()
        AND (
          memberships.status IN ('trialing', 'active', 'canceling')
          OR (
            memberships.status = 'past_due'
            AND memberships.grace_ends_at > now()
          )
        )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.pets
      WHERE pets.id = pet_theme_settings.pet_id
        AND pets.user_id = auth.uid()
    )
    AND EXISTS (
      SELECT 1
      FROM public.memberships
      WHERE memberships.user_id = auth.uid()
        AND (
          memberships.status IN ('trialing', 'active', 'canceling')
          OR (
            memberships.status = 'past_due'
            AND memberships.grace_ends_at > now()
          )
        )
    )
  );

CREATE INDEX IF NOT EXISTS pet_theme_settings_pet_id_idx
  ON public.pet_theme_settings (pet_id);
