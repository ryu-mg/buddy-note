# First-Entry Tutorial Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 회원가입 후 강아지 등록을 마친 사용자가 홈에 최초 1회 진입했을 때 3단계 튜토리얼을 보여주고, 완료/건너뛰기 상태를 DB에 저장해 같은 버전에서 반복 노출하지 않는다.

**Architecture:** 홈 RSC가 auth, pet, tutorial state를 읽고 표시 여부를 계산한다. 튜토리얼 copy와 visibility rule은 `lib/tutorial/*`의 pure helper로 분리하고, client bottom sheet는 Server Action을 호출해 completed/dismissed 상태를 저장한다. 상태 저장은 Supabase `user_tutorial_state` 테이블을 사용한다.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript strict, Tailwind v4 CSS variables, Supabase Postgres + RLS, Bun test.

---

## File Structure

- Create: `lib/tutorial/first-entry-tutorial.ts`
  - 튜토리얼 버전, 3개 step, CTA intent를 소유한다.
- Create: `lib/tutorial/first-entry-tutorial.test.ts`
  - step 순서, `/week` 설명, `/log` CTA, 금지 copy를 검증한다.
- Create: `lib/tutorial/visibility.ts`
  - auth/pet/state/route 기준 자동 노출 여부를 계산한다.
- Create: `lib/tutorial/visibility.test.ts`
  - trigger/suppression rule을 pure function으로 검증한다.
- Create: `supabase/migrations/20260506000001_user_tutorial_state.sql`
  - 사용자별 튜토리얼 상태 테이블과 RLS 정책을 추가한다.
- Modify: `types/database.ts`
  - `user_tutorial_state` row/insert/update 타입과 `Database.public.Tables` entry를 추가한다.
- Create: `app/tutorial/actions.ts`
  - `completeFirstEntryTutorial`과 `dismissFirstEntryTutorial` Server Action을 제공한다.
- Create: `components/tutorial/first-entry-tutorial-sheet.tsx`
  - 탭/버튼으로 넘어가는 모바일 우선 bottom sheet UI를 제공한다.
- Modify: `components/home/calendar-home.tsx`
  - `showFirstEntryTutorial` prop을 받아 튜토리얼 sheet를 렌더한다.
- Modify: `app/page.tsx`
  - `user_tutorial_state`를 조회하고 `shouldShowFirstEntryTutorial` 결과를 `CalendarHome`에 전달한다.

## Decisions Locked By This Plan

- 튜토리얼 버전은 `first-entry-v1`로 시작한다.
- 단계는 정확히 3개다: `calendar-view`, `week-view`, `ai-diary`.
- 2단계는 하단 네비게이션바 가장 좌측 `/week` 탭을 설명한다. `/logs` 모아보기 화면을 설명하지 않는다.
- 첫 일기 존재 여부는 자동 노출 suppression 조건이 아니다.
- 완료/dismissed 상태는 DB에 저장한다. localStorage는 source of truth로 쓰지 않는다.
- completed와 dismissed 모두 같은 버전에서 자동 재노출을 막는다.
- 마지막 단계의 `첫 일기 쓰기` CTA만 `/log`로 이동한다.
- repo 규칙상 실제 커밋은 사용자 승인 후에만 한다. 각 task 끝에서는 `git status --short`로 checkpoint만 확인한다.

---

### Task 1: Tutorial Content Model

**Files:**
- Create: `lib/tutorial/first-entry-tutorial.ts`
- Create: `lib/tutorial/first-entry-tutorial.test.ts`

- [ ] **Step 1: Write the failing test**

Create `lib/tutorial/first-entry-tutorial.test.ts`:

```ts
import { describe, expect, it } from 'bun:test'

import {
  FIRST_ENTRY_TUTORIAL_STEPS,
  FIRST_ENTRY_TUTORIAL_VERSION,
  type FirstEntryTutorialStepId,
} from '@/lib/tutorial/first-entry-tutorial'

describe('FIRST_ENTRY_TUTORIAL_STEPS', () => {
  it('uses a stable version key', () => {
    expect(FIRST_ENTRY_TUTORIAL_VERSION).toBe('first-entry-v1')
  })

  it('contains the three product steps in order', () => {
    expect(FIRST_ENTRY_TUTORIAL_STEPS.map((step) => step.id)).toEqual([
      'calendar-view',
      'week-view',
      'ai-diary',
    ] satisfies FirstEntryTutorialStepId[])
  })

  it('explains the left bottom nav as the week view', () => {
    const weekStep = FIRST_ENTRY_TUTORIAL_STEPS[1]
    expect(weekStep?.title).toContain('왼쪽 탭')
    expect(weekStep?.body).toContain('주간 뷰')
    expect(weekStep?.targetHref).toBe('/week')
  })

  it('keeps only the final primary CTA pointed at log creation', () => {
    expect(FIRST_ENTRY_TUTORIAL_STEPS[0]?.primaryCta.href).toBeUndefined()
    expect(FIRST_ENTRY_TUTORIAL_STEPS[1]?.primaryCta.href).toBeUndefined()
    expect(FIRST_ENTRY_TUTORIAL_STEPS[2]?.primaryCta).toEqual({
      label: '첫 일기 쓰기',
      href: '/log',
      completion: 'completed',
    })
  })

  it('uses Korean copy without emoji or banned SaaS words', () => {
    for (const step of FIRST_ENTRY_TUTORIAL_STEPS) {
      const copy = `${step.title} ${step.body}`
      expect(copy).not.toMatch(/[✨🐶🐾]/)
      expect(copy).not.toContain('스마트')
      expect(copy).not.toContain('혁신')
      expect(copy).not.toContain('올인원')
    }
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
bun test lib/tutorial/first-entry-tutorial.test.ts
```

Expected:

```text
error: Cannot find module '@/lib/tutorial/first-entry-tutorial'
```

- [ ] **Step 3: Write minimal implementation**

Create `lib/tutorial/first-entry-tutorial.ts`:

```ts
export const FIRST_ENTRY_TUTORIAL_VERSION = 'first-entry-v1' as const

export type FirstEntryTutorialStepId =
  | 'calendar-view'
  | 'week-view'
  | 'ai-diary'

export type TutorialCompletionIntent = 'completed' | 'dismissed'

export type FirstEntryTutorialCta = {
  label: string
  href?: string
  completion?: TutorialCompletionIntent
}

export type FirstEntryTutorialStep = {
  id: FirstEntryTutorialStepId
  title: string
  body: string
  targetHref?: string
  primaryCta: FirstEntryTutorialCta
  secondaryCta?: FirstEntryTutorialCta
}

export const FIRST_ENTRY_TUTORIAL_STEPS: FirstEntryTutorialStep[] = [
  {
    id: 'calendar-view',
    title: '캘린더에서 하루를 볼 수 있어',
    body: '홈에서는 날짜마다 남긴 일기를 한눈에 볼 수 있어. 사진이 있는 날은 작은 썸네일로 표시돼.',
    targetHref: '/',
    primaryCta: {
      label: '다음',
    },
  },
  {
    id: 'week-view',
    title: '왼쪽 탭에서 이번 주를 모아봐',
    body: '하단 왼쪽 탭은 주간 뷰야. 최근 일기와 기억 포인트를 짧게 모아서 볼 수 있어.',
    targetHref: '/week',
    primaryCta: {
      label: '다음',
    },
  },
  {
    id: 'ai-diary',
    title: '사진을 남기면 일기가 써져',
    body: '사진과 짧은 메모를 올리면 AI가 우리 강아지 말투로 오늘의 일기를 만들어줘. 첫 장부터 남겨볼까?',
    targetHref: '/log',
    primaryCta: {
      label: '첫 일기 쓰기',
      href: '/log',
      completion: 'completed',
    },
    secondaryCta: {
      label: '나중에 볼게',
      completion: 'dismissed',
    },
  },
]
```

- [ ] **Step 4: Run test to verify it passes**

Run:

```bash
bun test lib/tutorial/first-entry-tutorial.test.ts
```

Expected:

```text
pass
```

- [ ] **Step 5: Checkpoint**

Run:

```bash
git status --short
```

