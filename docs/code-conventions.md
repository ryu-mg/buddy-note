# buddy-note Code Conventions

> **이 문서는 LLM 에이전트가 파일을 수정하거나 작성하기 전 반드시 읽는다.** 여기 있는 규칙과 다르게 짜야 한다면 **이유를 명시하고 사용자 확인 후** 진행. 일관성이 개인 센스보다 우선.

상위 전략/스코프는 `AGENTS.md`, 시스템 아키텍처는 `docs/architecture.md`, 디자인 토큰은 `DESIGN.md` 참조.

---

## 1. Language / Build

- **TypeScript strict mode** (`tsconfig.json`). `any` 절대 금지. `unknown` + narrow로.
- **Bun** 기본 (lockfile `bun.lock`). `npm`/`pnpm`/`yarn` 쓰지 말 것.
- **Node `>=20.9.0`** (`.nvmrc`에 22 고정). 빌드/dev 들어가기 전 `nvm use`.
- `bun run build`가 항상 통과해야 함. 커밋 전 로컬에서 확인.
- `npx tsc --noEmit`도 통과해야 함 (type check는 build와 독립).

### Formatters / Linters
- Prettier 설정 X (Next.js 기본). ESLint는 `bun run lint`로.
- 탭 vs 스페이스: 스페이스 2 (파일에 이미 그렇게 들어있음).
- 세미콜론: **없음** (기존 파일 무세미콜론 따라감).
- 따옴표: single `'...'` 우선. JSX attr은 double `"..."`.

---

## 2. File / Directory Structure

```
app/           → 라우트 (page.tsx, layout.tsx, route.ts, actions.ts)
components/    → 재사용 UI (feature별 서브디렉토리)
lib/           → 로직 / framework-agnostic
types/         → 타입 정의 (DB schema 포함)
supabase/      → migrations, seed, config, edge functions
scripts/       → 로컬 도구 (self-contained Bun 서브프로젝트 OK)
docs/          → SSOT 문서 + 프롬프트 버전관리
public/        → 정적 파일
```

### 새 파일 만들 때
- **feature-first**: `components/onboarding/`, `lib/prompts/` 처럼 feature로 그룹
- 한 파일 200줄 넘으면 분할 고려
- `index.ts` re-export는 **금지** (import 경로 추적 어려워짐, tree shaking 방해)

### Naming
| 종류 | 규칙 | 예시 |
|---|---|---|
| 파일 (route) | Next.js 컨벤션 그대로 | `page.tsx`, `route.ts`, `layout.tsx`, `actions.ts` |
| 파일 (React 컴포넌트) | kebab-case | `question-card.tsx`, `name-form.tsx` |
| 파일 (lib) | kebab-case | `pet-mbti.ts`, `slug.ts` |
| 파일 (SQL migration) | `YYYYMMDDHHMMSS_description.sql` | `20260419000001_initial_schema.sql` |
| React 컴포넌트 | PascalCase | `QuestionCard` |
| 함수 | camelCase | `buildPersonaPromptFragment` |
| 상수 | SCREAMING_SNAKE | `MAX_MEMO_LENGTH` |
| 타입 | PascalCase | `Question`, `AxisKey` |
| DB 컬럼 | snake_case | `user_id`, `persona_answers`, `created_at` |
| env var | SCREAMING_SNAKE | `NEXT_PUBLIC_SUPABASE_URL` |

### Import paths
- **alias `@/` 사용**: `import { createClient } from '@/lib/supabase/server'`
- 상대 경로는 **같은 디렉토리 내에서만** OK: `import { helper } from './helper'`
- 외부 패키지 먼저 → 빈 줄 → `@/` 프로젝트 → 빈 줄 → 상대 경로
  ```ts
  import { redirect } from 'next/navigation'
  import { z } from 'zod'

  import { createClient } from '@/lib/supabase/server'
  import type { Database } from '@/types/database'

  import { buildFragment } from './helper'
  ```

---

## 3. React / Next.js Patterns

### RSC vs Client
- **기본 RSC**. `'use client'`는 hook/이벤트/브라우저 API 필요할 때만.
- Client component는 **가장 작은 leaf**로. 데이터 fetching은 RSC 부모가.
- 경계 명확히: client-only code (hooks, `window`)는 `lib/client/*`에, server-only (service role client)는 `lib/server/*`에.

