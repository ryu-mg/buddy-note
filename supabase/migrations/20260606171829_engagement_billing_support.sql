-- Engagement, support, and Toss Payments membership records.
-- Forward-only append. Existing membership entitlement table is extended,
-- but no column is renamed or dropped.

ALTER TABLE public.memberships
  ADD COLUMN IF NOT EXISTS provider text DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS provider_customer_key text,
  ADD COLUMN IF NOT EXISTS provider_billing_key text,
  ADD COLUMN IF NOT EXISTS last_payment_order_id text,
  ADD COLUMN IF NOT EXISTS last_payment_key text;

CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind text NOT NULL,
  title text NOT NULL,
  body text NOT NULL,
  href text,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT notifications_kind_chk
    CHECK (kind IN (
      'notice',
      'membership',
      'diary',
      'support',
      'system'
    )),
  CONSTRAINT notifications_title_len_chk CHECK (char_length(title) BETWEEN 1 AND 80),
  CONSTRAINT notifications_body_len_chk CHECK (char_length(body) BETWEEN 1 AND 400)
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY notifications_select_own
  ON public.notifications
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS notifications_user_created_idx
  ON public.notifications (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS notifications_user_unread_idx
  ON public.notifications (user_id, read_at)
  WHERE read_at IS NULL;

CREATE TABLE IF NOT EXISTS public.support_faqs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL DEFAULT 'usage',
  question text NOT NULL,
  answer text NOT NULL,
  sort_order int NOT NULL DEFAULT 0,
  is_published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT support_faqs_category_chk
    CHECK (category IN ('usage', 'membership', 'account', 'diary')),
  CONSTRAINT support_faqs_question_len_chk CHECK (char_length(question) BETWEEN 1 AND 120),
  CONSTRAINT support_faqs_answer_len_chk CHECK (char_length(answer) BETWEEN 1 AND 800)
);

DROP TRIGGER IF EXISTS support_faqs_set_updated_at
  ON public.support_faqs;

CREATE TRIGGER support_faqs_set_updated_at
  BEFORE UPDATE ON public.support_faqs
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.support_faqs ENABLE ROW LEVEL SECURITY;

CREATE POLICY support_faqs_select_published
  ON public.support_faqs
  FOR SELECT
  USING (is_published = true);

CREATE INDEX IF NOT EXISTS support_faqs_published_sort_idx
  ON public.support_faqs (is_published, sort_order, created_at DESC);

CREATE TABLE IF NOT EXISTS public.notices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  body text NOT NULL,
  published_at timestamptz,
  is_published boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT notices_title_len_chk CHECK (char_length(title) BETWEEN 1 AND 100),
  CONSTRAINT notices_body_len_chk CHECK (char_length(body) BETWEEN 1 AND 2000)
);

DROP TRIGGER IF EXISTS notices_set_updated_at
  ON public.notices;

CREATE TRIGGER notices_set_updated_at
  BEFORE UPDATE ON public.notices
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.notices ENABLE ROW LEVEL SECURITY;

CREATE POLICY notices_select_published
  ON public.notices
  FOR SELECT
  USING (is_published = true AND published_at <= now());

CREATE INDEX IF NOT EXISTS notices_published_idx
  ON public.notices (is_published, published_at DESC);

CREATE TABLE IF NOT EXISTS public.support_inquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category text NOT NULL,
  title text NOT NULL,
  body text NOT NULL,
  status text NOT NULL DEFAULT 'open',
  admin_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT support_inquiries_category_chk
    CHECK (category IN ('question', 'bug', 'feature')),
  CONSTRAINT support_inquiries_status_chk
    CHECK (status IN ('open', 'reviewing', 'answered', 'closed')),
  CONSTRAINT support_inquiries_title_len_chk CHECK (char_length(title) BETWEEN 2 AND 80),
  CONSTRAINT support_inquiries_body_len_chk CHECK (char_length(body) BETWEEN 10 AND 1000)
);

DROP TRIGGER IF EXISTS support_inquiries_set_updated_at
  ON public.support_inquiries;

CREATE TRIGGER support_inquiries_set_updated_at
  BEFORE UPDATE ON public.support_inquiries
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.support_inquiries ENABLE ROW LEVEL SECURITY;

CREATE POLICY support_inquiries_select_own
  ON public.support_inquiries
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY support_inquiries_insert_own
  ON public.support_inquiries
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS support_inquiries_user_created_idx
  ON public.support_inquiries (user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.membership_payment_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id text NOT NULL UNIQUE,
  order_name text NOT NULL,
  amount int NOT NULL,
  currency text NOT NULL DEFAULT 'KRW',
  provider text NOT NULL DEFAULT 'toss',
  environment text NOT NULL DEFAULT 'test',
  status text NOT NULL DEFAULT 'pending',
  payment_key text,
  checkout_url text,
  approved_at timestamptz,
  failure_code text,
  failure_message text,
  raw_response jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT membership_payment_orders_amount_chk CHECK (amount > 0),
  CONSTRAINT membership_payment_orders_environment_chk
    CHECK (environment IN ('test', 'live')),
  CONSTRAINT membership_payment_orders_status_chk
    CHECK (status IN ('pending', 'ready', 'approved', 'failed', 'canceled'))
);

DROP TRIGGER IF EXISTS membership_payment_orders_set_updated_at
  ON public.membership_payment_orders;

CREATE TRIGGER membership_payment_orders_set_updated_at
  BEFORE UPDATE ON public.membership_payment_orders
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.membership_payment_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY membership_payment_orders_select_own
  ON public.membership_payment_orders
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS membership_payment_orders_user_created_idx
  ON public.membership_payment_orders (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS membership_payment_orders_order_idx
  ON public.membership_payment_orders (order_id);

CREATE TABLE IF NOT EXISTS public.pet_diary_font_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id uuid NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
  font_key text NOT NULL DEFAULT 'buddy_hand',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT pet_diary_font_settings_pet_unique UNIQUE (pet_id),
  CONSTRAINT pet_diary_font_settings_font_key_chk
    CHECK (font_key IN ('buddy_hand', 'line_seed', 'maru_buri'))
);

DROP TRIGGER IF EXISTS pet_diary_font_settings_set_updated_at
  ON public.pet_diary_font_settings;

CREATE TRIGGER pet_diary_font_settings_set_updated_at
  BEFORE UPDATE ON public.pet_diary_font_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.pet_diary_font_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY pet_diary_font_settings_select_owner
  ON public.pet_diary_font_settings
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.pets
      WHERE pets.id = pet_diary_font_settings.pet_id
        AND pets.user_id = auth.uid()
    )
  );

CREATE POLICY pet_diary_font_settings_insert_member_owner
  ON public.pet_diary_font_settings
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.pets
      WHERE pets.id = pet_diary_font_settings.pet_id
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

CREATE POLICY pet_diary_font_settings_update_member_owner
  ON public.pet_diary_font_settings
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM public.pets
      WHERE pets.id = pet_diary_font_settings.pet_id
        AND pets.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.pets
      WHERE pets.id = pet_diary_font_settings.pet_id
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

CREATE INDEX IF NOT EXISTS pet_diary_font_settings_pet_id_idx
  ON public.pet_diary_font_settings (pet_id);
