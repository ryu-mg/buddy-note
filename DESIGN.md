# buddy-note Design System

Source of truth for all visual decisions.
Version 0.1 · Generated 2026-04-19 (from `/plan-design-review` Section 8)
Classifier: APP UI (with light MARKETING surface for public profile)

## 1. Brand Position

- **제품 정체성:** 반려동물 캐릭터 엔진. 우리 강아지의 기억이 쌓여가는 장소.
- **감정 축:** 따뜻함 (warmth) + 정확함 (precision). 귀엽지만 sloppy하지 않음.
- **안티-패턴:** pastel + 이모지 + bubbly = 금지. 어른이 쓰는 차분한 도구.

## 2. Typography

**Display / Heading (Korean):** Pretendard Variable (GitHub OSS)

- H1 (screen title): 28/32, Bold 700
- H2 (section): 20/26, Bold 700
- Body: 16/24, Regular 400
- Caption: 14/20, Regular 400
- Meta: 12/16, Medium 500

**Display / Heading (English, Latin):** Söhne (IF licensed) 또는 Inter Tight (fallback)

**Diary body (폴라로이드 + 앱 내):** MaruBuri (웹폰트, 무료) 또는 Nanum Myeongjo fallback.

- Diary 텍스트 본문은 명조체로. "쓰여진 기록" 메타포 강화. 나머지 앱 UI는 sans.

**System font 금지.** Pretendard / Söhne 없으면 fallback은 Noto Sans KR.

**Week 0 주의:** satori는 한국어 웹폰트를 자동 로드하지 않음. Pretendard + MaruBuri 한글 subset을 빌드 타임에 생성해 Edge Function에서 fetch (~1.5MB bundle).

## 3. Color

CSS variables (Tailwind config에 매핑):

```css
:root {
  /* Neutrals */
  --paper: #fafaf5;       /* 폴라로이드 크림 */
  --ink: #1a1a1a;         /* 본문 */
  --ink-soft: #3f3f3f;
  --mute: #6b7280;
  --line: #e5e7eb;
  --bg: #ffffff;

  /* Accent (warm, pet-safe) */
  --accent: #e07a5f;      /* 테라코타 — 따뜻한 단일 accent */
  --accent-soft: #fde6e0;

  /* Semantic */
  --success: #4a7c59;
  --error: #b04a4a;
  --warn: #d4a256;
}
```

- Purple/violet 절대 금지.
- Accent 단일 색 (테라코타). 추가 색 도입 금지 (v1).
- Gradient 금지 (공유 이미지 포함).

## 4. Spacing Scale

4px grid. Tokens: 4, 8, 12, 16, 20, 24, 32, 40, 48, 56, 64, 80.

- 컴포넌트 내부 padding: 16px 기본
- 섹션 간격: 24px 기본, 섹션 주제 바뀌면 32-40
- 화면 좌우 padding: 16px (모바일), 24px (공개 프로필 데스크톱)

## 5. Radius

- Cards: 12px (일기 카드)
- Buttons: 10px (primary)
- Chips: 999px (pill, 태그만 예외 — 유일한 라운드 element)
- 공유 이미지 (폴라로이드): 0px (각진 border)
- 입력 필드: 8px

Uniform bubbly 16-20px radius 금지.

## 6. Motion

- Default duration: 200ms
- Easing: cubic-bezier(0.2, 0.9, 0.3, 1) — soft out
- 3개 intentional motion:
  1. Diary 결과 슬라이드 업 (300ms)
  2. 카운터 count-up (800ms, ease-out)
  3. 3-keyword typing (60ms per char, 최대 1.2s)
- Loading shimmer: 1.2s cycle, 45deg diagonal
- Respect `prefers-reduced-motion: reduce` → count-up 생략, crossfade만.

## 7. Iconography

- Line icons only (Lucide 또는 Phosphor light).
- 16px / 20px / 24px 3 size 고정.
- 이모지 금지 (UI + 공유 이미지).
- 날씨: 5가지 (맑음/흐림/비/눈/바람) 커스텀 line SVG.

## 8. Imagery / Photography

