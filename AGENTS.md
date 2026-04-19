# buddy-note — AI Agent Guide

> **이 문서는 SSOT (Single Source of Truth)** — `CLAUDE.md`, `.cursor/rules`, `.github/copilot-instructions.md` 등은 모두 이 파일로 symlink. 이 파일만 유지하면 모든 AI 툴이 같은 컨텍스트를 본다.

---

## ⚠️ 파일 수정/작성 전 반드시 읽을 것 (AI 에이전트)

**새 파일을 만들거나 기존 파일을 수정하기 전, 아래 4개 문서를 순서대로 확인한다.** 읽지 않고 작업하면 drift가 쌓여 5-10회 반복 수정을 만든다.

| # | 문서 | 용도 | 언제 열어야 하나 |
|---|---|---|---|
| 1 | `AGENTS.md` (이 파일) | 상위 전략, scope, 10가지 locked decision, gstack 요구사항 | **항상** (가장 먼저) |
| 2 | `rules/architecture.md` | 시스템 구조, 데이터 흐름, 모듈 경계, 캐시, 보안 | 새 라우트/테이블/파이프라인 추가할 때 |
| 3 | `rules/code-conventions.md` | 코드 스타일, 네이밍, import 규칙, 패턴, AI 작업 프로토콜 | **모든 파일 수정 전** |
| 4 | `DESIGN.md` | 폴라로이드 style, 테라코타 accent, 토큰 | UI/스타일 바꿀 때 |

### 핵심 규칙 (자주 틀리는 것)
- DB 컬럼명 **`user_id`** (절대 `owner_id` 아님) — 다른 테이블도 이 컨벤션 따름
- Supabase client은 반드시 **`@/lib/supabase/*`** 경유, 직접 `createServerClient` 금지
- 에러는 **`throw` 대신 `return { error }`** (Server Actions)
- 스타일은 **`var(--color-*)` 토큰만**, 하드코딩된 hex/rgb 금지
- 커밋은 **사용자 요청 시에만** — 파일 생성·수정은 OK, `git add && commit`은 user가 승인 후
- Migration은 **forward-only**, 컬럼 drop/rename 금지

### 충돌 시 우선순위
1. 사용자의 직접 지시 (최우선)
2. `rules/code-conventions.md`의 명시적 규칙
3. `rules/architecture.md`의 구조 결정
4. `AGENTS.md`의 전략 결정
5. `DESIGN.md`의 시각 결정
6. 기존 코드의 암시적 패턴
7. 에이전트 본인의 judgment

**미심쩍으면 추측하지 말고 사용자에게 질문한다.**

---

## 🐾 Project Overview

**buddy-note**는 **"내 강아지의 성격을 1년 동안 기억하는 유일한 앱"**을 지향하는 반려동물 AI 일기 + SNS 공유 이미지 생성 웹앱이다.

### 한 줄 정체성
*기록 앱이 아니라 **반려동물 캐릭터 엔진**.* 로그가 쌓일수록 강아지가 점점 더 자기 자신 같아지는 시스템. (Codex reframing, 2026-04-19)

### 핵심 문제 의식
- 기존 한국 반려동물 기록 앱(똑똑집사, 반기다 등)은 건강 수첩 중심이라 "꺼내 보여줄 것"이 없음
- ChatGPT 사진+일기 workaround는 세션마다 강아지 정보 리셋
- AI 펫 포트레이트/비디오 앱은 one-shot 바이럴이라 개성 누적 안 됨

### 차별점 (moat)
**페르소나 기억 + 누적**. 5문항 펫 MBTI onboarding으로 입력한 성격이 이후 모든 일기에 녹아든다. 로그가 쌓일수록 `pet_memory_summary` 테이블이 "말투 / 반복 습관 / 좋아하는 것 / 최근 callback 포인트"를 압축 저장 — 매 기록이 과거를 참조하는 구조.

