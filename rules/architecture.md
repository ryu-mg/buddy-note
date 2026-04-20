# buddy-note Architecture

> **이 문서는 LLM 에이전트가 파일을 수정하거나 작성하기 전 반드시 읽는다.** 새 컴포넌트/테이블/라우트 추가 시 여기 있는 패턴을 따를지, 아니면 이 문서 업데이트 PR을 먼저 내야 한다.

상위 전략/스코프는 `AGENTS.md`, 디자인 토큰은 `DESIGN.md`, 구체적 코드 스타일은 `rules/code-conventions.md` 참조.

---

## 1. System Overview

```
  ┌────────────────────────────────────────────────────────────────────┐
  │                     Client (Browser / PWA)                         │
  │   RSC render · Server Actions · sessionStorage drafts · HMR         │
  └────────┬─────────────────────────────────┬──────────────────────────┘
           │                                 │
           │ fetch/navigate                  │ uploads (signed URL)
           ▼                                 ▼
  ┌─────────────────────┐          ┌─────────────────────────────────┐
  │   Next.js 16 App    │          │  Supabase (AWS Seoul)            │
  │   Router @ Vercel   │          │  ─────────────────────────────   │
  │                     │          │  Auth (email magic, +kakao v2)  │
  │   • Middleware      │◀────────▶│  Postgres (6 tables + RLS)       │
  │     (session)       │          │  Storage (photos / diary-images) │
  │   • Server Actions  │   RLS    │  Edge Functions (async jobs)     │
  │   • RSC + ISR       │          │  pg_cron (memory update worker)  │
  │   • satori render   │          └────────────────────┬──────────────┘
  │   • OG meta         │                               │
  └──────────┬──────────┘                               │
             │                                          │
             ▼                                          │
  ┌─────────────────────┐                               │
  │  Claude Sonnet 4.6  │                               │
  │  (multimodal,       │                               │
  │   one integrated    │          trigger              │
  │   call per log)     │          ▼                    │
  └──────────┬──────────┘      ┌─────────────────────────▼──────┐
             │                  │  memory_update_queue             │
             │ diary + tags     │  (pending → processing → done)   │
             │ + title          │  pg_cron worker with advisory    │
             ▼                  │  lock per pet                    │
       [diary insert]           └──────────────────────────────────┘
             │                           │
             ▼                           ▼
      [satori 3포맷]            [pet_memory_summary 압축 업데이트]
             │
             ▼
      [diary-images bucket]     → [사용자 공유 / /b/[slug]]
```

---

## 2. Runtime Topology

| Layer | Runtime | 위치 | 비고 |
|---|---|---|---|
| UI | React 19 RSC + Client Islands | Vercel Edge | Turbopack |
| Proxy | Node/Edge | Vercel Edge | `proxy.ts` (Next 16 file convention, helper는 `lib/supabase/middleware.ts`) |
| Server Actions | Node | Vercel Serverless | `'use server'` |
| DB | Postgres 16 | Supabase AWS Seoul | Forward-only migration |
| Auth | Supabase GoTrue | Supabase Seoul | 이메일 magic link (v1), 카카오 OAuth (v1.5) |
| Storage | S3-compatible | Supabase Seoul | 2 bucket 분리 |
| LLM | Anthropic Claude Sonnet 4.6 | Anthropic US | 통합 호출 1회/log |
| Image render | satori + resvg | Vercel Serverless | 서버사이드 SVG→PNG |
| Queue | Postgres table + pg_cron | Supabase Seoul | per-pet advisory lock |
| Observability | PostHog (무료 tier) | PostHog Cloud | 공유 클릭 추적 핵심 |

---

## 3. Data Model