### Server Actions 패턴
```ts
// app/<feature>/actions.ts
'use server'

import { z } from 'zod'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

const Schema = z.object({
  name: z.string().min(1).max(30),
  species: z.enum(['dog', 'cat']),
})

export type SaveResult = { error: string } | void

export async function savePet(
  _prev: SaveResult,
  formData: FormData,
): Promise<SaveResult> {
  const supabase = await createClient()
  if (!supabase) return { error: 'Supabase 설정이 필요해요.' }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: '로그인이 필요해요.' }

  const parsed = Schema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: '입력을 다시 확인해주세요.' }

  const { error } = await supabase.from('pets').insert({
    user_id: user.id,
    ...parsed.data,
  })
  if (error) return { error: '저장 중에 문제가 생겼어요.' }

  redirect('/')
}
```

규칙:
- **항상 `'use server'`** 최상단
- zod 검증 **필수** (FormData 직접 신뢰 금지)
- auth check 항상 첫 줄 이후
- 에러는 throw 아니라 `return { error }` (UI에서 inline 표시)
- 성공 시 `redirect()` 또는 `revalidatePath()`
- `useActionState` 호환 3-tuple 시그니처 `(prevState, formData)`

### Client Forms
```tsx
'use client'
import { useActionState } from 'react'
import { savePet, type SaveResult } from './actions'

export function Form() {
  const [state, action, pending] = useActionState<SaveResult, FormData>(
    savePet,
    undefined,
  )
  return (
    <form action={action}>
      <input name="name" required />
      {state?.error && <p role="alert">{state.error}</p>}
      <button disabled={pending}>{pending ? '저장 중...' : '저장할게요'}</button>
    </form>
  )
}
```

### Loading / Error / Not-found
- `app/<route>/loading.tsx` — RSC suspense fallback, skeleton UI 사용 (DESIGN §6 shimmer)
- `app/<route>/error.tsx` — boundary, 사과 + 재시도 버튼
- `app/<route>/not-found.tsx` — 404, 분위기 맞춤 copy ("이 친구를 찾을 수 없어요")

### Async APIs (Next 16 / React 19)
`cookies()`, `headers()`, `params`, `searchParams` **전부 Promise**. `await` 필수:
```ts
export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  // ...
}
```

---

## 4. Supabase Usage

### Client factories — 반드시 `@/lib/supabase/*` 경유
- `createClient()` (서버 컴포넌트 / Server Action) — null 반환 가능 (env 없을 때)
- `createBrowserClient()` (client component)
- `updateSession()` (middleware)

**직접 `@supabase/ssr`의 `createServerClient` 호출 금지.**

### Env-missing guard 패턴
```ts
const supabase = await createClient()
if (!supabase) {
  // 개발 편의성 — 실제 prod에서는 env 반드시 세팅
  return <p>Supabase 설정이 필요해요.</p>
  // 또는 redirect('/setup'), 또는 return { error }
}
```

### Privileged operations (service role)
```ts
// lib/supabase/service.ts (Week 2에 생성)
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Supabase service role env missing')
  return createClient<Database>(url, key, { auth: { persistSession: false } })
}
```

**service role client는 절대 client component에 import 금지.** `SUPABASE_SERVICE_ROLE_KEY`는 `NEXT_PUBLIC_` prefix **없음** — 자동으로 서버 전용.

### Query 패턴
```ts
// ✅ 좋음: 타입 힌트 잡힘
const { data, error } = await supabase
  .from('pets')
  .select('id, name, slug')
  .eq('user_id', user.id)
  .limit(1)
  .maybeSingle()

// ❌ 나쁨: 타입 손실
const { data }: any = await supabase.from('pets').select('*')
```

- 성능: 필요한 컬럼만 `select`. `*`는 relation 포함 시에만.
- `maybeSingle()` (없을 수 있음) vs `single()` (반드시 있어야; 없으면 에러). 맥락에 맞게.
- error 처리: `if (error) return { error: ... }` 패턴 유지 (throw 금지).