### 타겟 사용자
**SNS에서 반려동물 콘텐츠 올리는 모르는 반려인** (취미 공유 아님, 상용 제품 시각). 공개 강아지 프로필 URL (`/b/[slug]`)이 바이럴 루프의 코어 자산.

### 10x 비전
1년치 diary + 사진 + `pet_memory_summary`로 **"OOO와 나의 1년" 다큐멘터리 자동 편집** (유료 tier). 현재 v1에서는 월별 하이라이트 카드까지만.

---

## 🎨 Product / Design Principles

### 제품 결정 (lock됨, post-review)
- **Stack**: Next.js 16 App Router + TypeScript + Tailwind v4 + Supabase (AWS Seoul) + Vercel + satori/resvg + Claude Sonnet 4.6 (Week 0 A/B 후 최종 확정)
- **Visual style**: 폴라로이드 (24px white border, -1.2deg 기울임, 명조체 diary 본문, 5% grain)
- **Accent color**: 테라코타 `#e07a5f` (purple/violet 절대 금지)
- **Typography**: UI = Pretendard Variable, Diary 본문 = Nanum Myeongjo (serif, "쓰여진 기록" 메타포)
- **Anti-pattern**: 이모지, pastel, bubbly radius, gradient, "all-in-one / 스마트 / 혁신" 카피 — 전부 금지

### 언어
- 모든 UI/DB content: **한국어 기본**
- 코드 주석/커밋: 한국어 OK, 영어 OK, 섞어 쓰기 OK
- 일기 톤: **강아지 1인칭, 권유형 copy, 반말**
- 에러 메시지: 사과 + 회복 액션 ("잠시 AI가 놓쳤어요, 30초 뒤 다시 만들어볼게요")

---

## 🏗 Architecture Overview

```
  ┌─────────────────────────────────────────────────────────────────┐
  │                       BROWSER / PWA                             │
  │   [Next.js App Router: /home, /log, /b/[slug], /auth, /onboarding]
  └──────────┬────────────────────────────────────┬─────────────────┘
             │                                    │
             ▼                                    ▼
  ┌──────────────────────┐          ┌─────────────────────────────┐
  │   Vercel Edge/RSC    │          │  Supabase Seoul region       │
  │   - OG meta (SSR)    │          │  - Auth (email magic link +  │
  │   - ISR /b/[slug]    │◀────────▶│    kakao v1.5)               │
  │   - server actions   │   RLS    │  - Postgres (6 tables)       │
  │   - satori render    │          │  - Storage (photos/diary)    │
  └──────────┬───────────┘          │  - Edge Functions (async)    │
             │                       └─────────────┬────────────────┘
             ▼                                     │ trigger (logs)
  ┌──────────────────────┐          ┌──────────────▼──────────────┐
  │  Claude Sonnet 4.6   │          │  memory_update_queue          │
  │  (multimodal)        │◀─────────│  + pg_cron worker             │
  │  ONE integrated call │          │  (advisory lock per-pet)      │
  │  - photo analysis    │          └─────────────────────────────┘
  │  - tag suggestion    │
  │  - diary generation  │
  └──────────────────────┘
```

### Routes (v1)
- `/` — 홈, "OOO의 이야기 N일째" 타임라인
- `/auth/login` — 이메일 매직링크 전송
- `/auth/verify` — 이메일 확인 안내 (masked)
- `/auth/callback` — code → session 교환 → 신규는 `/onboarding`, 기존은 `/`
- `/auth/signout` — POST 로그아웃
- `/onboarding` — 진입 (auth check + pet 존재 check → 리다이렉트)
- `/onboarding/steps/[step]` — stepper 0~6 (0=info, 1~5=MBTI, 6=confirm)
- `/log` — (v1 Week 3) 사진 업로드 + 태그 + diary 생성
- `/b/[slug]` — (v1 Week 4) 공개 강아지 프로필 (ISR, 바이럴 루프 코어)