```sql
users                     -- Supabase Auth (관리 테이블)

pets (
  id uuid PK
  user_id uuid FK auth.users  -- NOTE: user_id 이름 고정. owner_id 금지
  name text
  species text CHECK ('dog','cat')
  breed text
  persona_answers jsonb       -- {q1:'A', q2:'C', ...}
  persona_prompt_fragment text -- "나는 마루, 푸들이야. 에너지 폭발 / ..."
  slug text UNIQUE             -- /b/[slug] 라우트 handle
  is_public boolean DEFAULT false
  deceased_at timestamptz      -- v2 memorial (컬럼 선반영, 미사용)
)

logs (
  id uuid PK
  pet_id uuid FK pets
  photo_url text                    -- signed URL (7일)
  photo_storage_path text           -- photos/{user_id}/{log_id}.{ext}
  tags text[]                       -- ['walk','meal',...]
  memo text (max 200)               -- LLM 프롬프트 인젝션 방어
)

diaries (
  id uuid PK
  log_id uuid UNIQUE FK logs        -- 1:1
  pet_id uuid FK pets
  title text
  body text                          -- 강아지 1인칭 한국어
  image_url_916 / _45 / _11 text    -- satori 3포맷
  is_fallback boolean                -- LLM 실패 시 template diary 표시
  model_used text                    -- 'claude-sonnet-4-6' 등 (A/B 추적)
  latency_ms int
  tokens_input/output int
)

pet_memory_summary (
  pet_id uuid PK FK pets
  tone_description text
  recurring_habits text[]
  favorite_things text[]
  recent_callbacks jsonb             -- [{date, detail}, ...]
  version int                        -- optimistic lock
)

memory_update_queue (
  id bigserial PK
  pet_id uuid FK pets
  log_id uuid FK logs
  status text ('pending','processing','done','failed')
  attempts int
  last_error text
  locked_until timestamptz           -- advisory lock TTL
)

slug_reserved (
  slug text PK                       -- admin, api, auth, _next, ... 31 entries
)
```

### RLS 정책 요약 (전체는 `supabase/migrations/20260419000002_rls_policies.sql`)

| 테이블 | SELECT | INSERT | UPDATE | DELETE |
|---|---|---|---|---|
| `pets` | owner OR `is_public=true` | owner | owner | owner |
| `logs` | owner only | owner | owner | owner |
| `diaries` | owner OR (public pet via EXISTS) | **service role only** | owner | cascade |
| `pet_memory_summary` | owner only | **service** | **service** | **service** |
| `memory_update_queue` | **service** | **service** | **service** | **service** |
| `slug_reserved` | anon OK | **service** | **service** | **service** |

RLS 변경 시 **unit test 필수** (`/tests/rls/*.sql` 또는 Supabase dashboard 수동 검증).

---

## 4. Data Flow: 사진 업로드 → diary 공유

```
[happy path]
  1. Client: 사진 선택 → Canvas EXIF strip → FormData
  2. Server Action `createLog`:
     a. auth check (supabase.auth.getUser)
     b. photos bucket에 upload (signed URL path: photos/{user_id}/{log_id}.{ext})
     c. server-side EXIF strip via sharp (이중 가드)
     d. logs insert
     e. Claude Sonnet 통합 호출 (photo + pet_memory_summary 주입 → tags + title + body)
     f. diaries insert (service role, is_fallback=false)
     g. satori 3포맷 렌더 → diary-images bucket upload (UUID 파일명)
     h. diaries UPDATE image_url_{916,45,11}
     i. revalidate('/') + revalidate('/b/[slug]') (on-demand)
     j. return diary to client
  3. Client: /diary/[id] 페이지로 slide-up 애니메이션

[trigger side-effect]
  logs AFTER INSERT → memory_update_queue enqueue
  pg_cron worker (매 30초) → 대기 row 처리 (per-pet advisory lock):
    - 최근 N개 log + 기존 memory_summary를 LLM에 주고 압축 업데이트
    - pet_memory_summary UPSERT with version 체크 (optimistic lock)
    - 실패 시 attempts++, last_error 기록, 재시도 큐

[shadow paths]
  - nil photo: Server Action reject with 400 "사진이 필요해요"
  - empty tags: 태그 추천 빈 배열 시 client 강제 입력 모달
  - LLM timeout (>30s): fallback template diary (is_fallback=true) +
    재시도 쿨다운 UI
  - LLM ContentModerationRefused: "이 사진은 처리할 수 없어요" + log 보존 X
  - upload 실패: retry 1회 + "다시 시도" 버튼
  - RLS 거부: 로그인 리다이렉트
```

