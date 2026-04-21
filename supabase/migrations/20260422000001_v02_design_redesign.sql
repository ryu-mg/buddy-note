-- buddy-note v0.2 design/data additions.
--
-- Forward-only: add nullable/default-backed fields and a new public milestone
-- table. No destructive rename/drop.

ALTER TABLE public.pets
  ADD COLUMN IF NOT EXISTS additional_info text;

COMMENT ON COLUMN public.pets.additional_info IS
  'Optional free-form note from the companion, appended to persona_prompt_fragment. Max 200 chars.';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'pets_additional_info_length_chk'
      AND conrelid = 'public.pets'::regclass
  ) THEN
    ALTER TABLE public.pets
      ADD CONSTRAINT pets_additional_info_length_chk
      CHECK (additional_info IS NULL OR char_length(additional_info) <= 200);
  END IF;
END $$;

ALTER TABLE public.diaries
  ADD COLUMN IF NOT EXISTS mood text;

COMMENT ON COLUMN public.diaries.mood IS
  'Diary mood selected by the LLM: bright, calm, tired, curious, grumpy, lonely. Existing rows may be NULL.';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'diaries_mood_chk'
      AND conrelid = 'public.diaries'::regclass
  ) THEN
    ALTER TABLE public.diaries
      ADD CONSTRAINT diaries_mood_chk
      CHECK (
        mood IS NULL
        OR mood IN ('bright', 'calm', 'tired', 'curious', 'grumpy', 'lonely')
      );
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.milestone_cards (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id          uuid NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
  milestone_day   integer NOT NULL,
  title           text NOT NULL,
  caption         text NOT NULL,
  image_url_916   text,
  image_url_45    text,
  image_url_11    text,
  is_public       boolean NOT NULL DEFAULT false,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT milestone_cards_day_chk
    CHECK (milestone_day IN (7, 30, 100, 365)),
  CONSTRAINT milestone_cards_unique_pet_day
    UNIQUE (pet_id, milestone_day)
);

DROP TRIGGER IF EXISTS milestone_cards_set_updated_at ON public.milestone_cards;
CREATE TRIGGER milestone_cards_set_updated_at
  BEFORE UPDATE ON public.milestone_cards
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.milestone_cards ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS milestone_cards_select_own ON public.milestone_cards;
CREATE POLICY milestone_cards_select_own ON public.milestone_cards
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.pets
      WHERE pets.id = milestone_cards.pet_id
        AND pets.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS milestone_cards_select_public ON public.milestone_cards;
CREATE POLICY milestone_cards_select_public ON public.milestone_cards
  FOR SELECT
  USING (is_public = true);

DROP POLICY IF EXISTS milestone_cards_update_own ON public.milestone_cards;
CREATE POLICY milestone_cards_update_own ON public.milestone_cards
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.pets
      WHERE pets.id = milestone_cards.pet_id
        AND pets.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.pets
      WHERE pets.id = milestone_cards.pet_id
        AND pets.user_id = auth.uid()
    )
  );

-- No INSERT policy: milestone generation is service-role only.

INSERT INTO public.slug_reserved (slug)
VALUES ('m')
ON CONFLICT (slug) DO NOTHING;
