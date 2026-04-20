# buddy-note

[![CI](https://github.com/ryu-mg/buddy-note/actions/workflows/ci.yml/badge.svg)](https://github.com/ryu-mg/buddy-note/actions/workflows/ci.yml)

> 반려동물의 성격을 1년 동안 기억하는 AI 일기 + SNS 공유 이미지 생성 앱.
> 챗GPT와 다르게 세션마다 강아지를 다시 설명할 필요가 없다.

## 한 줄 소개

사진을 올리면 Claude Sonnet 이 네 강아지 성격 기반 한국어 일기를 써주고,
satori 로 폴라로이드 3포맷 공유 이미지를 자동 생성한다. 기록이 쌓일수록
`pet_memory_summary` 가 누적돼 다음 일기가 점점 더 "그 강아지답게" 나온다.

## 타겟

SNS에 반려동물 콘텐츠 올리는 한국 반려인.

## 차별점

- **페르소나 기억** — 5문항 MBTI 온보딩으로 성격 지정, 이후 모든 일기에 주입
- **폴라로이드 공유 이미지** — Instagram/KakaoTalk 3포맷 (9:16 / 4:5 / 1:1) 자동 렌더
- **공개 프로필 URL** `/b/[slug]` — 바이럴 루프 코어 자산 (ISR 24h)

## 기술 스택

- **Runtime**: Next.js 16 (App Router, Turbopack, React 19) + TypeScript + Bun + Node 22
- **Style**: Tailwind CSS v4 (`@theme inline`), shadcn/ui, Pretendard + Nanum Myeongjo
- **Backend**: Supabase (AWS Seoul) — Auth (magic link + Kakao), Postgres + RLS, Storage, pg_cron
- **LLM**: Anthropic Claude Sonnet (multimodal), 프롬프트 인젝션 방어 + fallback 템플릿
- **Image**: satori + @resvg/resvg-js (폴라로이드 SVG→PNG), sharp (서버 EXIF strip)
- **Rate limit**: Upstash Redis sliding window

## 셋업

### 사전 요구

- Node >= 22 (`.nvmrc`), Bun, (선택) Supabase CLI

### 빠른 시작

```bash
nvm use
bun install

cp .envs/example.env .envs/local.env
ln -sf .envs/local.env .env.local

# .envs/local.env 채우기 (Supabase / Anthropic / Upstash / MEMORY_WORKER_SECRET)

# Supabase 프로젝트 생성 후
supabase link --project-ref <ref>
supabase db push

bun run dev    # http://localhost:4000
```

### 스크립트

| 명령 | 동작 |
|---|---|
| `bun run dev` | 개발 서버 (4000 포트, Turbopack) |
| `bun run build` | 프로덕션 빌드 |
| `bun run lint` | ESLint |
| `bun test` | 유닛 테스트 (bun 내장) |
| `bun run test:e2e` | Playwright E2E (dev 서버 + Supabase env 필요) |
| `bunx tsc --noEmit` | 타입 체크 |

## 주요 라우트

- `/` — 홈 (익명 랜딩 / 소유자 타임라인)
- `/auth/login` — 이메일 매직링크 + 카카오
- `/onboarding` — 5문항 MBTI 온보딩
- `/log` — 사진 업로드 + AI 일기 생성
- `/diary/[id]` — 결과 뷰 + 공유 모달
- `/b/[slug]` — 공개 프로필 (ISR 24h, OG 메타)
- `/pet` — 프로필 편집 + 탈퇴
- `/api/memory/process` — 메모리 요약 워커 (pg_cron 호출)

## 프로젝트 구조

```
app/             # App Router: auth, onboarding, log, diary, b/[slug], pet
components/      # ui/ (shadcn) + feature 컴포넌트
lib/             # supabase/, llm.ts, prompts/, pet-mbti, slug, image/
proxy.ts         # Next 16 proxy (Supabase session refresh)
supabase/        # migrations/ (forward-only), seed.sql, config.toml
scripts/         # llm-benchmark/ (Bun 서브프로젝트)
rules/           # architecture.md, code-conventions.md
docs/            # 제품 문서 (MBTI 문항 등)
types/           # database.ts
.envs/           # example.env + local.env (gitignore)
```

## 문서

- [AGENTS.md](./AGENTS.md) — 상위 전략, 10 locked decision, SSOT
- [rules/architecture.md](./rules/architecture.md) — 시스템 구조, 데이터 흐름
- [rules/code-conventions.md](./rules/code-conventions.md) — 코드 스타일, AI 작업 규칙
- [DESIGN.md](./DESIGN.md) — 폴라로이드 비주얼 시스템
- [TODOS.md](./TODOS.md) — deferred items + 유저 action items

## 현재 상태 (v1 진행률)

- ✅ 인증, 온보딩, /log, /diary, /, /b/[slug], pet 편집/탈퇴
- ✅ 메모리 파이프라인 (pg_cron + 워커 API)
- ✅ Rate limit, 프롬프트 인젝션 방어, 에러 경계, PWA manifest
- ⏳ Kakao 비즈앱 승인 대기 (C1)
- ⏳ Supabase 프로젝트 생성 + migration apply (C2)
- ⏳ LLM A/B 벤치마크 (C5)

## 라이선스

All rights reserved — personal project (작성자: @ryu-mg).