### Data Model (Supabase Postgres)
```
users (Supabase Auth)
pets (id, user_id, name, species, breed, persona_answers jsonb,
      persona_prompt_fragment, slug UNIQUE, is_public, deceased_at)
logs (id, pet_id, photo_url, photo_storage_path, tags[], memo)
diaries (id, log_id UNIQUE, pet_id, title, body,
         image_url_{916,45,11}, is_fallback, model_used,
         latency_ms, tokens_input/output)
pet_memory_summary (pet_id PK, tone_description, recurring_habits[],
                    favorite_things[], recent_callbacks jsonb, version)
memory_update_queue (id, pet_id, log_id, status, attempts,
                     locked_until)  ← async LLM summary pipeline
slug_reserved (slug PK)
```

RLS 전수. `pets.is_public=true`일 때만 anon이 `diaries` 읽기 가능 (`logs`, `pet_memory_summary`는 영원히 owner only).

### Supabase Storage buckets (Week 2+)
- `photos` — **private**, signed URL 7d 만료. 경로: `photos/{user_id}/{log_id}.{ext}`
- `diary-images` — **public**, UUID 파일명. RLS와 독립된 Supabase public URL 특성 때문에 bucket 분리

### LLM pipeline (Week 2)
1. 사진 업로드 → Supabase Storage `photos` bucket (EXIF strip — client Canvas + server sharp 이중)
2. Claude Sonnet 4.6에 **한 번의 통합 호출** (사진 분석 + 태그 추천 + diary 생성 + title)
3. 결과 → `diaries` insert (service role) + satori 3포맷 렌더 → `diary-images` bucket
4. `logs` AFTER INSERT trigger → `memory_update_queue` enqueue (비동기)
5. pg_cron worker가 per-pet advisory lock 잡고 memory_summary 업데이트 (optimistic lock version)
6. 실패 시 fallback template diary (`diaries.is_fallback=true`) + 재시도 쿨다운 UI

---

## 📁 파일 구조 (2026-04-20 기준)

```
new-project/
├── app/
│   ├── layout.tsx                    # Pretendard + Nanum Myeongjo CDN
│   ├── page.tsx                      # 홈 (auth state 표시, placeholder)
│   ├── globals.css                   # DESIGN.md tokens @theme inline (Tailwind v4)
│   ├── auth/
│   │   ├── layout.tsx                # centered card
│   │   ├── login/{page.tsx, actions.ts}
│   │   ├── callback/route.ts
│   │   ├── verify/page.tsx
│   │   └── signout/route.ts
│   └── onboarding/
│       ├── page.tsx                  # 진입 gate (auth + pet 존재)
│       ├── actions.ts                # savePet server action
│       └── steps/[step]/page.tsx     # 0~6 stepper
├── components/
│   ├── ui/                           # shadcn radix-nova (button, input, card, dialog, skeleton, label, sonner)
│   └── onboarding/
│       ├── name-form.tsx
│       ├── progress.tsx
│       └── question-card.tsx         # 폴라로이드 느낌, -0.6deg 기울임
├── lib/
│   ├── supabase/                     # SSR helper (server, client, middleware)
│   ├── pet-mbti.ts                   # 5문항 + persona_prompt_fragment builder
│   ├── slug.ts                       # Korean 초중종성 romanize + nanoid fallback
│   └── utils.ts                      # shadcn cn()
├── middleware.ts                     # Supabase session refresh (⚠ Next 16 proxy.ts deprecation warning)
├── supabase/
│   ├── config.toml                   # local CLI config (Seoul region)
│   ├── migrations/
│   │   ├── 20260419000001_initial_schema.sql
│   │   └── 20260419000002_rls_policies.sql
│   ├── seed.sql                      # 31 reserved slugs
│   └── README.md                     # apply workflow
├── types/database.ts                 # hand-written (regen from supabase CLI later)
├── scripts/llm-benchmark/            # self-contained Bun 3-model 비교 하네스
│   ├── benchmark.ts, package.json, bun.lock, README.md
│   └── photos/.gitkeep
├── rules/                            # AI 에이전트 작업 규칙 SSOT (파일 수정 전 필독)
│   ├── architecture.md               # 시스템 구조, 데이터 흐름, 모듈 경계, 보안
│   └── code-conventions.md           # 코드 스타일, 네이밍, 패턴, workflow
├── docs/                             # 제품 문서 (규칙 아님)
│   └── pet-mbti-questions-v0.md      # 5문항 source of truth
├── DESIGN.md                         # v0.1 디자인 시스템 (폴라로이드, 테라코타, 타이포)
├── TODOS.md                          # deferred items + 당신 action items (C1~C8)
├── AGENTS.md                         # 이 파일 (SSOT)
├── CLAUDE.md                         # → AGENTS.md (symlink)
├── package.json
├── .nvmrc                            # 22 (Next 16 요건 >=20.9.0)
├── .env.example
└── README.md                         # Next.js 기본 (나중에 프로젝트용으로 교체)
```