### 30초 목표 달성 전략
| 단계 | 예산 | 기법 |
|---|---|---|
| Client EXIF strip | 1-2s | Canvas 동기 처리 |
| Upload to Supabase | 3-5s | resumable upload |
| LLM 통합 호출 | 10-15s | 한 번 호출 (사진+diary+tag 한 프롬프트), `cache_control` 활용 |
| satori 3포맷 | 3-5s 병렬 | `Promise.all([render916, render45, render11])` |
| diary-images upload | 2-3s 병렬 | 3개 parallel |
| **Total p50** | **~25s** | |
| **Total p95** | **~45s** | (fallback UX로 대응) |

---

## 5. State Machines

### pets.is_public (공개 프로필 토글)

```
          ┌─────────────┐
          │  PRIVATE    │ ← 기본값
          └──────┬──────┘
                 │ user toggle
                 ▼
        ┌────────────────────┐
        │  PUBLIC_WARMING    │  ── 10s: 카카오/Twitter crawler warm up
        └──────┬─────────────┘
               │
               ▼
          ┌─────────┐
          │ PUBLIC  │ ─── URL live, OG 캐시 퍼짐
          └────┬────┘
               │ user toggle off
               ▼
        ┌────────────────────┐
        │ UNPUBLISHING       │  ⚠ 24h 가드
        │  - dynamic OG 변경 │    (카카오 crawler 캐시)
        │  - HTML 410 + noindex
        │  - 유저 경고 모달  │
        └──────┬─────────────┘
               │
               ▼
          [PRIVATE]
```

### diary lifecycle

```
  [pending] --llm success--> [complete]
     │                           │
     │ llm fail                  │ satori fail
     ▼                           ▼
  [fallback] ←----retry----- [rendering]
     │
     │ user retry
     ▼
  [pending]
```

### memory_update_queue row

```
  [pending] --worker picks up--> [processing]
     │                               │
     │ max attempts (3) reached      │ success
     ▼                               ▼
  [failed]                        [done]
                                     │
                                     │ auto-archive after 7d
                                     ▼
                                   [purged]
```

---

## 6. Module Boundaries

```
app/                          ← Route handlers (RSC, Server Actions, route.ts)
├── auth/                     (public feature)
├── onboarding/               (authed feature)
├── log/                      (authed feature, Week 3)
└── b/[slug]/                 (public feature, Week 4 — ISR)

components/
├── ui/                       ← shadcn primitives (customizable)
└── <feature>/                ← feature-specific UI (onboarding/, log/, profile/)

lib/                          ← Pure logic, framework-agnostic where possible
├── supabase/                 ← SSR helpers ONLY (createClient factory)
├── llm.ts                    ← Anthropic wrapper (Week 2)
├── prompts/                  ← Prompt templates with versions (Week 2)
├── pet-mbti.ts               ← Domain logic (questions, prompt fragment builder)
├── slug.ts                   ← Romanize + collision logic
├── image/                    ← satori 렌더 + EXIF strip (Week 2)
└── utils.ts                  ← shadcn cn() + tiny helpers

supabase/
├── migrations/               ← Forward-only SQL
├── seed.sql
├── functions/                ← Edge Functions (Week 2+, cron/webhook)
└── config.toml

scripts/                      ← Self-contained Bun subprojects (CI 외 로컬 도구)
└── llm-benchmark/

types/
└── database.ts               ← Supabase CLI로 regen 가능 (hand-written 시드)

docs/                         ← SSOT for architecture, conventions, prompts
├── architecture.md           ← 이 파일
├── code-conventions.md
├── pet-mbti-questions-v0.md
└── prompts/                  ← Week 2 LLM 프롬프트 버전관리
```

**의존 방향 규칙**:
- `app/` → `components/` → `lib/` → 외부 패키지
- `lib/` 안에서 서로 의존 OK
- `components/` → `app/` **역방향 금지**
- Circular dep 금지

---

## 7. Caching & Revalidation