Expected: new content model and test files are listed. Do not commit unless the user explicitly approves.

---

### Task 2: Tutorial Visibility Helper

**Files:**
- Create: `lib/tutorial/visibility.ts`
- Create: `lib/tutorial/visibility.test.ts`

- [ ] **Step 1: Write the failing test**

Create `lib/tutorial/visibility.test.ts`:

```ts
import { describe, expect, it } from 'bun:test'

import { shouldShowFirstEntryTutorial } from '@/lib/tutorial/visibility'

const base = {
  hasUser: true,
  hasPet: true,
  pathname: '/',
  completedAt: null,
  dismissedAt: null,
}

describe('shouldShowFirstEntryTutorial', () => {
  it('shows on the first authenticated home entry after pet registration', () => {
    expect(shouldShowFirstEntryTutorial(base)).toBe(true)
  })

  it('does not show for anonymous users', () => {
    expect(
      shouldShowFirstEntryTutorial({
        ...base,
        hasUser: false,
      }),
    ).toBe(false)
  })

  it('does not show before pet registration is complete', () => {
    expect(
      shouldShowFirstEntryTutorial({
        ...base,
        hasPet: false,
      }),
    ).toBe(false)
  })

  it('does not show outside home', () => {
    expect(
      shouldShowFirstEntryTutorial({
        ...base,
        pathname: '/week',
      }),
    ).toBe(false)
  })

  it('does not show after completion', () => {
    expect(
      shouldShowFirstEntryTutorial({
        ...base,
        completedAt: '2026-05-06T00:00:00.000Z',
      }),
    ).toBe(false)
  })

  it('does not show after dismissal', () => {
    expect(
      shouldShowFirstEntryTutorial({
        ...base,
        dismissedAt: '2026-05-06T00:00:00.000Z',
      }),
    ).toBe(false)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
bun test lib/tutorial/visibility.test.ts
```

Expected:

```text
error: Cannot find module '@/lib/tutorial/visibility'
```

- [ ] **Step 3: Write minimal implementation**

Create `lib/tutorial/visibility.ts`:

```ts
export type FirstEntryTutorialVisibilityInput = {
  hasUser: boolean
  hasPet: boolean
  pathname: string
  completedAt: string | null
  dismissedAt: string | null
}

export function shouldShowFirstEntryTutorial({
  hasUser,
  hasPet,
  pathname,
  completedAt,
  dismissedAt,
}: FirstEntryTutorialVisibilityInput): boolean {
  if (!hasUser) return false
  if (!hasPet) return false
  if (pathname !== '/') return false
  if (completedAt) return false
  if (dismissedAt) return false
  return true
}
```

- [ ] **Step 4: Run test to verify it passes**

Run:

```bash
bun test lib/tutorial/visibility.test.ts
```

Expected:

```text
pass
```

- [ ] **Step 5: Checkpoint**

Run:

```bash
git status --short
```

Expected: visibility helper and test files are listed. Do not commit unless the user explicitly approves.

---

### Task 3: Tutorial State Persistence

**Files:**
- Create: `supabase/migrations/20260506000001_user_tutorial_state.sql`
- Modify: `types/database.ts`

- [ ] **Step 1: Create migration**

Create `supabase/migrations/20260506000001_user_tutorial_state.sql`:

```sql
-- User-scoped tutorial state for versioned first-entry education.
-- Forward-only migration. Do not drop or rename existing columns.

CREATE TABLE IF NOT EXISTS public.user_tutorial_state (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tutorial_version text NOT NULL,
  completed_at timestamptz,
  dismissed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT user_tutorial_state_single_terminal_state
    CHECK (completed_at IS NULL OR dismissed_at IS NULL),
  CONSTRAINT user_tutorial_state_user_version_unique
    UNIQUE (user_id, tutorial_version)
);

DROP TRIGGER IF EXISTS user_tutorial_state_set_updated_at
  ON public.user_tutorial_state;

CREATE TRIGGER user_tutorial_state_set_updated_at
  BEFORE UPDATE ON public.user_tutorial_state
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.user_tutorial_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY user_tutorial_state_select_own
  ON public.user_tutorial_state
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY user_tutorial_state_insert_own
  ON public.user_tutorial_state
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY user_tutorial_state_update_own
  ON public.user_tutorial_state
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

- [ ] **Step 2: Update database types**

In `types/database.ts`, add:

```ts
export interface UserTutorialStateRow {
  id: string;
  user_id: string;
  tutorial_version: string;
  completed_at: string | null;
  dismissed_at: string | null;
  created_at: string;
  updated_at: string;
}

