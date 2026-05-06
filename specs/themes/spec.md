# Themes Spec

## Summary

테마 수정은 유료 멤버십 사용자에게 pet 앨범의 분위기를 고를 수 있게 하는 프리미엄 기능이다. v1은 자유 색상 편집기가 아니라 브랜드 guardrail 안에서 선택 가능한 preset 방식으로 시작한다.

기본 테라코타 폴라로이드 스타일은 buddy-note의 기준 테마다. 프리미엄 테마는 이 기준을 버리는 기능이 아니라, 강아지의 성격과 계절감에 맞는 앨범 표정을 선택하는 기능이다.

## Background

DESIGN.md는 테라코타 accent, 폴라로이드, warm neutral, purple/violet 금지를 locked decision으로 둔다. 테마 기능은 이 규칙과 충돌하면 안 된다.

유료 전환 관점에서 테마는 사용자가 즉시 눈으로 확인할 수 있는 보상이다. 결제/무료 체험의 첫 프리미엄 소비처로 적합하며, 공개 프로필과 공유 이미지에서 가치가 잘 드러난다.

## Goals

- 유료 사용자가 pet 단위로 테마 preset을 선택할 수 있다.
- 선택한 테마는 홈 일부 UI, 공개 프로필, 공유 이미지 템플릿에 반영될 수 있다.
- 무료 사용자는 preset preview를 볼 수 있지만 저장은 할 수 없다.
- 테마는 DESIGN.md의 visual guardrail을 벗어나지 않는다.
- 테마 변경은 public profile ISR/cache 반영 규칙을 가진다.

## Non-Goals

- v1에서 자유 색상 picker를 제공하지 않는다.
- v1에서 사용자 업로드 배경 이미지나 custom CSS를 허용하지 않는다.
- v1에서 dark mode 수동 토글과 테마 기능을 결합하지 않는다.
- v1에서 모든 앱 화면을 테마화하지 않는다.
- purple/violet 계열, gradient-heavy, pastel/bubbly 스타일은 제공하지 않는다.

## Theme Model

테마는 preset key로 저장한다.

기본 preset:

- `classic_terracotta`: 기본 buddy-note 테라코타
- `field_green`: 차분한 산책/잔디 무드
- `morning_gold`: 밝은 아침/햇살 무드
- `quiet_umber`: 조용한 갈색 앨범 무드
- `mist_blue`: 낮은 채도의 푸른 회색 무드

각 preset은 아래 semantic token만 가진다.

- `accent`
- `accent_soft`
- `paper`
- `mood_hint`

앱 전역 DESIGN token을 직접 덮어쓰기보다, 테마 적용 surface에서 `data-theme-preset` 또는 computed CSS variable scope를 사용한다.

## Data Requirements

pet 단위 설정으로 시작한다.

필수 필드:

- `pet_theme_settings`
  - `id`
  - `pet_id`
  - `theme_key`
  - `created_at`
  - `updated_at`

제약:

- `pet_id`는 unique다.
- owner 또는 admin만 변경 가능하다.
- 저장 시 pet owner의 `premium_theme` entitlement를 확인한다.
- 무료 사용자의 preview 선택은 DB에 저장하지 않는다.

## Entitlement

테마 저장은 `premium_theme` entitlement가 필요하다.

- trialing/active/canceling 사용자는 저장 가능하다.
- past_due는 grace period 안에서만 저장 가능하다.
- entitlement가 없으면 preview만 허용한다.
- 멤버십 종료 후 기존 저장 테마는 공개/공유 surface에 유지할지 기본 테마로 되돌릴지 정책이 필요하다.

v1 기본 정책은 “기존 테마는 유지하되 새 변경은 잠금”이다. 이미 생성된 공유 이미지 asset은 변경하지 않는다.

## UI Surfaces

- `/pet/theme`: preset 선택과 preview
- `/b/[slug]`: 공개 프로필 테마 반영
- 공유 이미지 렌더러: 새로 생성되는 이미지에 테마 반영
- premium lock: 무료 사용자의 저장 시도 또는 premium preset 선택 시 표시

UI 원칙:

- 카드 안 카드 구조를 만들지 않는다.
- preset은 swatch와 짧은 이름으로 보여준다.
- 버튼에는 명확한 저장/미리보기 액션만 둔다.
- 설명 copy는 기능 설명보다 결과 preview 중심으로 짧게 유지한다.

## Cache And Rendering

- 테마 변경 후 `/b/[slug]`를 revalidate한다.
- 새 공유 이미지는 변경된 테마로 생성한다.
- 이미 생성된 diary image URL은 immutable asset으로 유지한다.
- public profile OG image가 테마를 참조한다면 cache warm-up 또는 stale window를 문서화한다.

## Design Guardrails

- hardcoded hex/rgb는 컴포넌트에 직접 쓰지 않는다.
- preset 색상은 theme definition 파일 또는 DB seed 중 한 곳에서 관리한다.
- purple/violet, neon, pastel-heavy, gradient-heavy preset은 금지한다.
- radius는 기존 DESIGN token을 따른다.
- 기본 테라코타 CTA는 결제/주요 저장 액션에서 유지한다.

## Success Metrics

- 무료 체험 중 테마 preview 진입률
- premium theme 저장률
- 테마 저장 후 공개 프로필 공유율
- 테마 저장 후 공유 이미지 생성률
- premium lock에서 체험/결제로 이어지는 비율

## Launch Readiness Criteria

- 무료 사용자는 preview 가능, 저장 불가가 서버에서 검증된다.
- 유료 사용자는 pet 단위로 테마를 저장할 수 있다.
- public profile revalidate가 동작한다.
- 공유 이미지 새 생성분에 theme preset이 반영된다.
- DESIGN.md guardrail과 충돌하는 preset이 없다.