### Migration 규칙
- **forward-only**. down migration 없음.
- 컬럼 drop/rename **금지**. 새 컬럼 추가만. 제거는 새 컬럼으로 대체 + 구 컬럼은 deprecated 주석.
- RLS 정책 변경은 독립 migration 파일로.
- Schema 업데이트 후 `types/database.ts` 재생성 (Supabase CLI): `supabase gen types typescript --linked > types/database.ts`

---

## 5. LLM Usage

### 전용 wrapper 경유 (Week 2에 생성)
```ts
// lib/llm.ts
export async function generateDiary(input: {
  photoUrl: string
  petPersona: string
  memorySummary: string
  tags: string[]
}): Promise<DiaryResult> {
  // Anthropic SDK 호출, cost tracking, fallback, ...
}
```

**`@anthropic-ai/sdk`를 직접 import 금지**. `@/lib/llm`만 사용.

### 프롬프트 버전 관리
- `docs/prompts/diary-v1.md`, `docs/prompts/memory-summary-v1.md` 등
- 프롬프트 변경 시 **새 파일** (`-v2.md`), 기존 버전은 보존
- `lib/prompts/*.ts`에서 import → `lib/llm.ts`가 사용
- A/B 실험 시 `diaries.model_used`에 `claude-sonnet-4-6@diary-v1` 식으로 기록

### 필수 필드 기록 (매 호출)
```ts
await supabase.from('diaries').insert({
  // ...content
  model_used: 'claude-sonnet-4-6',
  latency_ms: Date.now() - start,
  tokens_input: response.usage.input_tokens,
  tokens_output: response.usage.output_tokens,
  is_fallback: false,
})
```

### Fallback
```ts
try {
  const diary = await generateDiary(input)
  return { ...diary, is_fallback: false }
} catch (err) {
  logLLMError(err)
  return {
    title: `${petName}의 기록`,
    body: TEMPLATE_FALLBACK_BODY(petName),
    is_fallback: true,
  }
}
```

**Fallback 시 UI에 명시** (토스트 "AI가 잠시 놓쳤어요, 나중에 다시 만들어볼게요")

---

## 6. Error Handling

### 규칙
- **throw 대신 return** (Server Actions / business logic). 에러 상태를 명시적 타입으로.
- `catch` 블록은 **구체 에러 타입**으로 narrow. `catch (e: any)` 금지.
- 사용자에게 보이는 에러 메시지는 **한국어 + 사과 + 회복 액션**:
  - ❌ "Internal server error"
  - ✅ "잠시 문제가 생겼어요. 30초 뒤 다시 시도해주세요."
- 개발자용 상세는 **console.error / 로깅만**, UI에 노출 X.

### Graceful null vs throw
| 상황 | 조치 |
|---|---|
| env 없음 | `return null` (createClient) → UI가 안내 표시 |
| auth 없음 | `redirect('/auth/login')` |
| RLS 거부 | `error` 받으면 로그 + 일반 "문제 생겼어요" UI |
| zod 검증 실패 | `return { error: '구체 메시지' }` |
| 예측 못한 외부 API 실패 | `catch` + fallback (LLM) 또는 user-friendly error |
| 프로그래밍 버그 | throw OK (Error boundary가 잡음) |

### Toast / UI 피드백
- `components/ui/sonner.tsx` (shadcn) 사용
- 성공 알림 최소화 (redirect로 대체)
- 에러 알림 명확, dismiss 가능
- 네트워크 끊김은 toast 대신 offline indicator (Week 3)

---

## 7. Styling

### 반드시 DESIGN.md token 경유
```tsx
// ✅ 좋음
<div className="bg-[var(--color-paper)] text-[var(--color-ink)]">

// ✅ 좋음 (shadcn 의미 토큰)
<Button variant="default">

// ❌ 나쁨 (하드코딩)
<div className="bg-[#fafaf5] text-[#1a1a1a]">

// ❌ 나쁨 (임의 색)
<div className="bg-purple-500">
```

**새 색/폰트/radius/motion 값 추가는 DESIGN.md 업데이트 먼저**, 그다음 `app/globals.css`의 `@theme inline`에 반영.

