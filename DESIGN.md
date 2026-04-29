---
version: alpha
name: buddy-note
description: 반려동물 캐릭터 엔진 — 폴라로이드 감성과 테라코타 accent가 교차하는 AI 일기 앱. 따뜻함(warmth)과 정확함(precision)을 동시에 담는다.
colors:
  bg: "#ffffff"
  paper: "#fafaf5"
  ink: "#1a1a1a"
  ink-soft: "#3f3f3f"
  mute: "#6b7280"
  line: "#e5e7eb"
  accent: "#e07a5f"
  accent-soft: "#fde6e0"
  accent-cta: "#b85038"
  primary: "{colors.accent-cta}"
  success: "#4a7c59"
  error: "#b04a4a"
  warn: "#d4a256"
  mood-bright: "#e0a83f"
  mood-calm: "#6f9f86"
  mood-tired: "#9b9489"
  mood-curious: "#5f8aa8"
  mood-grumpy: "#8a6650"
  mood-lonely: "#7f8f9f"
typography:
  h1:
    fontFamily: Pretendard Variable
    fontSize: 28px
    fontWeight: 700
    lineHeight: 1.14
    letterSpacing: -0.01em
  h2:
    fontFamily: Pretendard Variable
    fontSize: 20px
    fontWeight: 700
    lineHeight: 1.3
  body:
    fontFamily: Pretendard Variable
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.5
  caption:
    fontFamily: Pretendard Variable
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.43
  meta:
    fontFamily: Pretendard Variable
    fontSize: 12px
    fontWeight: 500
    lineHeight: 1.33
    letterSpacing: 0.14em
  diary-body:
    fontFamily: 마루 부리
    fontSize: 15px
    fontWeight: 400
    lineHeight: 1.7
rounded:
  polaroid: 0px
  input: 8px
  button: 10px
  card: 12px
  pill: 9999px
spacing:
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 40px
  2xl: 64px
components:
  button-primary:
    backgroundColor: "{colors.accent-cta}"
    textColor: "#ffffff"
    rounded: "{rounded.button}"
    padding: 12px 24px
  button-primary-hover:
    backgroundColor: "{colors.accent-cta}"
    textColor: "#ffffff"
  button-secondary:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.button}"
    padding: 12px 24px
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.ink-soft}"
    rounded: "{rounded.button}"
    padding: 12px 24px
  input:
    backgroundColor: "{colors.bg}"
    textColor: "{colors.ink}"
    rounded: "{rounded.input}"
    padding: 12px 16px
  diary-card:
    backgroundColor: "{colors.bg}"
    textColor: "{colors.ink}"
    rounded: "{rounded.polaroid}"
    padding: 24px 24px 44px 24px
  chip:
    backgroundColor: "{colors.accent-soft}"
    textColor: "{colors.ink-soft}"
    rounded: "{rounded.pill}"
    padding: 4px 12px
  divider:
    backgroundColor: "{colors.line}"
  toast-success:
    backgroundColor: "{colors.success}"
    textColor: "#ffffff"
  toast-error:
    backgroundColor: "{colors.error}"
    textColor: "#ffffff"
  toast-warn:
    backgroundColor: "{colors.warn}"
    textColor: "{colors.ink}"
  paw-print-bright:
    textColor: "{colors.mood-bright}"
  paw-print-calm:
    textColor: "{colors.mood-calm}"
  paw-print-tired:
    textColor: "{colors.mood-tired}"
  paw-print-curious:
    textColor: "{colors.mood-curious}"
  paw-print-grumpy:
    textColor: "{colors.mood-grumpy}"
  paw-print-lonely:
    textColor: "{colors.mood-lonely}"
  bottom-nav:
    backgroundColor: "{colors.bg}"
    textColor: "{colors.mute}"
  bottom-nav-active:
    textColor: "{colors.accent}"
---

# buddy-note Design System

Source of truth for all visual decisions. Version 0.2 · 2026-04-22
Classifier: APP UI (with light MARKETING surface for public profile `/b/[slug]`)

## Overview

반려동물 캐릭터 엔진. 우리 강아지의 기억이 쌓여가는 장소.

감정 축은 **따뜻함(warmth) + 정확함(precision)**이다. 귀엽지만 sloppy하지 않고, 감성적이지만 정보가 분명하다. 어른이 매일 꺼내 쓰는 차분한 도구여야 한다.

폴라로이드는 브랜드의 시각 언어다. 사진이 인화되는 순간의 설렘과 손에 쥐는 물성을 디지털로 환기한다. 이 언어는 공유 이미지에서 가장 강하게 발현되고, 앱 UI에는 그 분위기가 은은하게 배어 있다.

