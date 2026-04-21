# Changelog

이 파일은 buddy-note의 주요 변경 사항을 기록한다.

## v0.1.0 pre-release

### Product
- 반려동물 AI 일기 + 공유 이미지 생성 앱의 v1 vertical slice를 구현했다.
- 5문항 MBTI 온보딩으로 `persona_prompt_fragment`를 생성하고, 이후 일기 생성에 주입한다.
- 홈 타임라인, 일기 상세, 공개 프로필(`/b/[slug]`), 펫 프로필 편집/탈퇴 흐름을 추가했다.
- 폴라로이드 비주얼 시스템, 테라코타 accent, Pretendard/Nanum Myeongjo 타이포그래피를 앱 UI에 반영했다.

### Backend
- Supabase Postgres schema, RLS 정책, Storage bucket 정책, seed data를 추가했다.
- `photos` private bucket과 `diary-images` public bucket을 분리했다.
- 사진 업로드, EXIF strip, Claude 기반 일기 생성, fallback diary, satori/resvg 공유 이미지 렌더링 파이프라인을 구현했다.
- `pet_memory_summary` LLM 요약기와 `memory_update_queue` 기반 비동기 worker를 추가했다.
- Upstash Redis rate limit을 추가했다. 일기 생성은 유저당 시간당 10회, memory worker는 전역 분당 60회로 제한한다.

### Frontend
- shadcn/ui 기반 컴포넌트와 앱 전역 header/toaster/loading/error/not-found 상태를 추가했다.
- `/log` 업로드 폼, 진행 phase copy, `/diary/[id]` 공유 모달, 공개 프로필 카드 UI를 구현했다.
- 온보딩 localStorage 복구와 에러 copy 일관성 sweep을 반영했다.
- PWA manifest와 placeholder icon을 추가했다.

### Security
- 클라이언트 Canvas와 서버 `sharp`의 이중 EXIF strip을 적용했다.
- `sanitizeUserText`로 XML-like tag, delimiter, `USER DATA` smuggling 방어를 추가했다.
- Supabase service role 사용 경로를 서버 전용 모듈로 제한했다.
- 공개 프로필은 `pets.is_public=true`일 때만 익명 접근 가능하도록 RLS와 select 컬럼을 제한했다.

### Observability
- 구조화 logger와 PII redaction을 도입했다.
- Sentry Next.js 16 통합을 추가했다. DSN이 없으면 no-op으로 동작한다.
- Vercel Analytics와 Speed Insights를 RootLayout에 마운트했다.

### DX / Quality
- GitHub Actions CI를 추가했다. lint, typecheck, unit test, production build를 실행한다.
- Playwright E2E smoke test와 auth fixture scaffold를 추가했다.
- Bun unit test를 확장해 `sanitize`, LLM schema, rate-limit core 경계를 검증한다.
- Supabase CLI 기반 타입 생성 래퍼 `bun run gen:types`와 `types/database.generated.ts` placeholder를 추가했다.
- Dependabot 설정을 추가했다. npm dependency는 weekly, GitHub Actions는 monthly로 확인한다.

### Known Blockers
- Supabase Seoul 프로젝트 생성, env 설정, `supabase db push`가 필요하다.
- Kakao 비즈앱 승인 후 Supabase Kakao Provider 활성화가 필요하다.
- LLM A/B benchmark는 실제 반려동물 사진과 API key 준비 후 실행해야 한다.
- pg_cron schedule, Sentry DSN, Vercel 프로젝트 연결은 배포 환경에서 추가 설정이 필요하다.
