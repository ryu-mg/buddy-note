-- Per-user notification settings.
-- Forward-only append: preferences are stored separately from notifications so
-- existing notification history remains unchanged.

CREATE TABLE IF NOT EXISTS public.notification_preferences (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  all_notifications_enabled boolean NOT NULL DEFAULT true,
  diary_reminder_enabled boolean NOT NULL DEFAULT true,
  diary_complete_enabled boolean NOT NULL DEFAULT true,
  notice_enabled boolean NOT NULL DEFAULT true,
  membership_enabled boolean NOT NULL DEFAULT true,
  support_enabled boolean NOT NULL DEFAULT true,
  reminder_time text NOT NULL DEFAULT '21:00',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT notification_preferences_reminder_time_chk
    CHECK (reminder_time ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$')
);

DROP TRIGGER IF EXISTS notification_preferences_set_updated_at
  ON public.notification_preferences;

CREATE TRIGGER notification_preferences_set_updated_at
  BEFORE UPDATE ON public.notification_preferences
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY notification_preferences_select_own
  ON public.notification_preferences
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY notification_preferences_insert_own
  ON public.notification_preferences
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY notification_preferences_update_own
  ON public.notification_preferences
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