- 사용자 사진은 **1:1 square crop** 기본 (공유 이미지 모든 포맷에서 공통).
- auto-orient EXIF 적용, GPS metadata 제거 (프라이버시).
- LQIP (Low Quality Image Placeholder) 20px blurhash.
- Image max 3MB 저장, 8MB 이상은 client-side compression.

## 9. Component Library Plan

shadcn/ui base + 오버라이드:

- Button (primary/secondary/ghost 3 variants, 3 size)
- Input, Textarea
- Dialog (공유 모달)
- Toast
- Skeleton
- Tabs (diary 3포맷 switcher)
- Chip (custom, shadcn에 없음)

## 10. Accessibility

- 본문 텍스트 contrast 4.5:1 minimum (AA)
- 큰 텍스트 3:1
- 터치 타겟 44×44px
- 키보드 focus ring: 2px solid var(--accent), offset 2px
- Screen reader labels: 모든 icon-only 버튼에 aria-label
- Skip-link on 공개 프로필

## 11. Content / Voice

- 앱 UI 카피: 따뜻한 유틸리티. "사진 한 장 올려주세요" (명령형 아님, 권유형)
- Diary 톤: 강아지 1인칭, 5문항 기반 persona 반영
- 에러 메시지: 사과 + 회복 액션. "잠시 AI가 놓쳤어요, 30초 뒤 다시 만들어볼게요"
- 금지 단어: "unlock", "power of", "all-in-one", "혁신", "스마트"

## 12. Polaroid Template Spec (공유 이미지)

폴라로이드는 제품의 브랜드 자산이자 바이럴 채널. 일관성이 생명.

- Border: 24px 흰색 (bottom 44px — 카피 영역)
- 기울임: -1.2deg (살짝, 과하지 않게)
- 사진: 1:1 square crop, 내부 border 없음
- Grain: 5% opacity SVG turbulence filter (고정 seed로 재현성)
- 본문 영역 (bottom 44px):
  - 강아지 이름 (우측, MaruBuri, 14/18, `--ink`)
  - 날짜 (좌측, Pretendard Meta 12, `--mute`)
  - 날씨 아이콘 (날짜 옆, 12×12 line SVG)
- 로고 (우하단 12×12, opacity 0.3, 자연스럽게 섞임)
- 3 포맷 (9:16 / 4:5 / 1:1): crop ratio만 다름, lockup 동일

## 13. v0.2 Emotional System

v0.2는 폴라로이드 원칙을 유지하되, 버디가 화면의 주인공처럼 보이는 순간을 늘린다.

### Emotional serif usage

`var(--font-serif)`는 아래 경우에 허용한다.

- 강아지 이름
- MBTI 코드
- milestone 숫자
- 완료 문구 (`저장됐어`, `기억할게`)
- 일기 본문

작은 라벨, 메뉴, 입력 UI는 Pretendard를 유지한다.

### Mood palette

일기 분위기는 `bright | calm | tired | curious | grumpy | lonely` 6개만 사용한다.
`grumpy`는 purple을 쓰지 않고 muted umber/brown 계열로 표현한다.

- bright: `--color-mood-bright`
- calm: `--color-mood-calm`
- tired: `--color-mood-tired`
- curious: `--color-mood-curious`
- grumpy: `--color-mood-grumpy`
- lonely: `--color-mood-lonely`

무드는 월간 캘린더 발자국, 주간 timeline accent, 향후 mood map에만 작게 쓴다.

### Warm-dark

시스템 dark mode는 차가운 검정/슬레이트가 아니라 warm brown-black으로 자동 전환한다.
수동 테마 토글은 v0.2 범위에서 제외한다.

### Illustration

공통 일러스트는 `BuddyResting`, `BuddyTilted`, `BuddyHappy` 3개를 기준으로 한다.
상태는 직접 설명하는 긴 텍스트보다 그림과 짧은 버디 1인칭 카피로 전달한다.

---

**Change log**

- v0.2 — 2026-04-22 — Emotional serif, mood palette, warm-dark, Buddy illustration system.
- v0.1 — 2026-04-19 — Initial from design review auto-decisions. `/plan-design-review` auto-decided 15 items, all locked for v1.

이 문서는 Week 0 안에 확정해야 이후 모든 구현이 align 됨. 변경 시 PR 제목에 `[design-system]` 접두어 필수.