| 컨텐츠 | 캐시 전략 | 무효화 |
|---|---|---|
| `/` 홈 타임라인 | RSC render per request | 자동 (dynamic) |
| `/b/[slug]` | ISR 24h revalidate | diary 추가 시 `revalidateTag('pet-{id}')` |
| OG 메타 | 동적 SSR | pet 공개 전환 시 dynamic image 갱신 |
| 공유 이미지 PNG | CDN public URL (diary-images) | 불변 — 새 일기는 새 URL |
| satori fonts | Vercel Edge cache 빌드 타임 | Pretendard/Nanum Myeongjo subset 빌드 시 |
| Supabase Storage photos | 7d signed URL | 만료 시 재서명 (client 요청 시) |

### Kakao OG 캐시 이슈 (24h)
카카오톡은 OG 메타를 24시간 공격적으로 캐시. 유저가 `is_public=false`로 돌려도 구 링크 프리뷰는 24시간 live. 대응: 비공개 전환 시 **OG image를 placeholder로 즉시 교체** (동적 렌더). 링크 자체는 HTTP 410 + `noindex`.

---

## 8. Security Model

### 경계
1. **Client → Server Action**: auth check 항상 첫 줄. `user` null이면 `redirect('/auth/login')`
2. **Client → Route Handler**: CSRF는 Next.js Same-origin + cookies `SameSite=Lax`로 기본 방어. POST-only operations (signout) 명시
3. **Server → DB**: 기본 `anon` client. Privileged ops만 `SUPABASE_SERVICE_ROLE_KEY` (env로만, 클라이언트 노출 금지)
4. **External webhook → Server**: (Week 2+) 서명 검증 필수 (Supabase function secret or HMAC)

### 입력 검증 계층
```
UI form
  ↓ native validation + Tailwind hint
Server Action
  ↓ zod schema (required!)
Postgres CHECK constraints
  ↓ RLS policy
실제 DB write
```

### 이미지 업로드 가드
1. Client: file type + size (max 8MB) + Canvas EXIF strip
2. Server Action: sharp로 **재 strip** + re-encode (metadata 제거 확실히)
3. 파일명: UUID — 사용자 입력 파일명 절대 사용 X
4. Content-Type: magic number 검증 (MIME 헤더 신뢰 X)

### Rate limit (Week 3)
- Upstash Redis sliding window, 2-layer:
  - Middleware per-IP: 분당 30 req
  - Server Action per-user: 시간당 10 log (photos 업로드 무거운 경로)

### 프롬프트 인젝션 방어
- `logs.memo` max 200자 CHECK
- LLM system prompt와 user prompt 분리
- `pet_memory_summary`는 LLM이 생성한 content라 재주입 시 "system context" 경계 유지

---

## 9. Async Pipeline: `pet_memory_summary`

제품의 **진짜 해자**. 로그가 쌓일수록 강아지가 자기 자신 같아지는 메커니즘.

### 파이프라인
```
  logs INSERT
      │
      ▼ AFTER trigger
  memory_update_queue (pending)
      │
      ▼ pg_cron (30s 간격)
  worker acquires advisory lock (per pet_id)
      │
      ▼
  최근 N개 logs + 기존 pet_memory_summary + persona_prompt_fragment
      │
      ▼ Claude Sonnet (compression prompt, docs/prompts/memory-summary-v1.md)
  새 memory_summary (압축, 3KB 이하 유지)
      │
      ▼ UPSERT with version = version + 1 (optimistic lock)
  conflict 시 재시도 (최대 3회)
      │
      ▼
  memory_update_queue.status = 'done'
```

### 왜 async인가
- 사용자는 diary 받고 바로 다음 화면으로 감 (대기 불필요)
- memory_summary 업데이트 자체가 추가 LLM 호출 (비용 + latency)
- 동시 로그 2개 들어오면 순서 보장 필요 → advisory lock

### 비용 절감
- 매 기록마다 memory_summary 전체 재계산 X
- "이번 로그에서 새로 나타난 패턴만 merge" 프롬프트 (diff-style)
- `recent_callbacks`는 최근 10개로 capped

---

