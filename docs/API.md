# buddy-note API Docs

Last updated: 2026-04-21

Interactive Swagger UI:

- `/api-docs`
- Raw OpenAPI JSON: `/api/openapi.json`

buddy-note는 일반적인 public JSON API 제품이 아니라 Next.js App Router 앱이다. 사용자-facing write flow는 대부분 **Server Actions**로 처리하고, `app/api/*`는 운영 cron/worker 용도의 내부 API만 둔다.

## Base URLs

| 환경 | Base URL |
|---|---|
| Local | `http://localhost:4000` |
| Production | `NEXT_PUBLIC_SITE_URL` 값 |

## Auth Model

| API 종류 | 인증 방식 |
|---|---|
| Browser pages / Server Actions | Supabase Auth session cookie |
| Memory worker | `Authorization: Bearer $MEMORY_WORKER_SECRET` |
| Vercel cron ops routes | `Authorization: Bearer $CRON_SECRET` 또는 route-specific secret |
| Public profile read | 인증 없음. RLS가 `pets.is_public=true`인 diary만 허용 |

공개 클라이언트에서 service role key를 절대 사용하지 않는다. privileged 작업은 `@/lib/supabase/admin`을 경유하는 서버 전용 코드에서만 수행한다.

## Response Conventions

Route Handlers는 JSON을 반환한다.

성공:

```json
{
  "ok": true
}
```

실패:

```json
{
  "ok": false,
  "error": "사람이 읽을 수 있는 에러 메시지"
}
```

운영 route는 정찰 방지를 위해 일부 인증 실패 원인을 일반화한다. 자세한 원인은 서버 로그 또는 Sentry에서 확인한다.

## Public Read Surface

### `GET /b/[slug]`

공개 반려동물 프로필 HTML 페이지. JSON API가 아니다.

| 속성 | 값 |
|---|---|
| Auth | 없음 |
| Cache | ISR 24h (`revalidate = 86400`) |
| Access rule | `pets.is_public=true`일 때만 렌더 |
| Not found policy | 존재하지 않는 slug와 비공개 pet을 모두 404로 처리 |

노출 데이터:

| 데이터 | 공개 여부 |
|---|---|
| pet name | 공개 |
| diary title/body | 공개 |
| diary share image URLs | 공개 |
| user_id | 비공개 |
| logs.memo/tags/photo private path | 비공개 |
| pet_memory_summary | 비공개 |

관련 파일:

- `app/b/[slug]/page.tsx`
- `components/public/public-diary-card.tsx`

## Internal Ops APIs

### `POST /api/memory/process`

`memory_update_queue`를 처리해 `pet_memory_summary`를 갱신하는 내부 worker endpoint.

| 속성 | 값 |
|---|---|
| Method | `POST` |
| Runtime | Node.js |
| Auth | `Authorization: Bearer $MEMORY_WORKER_SECRET` |
| Rate limit | Upstash Redis, global worker limit |
| Caller | Supabase `pg_cron` + `pg_net` |

Request body는 현재 사용하지 않는다.

Example:

```bash
curl -X POST "$NEXT_PUBLIC_SITE_URL/api/memory/process" \
  -H "Authorization: Bearer $MEMORY_WORKER_SECRET" \
  -H "Content-Type: application/json" \
  -d '{}'
```

Success response:

```json
{
  "ok": true,
  "processed": 1,
  "succeeded": 1,
  "failed": 0,
  "skipped": 0
}
```

Failure responses:

| Status | Meaning |
|---|---|
| `401` | missing/invalid `MEMORY_WORKER_SECRET` |
| `429` | worker rate limit exceeded |
| `500` | Supabase env/RPC/processing failure |

Related files:

- `app/api/memory/process/route.ts`
- `lib/memory/process-queue.ts`
- `supabase/migrations/20260420000002_memory_worker_functions.sql`
- `supabase/migrations/20260420000003_memory_worker_cron.sql`

### `GET /api/cleanup/orphan-images`

`diary-images` public bucket에서 `diaries.image_url_*`가 더 이상 참조하지 않는 파일을 제거한다.

| 속성 | 값 |
|---|---|
| Method | `GET` 또는 `POST` |
| Runtime | Node.js |
| Auth | `DIARY_IMAGE_CLEANUP_SECRET` 우선, 없으면 `CRON_SECRET` |
| Caller | Vercel Cron |
| Schedule | `vercel.json` 참고 |

Query parameters:

| Name | Type | Default | Description |
|---|---|---|---|
| `dryRun` | `0` 또는 `1` | `0` | `1`이면 삭제하지 않고 count만 반환 |

Example:

```bash
curl "$NEXT_PUBLIC_SITE_URL/api/cleanup/orphan-images?dryRun=1" \
  -H "Authorization: Bearer $CRON_SECRET"
```

Success response:

```json
{
  "ok": true,
  "dryRun": true,
  "scanned": 12,
  "referenced": 9,
  "orphaned": 3,
  "removed": 0
}
```

Failure responses:

| Status | Meaning |
|---|---|
| `401` | missing/invalid cleanup secret |
| `503` | Supabase service role env missing |
| `500` | Storage list/delete or DB read failure |

Related files:

- `app/api/cleanup/orphan-images/route.ts`
- `lib/ops/diary-image-cleanup.ts`
- `vercel.json`

### `GET /api/health/llm`

Anthropic API가 정상 응답하는지 확인하고, 실패 시 Discord webhook이 설정되어 있으면 알림을 보낸다.

| 속성 | 값 |
|---|---|
| Method | `GET` 또는 `POST` |
| Runtime | Node.js |
| Auth | `LLM_HEALTH_SECRET` 우선, 없으면 `CRON_SECRET` |
| Caller | Vercel Cron |
| Alert | `DISCORD_WEBHOOK_URL` 설정 시 실패 알림 |

Example:

```bash
curl "$NEXT_PUBLIC_SITE_URL/api/health/llm" \
  -H "Authorization: Bearer $CRON_SECRET"
```

Success response:

```json
{
  "ok": true,
  "model": "claude-haiku-4-5",
  "latencyMs": 812,
  "tokensInput": 14,
  "tokensOutput": 3
}
```

Failure responses:

| Status | Meaning |
|---|---|
| `401` | missing/invalid health secret |
| `503` | `ANTHROPIC_API_KEY` missing |
| `502` | Anthropic request failed or empty response |

Failure body includes `notified` to indicate whether Discord notification was sent.

Related files:

- `app/api/health/llm/route.ts`
- `lib/llm/client.ts`
- `lib/ops/cron-auth.ts`
- `vercel.json`

## Server Action Contracts

Server Actions are not stable public HTTP APIs. They are documented here because they are the main FE-BE boundary.

### `createLog(formData)`

Creates a log, uploads the photo, generates a diary, renders share images, and returns the diary id.

Location: `app/log/actions.ts`

Input `FormData`:

| Field | Type | Required | Validation |
|---|---|---:|---|
| `photo` | `File` | yes | JPG/PNG/WebP, max 8MB |
| `petId` | UUID string | yes | must belong to current user |
| `tags` | JSON string array | no | max 8, values from `LOG_TAG_VALUES` |
| `memo` | string | no | max 200 chars |

Success:

```ts
{ ok: true, diaryId: string }
```

Failure:

```ts
{
  ok: false,
  error: string,
  code: 'auth' | 'pet' | 'upload' | 'llm' | 'render' | 'db' | 'rate_limit'
}
```

Important side effects:

- Inserts into `logs`.
- Uploads private photo to `photos`.
- Calls LLM diary generator with fallback behavior.
- Renders and uploads public share images to `diary-images`.
- Inserts into `diaries`.
- `diaries` insert triggers `memory_update_queue` enqueue after the diary row exists.
- Revalidates `/`, `/logs`, and the public `/b/{slug}` page when the pet is public.

### Pet and visibility actions

| Action | Location | Purpose |
|---|---|---|
| `savePet` | `app/onboarding/actions.ts` | create onboarding pet profile |
| `updatePet` | `app/pet/edit/actions.ts` | update pet profile fields |
| `deletePet` | `app/pet/delete/actions.ts` | delete pet/account-owned data path |
| `updatePublicVisibility` | `app/actions.ts` | toggle `pets.is_public` |
| `deleteDiary` | `app/diary/[id]/actions.ts` | delete one diary |

All actions require a Supabase session and return user-facing Korean errors instead of exposing raw database errors.

## Environment Variables

| Env var | Required for | Notes |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | all Supabase reads/writes | public anon URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | browser/RSC Supabase client | public anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | uploads, diary insert, worker, ops cleanup | server-only |
| `ANTHROPIC_API_KEY` | diary generation, memory summary, LLM health | server-only |
| `MEMORY_WORKER_SECRET` | `/api/memory/process` | pg_cron bearer |
| `CRON_SECRET` | ops cron fallback secret | Vercel cron bearer |
| `DIARY_IMAGE_CLEANUP_SECRET` | cleanup route | optional override |
| `LLM_HEALTH_SECRET` | LLM health route | optional override |
| `DISCORD_WEBHOOK_URL` | LLM health alerts | optional |
| `UPSTASH_REDIS_REST_URL` | rate limit | optional in dev; missing = stub mode |
| `UPSTASH_REDIS_REST_TOKEN` | rate limit | optional in dev; missing = stub mode |

Full template: `.env.example`.

## Versioning Policy

- Route Handlers under `app/api/*` are internal and may change without semantic versioning until v1 public API requirements exist.
- If a public JSON API is introduced later, use `/api/v1/*`, update `lib/openapi/spec.ts`, and keep backward compatibility within the v1 namespace.
- Server Actions are app-internal contracts and should be changed together with their consuming components.

## Local Verification

```bash
bun run lint
bunx tsc --noEmit
bun run test
bunx next build
```

Route smoke checks require env and secrets. Example:

```bash
curl -i "$NEXT_PUBLIC_SITE_URL/api/health/llm" \
  -H "Authorization: Bearer $CRON_SECRET"
```