---

## 🛠 Development Workflow

### 초기 세팅 (신규 참여자)
```bash
# Node 버전 맞추기
nvm use   # .nvmrc → 22

# 의존성
bun install

# 환경변수 (Supabase 프로젝트는 dashboard에서 생성 — Region: Seoul)
cp .env.example .env.local
# .env.local 채우기:
#   NEXT_PUBLIC_SUPABASE_URL=...
#   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
#   SUPABASE_SERVICE_ROLE_KEY=...
#   ANTHROPIC_API_KEY=...

# Supabase migration 적용 (CLI 설치 필요: brew install supabase/tap/supabase)
supabase link --project-ref <ref>
supabase db push

# Dev 서버
bun run dev                           # http://localhost:4000
```

### Build / Test
```bash
bun run build                         # production build 검증
bun run lint                          # ESLint
npx tsc --noEmit                      # TS type check (CI에 필수)
```

### LLM A/B 벤치마크 (Week 0)
```bash
cd scripts/llm-benchmark
cp .env.example .env                  # 3개 API key
# photos/ 에 강아지 사진 5-10장
bun install && bun run bench
# results/comparison-*.md rubric 수동 채점
```

### Migration 추가 시
```bash
supabase migration new <slug>         # 새 SQL 파일 생성
# 편집 후
supabase db push                      # 적용
# 또는 local reset: supabase db reset
```

### 규칙
- `supabase/migrations/` **forward-only**. down migration 없음 — 롤백은 "새 forward migration으로 수정".
- 컬럼 drop 금지 (v1 policy). `pet_memory_summary`는 특히 compound asset이라 schema 진화 시 **append-only**.

---

## ⚙️ Conventions

### 코드
- TypeScript strict mode
- Server Actions 우선 (API routes는 webhook/OG 전용)
- RSC 기본, client component는 필요 시에만 (`'use client'` 명시)
- Supabase client은 **반드시 `@/lib/supabase/{server,client,middleware}`** 경유 — 직접 `createClient` 호출 금지
- Env var 없을 때 graceful fallback (null 반환 + UI에 안내)

### 스타일
- **DESIGN.md가 SSOT** — 새 색/radius/motion 추가는 DESIGN.md 먼저 업데이트 후 `app/globals.css` `@theme inline`에 반영. PR 제목에 `[design-system]` 접두.
- Tailwind v4 `@theme inline` 방식 (`tailwind.config.ts` 없음)
- shadcn/ui 컴포넌트는 `components/ui/`에서 import, 직접 수정 OK (customization 허용)

### LLM 호출
- **항상 `@/lib/llm.ts` 경유** (Week 2에 생성) — 직접 SDK 호출 금지
- 프롬프트는 `@/lib/prompts/*.ts`에 분리 저장, `pet_memory_summary`를 system prompt에 주입
- 토큰/비용/latency 기록 필수 (`diaries.model_used`, `latency_ms`, `tokens_*`)
- 실패 시 fallback template + `is_fallback=true` flag
- Rate limit: 유저당 시간당 10 기록 (Upstash Redis sliding window, Week 3)

