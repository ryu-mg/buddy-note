# Swagger / FE-BE 검수 체크리스트

작성일: 2026-04-21

목표:

- Swagger/OpenAPI 스펙이 실제 Route Handler와 일치하는지 검수한다.
- FE가 필요로 하는 데이터/액션 계약을 BE가 제대로 제공하는지 도메인별로 검수한다.
- 통과한 항목만 체크한다. 불일치가 있으면 체크하지 않고 findings에 기록한다.

## 검수 도메인

| # | 도메인 | Swagger check | FE-BE check | 상태 |
|---|---|---|---|---|
| 1 | API docs infra (`/api-docs`, `/api/openapi.json`) | [x] | [x] | 통과 |
| 2 | Public profile (`/b/[slug]`) | [x] | [x] | 통과 |
| 3 | Memory worker (`/api/memory/process`) | [x] | [x] | 통과 |
| 4 | Orphan image cleanup (`/api/cleanup/orphan-images`) | [x] | [x] | 통과 |
| 5 | LLM health (`/api/health/llm`) | [x] | [x] | 통과 |
| 6 | Log creation (`/log`, `createLog`) | [x] | [x] | 통과 |
| 7 | Diary detail/share/delete (`/diary/[id]`) | [x] | [x] | 통과 |
| 8 | Home/history feed (`/`, `/logs`) | [x] | [x] | 통과 |
| 9 | Auth/onboarding/pet settings | [x] | [x] | 통과 |

## Resolved findings

### F1. 새 일기 생성 후 공개 프로필 ISR 캐시가 갱신되지 않음

- 심각도: P1
- 도메인: Public profile, Log creation
- 파일: `app/log/actions.ts`
- 위치: `createLog` 성공 경로 마지막 revalidate
- 기존 동작: 새 diary insert 후 `revalidatePath('/')`만 호출했다.
- 영향: pet이 공개 상태일 때 `/b/[slug]`는 `revalidate = 86400`이라 새 일기가 공개 프로필/OG 메타에 최대 24시간 늦게 반영될 수 있었다.
- FE-BE 판정: FE는 공개 프로필을 최신 일기 목록으로 기대하지만 BE 성공 경로가 public profile cache invalidation을 제공하지 않았다.
- 권장 수정: `pets` 조회 시 `slug`, `is_public`을 같이 가져오고, 성공 후 `revalidatePath('/logs')`, 공개 상태면 `revalidatePath(`/b/${pet.slug}`)`를 호출한다.
- 조치: `createLog`가 `slug`, `is_public`을 조회하고 성공 후 `/`, `/logs`, 공개 상태의 `/b/{slug}`를 revalidate한다.

### F2. memory queue enqueue 시점이 diary insert보다 앞섬

- 심각도: P2
- 도메인: Log creation, Memory worker
- 파일: `app/log/actions.ts`, `supabase/migrations/20260419000001_initial_schema.sql`
- 기존 동작: `logs` row를 먼저 insert해서 `logs AFTER INSERT` trigger가 즉시 queue를 만든 뒤, LLM과 diary insert가 뒤따랐다.
- 영향: worker가 긴 LLM 생성 중 먼저 실행되면 `logs`는 있지만 `diaries`가 아직 없는 상태로 memory summary를 갱신할 수 있었다. 이 경우 해당 diary body/title callback이 memory에 반영되지 않을 수 있었다.
- FE-BE 판정: 사용자 화면 즉시 기능은 깨지지 않지만, “기억 누적” BE 계약에는 race window가 있다.
- 권장 수정: queue enqueue를 `diaries AFTER INSERT`로 옮기거나, worker가 diary 없는 log를 retry/skip하도록 한다.
- 조치: forward-only migration `20260421000001_move_memory_enqueue_to_diaries.sql`로 `logs` trigger를 제거하고 `diaries AFTER INSERT` trigger로 enqueue 시점을 이동했다.

## 검수 메모

- Swagger route coverage: 실제 Route Handler 7개와 OpenAPI paths/methods를 대조했다.
- OpenAPI에 포함된 실제 Route Handler:
  - `GET /api-docs`
  - `GET /api/openapi.json`
  - `GET /auth/callback`
  - `POST /auth/signout`
  - `GET /b/{slug}`
  - `POST /api/memory/process`
  - `GET|POST /api/cleanup/orphan-images`
  - `GET|POST /api/health/llm`
- Server Actions는 public HTTP API가 아니므로 Swagger JSON에는 넣지 않고, `docs/API.md`의 Server Action Contracts 섹션에서 계약을 문서화한다.
- 검증 명령:
  - `bun run lint` 통과
  - `bunx tsc --noEmit` 통과
  - `bun test lib/` 통과
  - `bunx next build` 통과
  - `git diff --check` 통과
