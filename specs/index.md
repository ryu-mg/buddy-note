# Specs Index

## Purpose

이 문서는 `specs/` 하위 제품 스펙의 우선순위와 개발 순서를 정의한다. 순서는 사용자 가치, 기술 의존성, 결제 전환 흐름을 함께 고려한다.

## Current Specs

| Spec | 상태 | 설명 |
|---|---|---|
| `specs/tutorial/spec.md` | 구현됨 | 회원가입 후 강아지 등록을 마친 사용자의 최초 1회 진입 튜토리얼 |
| `specs/payments/spec.md` | 스펙 작성됨 | 유료 멤버십, 무료 체험, 정기 결제, entitlement |
| `specs/themes/spec.md` | 스펙 작성됨 | 유료 사용자용 pet 단위 테마 preset |
| `specs/family/spec.md` | 스펙 작성됨 | pet 단위 가족 초대, 권한, 가족 알림 |

## Development Order

### 0. Tutorial

Files:

- `specs/tutorial/spec.md`
- `specs/tutorial/plan.md`

Reason:

- 이미 기본 구현이 끝난 신규 사용자 activation 기능이다.
- 결제/테마/가족 기능보다 앞서 첫 일기 작성률을 높이는 foundation이다.

### 1. Payments And Entitlements

Files:

- `specs/payments/spec.md`
- `specs/payments/tasks.md`

Reason:

- 테마와 가족 기능은 모두 유료 entitlement를 소비한다.
- 서버 기준 entitlement 없이 프리미엄 UI를 먼저 만들면 클라이언트 잠금만 남아 보안 경계가 약해진다.
- 무료 체험은 첫 premium feature preview와 연결되므로 payments 모델에서 먼저 잠가야 한다.

Required before moving on:

- membership state table
- trial start policy
- entitlement resolver
- premium lock surface

### 2. Themes

Files:

- `specs/themes/spec.md`
- `specs/themes/tasks.md`

Reason:

- 테마는 가장 작은 프리미엄 소비처다.
- 가족 기능보다 데이터/RLS blast radius가 작다.
- 무료 체험 중 사용자가 즉시 가치를 볼 수 있어 payments 검증 surface로 적합하다.

Required before moving on:

- `premium_theme` entitlement check
- pet theme settings RLS
- `/pet/theme` preview/save
- public profile revalidation

### 3. Family

Files:

- `specs/family/spec.md`
- `specs/family/tasks.md`

Reason:

- 가족 기능은 `pets.user_id` 단일 owner 모델을 확장하고, RLS와 알림 queue가 함께 바뀌는 큰 작업이다.
- `family_invite` entitlement가 먼저 있어야 무료/유료 경계가 명확하다.
- push notification은 diary 생성 flow 이후의 비동기 side effect라 마지막에 붙이는 편이 안전하다.

Required before implementation:

- `family_invite` entitlement
- family RLS 설계
- invite token hash flow
- notification queue와 rate limit 정책

## Dependency Graph

```text
tutorial
  └─ payments / entitlement
       ├─ themes
       │    └─ themed public profile / themed share image
       └─ family
            └─ family notifications
```

## Priority Rationale

1. **Activation first:** 튜토리얼은 신규 사용자가 첫 일기 작성까지 가는 길을 줄인다.
2. **Server trust before premium UI:** 결제와 entitlement가 먼저 있어야 유료 기능 잠금이 제품/보안 양쪽에서 일관된다.
3. **Small premium proof before large collaboration:** 테마는 작고 시각적이어서 무료 체험과 멤버십 전환 검증에 좋다.
4. **Collaboration last:** 패밀리는 권한, 초대, 알림, privacy가 모두 얽혀 있어 가장 늦게 구현한다.

## Backlog Migration Notes

`IDEA.md`의 네 항목은 아래처럼 이관되었다.

| IDEA 항목 | 이관 위치 |
|---|---|
| 유료 사용자 멤버십 | `specs/payments/spec.md`, `specs/payments/tasks.md` |
| 무료 체험판 | `specs/payments/spec.md`, `specs/payments/tasks.md` |
| 패밀리 기능 | `specs/family/spec.md`, `specs/family/tasks.md` |
| 테마 수정 | `specs/themes/spec.md`, `specs/themes/tasks.md` |