export type UserTutorialStateInsert = Omit<
  UserTutorialStateRow,
  'id' | 'created_at' | 'updated_at'
> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};

export type UserTutorialStateUpdate = Partial<UserTutorialStateInsert>;
```

Then add the table entry under `Database.public.Tables`:

```ts
user_tutorial_state: {
  Row: UserTutorialStateRow;
  Insert: UserTutorialStateInsert;
  Update: UserTutorialStateUpdate;
  Relationships: [];
};
```

- [ ] **Step 3: Verify migration naming and type references**

Run:

```bash
rg -n "user_tutorial_state|UserTutorialState" supabase/migrations/20260506000001_user_tutorial_state.sql types/database.ts
```

Expected: output includes matches from both `supabase/migrations/20260506000001_user_tutorial_state.sql` and `types/database.ts`.

- [ ] **Step 4: Checkpoint**

Run:

```bash
git status --short
```

Expected: migration and database type updates are listed. Do not commit unless the user explicitly approves.

---

### Task 4: Completion And Dismissal Server Actions

**Files:**
- Create: `app/tutorial/actions.ts`

- [ ] **Step 1: Create Server Actions**

Create `app/tutorial/actions.ts`:

```ts
'use server'

import { redirect } from 'next/navigation'

import { FIRST_ENTRY_TUTORIAL_VERSION } from '@/lib/tutorial/first-entry-tutorial'
import { createClient } from '@/lib/supabase/server'

export type TutorialActionResult = { error: string } | void

async function saveTutorialState(
  state: 'completed' | 'dismissed',
): Promise<{ error: string } | null> {
  const supabase = await createClient()
  if (!supabase) return { error: 'Supabase 설정이 필요해요.' }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: '로그인이 필요해요.' }

  const now = new Date().toISOString()
  const payload =
    state === 'completed'
      ? { completed_at: now, dismissed_at: null }
      : { completed_at: null, dismissed_at: now }

  const { error } = await supabase.from('user_tutorial_state').upsert(
    {
      user_id: user.id,
      tutorial_version: FIRST_ENTRY_TUTORIAL_VERSION,
      ...payload,
    },
    {
      onConflict: 'user_id,tutorial_version',
    },
  )

  if (error) {
    return { error: '튜토리얼 상태를 저장하지 못했어요. 다시 시도해주세요.' }
  }

  return null
}

export async function completeFirstEntryTutorial(): Promise<TutorialActionResult> {
  const result = await saveTutorialState('completed')
  if (result) return result
  redirect('/log')
}

export async function dismissFirstEntryTutorial(): Promise<TutorialActionResult> {
  return saveTutorialState('dismissed')
}
```

- [ ] **Step 2: Type-check the action file**

Run:

```bash
npx tsc --noEmit
```

Expected: no TypeScript errors related to `app/tutorial/actions.ts`.

- [ ] **Step 3: Checkpoint**

Run:

```bash
git status --short
```

Expected: action file is listed. Do not commit unless the user explicitly approves.

---

### Task 5: First-Entry Tutorial Sheet

**Files:**
- Create: `components/tutorial/first-entry-tutorial-sheet.tsx`

- [ ] **Step 1: Create client component**

Create `components/tutorial/first-entry-tutorial-sheet.tsx`:

```tsx
'use client'

import { useState, useTransition } from 'react'

import {
  completeFirstEntryTutorial,
  dismissFirstEntryTutorial,
} from '@/app/tutorial/actions'
import { Button } from '@/components/ui/button'
import { FIRST_ENTRY_TUTORIAL_STEPS } from '@/lib/tutorial/first-entry-tutorial'