### Tailwind 사용
- Tailwind v4, `@theme inline` 방식. `tailwind.config.ts` 파일 없음.
- Arbitrary value는 CSS var로: `bg-[var(--color-accent-brand)]` ✅ vs `bg-[#e07a5f]` ❌
- 반응형: `sm:`, `md:`, `lg:`. 모바일 first (무접두사가 모바일).
- `@apply`는 `components/ui/*`에서만 제한적으로. 일반 컴포넌트는 JSX에 직접.

### 폴라로이드 엘리먼트 (DESIGN §12)
```tsx
<div
  className={clsx(
    'bg-[var(--color-paper)] p-6 pb-11', // 24px + 44px bottom
    'motion-safe:-rotate-[0.6deg] motion-safe:transition-transform',
    'ring-1 ring-[var(--color-line)]',
  )}
>
  {/* photo 1:1 crop */}
  {/* lockup: 좌 날짜+날씨, 우 강아지 이름, 우하단 로고 opacity 0.3 */}
</div>
```

### Motion
- 기본 duration `var(--duration-default)` (200ms)
- easing `var(--ease-soft-out)`
- `motion-safe:` prefix로 `prefers-reduced-motion: reduce` 존중

---

## 8. Accessibility

### 필수 baseline
- 본문 contrast **4.5:1**, 큰 텍스트 3:1
- 터치 타겟 **44×44px 이상**
- 키보드 포커스 ring: `focus-visible:ring-2 focus-visible:ring-[var(--color-accent-brand)] focus-visible:ring-offset-2`
- Icon-only 버튼은 **`aria-label` 필수**
- Form field는 **`<label>` 필수** (또는 `aria-label`)
- Images는 **`alt` 필수** (장식이면 `alt=""`)
- 한국어 페이지는 `<html lang="ko">` (이미 `app/layout.tsx`에 설정됨)

### 키보드 인터랙션
- 모든 interactive element는 키보드로 도달/조작 가능해야 함
- `tabIndex={-1}` 신중히 (focus trap 용도 외)
- Enter/Space 트리거: `<button>`은 자동, `<div onClick>` 쓰지 말 것

---

## 9. i18n (v1 한국어만)

- 모든 사용자 노출 문자열은 **한국어**
- 코드 안의 텍스트: 변수 분리 필요 없음 (v1 한국어 고정)
- v1.5 다국어 시: `lib/i18n.ts` + dict JSON 구조 도입 예정
- 기술 용어/외부 제품명은 원문 유지 (`Supabase`, `Next.js`)

### Copy voice (DESIGN §11)
- 권유형 > 명령형: "사진 한 장 올려주세요" ✅, "사진 올려라" ❌
- 에러: 사과 + 회복 액션: "잠시 AI가 놓쳤어요, 30초 뒤 다시 만들어볼게요"
- 금지: "unlock", "power of", "all-in-one", "혁신", "스마트"

---

## 10. Testing (점진 도입, v1 최소)

### v1 필수
- **E2E critical path** (Playwright, Week 5): 로그인 → pet 등록 → 사진 업로드 → diary 생성 → 공유 → 공개 프로필 URL 방문. 이 한 flow가 녹색이면 ship 가능.
- **RLS unit test**: 유저 A가 유저 B의 pet 수정 시도 → 403. SQL 파일로.

### v1.5+
- Visual regression (satori 3포맷)
- LLM output snapshot eval (동일 입력 일관성)

### 당장 안 하는 것
- React 컴포넌트 단위 테스트 (ROI 낮음, UI는 반복 변경)
- 100% coverage — 핵심 path에 집중

---

## 11. Git Conventions

### Branch
- `main` = production
- 작업은 가능한 main에 직접 commit (솔로 개발). PR 필요하면 `feat/slug` 브랜치.

### Commit message
- **Conventional Commits 완화 버전**:
  - `feat: <설명>` — 새 기능
  - `fix: <설명>` — 버그 수정
  - `chore: <설명>` — 설정/빌드/deps
  - `docs: <설명>` — 문서만
  - `refactor: <설명>` — 동작 동일, 구조 개선
  - `test: <설명>` — 테스트만
  - `style: <설명>` — 포맷팅/공백 (로직 무변경)
- 제목 영어 or 한국어 (상관 없음). 1줄 72자 이내.
- Body 한국어 OK. "왜" 중심. "무엇"은 diff가 보여줌.
- 끝에 Co-Authored-By 달기 (AI 에이전트 사용 시).

