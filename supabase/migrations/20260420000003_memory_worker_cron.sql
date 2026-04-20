-- buddy-note memory-updater cron setup (pg_cron + pg_net)
-- Source of truth: AGENTS.md "LLM pipeline step 5" + rules/architecture.md §9
--
-- Why this migration does NOT auto-schedule the job:
--   * The cron body references an app URL and a bearer secret that only exist
--     in the deployed environment (Vercel URL + MEMORY_WORKER_SECRET).
--   * Migrations run before the app is deployed, so baking those values in
--     here would either hard-code a placeholder or leak a real secret into
--     the repo. Both are bad.
--
-- Instead: this migration makes sure pg_cron + pg_net are enabled and leaves
-- the cron.schedule() call as a doc comment. After your first deploy, paste
-- the block below into Supabase Studio → SQL Editor (still as service_role)
-- with your real app URL and secret.

-- =====================================================================
-- Extensions — idempotent. In local CLI these may not be available, but
-- the initial migration already uses the same "try + NOTICE" pattern so
-- we keep it strict here: hosted Supabase always has them enabled once
-- you flip them on in the dashboard.
-- =====================================================================
DO $extensions$
BEGIN
  BEGIN
    EXECUTE 'CREATE EXTENSION IF NOT EXISTS "pg_cron"';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'pg_cron not available — enable via Supabase Studio → Database → Extensions, then re-run the schedule block manually.';
  END;
  BEGIN
    EXECUTE 'CREATE EXTENSION IF NOT EXISTS "pg_net"';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'pg_net not available — enable via Supabase Studio → Database → Extensions, then re-run the schedule block manually.';
  END;
END;
$extensions$;

-- =====================================================================
-- Post-deploy schedule block (DO NOT uncomment in this file).
--
-- Run this in Supabase Studio → SQL Editor, replacing:
--   YOUR_APP_URL        → https://buddy-note.vercel.app  (or your prod host)
--   YOUR_WORKER_SECRET  → value of MEMORY_WORKER_SECRET in Vercel env
--
-- The worker is cheap (returns fast when queue is empty) so every-minute
-- cadence is fine. Adjust to '*/2 * * * *' if you need to back off.
--
-- =====================================================================
/*
SELECT cron.schedule(
  'memory-worker-tick',
  '* * * * *',
  $body$
    SELECT net.http_post(
      url := 'https://YOUR_APP_URL/api/memory/process',
      headers := '{"Authorization": "Bearer YOUR_WORKER_SECRET", "Content-Type": "application/json"}'::jsonb,
      body := '{}'::jsonb,
      timeout_milliseconds := 30000
    );
  $body$
);
*/

-- To unschedule (e.g., during an incident):
--   SELECT cron.unschedule('memory-worker-tick');
--
-- To inspect:
--   SELECT jobid, schedule, command, active FROM cron.job WHERE jobname = 'memory-worker-tick';
--   SELECT * FROM cron.job_run_details WHERE jobid = <id> ORDER BY start_time DESC LIMIT 20;
--
-- Observability (architecture.md §10): queue depth + failed rate are the key
-- signals — alert thresholds are in the observability table there.
