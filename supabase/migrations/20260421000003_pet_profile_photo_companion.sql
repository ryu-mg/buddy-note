-- Profile photo + companion relationship wording.
--
-- Forward-only: keep guardian_relationship for existing code/data, introduce
-- companion_relationship as the canonical field for new product copy.

ALTER TABLE public.pets
  ADD COLUMN IF NOT EXISTS profile_photo_storage_path text,
  ADD COLUMN IF NOT EXISTS companion_relationship text;

COMMENT ON COLUMN public.pets.profile_photo_storage_path IS
  'Private photos bucket path for the pet profile image, e.g. {user_id}/profile/{pet_id}.jpg.';

COMMENT ON COLUMN public.pets.companion_relationship IS
  '반려인 호칭 used in diary/persona prompts, e.g. 누나, 언니, 오빠, 형, 동생.';

UPDATE public.pets
SET companion_relationship = guardian_relationship
WHERE companion_relationship IS NULL
  AND guardian_relationship IS NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'pets_companion_relationship_length_chk'
      AND conrelid = 'public.pets'::regclass
  ) THEN
    ALTER TABLE public.pets
      ADD CONSTRAINT pets_companion_relationship_length_chk
      CHECK (
        companion_relationship IS NULL
        OR char_length(companion_relationship) BETWEEN 1 AND 20
      );
  END IF;
END $$;