### 보안 (v1 필수)
- 사진 업로드: client Canvas + server sharp **이중 EXIF strip** (GPS 제거)
- Slug 검증: regex `^[a-z0-9][a-z0-9-]{2,29}$` + `slug_reserved` 테이블 trigger
- RLS 정책 변경 시 `supabase/migrations/`에 새 파일, **단위 테스트 필수**
- 프롬프트 인젝션 방어: 유저 `memo` max 200자 + system prompt 분리

### i18n
- v1 한국어만. 번역은 v1.5 (다국어 diary는 v2 hook)

---

## 🎯 Critical Decisions (locked)

| # | 결정 | 근거 | 뒤집기 비용 |
|---|---|---|---|
| D1 | Next.js 16 + React 19 (Tailwind v4) | create-next-app@latest가 16 install, App Router 기본 거의 동일 | Medium (잔여 Next 15 ref 수정) |
| D2 | Supabase over Firebase/자체 Postgres | Auth + RLS + Storage + Realtime 한 패키지, 카카오 OAuth 지원, Seoul region | High (전체 백엔드 재설계) |
| D3 | satori + SVG 템플릿 (AI 이미지 생성 X) | v1 비용 민감, 일관성 확보. AI 이미지는 v1.5 premium | Low (로더 추가) |
| D4 | Claude Sonnet 4.6 (tentative, Week 0 A/B로 최종 확정) | 한국어 자연스러움 + multimodal + 비용 중간 | Low (프롬프트만 조정, `diaries.model_used`로 A/B 가능) |
| D5 | 폴라로이드 visual style | "캐릭터 엔진"과 감정 1:1 align, AI slop 방어 | Medium (공유 이미지 템플릿 재작성) |
| D6 | 페르소나 기억 = 제품 해자 | 챗GPT와 가장 큰 차별점, 데이터 lock-in 강함 | High (제품 정체성 근본 변경) |
| D7 | 공개 프로필 URL `/b/[slug]`를 v1에 포함 | 바이럴 루프 코어 asset (CEO review expansion) | Low (URL 비활성화) |
| D8 | LLM fallback template을 v1에 포함 | Eng+Design review 독립 합의로 승격 | Low (feature flag off) |
| D9 | middleware.ts 유지 (Next 16 deprecation warning 감수) | Supabase 공식 가이드가 아직 middleware 기준 | Low (이름만 rename when Supabase 가이드 업데이트됨) |
| D10 | 카카오 로그인 v1 필수 (Codex는 v2로 제안했으나 오판) | 한국 시장 UX 마찰 완화 | Medium (비즈앱 승인 대기) |

### 수용된 리스크 (사용자 의도 결정)
- ~~**LLM 실패 시 fallback 없음**~~ → 뒤집힘, D8 참조
- **API down 알림 없음** — Vercel cron + Discord webhook은 v1.5

---

## 📎 외부 아티팩트 (repo 바깥)

구현 상세·검토·전략은 `~/.gstack/projects/new-project/`에 누적:

- **Design doc** (office-hours 산출): `~/.gstack/projects/new-project/bao-main-design-20260419-015042.md`
- **CEO plan** (/plan-ceo-review, SCOPE EXPANSION): `~/.gstack/projects/new-project/ceo-plans/2026-04-19-buddy-note.md`
- **Eng review** (confidence 8/10, GO with conditions): `~/.gstack/projects/new-project/bao-main-eng-review-20260419-235500.md`
- **Design review** (3.0/10 → 8.5/10, 폴라로이드 확정): `~/.gstack/projects/new-project/bao-main-design-review-20260419-150058.md`

세컨드 브레인 위키 (개인): `~/Library/Mobile Documents/iCloud~md~obsidian/Documents/ryu.mg/wiki/entities/buddy-note.md`

---

## 🤖 AI Agent 작업 규칙

