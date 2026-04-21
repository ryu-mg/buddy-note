-- MVP redesign: Kakao-only UI, dog-only onboarding, guardian relationship,
-- 4-axis MBTI result, and one diary per pet per local day.
--
-- Forward-only migration. Existing rows are kept; new application writes use
-- species='dog' and log_date for daily uniqueness.

ALTER TABLE public.pets
  ADD COLUMN IF NOT EXISTS guardian_relationship text,
  ADD COLUMN IF NOT EXISTS personality_code text,
  ADD COLUMN IF NOT EXISTS personality_label text;

COMMENT ON COLUMN public.pets.guardian_relationship IS
  '보호자 호칭 used in diary/persona prompts, e.g. 누나, 언니, 오빠, 형, 동생.';
COMMENT ON COLUMN public.pets.personality_code IS
  'Human MBTI-style 4-letter code for the dog persona, e.g. ENFP.';
COMMENT ON COLUMN public.pets.personality_label IS
  'Korean product label paired with personality_code, e.g. 문앞 탐험가.';

ALTER TABLE public.pets
  DROP CONSTRAINT IF EXISTS pets_species_check;

ALTER TABLE public.pets
  ADD CONSTRAINT pets_species_dog_only_chk
  CHECK (species = 'dog') NOT VALID;

ALTER TABLE public.pets
  ADD CONSTRAINT pets_guardian_relationship_length_chk
  CHECK (
    guardian_relationship IS NULL
    OR char_length(guardian_relationship) BETWEEN 1 AND 20
  ) NOT VALID,
  ADD CONSTRAINT pets_personality_code_format_chk
  CHECK (
    personality_code IS NULL
    OR personality_code ~ '^[EI][SN][TF][JP]$'
  ) NOT VALID;

ALTER TABLE public.logs
  ADD COLUMN IF NOT EXISTS log_date date;

UPDATE public.logs
SET log_date = (created_at AT TIME ZONE 'Asia/Seoul')::date
WHERE log_date IS NULL;

ALTER TABLE public.logs
  ALTER COLUMN log_date SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS logs_pet_id_log_date_key
  ON public.logs(pet_id, log_date);

CREATE INDEX IF NOT EXISTS logs_pet_id_log_date_idx
  ON public.logs(pet_id, log_date DESC);

COMMENT ON COLUMN public.logs.log_date IS
  'Calendar date in Asia/Seoul. MVP allows one log/diary per pet per day.';
