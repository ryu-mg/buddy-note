# Family Tasks

## Scope

이 작업은 `specs/family/spec.md`의 패밀리 초대, 권한, 가족 알림을 구현 가능한 단위로 나눈다. 결제 상태 판정은 `specs/payments/tasks.md`의 entitlement resolver를 사용한다.

## Dependencies

- `family_invite` entitlement가 정의되어 있어야 한다.
- diary 생성 flow가 안정적으로 동작해야 한다.
- push notification은 PWA install과 별개로 브라우저 권한을 요청할 수 있어야 한다.

## Task 1: Family Schema And RLS

Goal: pet owner와 가족 멤버를 분리해 권한을 저장하고 검증한다.

Files:

- Create: `supabase/migrations/<timestamp>_family.sql`
- Modify: `types/database.ts`
- Create: `tests/rls/family.sql`

Steps:

- [ ] `family_members` 테이블을 만든다.
- [ ] `family_invites` 테이블을 만든다.
- [ ] role check를 `admin`, `editor`, `viewer`로 제한한다.
- [ ] `family_members(pet_id, user_id)` unique constraint를 추가한다.
- [ ] owner/member/non-member 읽기 정책을 작성한다.
- [ ] editor 이상 작성 권한을 검증할 helper SQL 또는 RLS 조건을 정의한다.
- [ ] RLS 테스트에서 owner, viewer, non-member 접근을 검증한다.

Validation:

- [ ] `npx tsc --noEmit`
- [ ] local Supabase 가능 시 `tests/rls/family.sql` 실행

## Task 2: Invite Token Flow

Goal: owner/admin이 안전한 초대 링크를 만들고, 로그인 사용자가 수락할 수 있게 한다.

Files:

- Create: `lib/family/invite-token.ts`
- Create: `lib/family/invite-token.test.ts`
- Create: `app/pet/family/actions.ts`
- Create: `app/family/invite/[token]/page.tsx`

Steps:

- [ ] token 원문 생성과 SHA-256 hash helper를 만든다.
- [ ] token 원문은 URL에만 포함하고 DB에는 hash만 저장한다.
- [ ] 초대 생성 Server Action을 만든다.
  - 로그인 확인
  - pet owner/admin 권한 확인
  - `family_invite` entitlement 확인
  - 만료 시각 저장
- [ ] 초대 수락 Server Action을 만든다.
  - 로그인 확인
  - token hash 조회
  - 만료/취소/이미 수락 상태 확인
  - `family_members` upsert
- [ ] token helper 단위 테스트를 작성한다.

Validation:

- [ ] `bun test lib/family/invite-token.test.ts`
- [ ] `npx tsc --noEmit`
- [ ] `bun run lint`

## Task 3: Family Management UI

Goal: owner가 가족 구성원을 보고 초대/권한변경/제거를 할 수 있게 한다.

Files:

- Create: `app/pet/family/page.tsx`
- Create: `components/family/family-member-list.tsx`
- Create: `components/family/family-invite-panel.tsx`

Steps:

- [ ] `/pet/family`에서 현재 pet의 가족 멤버를 조회한다.
- [ ] 멤버 role을 보기 전용, 작성 가능, 관리자로 표시한다.
- [ ] owner/admin만 초대 panel을 볼 수 있게 한다.
- [ ] 멤버십 entitlement가 없으면 premium lock을 보여준다.
- [ ] 제거 액션은 확인 dialog를 거친다.

Validation:

- [ ] `npx tsc --noEmit`
- [ ] `bun run lint`
- [ ] `bun run build`

## Task 4: Family Diary Access

Goal: 가족 멤버가 권한에 맞게 pet diary를 열람하거나 작성할 수 있게 한다.

Files:

- Modify: `app/page.tsx`
- Modify: `app/week/page.tsx`
- Modify: `app/log/page.tsx`
- Modify: diary/log Server Actions

Steps:

- [ ] 현재 user가 owner인지 family member인지 판정하는 server helper를 만든다.
- [ ] viewer 이상은 diary read surface에 접근할 수 있게 한다.
- [ ] editor 이상은 log 생성 surface에 접근할 수 있게 한다.
- [ ] non-member는 기존처럼 접근 불가 또는 onboarding/home redirect를 유지한다.
- [ ] 권한 없는 작성 시 사과 + 회복 액션 error를 반환한다.

Validation:

- [ ] `npx tsc --noEmit`
- [ ] `bun run lint`
- [ ] 가족 viewer/editor 권한별 manual QA

## Task 5: Push Token And Notification Queue

Goal: 새 일기 작성 후 가족에게 비동기 알림을 보낸다.

Files:

- Create: `supabase/migrations/<timestamp>_family_notifications.sql`
- Create: `app/notifications/actions.ts`
- Create: `app/api/notifications/process/route.ts`
- Create: `lib/notifications/rate-limit.ts`
- Create: `lib/notifications/rate-limit.test.ts`

Steps:

- [ ] `push_tokens`와 `notification_queue` 테이블을 만든다.
- [ ] push token은 본인만 등록/해제 가능하게 RLS를 설정한다.
- [ ] diary 생성 성공 후 가족 멤버 notification queue row를 만든다.
- [ ] 작성자 본인은 queue 대상에서 제외한다.
- [ ] pet/user 기준 10분 rate limit helper를 만든다.
- [ ] processing route는 service secret을 확인한 뒤 pending row를 처리한다.
- [ ] 알림 실패는 attempts와 last_error에 남긴다.

Validation:

- [ ] `bun test lib/notifications/rate-limit.test.ts`
- [ ] `npx tsc --noEmit`
- [ ] local Supabase 가능 시 notification RLS 테스트 실행

## Task 6: Family QA Checklist

Goal: 출시 전 권한 누수와 알림 실패 경로를 확인한다.

Files:

- Create: `specs/family/qa.md`

Steps:

- [ ] owner가 viewer를 초대하고 수락하는 happy path를 확인한다.
- [ ] non-member가 invite 없이 diary를 읽을 수 없는지 확인한다.
- [ ] viewer가 작성 화면에 접근할 수 없는지 확인한다.
- [ ] editor가 일기를 작성할 수 있는지 확인한다.
- [ ] owner가 멤버 제거 후 접근이 즉시 막히는지 확인한다.
- [ ] 알림 실패가 diary 생성 성공을 되돌리지 않는지 확인한다.
