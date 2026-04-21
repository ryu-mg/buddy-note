# AGENTS_TODOS — 잔여 코드 작업 플랜

> AI 에이전트가 **env 없이 바로 처리 가능한 순수 코드 작업**만 여기에 정리.
> 유저 블로커(Kakao 비즈앱, Supabase 프로젝트 생성, LLM 벤치 실행 등)는 `TODOS.md` 참조.
> 완료 시 체크박스 마크 + 관련 커밋 해시 간단히 병기.

---

## 🟠 유저 블로커 (AI 가 진행 불가 — 대기)

| # | 항목 | 비고 |
|---|---|---|
| C1 | Kakao 비즈앱 신청 → 승인 대기 (3-7일) | `/auth/login`에 Kakao 버튼 wired, Supabase Dashboard 활성화만 남음 |
| C2 | Supabase Seoul 프로젝트 생성 + `.envs/local.env` 채우기 + `supabase db push` | E2E 검증 게이트 |
| C5 | LLM A/B 벤치 (강아지 사진 5-10장 + 3개 API key) | `scripts/llm-benchmark/` 준비 완료 |
| — | pg_cron 스케줄 등록 (Supabase SQL Editor) | `supabase/migrations/20260420000003_*` 주석 블록 실행 |
| — | Sentry 계정 + DSN 발급 → env 등록 | DSN 없으면 no-op 이라 무해 |

---

## 🟢 세트 B — 배포 품질 (env-free, 3 에이전트 병렬 가능)

### B-1. Vercel Analytics + Speed Insights wire
- **What**: `@vercel/analytics/next` + `@vercel/speed-insights/next` 설치 → `app/layout.tsx`에 `<Analytics />`, `<SpeedInsights />` 마운트
- **Why**: Vercel 배포 후 바로 페이지 뷰 + Core Web Vitals 수집. dev/preview에선 no-op 기본값
- **영향 파일**: `package.json`, `app/layout.tsx`
- **검증**: `bunx next build` 통과 + `bun test` 그대로 120 pass
- **Effort**: XS (10분)

### B-2. `scripts/gen-types.sh` — Supabase 타입 자동생성 래퍼
- **What**: `types/database.ts` 를 `supabase gen types typescript --local` (또는 `--project-id`)로 재생성하는 래퍼 스크립트. README 사용법 추가
- **Why**: 현재 `types/database.ts` 는 손으로 유지 중 → 스키마 evolve 시 drift 위험. 새 migration 추가 후 `bun run gen:types` 한 방에 싱크
- **영향 파일**: `scripts/gen-types.sh` (신규), `package.json` (scripts.gen:types), `README.md` (사용법)
- **주의**: supabase CLI 설치 전제 조건 README에 명시. 생성물이 hand-written 필드(RecentCallback 등)와 충돌하면 별도 `types/database.generated.ts` 로 분리하는 방안도 고려
- **Effort**: S (30분)

### B-3. 단위 테스트 확장
- **What**: 다음 3개 모듈에 `*.test.ts` 추가
  - `lib/llm/sanitize.ts` — XML-ish tag / delimiter smuggling 방어 케이스 (프롬프트 인젝션)
  - `lib/llm/schemas.ts` — diaryInputSchema / diarySchema edge (min/max 길이, 빈 callbacks, 잘못된 mediaType)
  - `lib/rate-limit.ts` — stub 모드(env 없음) + 정상 모드 분기, sliding window 경계
- **Why**: 보안·LLM 경계·유저 쿼터는 회귀 시 소리 없이 뚫릴 수 있는 영역. 현재 120 pass → 목표 150+ pass
- **영향 파일**: `lib/llm/sanitize.test.ts`, `lib/llm/schemas.test.ts`, `lib/rate-limit.test.ts` (모두 신규)
- **Effort**: M (1시간)

---

## 🟡 세트 C — DX / 운영 편의 (우선순위 중)

### C-1. CHANGELOG.md 시드
- **What**: 현재 29 커밋(`ship --since origin/main` 혹은 git log 파싱) 기반으로 v0.1 pre-release CHANGELOG 초안. 앞으로 `ship` skill이 append
- **Effort**: S (20분)

### C-2. Dependabot 또는 Renovate config
- **What**: `.github/dependabot.yml` (최소: npm weekly, github-actions monthly) 또는 `renovate.json`
- **Why**: Next 16 / Supabase SDK / Sentry 등 빠르게 움직이는 의존성. 보안 업데이트 자동화
- **Effort**: XS (10분)

### C-3. README 프로젝트용으로 교체
- **What**: 현재 `README.md` 는 create-next-app 기본값. buddy-note 소개 + dev setup + 링크(AGENTS.md, DESIGN.md, TODOS.md) 로 대체
- **Effort**: S (30분)

### C-4. types/database.ts ↔ migrations 싱크 감사
- **What**: `supabase/migrations/*.sql` 와 `types/database.ts` 를 한 번 대조 — 누락 컬럼/테이블 / 타입 mismatch 점검. B-2 스크립트 만든 김에 한 번 실제 generate 해서 diff 리포트
- **Effort**: S (C2 완료 전제, Supabase 있어야 실제 gen 가능 — 그 전에는 수동 diff만)
- **블로커**: C2