v0.2부터 버디(강아지)가 화면의 주인공처럼 느껴지는 순간을 늘린다. serif 폰트, 무드 색상, 짧은 1인칭 카피, 일러스트가 그 역할을 한다.

## Colors

팔레트는 warm neutral 기반에 테라코타 단일 accent로 구성된다. 추가 accent 색 도입은 v1 금지.

- **bg (#ffffff):** 기본 화면 배경. 순백.
- **paper (#fafaf5):** 폴라로이드 크림 — 인화지의 따뜻한 off-white. 카드·입력 배경·섹션 구분에 사용.
- **ink (#1a1a1a):** 본문 텍스트. 순흑보다 따뜻한 near-black.
- **ink-soft (#3f3f3f):** 서브 텍스트, 설명 문구.
- **mute (#6b7280):** 메타 정보, 플레이스홀더, 비활성 탭.
- **line (#e5e7eb):** 테두리, 구분선, 비활성 캘린더 셀.
- **accent (#e07a5f):** 테라코타 — 유일한 interaction 색. CTA 버튼, 선택 상태, focus ring, active 탭에만 사용.
- **accent-soft (#fde6e0):** 테라코타의 10% tint. chip 배경, 선택된 날짜 셀 배경.
- **success (#4a7c59):** 저장 완료, 업로드 성공 등 긍정 피드백.
- **error (#b04a4a):** 오류 메시지, 실패 상태.
- **warn (#d4a256):** 경고, 주의 안내.

### Mood palette

일기 분위기는 아래 6개만 사용한다. 무드 색은 월간 캘린더 발자국, 주간 timeline accent, 향후 mood map에만 작게 적용한다.

- **mood-bright (#e0a83f):** 밝고 활기찬 날
- **mood-calm (#6f9f86):** 여유롭고 평온한 날
- **mood-tired (#9b9489):** 피곤하거나 늘어진 날
- **mood-curious (#5f8aa8):** 호기심 많고 탐구적인 날
- **mood-grumpy (#8a6650):** 투덜거리거나 예민한 날 (purple 금지 — muted umber/brown 계열)
- **mood-lonely (#7f8f9f):** 조용하고 쓸쓸한 날

### Dark mode (warm-dark)

시스템 dark mode는 차가운 검정/슬레이트가 아니라 warm brown-black으로 자동 전환한다.

| Token | Light | Dark |
|---|---|---|
| bg | #ffffff | #17120f |
| paper | #fafaf5 | #211b17 |
| ink | #1a1a1a | #f5efe6 |
| ink-soft | #3f3f3f | #d8cabe |
| mute | #6b7280 | #aa9a8d |
| line | #e5e7eb | #3a302a |
| accent-soft | #fde6e0 | #3a2620 |

수동 테마 토글은 v0.2 범위 제외.

## Typography

UI는 Pretendard Variable(sans), 일기 본문은 마루 부리(serif). **System font 금지** — 없으면 fallback은 Noto Sans KR / Nanum Myeongjo.

```
font-sans: "Pretendard Variable", "Pretendard", -apple-system, "Noto Sans KR", sans-serif
font-serif: "마루 부리", "MaruBuri", "Nanum Myeongjo", "Noto Serif KR", serif
```

serif(`font-serif`)는 아래 경우에만 허용한다. 작은 라벨·메뉴·입력 UI는 Pretendard 유지.

- 강아지 이름
- MBTI 코드
- milestone 숫자
- 완료 문구 (`저장됐어`, `기억할게`)
- 일기 본문

**Week 0 주의:** satori는 한국어 웹폰트를 자동 로드하지 않는다. Pretendard + 마루 부리 한글 subset을 빌드 타임에 생성해 Edge Function에서 fetch (~1.5 MB bundle).

## Layout

4px grid. 화면 좌우 padding: 16px(모바일), 24px(공개 프로필 데스크톱). 섹션 간격 기본 24px, 주제 전환 시 32–40px.

| Token | Value | 용도 |
|---|---|---|
| xs | 4px | 아이콘–텍스트 gap |
| sm | 8px | 인라인 gap, chip 상하 padding |
| md | 16px | 컴포넌트 내부 padding, 화면 좌우 여백 |
| lg | 24px | 섹션 간격, 폴라로이드 border |
| xl | 40px | 섹션 주제 전환 |
| 2xl | 64px | 페이지 상단 여백 |

사용자 사진은 **1:1 square crop** 기본 (공유 이미지 모든 포맷에서 공통). LQIP 20px blurhash 적용. Image max 3 MB 저장, 8 MB 이상은 client-side compression.

## Elevation & Depth

그림자는 warm low-contrast. 차가운 파란 drop shadow 금지.

```css
--shadow-card:      0 1px 2px rgb(26 26 26 / 0.04), 0 14px 32px -18px rgb(26 26 26 / 0.18);
--shadow-card-soft: 0 1px 2px rgb(26 26 26 / 0.04), 0  8px 24px -12px rgb(26 26 26 / 0.08);
--shadow-polaroid:  0 24px 55px -30px rgb(26 26 26 / 0.42);
--shadow-accent:    0 10px 24px -16px rgb(224 122 95 / 0.82);
```

Dark mode에서는 투명도가 높아진다 (0.18 → 0.55, accent 0.82 → 0.55).

## Shapes

Radius 계층은 목적별로 고정된다. Uniform bubbly 16–20px radius 금지.

| Token | Value | 적용 대상 |
|---|---|---|
| polaroid | 0px | 공유 이미지, 폴라로이드 카드 |
| input | 8px | 입력 필드 |
| button | 10px | 버튼 (primary/secondary/ghost) |
| card | 12px | 일기 카드, 다이얼로그 |
| pill | 9999px | chip/tag 전용 — 유일한 full-round |

### Motion

```
duration-default:  200ms
ease-soft-out:     cubic-bezier(0.2, 0.9, 0.3, 1)
```

의도된 모션 3가지만 허용한다.

1. **diary 결과 슬라이드 업** — 300ms ease-soft-out
2. **카운터 count-up** — 800ms ease-out
3. **3-keyword typing** — 60ms/char, 최대 1.2s

Loading shimmer: 1.2s cycle, 45deg diagonal. `prefers-reduced-motion: reduce` → count-up 생략, crossfade만.

### Polaroid (공유 이미지)

폴라로이드는 브랜드 자산이자 바이럴 채널. 일관성이 생명.

- Border: 24px 흰색 (bottom 44px — 카피 영역)
- 기울임: -1.2deg
- 사진: 1:1 square crop, 내부 border 없음
- Grain: 5% opacity SVG turbulence filter (고정 seed로 재현성)
- Bottom 44px 영역: 강아지 이름(우측, diary-body 14px) + 날짜(좌측, meta) + 날씨 아이콘(날짜 옆, 12×12 line SVG)
- 로고: 우하단 12×12, opacity 0.3
- 3 포맷 (9:16 / 4:5 / 1:1): crop ratio만 다름, lockup 동일

### Illustration

공통 일러스트는 `BuddyResting`, `BuddyTilted`, `BuddyHappy` 3개를 기준으로 한다. 상태는 긴 텍스트보다 그림과 짧은 버디 1인칭 카피로 전달한다.

## Components

shadcn/ui base + 오버라이드. Icon은 Lucide/Phosphor line, 16/20/24px 3사이즈.

| 컴포넌트 | 설명 |
|---|---|
| Button | primary / secondary / ghost 3 variants, 3 size |
| Input, Textarea | rounded-input, line border |
| Dialog | 공유 모달 |
| Toast | Sonner |
| Skeleton | shimmer |
| Tabs | diary 3포맷 switcher |
| Chip | custom, pill radius, accent-soft 배경 |
| BottomNav | 주간 / 홈 / 내 정보 3탭, 고정 하단 |

터치 타겟 최소 44×44px. 모든 icon-only 버튼에 `aria-label`.

### Content / Voice

- 앱 UI 카피: 따뜻한 유틸리티 — 명령형 아님, 권유형. ("사진 한 장 올려주세요")
- Diary 톤: 강아지 1인칭, 5문항 persona 반영, 반말
- 에러 메시지: 사과 + 회복 액션 ("잠시 AI가 놓쳤어요, 30초 뒤 다시 만들어볼게요")

## Do's and Don'ts

**Do:**
- `var(--color-*)` 토큰만 사용 — 하드코딩된 hex/rgb 금지
- 새 색/radius/motion은 DESIGN.md 먼저 업데이트 후 `app/globals.css` `@theme inline`에 반영, PR 제목에 `[design-system]` 접두어
- 본문 텍스트 contrast 4.5:1 minimum (WCAG AA), 큰 텍스트 3:1
- 키보드 focus ring: 2px solid `{colors.accent}`, offset 2px
- Skip-link on 공개 프로필

**Don't:**
- Purple/violet 사용 금지 (전체 앱, 공유 이미지 포함)
- Gradient 금지
- 이모지 금지 (UI + 공유 이미지)
- Pastel + bubbly radius + "all-in-one / 스마트 / 혁신" 카피 금지
- Uniform 16–20px radius 금지
- System font 금지

---

**Change log**

- v0.2 — 2026-04-22 — Emotional serif, mood palette, warm-dark, Buddy illustration system. Restructured to DESIGN.md spec (google-labs-code/design.md).
- v0.1 — 2026-04-19 — Initial from design review. `/plan-design-review` auto-decided 15 items, all locked for v1.
