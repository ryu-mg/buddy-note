-- Support inquiry topics and private image attachments.
-- Forward-only: keep existing inquiries valid while requiring topic in app code.

ALTER TABLE public.support_inquiries
  ADD COLUMN IF NOT EXISTS topic text;

ALTER TABLE public.support_inquiries
  DROP CONSTRAINT IF EXISTS support_inquiries_topic_chk;

ALTER TABLE public.support_inquiries
  ADD CONSTRAINT support_inquiries_topic_chk
  CHECK (
    topic IS NULL OR topic IN (
      'account',
      'diary',
      'membership',
      'notification',
      'payment',
      'profile',
      'login',
      'upload',
      'layout',
      'performance',
      'sharing',
      'theme',
      'other'
    )
  );

COMMENT ON COLUMN public.support_inquiries.topic IS
  'User-selected support topic. Nullable for rows created before 2026-06-08.';

CREATE TABLE IF NOT EXISTS public.support_inquiry_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  inquiry_id uuid NOT NULL REFERENCES public.support_inquiries(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  storage_path text NOT NULL,
  file_name text NOT NULL,
  content_type text NOT NULL,
  file_size int NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT support_inquiry_attachments_content_type_chk
    CHECK (content_type IN ('image/jpeg', 'image/png', 'image/webp')),
  CONSTRAINT support_inquiry_attachments_file_size_chk
    CHECK (file_size > 0 AND file_size <= 5242880),
  CONSTRAINT support_inquiry_attachments_storage_path_len_chk
    CHECK (char_length(storage_path) BETWEEN 8 AND 512),
  CONSTRAINT support_inquiry_attachments_file_name_len_chk
    CHECK (char_length(file_name) BETWEEN 1 AND 180)
);

ALTER TABLE public.support_inquiry_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY support_inquiry_attachments_select_own
  ON public.support_inquiry_attachments
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY support_inquiry_attachments_insert_own
  ON public.support_inquiry_attachments
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1
      FROM public.support_inquiries
      WHERE support_inquiries.id = support_inquiry_attachments.inquiry_id
        AND support_inquiries.user_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS support_inquiry_attachments_inquiry_idx
  ON public.support_inquiry_attachments (inquiry_id, created_at ASC);

CREATE INDEX IF NOT EXISTS support_inquiries_topic_idx
  ON public.support_inquiries (topic, created_at DESC);
