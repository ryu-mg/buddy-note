# AGENTS_TODOS — 현재 잔여 작업 SSOT

> 새 세션에서는 `AGENTS.md`, `rules/architecture.md`, `rules/code-conventions.md`, `TODOS.md`, 이 파일을 순서대로 읽고 시작한다.
> 2026-04-21 기준, **사용자/외부 서비스 블로커 없이 처리 가능한 코드 작업은 모두 완료**했다.

---

## 현재 상태 스냅샷 (2026-04-21)

- Branch: `main`
- 마지막 구현 커밋: `16fe886 chore: LLM health check 추가`
- 품질 게이트:
  - `bun run lint` 통과
  - `bunx tsc --noEmit` 통과
  - `bun run test` 통과 — 166 pass
  - `bunx next build` 통과
  - `bun run build-storybook` 통과
- 주의: Storybook build는 `radix-ui package.json` 탐색 경고와 chunk-size 경고를 출력하지만 실패는 아님.

---

## 완료된 비블로커 작업

| 영역 | 상태 | 대표 커밋 |
|---|---|---|
| 배포 품질 세트 B | 완료 | `8aa6428 chore: 배포 품질 세트 B 완료` |
| Dependabot | 완료 | `2368488 chore: Dependabot 설정 추가` |
| CHANGELOG 시드 | 완료 | `448b9c5 docs: v0.1 pre-release changelog 시드` |
| README 프로젝트 문서화 | 완료 | `86826d3 docs: README 현재 상태 반영` |
| lint warning 정리 | 완료 | `baa499c chore: lint warning 정리` |
| `/logs` 월별 기록 히스토리 | 완료 | `7e9742b feat: 월별 기록 히스토리 페이지 추가` |
| Storybook 도입 | 완료 | `1c51f68 chore: Storybook 도입` |
| Storybook 산출물 lint 제외 | 완료 | `8cc1204 chore: Storybook 산출물 lint 제외` |
| `diary-images` orphan cleanup cron | 완료 | `d637649 chore: orphan diary image cleanup 추가` |
| LLM health check + Discord webhook | 완료 | `16fe886 chore: LLM health check 추가` |

---

## 지금 남은 작업

### 사용자/외부 서비스 블로커

| # | 항목 | 해제 조건 | 해제 후 할 일 |
|---|---|---|---|
| C1 | Kakao 비즈앱 승인 | Kakao 비즈앱 승인 + Supabase Dashboard Provider 활성화 | staging에서 Kakao OAuth 실제 플로우 검증 |
| C2 | Supabase Seoul 프로젝트 | `.env.local` 작성 + `supabase db push` | `bun run gen:types`, DB 타입 싱크 감사, 실제 E2E |
| C5 | LLM A/B 벤치 | 강아지 사진 5-10장 + 3 API key | `scripts/llm-benchmark` 실행 후 모델 결정 업데이트 |
| — | pg_cron 스케줄 등록 | Supabase SQL Editor에서 migration 주석 블록 실행 | `/api/memory/process` 실가동 확인 |
| — | Vercel 프로젝트 연결 | `vercel link` + env 등록 | Analytics/Speed Insights/Cron 실동작 확인 |
| — | Sentry DSN 발급 | Vercel env에 `SENTRY_*` 등록 | 실제 이벤트 수집 확인 |
| — | 운영 secret 등록 | `CRON_SECRET`, 선택적으로 `DIARY_IMAGE_CLEANUP_SECRET`, `LLM_HEALTH_SECRET`, `DISCORD_WEBHOOK_URL` 등록 | `/api/cleanup/orphan-images`, `/api/health/llm` cron 실동작 확인 |

### 디자인 자원/정책 블로커

| 항목 | 블로커 | 메모 |
|---|---|---|
| Dark mode 토글 | DESIGN.md 다크 팔레트 미확정 | 토큰 추가는 DESIGN.md 먼저 업데이트해야 함 |
| 실제 앱/PWA 아이콘 교체 | 최종 아이콘 자원 없음 | 현재 placeholder 아이콘 유지 |
| 월별 검색/필터 고도화 | migration 필요 | C2 이후 schema 변경과 함께 처리 |

---

## 다음 실행 순서

1. C2가 풀리면 `bun run gen:types`를 실행하고 `types/database.generated.ts`를 실제 Supabase 스키마로 갱신한다.
2. Supabase test/staging env가 준비되면 Playwright E2E를 실제 auth/onboarding/log 생성 플로우로 확장한다.
3. Vercel env가 준비되면 cron 두 개를 실제 호출해 확인한다.
4. C5가 풀리면 LLM benchmark 결과를 반영해 `lib/llm/client.ts`의 기본 모델 결정을 확정한다.
5. 디자인 자원이 들어오면 dark palette 또는 PWA icon 교체를 별도 커밋으로 처리한다.

---

## Ops route 메모

- `/api/cleanup/orphan-images`
  - `Authorization: Bearer $DIARY_IMAGE_CLEANUP_SECRET` 또는 `$CRON_SECRET` 필요
  - `?dryRun=1` 지원
  - `diary-images` bucket object 중 `diaries.image_url_*`에서 참조하지 않는 파일 삭제
- `/api/health/llm`
  - `Authorization: Bearer $LLM_HEALTH_SECRET` 또는 `$CRON_SECRET` 필요
  - Anthropic ping 실패 시 `DISCORD_WEBHOOK_URL`이 있으면 Discord로 알림

---

## 검증 명령

```bash
bun run lint
bunx tsc --noEmit
bun run test
bunx next build
bun run build-storybook
```
