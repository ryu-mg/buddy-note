# Themes Tasks

## Scope

이 작업은 `specs/themes/spec.md`의 프리미엄 테마 preset 기능을 구현 가능한 단위로 나눈다. 첫 프리미엄 소비처로 사용할 수 있게 payments entitlement와 연결한다.

## Dependencies

- `premium_theme` entitlement resolver가 있어야 한다.
- public profile `/b/[slug]` revalidation 경로가 있어야 한다.
- 공유 이미지 렌더러가 theme input을 받을 수 있어야 한다.

## Task 1: Theme Preset Registry

Goal: 허용된 테마 preset을 코드에서 한 곳으로 관리한다.

Files:

- Create: `lib/themes/presets.ts`
- Create: `lib/themes/presets.test.ts`

Steps:

- [ ] `ThemePresetKey` union을 정의한다.
- [ ] `THEME_PRESETS`에 5개 preset을 정의한다.
  - `classic_terracotta`
  - `field_green`
  - `morning_gold`
  - `quiet_umber`
  - `mist_blue`
- [ ] 각 preset은 `accent`, `accentSoft`, `paper`, `moodHint` semantic token을 가진다.
- [ ] purple/violet 금지 테스트를 추가한다.
- [ ] 알 수 없는 key를 기본 `classic_terracotta`로 되돌리는 helper를 만든다.

Validation:

- [ ] `bun test lib/themes/presets.test.ts`
- [ ] `npx tsc --noEmit`

## Task 2: Theme Settings Schema

Goal: pet 단위 theme key를 저장한다.

Files:

- Create: `supabase/migrations/<timestamp>_pet_theme_settings.sql`
- Modify: `types/database.ts`
- Create: `tests/rls/pet_theme_settings.sql`

Steps:

- [ ] `pet_theme_settings` 테이블을 만든다.
- [ ] `pet_id` unique constraint를 추가한다.
- [ ] `theme_key` text check를 preset key로 제한한다.
- [ ] owner만 select/insert/update 가능하게 RLS를 작성한다.
- [ ] family admin 지원 시 admin update 권한은 family RLS 이후 별도 migration으로 추가한다.
- [ ] RLS 테스트에서 owner와 non-owner 접근을 검증한다.

Validation:

- [ ] `npx tsc --noEmit`
- [ ] local Supabase 가능 시 `tests/rls/pet_theme_settings.sql` 실행

## Task 3: Theme Save Action

Goal: entitlement가 있는 사용자만 pet theme을 저장할 수 있게 한다.

Files:

- Create: `app/pet/theme/actions.ts`
- Create: `lib/themes/validation.ts`
- Create: `lib/themes/validation.test.ts`

Steps:

- [ ] zod 또는 explicit validator로 `theme_key`를 검증한다.
- [ ] Server Action에서 로그인과 pet ownership을 확인한다.
- [ ] `premium_theme` entitlement를 확인한다.
- [ ] entitlement가 없으면 `{ error }`를 반환한다.
- [ ] 저장 성공 후 `/pet/theme`, `/`, `/b/[slug]`를 revalidate한다.

Validation:

- [ ] `bun test lib/themes/validation.test.ts`
- [ ] `npx tsc --noEmit`
- [ ] `bun run lint`

## Task 4: Theme Picker UI

Goal: 사용자가 preset을 미리 보고 저장할 수 있게 한다.

Files:

- Create: `app/pet/theme/page.tsx`
- Create: `components/themes/theme-picker.tsx`
- Create: `components/themes/theme-swatch.tsx`

Steps:

- [ ] `/pet/theme`에서 현재 pet과 저장된 theme을 조회한다.
- [ ] preset swatch grid를 보여준다.
- [ ] 선택한 preset은 preview로 즉시 반영한다.
- [ ] 무료 사용자가 저장하려 하면 premium lock을 보여준다.
- [ ] 저장 버튼은 테라코타 CTA token을 유지한다.

Validation:

- [ ] `npx tsc --noEmit`
- [ ] `bun run lint`
- [ ] mobile/desktop manual UI 확인

## Task 5: Public Profile Theme Application

Goal: `/b/[slug]` 공개 프로필에 저장된 theme preset을 반영한다.

Files:

- Modify: `app/b/[slug]/page.tsx`
- Create: `components/themes/theme-scope.tsx`

Steps:

- [ ] public profile query에 `pet_theme_settings(theme_key)`를 포함한다.
- [ ] 알 수 없는 theme은 기본 preset으로 fallback한다.
- [ ] theme scope 컴포넌트가 semantic CSS variable을 제한된 subtree에 적용한다.
- [ ] 테마 변경 후 revalidate된 public profile에서 반영되는지 확인한다.

Validation:

- [ ] `npx tsc --noEmit`
- [ ] `bun run build`

## Task 6: Share Image Theme Input

Goal: 새로 생성되는 공유 이미지에 theme preset을 반영한다.

Files:

- Modify: share image renderer files
- Modify: diary image generation call site
- Create: renderer unit/snapshot test if existing pattern exists

Steps:

- [ ] diary image generation 시 pet theme key를 함께 조회한다.
- [ ] renderer input에 `themeKey`를 추가한다.
- [ ] renderer는 preset registry를 통해 색상을 가져온다.
- [ ] 기존 생성 이미지 URL은 변경하지 않는다.
- [ ] 기본 테마와 premium theme 각각의 렌더 결과를 확인한다.

Validation:

- [ ] renderer test
- [ ] `npx tsc --noEmit`
- [ ] `bun run build`