### 공통 원칙
- **DESIGN.md tokens를 반드시 경유** — 새 색/폰트/radius 하드코딩 금지
- **한국어로 커뮤니케이션** (유저와 AI 모두). 기술용어는 원문 유지
- **Server Action** 우선, API route는 webhook/OG/external 용도만
- **RLS first** — 모든 새 테이블은 RLS 활성화 + 정책 명시 필수
- **컬럼 drop/rename 금지** — 새 컬럼 추가만 (기존 null-default로 추가)
- **커밋은 사용자 요청 시에만**. 작업 파일만 생성하고 user가 리뷰 후 커밋
- **외부 아티팩트 먼저 읽기** — CEO plan + eng review + design review를 읽으면 "왜"가 다 나옴

### Next.js 16 breaking changes
- `middleware.ts` → `proxy.ts` 권장 (v1은 middleware 유지, D9 참조)
- React 19 기본, 서버 컴포넌트 async
- `cookies()`, `headers()`, `params`, `searchParams` 모두 **async** — `await` 필수
- Turbopack stable, webpack fallback 필요 시 명시

### Supabase
- `createClient()` 반환이 null일 수 있음 (env 미설정) — 항상 guard
- `@supabase/ssr` 패키지 사용. `@supabase/auth-helpers-nextjs`는 legacy (쓰지 말 것)
- RLS 우회 insert (diaries, memory_summary, queue)는 **service role key** 사용

### LLM
- Claude Sonnet 4.6 기본. 비용 한계는 `.env`의 `LLM_COST_CAP_USD` (Week 2에 추가)
- 프롬프트 변경은 `docs/prompts/*.md` 버전 관리
- A/B 실험은 `diaries.model_used` 컬럼 기반

---

## 🧰 gstack (REQUIRED — global install)

**Before doing ANY work, verify gstack is installed:**

```bash
test -d ~/.claude/skills/gstack/bin && echo "GSTACK_OK" || echo "GSTACK_MISSING"
```

If GSTACK_MISSING: STOP. Do not proceed. Tell the user:

> gstack is required for all AI-assisted work in this repo.
> Install it:
> ```bash
> git clone --depth 1 https://github.com/garrytan/gstack.git ~/.claude/skills/gstack
> cd ~/.claude/skills/gstack && ./setup --team
> ```
> Then restart your AI coding tool.

Do not skip skills, ignore gstack errors, or work around missing gstack.

**gstack skills 사용**: `/qa`, `/ship`, `/review`, `/investigate`, `/browse` 등이 활성. `/browse`로 모든 웹 브라우징.
gstack 파일 경로는 `~/.claude/skills/gstack/...` (global path).

### Skill routing
사용자 요청이 아래 패턴에 맞으면 **Skill 툴을 FIRST action으로 호출** (직접 답변 금지):

| 사용자 표현 | 실행할 skill |
|---|---|
| "아이디어 있어 / 뭐 만들까 / 이게 괜찮나" | `office-hours` |
| "버그 / 500 에러 / 작동 안 함" | `investigate` |
| "ship / deploy / push / PR 만들어줘" | `ship` |
| "테스트 / QA / 버그 찾아줘" | `qa` |
| "코드 리뷰 / diff 체크" | `review` |
| "ship 후 docs 업데이트" | `document-release` |
| "주간 retro" | `retro` |
| "디자인 시스템 / 브랜드 가이드" | `design-consultation` |
| "시각 검수 / UI 다듬기" | `design-review` |
| "아키텍처 리뷰 / 플랜 잠그기" | `plan-eng-review` |
| "저장 / 체크포인트 / 어디까지 했지" | `checkpoint` |
| "코드 건강 / quality 점수" | `health` |

---

## 📜 변경 로그

- **2026-04-19** — 위키 ingest + office-hours + CEO review (SCOPE EXPANSION) + eng review + design review (폴라로이드 확정) + LLM fallback v1 승격
- **2026-04-20** — Week 1 Day 1 vertical slice 완성 (schema + shadcn + auth + onboarding, 4-agent 병렬). AGENTS.md SSOT 확립, CLAUDE.md symlink
