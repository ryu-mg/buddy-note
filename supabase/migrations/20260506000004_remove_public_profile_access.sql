-- Public profile feature removed.
-- Keep legacy columns for forward-only compatibility, but disable anon reads.

UPDATE public.pets
SET is_public = false
WHERE is_public = true;

DROP POLICY IF EXISTS pets_select_public ON public.pets;
DROP POLICY IF EXISTS diaries_select_public ON public.diaries;
DROP POLICY IF EXISTS pet_theme_settings_select_public_pet
  ON public.pet_theme_settings;
