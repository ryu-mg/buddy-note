# supabase/

Schema migrations, RLS policies, and seed data for **buddy-note**.

Source of truth for design intent:
- `~/.gstack/projects/new-project/bao-main-eng-review-20260419-235500.md` (§1.2, §1.5, §1.6)
- `~/.gstack/projects/new-project/ceo-plans/2026-04-19-buddy-note.md`

## Layout

```
supabase/
  config.toml                                  # local CLI config (port, major_version, etc.)
  migrations/
    20260419000001_initial_schema.sql          # tables, indexes, triggers
    20260419000002_rls_policies.sql            # RLS on every table
  seed.sql                                     # reserved slug list (idempotent)
  README.md                                    # this file
```

Types live in `types/database.ts` at the repo root. Hand-written in Week 1;
regenerate via `supabase gen types typescript --local > types/database.ts` once
the CLI is configured against a real project.

## Prerequisites

- [Supabase CLI](https://supabase.com/docs/guides/local-development/cli/getting-started) (`brew install supabase/tap/supabase`)
- Docker (for `supabase start`)
- Node 22 / Bun (per repo's `.nvmrc`)

## Local development

First time:

```bash
# from repo root
supabase start          # boots Postgres, Storage, Studio, Auth, Edge Runtime
supabase db reset       # applies migrations/ + seed.sql from scratch
```

After editing a migration:

```bash
supabase db reset       # wipes local DB and re-applies everything cleanly
```

Studio is at http://127.0.0.1:54323 (per `config.toml`). Inbucket (local
email) at http://127.0.0.1:54324 — useful for magic-link signin tests.

## Applying to a hosted Supabase project

1. Create a project at https://supabase.com (region: **ap-northeast-2 / Seoul**
   per CEO plan Key Decision #1).
2. Link this repo to it:

   ```bash
   supabase link --project-ref <your-project-ref>
   ```

3. Push migrations:

   ```bash
   supabase db push
   ```

4. Seed the reserved slugs (seed.sql is NOT auto-run on hosted DBs):

   ```bash
   supabase db execute --file supabase/seed.sql
   ```

   Or paste `seed.sql` into the SQL editor — it's idempotent
   (`ON CONFLICT (slug) DO NOTHING`).

5. Regenerate types for app code:

   ```bash
   supabase gen types typescript --linked > types/database.ts
   ```

## RLS sanity checks

Per Eng review §3.3, we need 8 RLS tests before shipping. Minimum matrix
(anon client vs authenticated client):

| Scenario                               | Expected |
| -------------------------------------- | -------- |
| anon reads `pets` where is_public=true | allowed  |
| anon reads `pets` where is_public=false| denied   |
| anon reads `logs` for public pet       | denied (logs are never public) |
| anon reads `diaries` for public pet    | allowed  |
| anon reads `pet_memory_summary`        | denied   |
| anon inserts into `pets`               | denied   |
| auth user reads another user's pet     | denied   |
| auth user reads their own pet          | allowed  |

Implementation lives in `tests/rls/` (not created in this migration).

## Schema notes

- **`deceased_at`** is in `pets` from day one so v2 memorial UX doesn't need
  a migration. Null = alive; timestamp = memorialized.
- **`diaries` has no INSERT policy** — only `service_role` can create diaries.
  The LLM pipeline uses the admin client (`lib/supabase/admin.ts`).
- **`memory_update_queue`** is fully internal (no RLS policies defined).
  The AFTER INSERT trigger on `logs` enqueues work; a pg_cron job + Edge
  Function drains it per pet_id with an advisory lock (Eng review §1.2).
- **Slug validation** is two-layer:
  1. regex check constraint `^[a-z0-9][a-z0-9-]{2,29}$` on the column
  2. BEFORE INSERT/UPDATE trigger that blocks any slug present in
     `slug_reserved`. Client SHOULD also pre-check via the anon-readable
     `slug_reserved` table for good UX.
- **Indexes** we explicitly create: `pets(user_id)`, `logs(pet_id, created_at DESC)`,
  `diaries(pet_id, created_at DESC)`, partial index on
  `memory_update_queue(status, locked_until) WHERE status='pending'`.
  `pets(slug)` is implicit via `UNIQUE`.

## Not in this migration (intentional)

- Storage buckets (`photos` private, `diary-images` public) — create via
  Supabase Studio or a separate bucket-config migration in Week 2.
- `pg_cron` job scheduling — created by the memory-updater Edge Function
  deploy step, not here.
- Rate-limiting tables — using Upstash Redis per Eng review §1.8.