---

## 🔵 세트 D — FE 완성도 (우선순위 낮음)

### D-1. `/logs` 전용 히스토리 페이지
- **What**: 현재 홈(`/`)이 타임라인을 겸하는데, 로그 수가 쌓이면 월별 스크롤이 부담. 전용 리스트 뷰 + 페이지네이션/무한스크롤
- **v1.5 후보**: 홈 UX 사용자 피드백 본 뒤 결정
- **Effort**: M (2-3시간)

### D-2. 월별 필터 / 검색
- **What**: `/logs` + 홈에 월 선택 드롭다운, 태그 필터. 검색은 diary title/body full-text (Postgres `tsvector`)
- **Depends**: D-1, tsvector 인덱스 추가 migration
- **Effort**: M

### D-3. Dark mode 토글
- **What**: `next-themes` 는 설치되어 있지만 토큰·토글 UI 없음. `--color-*` 토큰에 `.dark` variant 추가 + Settings 화면 토글
- **주의**: DESIGN.md 에 dark 팔레트 명시 필요 (테라코타 accent가 다크에서 눈 아프지 않은 보정값) — 디자인 선행
- **Effort**: M (토큰 확정 후 S)

### D-4. Storybook 도입
- **What**: `components/ui/*` + `components/onboarding/*` 카탈로그. radix-nova 변형 탐색용
- **Effort**: M

### D-5. 실제 앱 아이콘 / PWA 아이콘 교체
- **What**: 현재 `public/icons/*.png` 은 placeholder. 폴라로이드 모티브 + 테라코타 단색 로고 + 192/512 PNG + maskable 버전
- **Blocker**: 디자인 자원 필요 (사용자 또는 `/design-consultation`)
- **Effort**: S (자원 있을 때)

---

## 🟣 세트 E — 운영·관측 (v1 ship 전후)

### E-1. diary-images orphan cleanup cron
- **What**: 유저 탈퇴 / diary 삭제 시 `diary-images` bucket 의 UUID 파일이 고아로 남음. 주 1회 cron이 `diaries.image_url_*` 와 bucket 을 대조해서 회수
- **현재**: `app/pet/delete/*` 와 `app/diary/[id]/delete` 에 TODO 주석만 있음
- **Effort**: S (Supabase Edge Function or Vercel Cron + service role)

### E-2. LLM health check + Discord webhook
- **What**: Vercel Cron이 5분마다 Claude API에 ping → 실패 시 Discord webhook 알림. `TODOS.md` P1 항목 중 "v1.5 잔여" 와 동일
- **Effort**: XS (15분, 웹훅 URL은 env)

### E-3. E2E 시나리오 추가
- **현재**: `e2e/smoke.spec.ts` 5개 pass + `onboarding.spec.ts`, `log-flow.spec.ts` 스텁
- **추가 목표**:
  - 온보딩 풀 플로우 (0→6, MBTI 답안 저장 → /home 리다이렉트)
  - 로그 작성 → diary 생성(Mock Anthropic) → 공개 프로필 `/b/[slug]` 조회
  - Kakao OAuth callback (mock)
- **블로커**: C2 (Supabase 없이는 대부분 막힘 → Supabase test project 또는 로컬 supabase)
- **Effort**: L

---

## 📋 완료된 (참고용)

- ✅ Phase 1~3 — BE 인프라 + /log + /diary + 홈 + 공개 프로필 + 메모리 파이프라인
- ✅ FE polish + Kakao 버튼 wire + Loading states + SEO (sitemap/robots) + proxy.ts 마이그레이션
- ✅ Pet settings + diary delete + PWA manifest + 4 icons placeholder + E2E smoke 5개 + README seed
- ✅ 구조화 로거(`lib/logger.ts`) + PII redaction + Sentry hook
- ✅ a11y sweep (aria/autoComplete/터치 타겟 10파일) — `d888e80`
- ✅ CI 워크플로 (lint/tsc/test/build) + PR 템플릿 — `801d01f`
- ✅ Sentry Next 16 통합 (DSN 없을 때 no-op) — `ba3f0b9`
- ✅ 온보딩 localStorage 복구 (7일 TTL) + 에러 copy 일관성 — `8480451`
- ✅ GitHub 원격 연결 (ryu-mg/buddy-note, 29 커밋 push)
- ✅ git credential 계층 정리 (`dev/` 하위 자동 ryu-mg 라우팅)
- ✅ `.envs/` 환경변수 체계 + `example.env` 템플릿

---

## 🧭 다음 추천 순서

1. **세트 B** (3 병렬) — 배포 직전 품질 메트릭 + 타입 싱크 + 테스트 커버리지
2. **세트 C-1, C-2, C-3** (1 에이전트 순차) — ship skill 이 먹기 좋은 DX 세팅
3. 사용자 블로커 처리 (C1/C2/C5) 기다리며 세트 D 중 env 불요 항목(D-3 토큰, D-5 아이콘) 작업

업데이트 시점: 2026-04-21