### 예시
```
feat: Week 1 Day 1 vertical slice — schema + shadcn + auth + onboarding

Parallel 4-agent team output merged into one commit.

- supabase/: 6-table schema + RLS전수 + optimistic lock
- components/ui/: shadcn radix-nova + DESIGN.md @theme inline
- app/auth/: email magic link + no-env guard
- app/onboarding/: MBTI 5문항 stepper (폴라로이드 느낌)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
```

### 절대 금지
- `--no-verify` (hooks 우회)
- `push --force` main branch
- 커밋에 `.env*`, secrets
- 사용자 확인 없이 `reset --hard`, `checkout .`

---

## 12. Performance Guidelines

- N+1 query 주의 — `select('*, relation(*)')` 활용
- Image: Next.js `<Image>` (Vercel optimizing). `<img>` 직접 금지
- Font: `display=swap` 필수 (FOIT 방지)
- Bundle: Client component 최소화. 무거운 패키지는 dynamic import
- satori: 3포맷 병렬 렌더 (`Promise.all`)
- LLM: 한 번의 통합 호출 > 체인 호출 (비용 + 지연)

---

## 13. AI Agent Workflow Rules

### 새 파일 / 기능 작업 전
1. **`AGENTS.md` 확인** — 상위 전략, 결정 내역, gstack 요구사항
2. **`docs/architecture.md` 확인** — 이 새 기능이 어디에 속하는지 (module boundary, data flow, cache)
3. **이 문서 (`docs/code-conventions.md`) 확인** — 패턴, 이름, import 규칙
4. **`DESIGN.md` 확인** — UI 변경이면 token 먼저 체크

### 코드 수정 전
- 해당 파일 전체 Read (부분 스크롤 금지)
- Import 경로 확인
- 의존 파일도 Read (예: Server Action 수정 시 그 action을 호출하는 Client component도)

### 새 테이블/컬럼 추가
1. `docs/architecture.md` §3 Data Model 업데이트 **먼저**
2. Migration SQL 작성 (`supabase/migrations/<timestamp>_<desc>.sql`)
3. RLS 정책 migration 분리
4. `types/database.ts` 업데이트 (수동 또는 CLI regen)
5. 코드 사용처 작성

### 새 LLM 호출 추가
1. `docs/prompts/<name>-v1.md` 작성 (프롬프트 버전)
2. `lib/prompts/<name>.ts` 익스포트
3. `lib/llm.ts`에 호출 함수 추가
4. `diaries` 또는 관련 테이블에 `model_used` / latency / tokens 기록

### 커밋 금지 상황
- `bun run build` 실패
- `npx tsc --noEmit` 에러
- 사용자가 커밋 요청 안 했음
- hooks 실패 (해결 없이 `--no-verify` 우회 금지)

### 변경 범위 규칙
- 요청받은 scope 밖 파일 수정 금지 (의도치 않은 부작용 방지)
- "관련 cleanup"이 정말 필요하면 별도 commit으로 분리

---

## 14. Quick Reference Cheatsheet

```
파일 작업 전 읽을 순서: AGENTS.md → docs/architecture.md → docs/code-conventions.md → DESIGN.md

import 순서: 외부 → @/ → 상대
Supabase: @/lib/supabase/* 만
DB 컬럼: snake_case, user_id (owner_id ❌)
에러: return { error } > throw
스타일: var(--color-*), DESIGN.md 토큰만
언어: 한국어 UI, 코드는 English 섞어도 OK
커밋: conventional + Co-Authored-By
Migration: forward-only, 컬럼 drop ❌
LLM: @/lib/llm 경유, 프롬프트 버전관리, fallback 필수
테스트: E2E critical path 우선
```

### 미심쩍으면
1. 비슷한 기존 파일 찾아서 패턴 따라하기 (`app/auth/login/actions.ts`)
2. AGENTS.md / architecture.md / code-conventions.md 재독
3. 사용자에게 확인

**AI 에이전트 최후의 수단**: 이 문서가 다루지 않는 case에서 judgment call 필요할 때, **질문하기** > 추측. 사용자 confirm 받고 문서 업데이트 PR.
