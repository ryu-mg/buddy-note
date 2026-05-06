# Payments Tasks

## Scope

이 작업은 `specs/payments/spec.md`의 유료 멤버십과 무료 체험판을 구현 가능한 단위로 나눈다. 유료 기능의 실제 소비처인 테마, 가족 기능, 하이라이트, 공유 이미지 템플릿은 각 feature spec에서 entitlement key만 받아 사용한다.

## Dependencies

- Supabase schema와 RLS가 안정적으로 적용되어 있어야 한다.
- `pets.user_id` 기반 소유권 모델을 그대로 유지한다.
- 프리미엄으로 잠글 첫 소비처는 `specs/themes/spec.md`의 테마 preset으로 둔다.
- 패밀리 기능은 결제 entitlement 모델 이후에 붙인다.

## Task 1: Membership State Model

Goal: 사용자별 현재 멤버십과 무료 체험 상태를 서버가 판정할 수 있게 한다.

Files:

- Create: `supabase/migrations/<timestamp>_membership_state.sql`
- Modify: `types/database.ts`
- Create: `tests/rls/membership_state.sql`

Steps:

- [ ] `memberships` 테이블을 만든다.
  - 필드: `id`, `user_id`, `status`, `plan_key`, `trial_started_at`, `trial_ends_at`, `current_period_starts_at`, `current_period_ends_at`, `cancel_at_period_end`, `grace_ends_at`, `created_at`, `updated_at`
  - `user_id`는 `auth.users(id)`를 참조한다.
  - 같은 user의 active-like row는 v1에서 1개만 유지한다.
- [ ] 상태 enum은 text check로 시작한다.
  - `free`, `trialing`, `active`, `past_due`, `canceling`, `ended`, `refunded`
- [ ] RLS를 켠다.
  - 사용자는 본인 row만 select 가능하다.
  - insert/update는 service role 또는 서버 전용 작업에서만 수행한다.
- [ ] `types/database.ts`에 row/insert/update 타입을 추가한다.
- [ ] RLS 테스트 SQL을 추가한다.
  - 본인 row read 가능
  - 타인 row read 불가
  - authenticated user 직접 insert/update 불가

Validation:

- [ ] `npx tsc --noEmit`
- [ ] `bun run lint`
- [ ] local Supabase 가능 시 `tests/rls/membership_state.sql` 실행

## Task 2: Trial Start Policy

Goal: 첫 pet 생성 완료 후 카드 없는 7일 무료 체험을 user당 1회만 시작한다.

Files:

- Create: `lib/billing/trial.ts`
- Create: `lib/billing/trial.test.ts`
- Modify: `app/onboarding/actions.ts`

Steps:

- [ ] `TRIAL_DAYS = 7` 상수를 정의한다.
- [ ] `buildTrialWindow(now)` pure helper를 만든다.
  - 시작: 입력 시각
  - 종료: 시작 + 7일
- [ ] `shouldStartTrial({ hasUsedTrial, hasPetJustCreated })` helper를 만든다.
- [ ] onboarding pet 저장 성공 후 trial row를 upsert한다.
  - 이미 trial을 사용한 user는 새로 만들지 않는다.
  - 실패해도 pet 생성은 되돌리지 않고 안내 가능한 error를 반환한다.
- [ ] pure helper 테스트를 먼저 작성한다.

Validation:

- [ ] `bun test lib/billing/trial.test.ts`
- [ ] `npx tsc --noEmit`
- [ ] `bun run lint`

## Task 3: Entitlement Resolver

Goal: UI와 Server Action이 같은 서버 기준으로 프리미엄 기능 접근을 판단한다.

Files:

- Create: `lib/billing/entitlements.ts`
- Create: `lib/billing/entitlements.test.ts`

Steps:

- [ ] entitlement key를 정의한다.
  - `premium_theme`
  - `family_invite`
  - `monthly_highlight`
  - `premium_share_template`
  - `extended_memory`
- [ ] `resolveEntitlements(membership, now)` pure helper를 만든다.
  - `trialing`, `active`, `canceling`은 프리미엄 허용
  - `past_due`는 `grace_ends_at` 전까지만 허용
  - `free`, `ended`, `refunded`는 기본 기능만 허용
- [ ] 결제 상태가 불명확하면 새 프리미엄 권한을 열지 않는다.
- [ ] 각 상태별 테스트를 작성한다.

Validation:

- [ ] `bun test lib/billing/entitlements.test.ts`
- [ ] `npx tsc --noEmit`

## Task 4: Billing Surfaces

Goal: 사용자가 현재 멤버십 상태와 다음 행동을 이해할 수 있게 한다.

Files:

- Create: `app/membership/page.tsx`
- Create: `components/billing/membership-status.tsx`
- Create: `components/billing/premium-lock.tsx`

Steps:

- [ ] `/membership`에서 현재 상태, 체험 종료일, 다음 결제일, 해지 예약 여부를 보여준다.
- [ ] premium lock 컴포넌트는 기능명, 잠긴 이유, 체험/구독 CTA를 받는다.
- [ ] 종료된 프리미엄 기능은 기존 데이터 삭제 없이 생성/수정만 막는 copy를 사용한다.
- [ ] UI 문구는 한국어, 짧은 설명, 테라코타 CTA 토큰을 사용한다.

Validation:

- [ ] `npx tsc --noEmit`
- [ ] `bun run lint`
- [ ] `bun run build`

## Task 5: Payment Provider Integration

Goal: Toss Payments 자동결제 기반 구독을 시작할 수 있게 한다.

Files:

- Create: `app/membership/actions.ts`
- Create: `app/api/payments/toss/webhook/route.ts`
- Create: `lib/billing/toss.ts`
- Create: `lib/billing/webhook-events.ts`

Steps:

- [ ] 결제 시작 Server Action을 만든다.
  - 로그인 확인
  - 현재 entitlement 확인
  - 결제창 시작에 필요한 payload 생성
- [ ] webhook 원본 이벤트 저장 테이블을 추가한다.
- [ ] webhook idempotency key를 기준으로 중복 처리를 막는다.
- [ ] 성공, 실패, 해지, 환불 이벤트를 membership state로 수렴시킨다.
- [ ] provider secret은 서버 전용 env에서만 읽는다.

Validation:

- [ ] Toss sandbox webhook fixture 단위 테스트
- [ ] `npx tsc --noEmit`
- [ ] `bun run lint`

## Task 6: Operations Runbook

Goal: 결제 문의 대응에 필요한 최소 운영 절차를 문서화한다.

Files:

- Create: `docs/runbooks/payments.md`

Steps:

- [ ] 사용자 현재 상태 확인 SQL을 작성한다.
- [ ] webhook 처리 실패 확인 SQL을 작성한다.
- [ ] 결제 실패 grace period 확인 절차를 작성한다.
- [ ] 환불/수동 조정 시 기록해야 할 필드를 명시한다.

Validation:

- [ ] runbook에 실제 테이블명과 컬럼명이 migration과 일치하는지 확인한다.
