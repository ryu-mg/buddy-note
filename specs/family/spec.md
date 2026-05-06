# Family Spec

## Summary

패밀리 기능은 하나의 반려동물 기록을 여러 보호자가 함께 보는 비공개 공유 경험이다. v1 패밀리의 중심은 “오늘 일기가 작성되면 초대된 가족에게 알림이 가고, 가족 전용 피드에서 같은 기록을 볼 수 있는 것”이다.

공개 프로필(`/b/[slug]`)은 익명 방문자에게 보여주는 바이럴 surface이고, 패밀리는 초대와 권한을 가진 사람만 접근하는 private surface다. 두 기능은 공유라는 단어를 같이 쓰지만, 보안 모델과 UX 목적이 다르다.

## Background

현재 `pets.user_id`는 단일 owner를 의미한다. 패밀리 기능을 추가하려면 owner 구조를 깨지 않으면서, pet 단위로 여러 사용자가 접근할 수 있는 membership layer를 추가해야 한다.

buddy-note의 핵심은 “강아지의 하루가 기록되고 기억되는 것”이다. 가족 기능은 작성자 한 명의 기록을 가족이 같이 따라가게 만들어 기록 지속성을 높이고, 새 일기 작성 순간에 재방문을 만든다.

## Goals

- pet owner가 가족을 초대할 수 있다.
- 초대받은 사용자는 초대를 수락한 뒤 가족 멤버가 된다.
- 가족 멤버는 권한에 따라 pet, diary, family feed를 볼 수 있다.
- 새 일기 작성 시 가족 멤버에게 push notification을 보낼 수 있다.
- owner는 가족 멤버의 권한을 변경하거나 제거할 수 있다.
- 가족 공유는 공개 프로필 설정과 독립적으로 동작한다.

## Non-Goals

- v1에서 여러 owner가 결제 책임을 나눠 갖는 seat billing은 구현하지 않는다.
- v1에서 가족 간 댓글, 채팅, reaction은 구현하지 않는다.
- v1에서 초대받지 않은 연락처 자동 추천은 구현하지 않는다.
- 공개 프로필의 anon 접근 범위를 넓히지 않는다.
- 알림이 실패했다고 일기 작성 자체를 실패시키지 않는다.

## Roles And Permissions

패밀리 권한은 pet 단위다.

| Role | 설명 | 가능 동작 |
|---|---|---|
| `owner` | 기존 `pets.user_id` 소유자 | 모든 관리, 작성, 열람, 초대 |
| `admin` | owner가 지정한 가족 관리자 | 가족 초대/제거, 작성, 열람 |
| `editor` | 함께 기록하는 가족 | 일기 작성, 열람 |
| `viewer` | 보기 전용 가족 | 가족 피드와 일기 열람 |

`owner`는 `family_members`에 중복 저장하지 않아도 되지만, 권한 계산에서는 항상 최고 권한으로 취급한다.

## Invitation Flow

1. owner 또는 admin이 초대 링크를 생성한다.
2. 초대 링크는 pet, role, 만료 시각, token hash를 가진다.
3. 초대받은 사용자는 로그인 후 초대를 확인한다.
4. 수락하면 `family_members` row가 생성된다.
5. 이미 멤버인 사용자가 같은 pet 초대를 수락하면 기존 role을 정책에 따라 유지하거나 상향한다.

초대 링크는 원문 token을 DB에 저장하지 않는다. DB에는 hash만 저장하고, URL에는 원문 token을 담는다.

## Notification Flow

새 일기 생성 후 가족 멤버에게 push notification을 보낸다.

원칙:

- 알림은 diary 생성 성공 후 비동기로 보낸다.
- 작성자 본인에게는 기본적으로 보내지 않는다.
- 멤버별 알림 opt-out을 지원한다.
- 알림 실패는 retry queue에 남기되 diary 생성 결과를 되돌리지 않는다.
- 알림 빈도 제한을 둔다. 기본값은 pet/user 기준 10분 내 1회다.

## Data Requirements

필수 테이블:

- `family_members`
  - `id`
  - `pet_id`
  - `user_id`
  - `role`
  - `notification_enabled`
  - `created_at`
  - `updated_at`
- `family_invites`
  - `id`
  - `pet_id`
  - `inviter_user_id`
  - `role`
  - `token_hash`
  - `expires_at`
  - `accepted_at`
  - `revoked_at`
  - `created_at`
- `push_tokens`
  - `id`
  - `user_id`
  - `endpoint`
  - `p256dh`
  - `auth`
  - `user_agent`
  - `created_at`
  - `revoked_at`
- `notification_queue`
  - `id`
  - `user_id`
  - `pet_id`
  - `diary_id`
  - `kind`
  - `status`
  - `attempts`
  - `last_error`
  - `locked_until`
  - `created_at`

DB 컬럼은 기존 컨벤션대로 `user_id`를 사용한다. migration은 forward-only로 작성한다.

## RLS Requirements

- owner는 자신의 pet family row를 볼 수 있다.
- family member는 자신이 속한 pet의 family member 목록 중 필요한 최소 정보만 볼 수 있다.
- viewer 이상은 해당 pet의 diary를 볼 수 있다.
- editor 이상은 해당 pet에 log/diary 생성을 요청할 수 있다.
- family invite 생성/취소는 owner/admin만 가능하다.
- push token은 본인만 select/insert/update 가능하다.
- notification queue는 service role만 처리한다.

RLS 변경 시 `tests/rls/family.sql`을 추가한다.

## UI Surfaces

- `/pet/family`: 가족 멤버 목록, 초대 생성, 권한 변경, 제거
- `/family/invite/[token]`: 초대 확인과 수락
- `/week`: 가족이 볼 때도 최근 기록을 모아보는 기본 surface
- 알림 권한 요청 UI: 첫 가족 초대 수락 후 또는 가족 설정 화면

UI tone:

- 가족 초대는 “공유 URL 공개”와 다르다는 점을 명확히 말한다.
- 권한명은 짧게 유지한다. 보기 전용, 작성 가능, 관리자.
- 알림 실패나 권한 거부는 사과 + 회복 액션을 제공한다.

## Entitlement

패밀리 기능은 멤버십 entitlement `family_invite`가 필요하다.

- 무료 사용자는 가족 기능 preview와 잠금 안내만 볼 수 있다.
- 이미 생성된 가족 멤버십은 멤버십 종료 후에도 owner가 관리/삭제할 수 있어야 한다.
- 멤버십 종료 후 새 초대 생성과 알림 발송은 잠근다.
- viewer가 무료 사용자인지는 접근 판단 기준이 아니다. 결제 책임은 pet owner의 entitlement를 기준으로 한다.

## Success Metrics

- 가족 초대 생성률
- 초대 수락률
- 가족 멤버가 있는 pet의 30일 기록 유지율
- 새 일기 알림 open rate
- 알림 opt-out 비율
- 가족 멤버의 `/week` 재방문율

## Launch Readiness Criteria

- family RLS가 owner/member/non-member 경계를 통과한다.
- 초대 token 원문이 DB에 저장되지 않는다.
- 멤버십 종료 상태에서 새 초대와 알림 발송이 잠긴다.
- 알림 실패가 diary 생성 실패로 이어지지 않는다.
- owner가 가족 멤버를 제거하면 해당 사용자의 private 접근이 즉시 막힌다.