export function FirstEntryTutorialSheet() {
  const [open, setOpen] = useState(true)
  const [stepIndex, setStepIndex] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  if (!open) return null

  const step = FIRST_ENTRY_TUTORIAL_STEPS[stepIndex]
  if (!step) return null

  const isLast = stepIndex === FIRST_ENTRY_TUTORIAL_STEPS.length - 1

  function goNext() {
    if (!isLast) {
      setStepIndex((current) => current + 1)
    }
  }

  function dismiss() {
    setError(null)
    startTransition(async () => {
      const result = await dismissFirstEntryTutorial()
      if (result?.error) {
        setError(result.error)
        return
      }
      setOpen(false)
    })
  }

  function complete() {
    setError(null)
    startTransition(async () => {
      const result = await completeFirstEntryTutorial()
      if (result?.error) setError(result.error)
    })
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="first-entry-tutorial-title"
      className="fixed inset-0 z-50 flex items-end justify-center bg-[var(--color-ink)]/20 px-3 pb-3"
    >
      <section
        className="w-full max-w-md rounded-t-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-bg)] px-4 pb-5 pt-4 shadow-[var(--shadow-polaroid)]"
        onClick={!isLast ? goNext : undefined}
      >
        <div className="mx-auto mb-4 h-1 w-10 rounded-[var(--radius-pill)] bg-[var(--color-line)]" />

        <div className="mb-4 flex items-center justify-between gap-4">
          <p className="text-[12px] font-medium text-[var(--color-mute)]">
            {stepIndex + 1} / {FIRST_ENTRY_TUTORIAL_STEPS.length}
          </p>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation()
              dismiss()
            }}
            disabled={isPending}
            aria-label="튜토리얼 닫기"
            className="rounded-[var(--radius-button)] px-2 py-1 text-[13px] font-medium text-[var(--color-mute)] transition-colors hover:text-[var(--color-ink)]"
          >
            닫기
          </button>
        </div>

        <div className="flex flex-col gap-2">
          <h2
            id="first-entry-tutorial-title"
            className="text-[20px] font-semibold text-[var(--color-ink)]"
          >
            {step.title}
          </h2>
          <p className="text-[14px] leading-[1.65] text-[var(--color-ink-soft)]">
            {step.body}
          </p>
        </div>

        {error ? (
          <p role="alert" className="mt-3 text-[13px] text-[var(--color-error)]">
            {error}
          </p>
        ) : null}

        <div className="mt-5 flex gap-2">
          {isLast && step.secondaryCta ? (
            <Button
              type="button"
              variant="outline"
              className="min-h-11 flex-1"
              onClick={(event) => {
                event.stopPropagation()
                dismiss()
              }}
              disabled={isPending}
            >
              {step.secondaryCta.label}
            </Button>
          ) : null}
          <Button
            type="button"
            className="min-h-11 flex-1"
            onClick={(event) => {
              event.stopPropagation()
              if (isLast) {
                complete()
                return
              }
              goNext()
            }}
            disabled={isPending}
          >
            {step.primaryCta.label}
          </Button>
        </div>
      </section>
    </div>
  )
}
```

- [ ] **Step 2: Verify component imports**

Run:

```bash
npx tsc --noEmit
```

Expected: no TypeScript errors related to tutorial component imports.

- [ ] **Step 3: Checkpoint**

Run:

```bash
git status --short
```

Expected: tutorial sheet component is listed. Do not commit unless the user explicitly approves.

---

### Task 6: Home Integration

**Files:**
- Modify: `components/home/calendar-home.tsx`
- Modify: `app/page.tsx`

- [ ] **Step 1: Render tutorial from CalendarHome**

In `components/home/calendar-home.tsx`, add:

```ts
import { FirstEntryTutorialSheet } from '@/components/tutorial/first-entry-tutorial-sheet'
```

Update props:

```ts
export function CalendarHome({
  pet,
  diaries,
  showFirstEntryTutorial = false,
}: {
  pet: CalendarPet
  diaries: CalendarDiary[]
  showFirstEntryTutorial?: boolean
}) {
```

In both render branches, include:

```tsx
{showFirstEntryTutorial ? <FirstEntryTutorialSheet /> : null}
```

For the empty state branch, return a fragment so the sheet can render alongside the empty state:

```tsx
return (
  <>
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col gap-8 px-4 py-12">
      <EmptyState
        illustration="resting"
        tone="warm"
        title={`${pet.name}의 첫 페이지를 채워볼까?`}
        hint="사진 한 장이면 buddy가 오늘을 직접 적어줘."
        cta={{ label: '첫 기록 남기기', href: '/log' }}
      />
    </main>
    {showFirstEntryTutorial ? <FirstEntryTutorialSheet /> : null}
  </>
)
```

- [ ] **Step 2: Query tutorial state on home**

In `app/page.tsx`, add imports:

```ts
import { FIRST_ENTRY_TUTORIAL_VERSION } from '@/lib/tutorial/first-entry-tutorial'
import { shouldShowFirstEntryTutorial } from '@/lib/tutorial/visibility'
```

After pet query succeeds, add:

```ts
const { data: tutorialState } = await supabase
  .from('user_tutorial_state')
  .select('completed_at, dismissed_at')
  .eq('user_id', user.id)
  .eq('tutorial_version', FIRST_ENTRY_TUTORIAL_VERSION)
  .maybeSingle()
```

Before rendering `CalendarHome`, compute:

```ts
const showFirstEntryTutorial = shouldShowFirstEntryTutorial({
  hasUser: true,
  hasPet: true,
  pathname: '/',
  completedAt: tutorialState?.completed_at ?? null,
  dismissedAt: tutorialState?.dismissed_at ?? null,
})
```

Update render:

```tsx
return (
  <CalendarHome
    pet={calendarPet}
    diaries={diaries}
    showFirstEntryTutorial={showFirstEntryTutorial}
  />
)
```

- [ ] **Step 3: Run focused tests**

Run:

```bash
bun test lib/tutorial/first-entry-tutorial.test.ts lib/tutorial/visibility.test.ts
```

Expected:

```text
pass
```

- [ ] **Step 4: Run type check**

Run:

```bash
npx tsc --noEmit
```

Expected: no TypeScript errors.

- [ ] **Step 5: Checkpoint**

Run:

```bash
git status --short
```

Expected: home integration files are listed. Do not commit unless the user explicitly approves.

---

### Task 7: Verification And Manual QA

**Files:**
- Read/verify only unless failures require fixes.

- [ ] **Step 1: Run lint**

Run:

```bash
bun run lint
```

Expected: lint passes.

- [ ] **Step 2: Run build**

Run:

```bash
bun run build
```

Expected: production build passes.

- [ ] **Step 3: Manual QA with local dev server**

Run:

```bash
bun run dev
```

Expected: local server starts on `http://localhost:4000`.

Manual checks:

- New logged-in user with pet and no `user_tutorial_state`: home shows 3-step tutorial.
- Step 1 title mentions calendar view.
- Tapping Step 1 body or `다음` moves to Step 2.
- Step 2 title/body explains the left bottom tab as `/week` 주간 뷰.
- Tapping Step 2 body or `다음` moves to Step 3.
- Step 3 `첫 일기 쓰기` saves completed state and redirects to `/log`.
- Closing at any step saves dismissed state and keeps user on home.
- Refresh after completed or dismissed does not auto-open tutorial.
- Existing user with `completed_at` does not see tutorial.
- Existing user with `dismissed_at` does not see tutorial.

- [ ] **Step 4: Final checkpoint**

Run:

```bash
git status --short
```

Expected: only intended tutorial files, migration, and type updates are changed.

## Self-Review

- Spec coverage: Tasks cover content, visibility, DB persistence, Server Actions, UI sheet, home integration, and verification.
- Trigger/suppression: Task 2 and Task 6 implement first authenticated home entry after pet registration, with completed/dismissed suppression.
- Step content: Task 1 locks calendar, `/week` left tab, and AI diary creation.
- DB rules: Task 3 uses `user_id`, forward-only migration, RLS, and no drop/rename.
- UI rules: Task 5 uses token-based Tailwind classes and avoids emoji/gradient/pastel copy.
- Commit policy: Plan uses checkpoints only; actual commit requires user approval.
