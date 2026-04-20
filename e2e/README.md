# E2E 테스트 (Playwright)

`@/e2e` 는 buddy-note 의 스모크 + critical path 검증용. 풀 커버리지 아니라 "회귀 감지 그리드".

## 실행

```bash
# 1) 별도 터미널에서 dev 서버 먼저 띄우기 (Supabase env 필요)
bun run dev

# 2) 테스트 실행
bun run test:e2e                           # 전부
bun run test:e2e e2e/smoke.spec.ts         # 스모크만
bun run test:e2e --project=chromium        # 특정 브라우저
bun run test:e2e --headed                  # 헤드풀 디버그
```

dev 서버를 자동으로 띄우려면:

```bash
PLAYWRIGHT_AUTOSTART=1 bun run test:e2e
```

스테이징이나 프리뷰 URL 로 쏘려면:

```bash
PLAYWRIGHT_BASE_URL=https://pr-123.buddy-note.vercel.app bun run test:e2e
```

## Prereqs

- Supabase 환경변수 설정 (`.env.local` — `AGENTS.md` 세팅 섹션 참조)
- `bun run dev` 가 `http://localhost:4000` 에서 떠 있어야 함 (autostart 모드 제외)
- 처음이면 브라우저 바이너리 설치: `bunx playwright install chromium webkit`

## 구조

```
e2e/
├── fixtures/
│   ├── auth.ts           # authenticatedUser / freshUser fixture (스캐폴드, C2 이후 실 구현)
│   └── sample-dog.jpg    # 10x10 placeholder JPEG (업로드 테스트용)
├── smoke.spec.ts         # 익명 smoke — env 없어도 일부 통과
├── onboarding.spec.ts    # 로그인 필요 — fixture 미구현 시 전 skip
├── log-flow.spec.ts      # auth + Supabase + Anthropic 모두 필요 — 전 skip
└── README.md
```

## 알려진 한계

- **매직 링크 auth 는 메일박스 브릿지 없이 E2E 로 재현 불가**. `fixtures/auth.ts` 는
  Supabase Admin API (`auth.admin.generateLink`) 를 이용한 세션 쿠키 주입 전략으로
  C2 이후 채운다. 구현 전까지 로그인 필요 테스트는 `test.skip()` 처리된다.
- **LLM 호출을 하는 log-flow 테스트**는 실 Anthropic key 가 아니면 결정적이지 않다.
  C4 이후 `@/lib/llm.ts` 에 mock 훅 열거나 실키 + 짧은 프롬프트 variant 로 대체 예정.
- viewport 는 iPhone SE (375×667) 기본 — primary 타겟이 모바일 SNS 유저.
- 병렬 실행 (`fullyParallel: true`) — 테스트는 서로 독립이어야 한다. 공용 유저
  / 공용 pet 를 만들지 말 것.

## 새 테스트 추가 규칙

- 파일명 `*.spec.ts`
- role / text / label 선택자만 — CSS class 기반 금지 (`.btn-primary` 같은 거)
- 한국어 UI 라 텍스트도 한국어로 찾는 게 자연스러움 (`getByRole('button', { name: '저장' })`)
- auth 가 필요하면 `./fixtures/auth` 의 `test` 를 import
- flaky 하면 retry 늘리지 말고 원인 수정 — 타이밍은 `waitForURL` / `expect().toBeVisible()` 로
