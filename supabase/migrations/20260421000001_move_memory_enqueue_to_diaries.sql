-- Move memory queue enqueue from logs to diaries.
--
-- Reason:
--   `logs AFTER INSERT` can enqueue while LLM generation and diary insert are
--   still in progress. The worker reads logs with their diary join, so enqueue
--   should happen only after the diary row exists.

DROP TRIGGER IF EXISTS logs_enqueue_memory_update ON public.logs;
DROP TRIGGER IF EXISTS diaries_enqueue_memory_update ON public.diaries;

CREATE OR REPLACE FUNCTION public.enqueue_memory_update()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.memory_update_queue (pet_id, log_id)
  VALUES (NEW.pet_id, NEW.log_id);
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.enqueue_memory_update() IS
  'Enqueues memory updates after a diary exists, so the worker can read log and diary data together.';

CREATE TRIGGER diaries_enqueue_memory_update
  AFTER INSERT ON public.diaries
  FOR EACH ROW EXECUTE FUNCTION public.enqueue_memory_update();