## 10. Observability (Week 4)

| 메트릭 | 임계치 | 반응 |
|---|---|---|
| Diary 생성 p95 latency | > 60s | warning (PostHog) |
| LLM 에러율 | > 5% / 15min | warning |
| Fallback diary 비율 | > 10% / day | critical (API 이슈 의심) |
| Queue depth | > 100 pending | warning |
| Queue failed rate | > 5% | critical |
| Supabase Storage 사용량 | > 80% | warning |
| LLM 월 비용 | > $100 (v1) | warning |
| 공유 클릭 / 기록 | 추적만 | (지표) |
| 공개 프로필 외부 유입 → 앱 | 추적만 | (지표) |

PostHog 무료 tier (1M events/월)로 v1 충분. Supabase Log Drains로 DB 이벤트 따로.

---

## 11. Deployment & Rollback

### 배포 파이프라인 (Week 5+)
```
push to main
  ↓
GitHub Actions
  - lint + typecheck + build
  - (Week 6) supabase db diff 체크
  ↓ pass
Vercel deploy (preview 먼저 → promote)
  ↓ pass smoke check
Production
  ↓ 자동 canary (postHog error rate)
  - 실패 시 auto rollback 1클릭
```

### Migration 적용 순서 (필수)
1. **먼저** DB migration apply (`supabase db push`)
2. **그 다음** 코드 deploy
3. 코드가 먼저 가면 없는 컬럼/테이블 참조로 500

### Rollback 시나리오
| 장애 | 조치 | 복구 시간 |
|---|---|---|
| 코드 버그 | Vercel instant rollback | 30초 |
| Migration 망가짐 | forward-only fix migration | 수분 |
| LLM API down | fallback template 자동 | 즉시 (자동) |
| Supabase 장애 | 대기 + 사용자 안내 페이지 | Supabase SLA |
| 카카오 crawler 캐시 문제 | OG placeholder 동적 교체 | 즉시 |

---

## 12. Scaling Characteristics

| 지표 | DAU 100 (v1 목표) | DAU 1,000 | DAU 10,000 |
|---|---|---|---|
| 월 로그 수 | ~1,500 | ~15,000 | ~150,000 |
| LLM 비용/월 | ~$40 | ~$400 | ~$4,000 (premium tier 필수) |
| Storage | ~3-9GB | ~30-90GB | ~300GB+ |
| Supabase tier | Free → Pro($25) | Pro | Team |
| Vercel tier | Hobby → Pro | Pro | Pro |
| 첫 병목 | 없음 | LLM 비용 | DB CPU (memory_summary 업데이트) |

---

## 13. Future Evolution

### v1.5 (DAU 50+ 이후)
- 카카오 OAuth 완전 통합
- 월별 BEST MOMENT 투표 카드
- LLM API health check + Discord webhook

### v2 (DAU 100+)
- Memorial 페이지
- 산책 중 매칭 (위치/시간) — 프라이버시 검토 먼저
- AI 이미지 생성 premium (DALL-E/SDXL 하이브리드)
- 1년 다큐멘터리 자동 편집 (유료)

### 구조 진화 경로
- `pet_memory_summary`는 v2에서 **vector embedding** 컬럼 추가 가능성 (pgvector) — 유사 강아지 매칭 / 추억 검색용
- Edge Function으로 LLM 호출을 이동 (Vercel Serverless → Supabase Edge) — 비용 최적화 시
- Image CDN을 Vercel Image Optimization 대신 Cloudflare로 이전 (글로벌 확장 시)

---

## 14. 위 내용과 충돌할 때

이 문서가 **코드의 진실**이다. 코드가 다르게 작동한다면:
1. 버그인지 문서 stale인지 판정
2. 버그면 코드 수정 + 관련 test 추가
3. 문서가 stale이면 PR로 이 문서 업데이트 + 이유 명시

**AI 에이전트**: 이 문서와 어긋나는 코드를 발견하거나, 여기 없는 새 구조/테이블/라우트를 제안할 때는 **사용자 확인 후** 이 문서를 먼저 업데이트하고 그 다음 코드 작업.
