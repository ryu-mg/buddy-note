# DESIGN_TODOS — UI/UX/디자인 개선 로드맵

> **상태:** v0 · 생성 2026-04-21 · 출처: 캐릭터 부재 진단 + 21 아이디어 ideation
> **스코프:** 기존 DESIGN.md SSOT (폴라로이드 / 테라코타 / 명조체 / no-emoji) 를 존중하면서, *"캐릭터가 없는 캐릭터 엔진"* 문제를 해결한다.
> **진행 방식:** 티켓 번호 `D-1 ~ D-15`. 상단 → 하단 우선순위. Tier 1 (5개) 먼저 merge 후, 2/3 는 검증 끝나면 스케줄.
> **DESIGN.md 수정을 수반하는 티켓은 `[design-system]` 라벨 명시.**

---

## 🎯 근본 진단 (이 문서의 전제)

1. **제품 정체성 ("캐릭터 엔진") vs UI 실행 (차가운 유틸리티) 간 격차.** 강아지가 주인공인데 화면에 "주인공 배치"가 없다.
2. **DESIGN.md는 "귀엽지만 sloppy하지 않음"을 이상으로 두지만, 실제 UI는 "정확함" 쪽으로 과하게 기움.** 따뜻함이 카피와 폴라로이드 기울기 몇 도에만 의존.
3. **톤 분열:** Diary는 강아지 1인칭, UI는 보호자 3인칭. 유저가 "강아지와 대화하는 앱" 감각을 못 받음.
4. **빈 상태·마일스톤·완료 moment** 의 감정 설계 부재. 재방문 유인 약함.

→ 이 4개를 해결하는 데 디자인의 전부를 건다. 파스텔/이모지/bubbly 를 풀지 **않고** 해결 가능 (이모지 대체재는 D-4 브랜드 SVG).

---

## 우선순위 스냅샷

| Tier | 티켓 | 한 줄 | 예상 작업량 |
|---|---|---|---|
| **T1** | D-1 | 홈 Hero "오늘의 버디 카드" | M (2-3일) |
| **T1** | D-2 | UI 카피 1인칭 리라이트 | S (0.5일) |
| **T1** | D-3 | Diary 완료 "찰칵" moment | S (1일) |
| **T1** | D-4 | 브랜드 SVG 일러스트 3개 | M (1-2일) |
| **T1** | D-5 | 공개 프로필 Hero 재설계 | M (2일) |
| **T2** | D-6 | 명조체 key moment 확장 | XS (0.5일) |
| **T2** | D-7 | 캘린더 → 폴라로이드 타임라인 | L (3-4일) |
| **T2** | D-8 | Onboarding Step 6 리빌 재설계 | S (1일) |
| **T2** | D-9 | 빈 상태 일러스트 통합 | S (1일) |
| **T2** | D-10 | 감정 스티커 (캘린더 점 대체) | M (2-3일, LLM 연동) |
| **T3** | D-11 | "오늘의 callback" 모듈 | L (3일, memory_summary 의존) |
| **T3** | D-12 | 마일스톤 자동 recap 폴라로이드 | L (3-4일) |
| **T3** | D-13 | Upload = 대화형 UX | M (2일) |
| **T3** | D-14 | 야간 warm-dark 모드 | S (1일) |
| **T3** | D-15 | 커스텀 커서 & 폴라로이드 pin 모션 | XS (0.5일) |
| **T1** | D-16 | 하단 네비게이션 3-탭 재편 (주간/월간/내 정보) | S (1일) |
| **T1** | D-17 | 캘린더 기록 마커 → 강아지 발자국 | XS (0.5일) |
| **T1** | D-18 | Onboarding 자유 기술 단계 (200자) | S (1일) |

---

# 🟢 Tier 1 — 즉시 효과, 브랜드 규율 내

## D-1 · 홈 Hero "오늘의 버디 카드"

**문제:** 로그인 후 홈 첫 화면이 캘린더 그리드와 조그만 `N일째` 텍스트. 제품 핵심 자산 (*persona*) 이 UI에 전혀 안 나옴. 주인공 부재.

**목표:** 유저가 홈을 열면 **2초 안에 "내 강아지"를 만난다.**

**수정 파일:**
- **신규:** `components/home/buddy-card.tsx`
- **수정:** `components/home/calendar-home.tsx` (header 영역 전체 교체)
- **수정:** `app/page.tsx` (pet select 에 `profile_photo_storage_path`, `persona_answers`, 최근 diary 1건 추가 fetch)
- **신규 라이브러리:** `lib/greeting.ts` — 시간대/요일/성격기반 인사말 pool + selector

**UI 구성 (top-down):**

```
┌─────────────────────────────────────────────┐
│  [ 70px 원형 아바타 ]                          │
│    (profile_photo_storage_path signed URL)   │
│                                              │
│  마루  (24px, 명조체, D-6 와 연결)              │
│  ENFP · 냄새 탐정                              │
│                                              │
│  ─────────────────────────────────           │
│  "오늘도 뛰었어. 잠깐 낮잠 좀 잘래."           │
│  (15px, 명조체, 강아지 1인칭)                  │
│  ─────────────────────────────────           │
│                                              │
│  234일째 · 기록 47장                           │
└─────────────────────────────────────────────┘
```

**카피 풀 (`lib/greeting.ts`):**
- 아침 (06~11): `"오늘도 일찍 깼네. 밥 줄 거지?"`, `"잘 잤어? 오늘 뭐 할까?"`
- 낮 (11~17): `"낮잠 타임이야."`, `"창밖에 뭐 지나가는지 지켜봐야지."`
- 저녁 (17~21): `"산책 안 가?"`, `"오늘 재미있었어."`
- 밤 (21~06): `"오늘도 고마웠어."`, `"빨리 자자."`
- **성격 modifier**: E축은 `! `로 끝, I축은 `…`로 끝. F축은 "~야/어", T축은 "~지".

**아바타 fallback:**
- `profile_photo_storage_path` 없으면 → MBTI 4글자 기반 단색 이니셜 블록 (테라코타 bg + 크림 글자, 명조체 대문자 2글자 e.g. "EN"). 이건 **귀엽고 브랜드 안에서 식별 가능**.

**수용 기준:**
- [ ] 홈 로드 시 아바타 + 이름 + MBTI + 인사 + 스탯이 한 블록으로 보인다
- [ ] 성격 코드 없으면 MBTI 대신 `"성격은 천천히 알려줘"` 플레이스홀더
- [ ] `prefers-reduced-motion`: reveal 애니메이션 skip
- [ ] 아바타 클릭 → `/pet` 이동 (마이페이지)
- [ ] 모바일 (390w) / 태블릿 (768w) / 데스크톱 (1024w) 모두 정렬 깔끔
- [ ] 로딩 skeleton 지원 (Suspense 경계 기존 것 재활용 OK)

---

## D-2 · UI 카피 1인칭 리라이트

**문제:** Diary는 강아지 1인칭인데 UI 카피는 보호자 3인칭. "강아지랑 대화하는 앱" 감각이 안 옴.

**목표:** *보호자-강아지 대화* 톤으로 마이크로 카피를 bending. 이모지/과한 친근함 없이.

**수정 파일 (전수 검토):**
- `app/page.tsx` · `components/home/calendar-home.tsx` · `app/log/upload-form.tsx` · `components/log/phase-copy.tsx` · `app/diary/[id]/page.tsx` · `components/empty/empty-state.tsx` · `app/onboarding/steps/[step]/page.tsx`

**카피 변경표 (diff):**

| 위치 | 현재 | 변경 |
|---|---|---|
| 홈 hero 서브 (anon) | "사진 한 장으로 일기가 되고, 일기가 쌓이면 버디가 점점 더 자기 자신 같아져요." | 유지 (랜딩은 3인칭 OK) |
| 캘린더 비어있는 sheet | "아직 오지 않은 날은 기록할 수 없어요." | "아직 오지 않은 날이에요. 그때 만나요." |
| upload label | "오늘의 사진" | "오늘 뭐 했어?" |
| upload placeholder | "사진 한 장을 올려주세요" | "사진 한 장 보여줄래?" |
| upload hint | "눌러서 고르기" / "마음에 들면 아래 버튼을 눌러주세요" | "눌러서 고르기" / "이거면 돼. 아래 버튼 눌러줘." |
| upload 메모 label | "남겨두고 싶은 메모 (선택)" | "엄마/아빠가 한 마디 (선택)" — ※ 반려인 호칭 동적 삽입 (onboarding의 `companion_relationship`) |
| upload submit | `${petName}의 일기 만들기` | `"오늘 이야기 만들어줘"` |
| PhaseCopy phase 0 title | "사진을 살펴보는 중이에요" | "사진 들여다보는 중…" |
| PhaseCopy phase 2 title | `${petName}의 말투로 적는 중이에요` | `"나 평소처럼 적어볼게"` (1인칭) |
| Diary detail "자세히 보기" (캘린더 sheet) | "자세히 보기" | "그날 이야기 보기" |
| Diary "다시 만들기" (fallback) | "다시 만들기" | "다시 해볼래" |
| EmptyState (공개 프로필) | `${pet.name} 아직 첫 일기를 준비 중이에요` + "다음에 다시 놀러 와주세요." | `${pet.name}, 아직 준비 중` + "조금 있다 다시 올래?" |
| Diary fallback banner | "AI가 잠시 놓쳤어요. 이건 임시 일기예요…" | "내가 오늘 말이 잘 안 떠올랐어. 잠깐 임시로 적어둘게." (강아지 1인칭) |
| Bottom nav | "홈" / "마이페이지" | "홈" / "내 정보" — `마이페이지` 는 잡지적, 친근 감 저하 |
| 생성 중 overlay cancel | "뒤로 갈래요" | "조금 있다 다시 할래" |

**가이드라인 (`docs/copy-voice.md` 로 별도 저장, 신규):**
- 주어 생략 선호 (한국어 자연스러움). 강아지가 주체일 땐 "나"
- 강아지 말투 = 반말. 보호자 도구 카피 = 높임 OK. **중간층(시스템 알림)은 강아지 voice**.
- 금지 단어: "저장하겠습니다", "로딩 중", "처리하는 중", "오류가 발생했습니다"
- 에러: 사과 + 회복 액션. 강아지 voice 권장. e.g. `"잠깐 헷갈렸어. 30초만 기다려줘."`

**수용 기준:**
- [ ] 위 diff 표 전부 반영
- [ ] `docs/copy-voice.md` 생성, voice guideline 정리
- [ ] `companion_relationship` 값 없으면 fallback "엄마/아빠"
- [ ] Storybook stories 카피 업데이트

---

## D-3 · Diary 완료 "찰칵" moment

**문제:** LLM 생성 완료 → `router.push(/diary/[id])` 즉시 이동. 큰 작업을 끝냈는데 셀레브레이션이 없음. 재방문 동기 약화.

**목표:** *폴라로이드 인쇄 순간* 의 브랜드 의식. "오늘의 기억, 저장됐어요" 정체성 강화.

**수정 파일:**
- **신규:** `components/diary/shutter-reveal.tsx` — 화면 중앙 overlay 컴포넌트
- **수정:** `app/log/upload-form.tsx` — `result.ok` 후 navigate 전에 1.2s ShutterReveal 연출
- **수정:** `app/globals.css` — `@keyframes shutter-flash`, `@keyframes polaroid-drop` 추가
- **수정:** `app/diary/[id]/page.tsx` — query param `?arrive=1` 있을 때 폴라로이드 입장 애니메이션 (optional, nice-to-have)

**애니메이션 스펙:**

```
0ms  : 현재 overlay (PhaseCopy) fade-out 시작
200ms: 흰 플래시 (opacity 0 → 0.9 → 0, duration 300ms) — "카메라 셔터"
500ms: 폴라로이드 SVG (생성된 첫 이미지 미리 fetch) 중앙에서
       scale(0.9) rotate(-6deg) → scale(1) rotate(-1.2deg) 착지
       (400ms, cubic-bezier(0.2, 0.9, 0.3, 1))
900ms: 명조체 "저장됐어" (페이드인 200ms)
1100ms: 전체 fade-out 300ms
1400ms: router.push → diary detail
```

**Haptic (mobile only):**
```ts
if (navigator.vibrate) navigator.vibrate([10, 50, 10])  // 셔터 → 인쇄 → 착지
```

**`prefers-reduced-motion`:** 플래시 + 착지 애니메이션 skip, 200ms crossfade만 + 텍스트 즉시 노출.

**수용 기준:**
- [ ] 생성 완료 → 1.4s 의식 → diary 페이지 도착
- [ ] 모션 감소 설정에서는 crossfade 로 fallback
- [ ] 네트워크 지연으로 LLM 실패 시 애니메이션 skip, 에러 토스트 (기존 대로)
- [ ] Haptic 은 iOS Safari 에서 작동 (duck-typed feature detect)
- [ ] Lighthouse 성능 regression 없음 (애니메이션은 CSS transform 만)

---

## D-4 · 브랜드 SVG 일러스트 3개 (이모지 대체재)

**문제:** "귀여움"을 브랜드 내 언어로 표현할 asset 이 없음. 이모지 금지는 옳지만, 텍스트만으로는 따뜻함 약함.

**목표:** DESIGN §7 "line icons only" 유지하되 **캐릭터 표정 3종** 을 브랜드 톤으로 제작.

**신규 파일:**
- `components/illustrations/buddy-resting.tsx` (엎드려 있는 강아지, 빈 상태용)
- `components/illustrations/buddy-tilted.tsx` (고개 갸웃, 에러용)
- `components/illustrations/buddy-happy.tsx` (꼬리 살랑, 성공용)

**스펙:**
- 단일 stroke (2px), `currentColor` 사용 → 어느 색에나 적응
- viewBox 96×96, 실제 사용은 48-120px
- DESIGN §2 톤: 선이 거칠지 않음, 부드러운 곡선, 해부학적 정확 < 감정 표현
- 참고 레퍼런스: 일본의 "Osamu Harada" 감성 or "Dick Bruna (miffy)" 의 기하학 최소주의 변형
- **이모지스러움 금지** (입 O, 눈 점점 하트 X)
- 그림자 1개 선 밑바닥 ellipse

**적용처:**
- `components/empty/empty-state.tsx` — tone 별 일러스트 prop 추가 (`variant: 'resting' | 'happy' | 'neutral'`)
- `app/error.tsx`, `app/global-error.tsx`, `app/not-found.tsx` — buddy-tilted + 한 줄 카피
- D-3 shutter-reveal — buddy-happy 를 "저장됐어" 옆에 40×40

**수용 기준:**
- [ ] 3개 SVG 각각 inline React component (외부 SVG 파일 X — currentColor 바인딩)
- [ ] Storybook 카드 1개 (3 variant × 3 size × 2 color)
- [ ] 모든 일러스트 `role="img" aria-label="..."` 지정, decorative 용도는 `aria-hidden`
- [ ] 다크모드에서 stroke color 자동 반전 (currentColor 덕분에)

---

## D-5 · 공개 프로필 Hero 재설계 (`/b/[slug]`)

**문제:** 공개 프로필은 **바이럴 루프의 코어 자산**인데 현재 hero 가 `36px 이름 + N일째 부제` 1줄뿐. 카카오톡 붙여넣었을 때 임팩트 부족.

**목표:** 방문자가 **첫 스크롤 없이 "이 강아지 누구인지"** 이해 + **스크린샷 shareable**.

**수정 파일:**
- `app/b/[slug]/page.tsx` — hero 섹션 전체 교체
- **신규:** `components/public/profile-hero.tsx`
- **신규:** `components/public/polaroid-stack.tsx` — 최근 3장 부채꼴 겹친 decorative stack

**UI 구성:**

```
┌─────────────────────────────────────────────┐
│                                              │
│   [ 폴라로이드 stack — 최근 3장, 부채꼴      │
│     -6°, -1.2°, +4°, 각 z-index 0/1/2 ]    │
│                                              │
│                                              │
│   ━━━━━━━━━━━━━━━━━━━━                      │
│     마루                                      │
│   (56px, 명조체, D-6 scope)                   │
│   ━━━━━━━━━━━━━━━━━━━━                      │
│                                              │
│   ENFP · 냄새 탐정                            │
│   (16px, mute)                               │
│                                              │
│   234일 · 폴라로이드 47장                      │
│   (13px, mute, 숫자만 명조체 강조)            │
│                                              │
└─────────────────────────────────────────────┘
```

**데이터 추가:**
- `fetchPublicPet` select 에 `personality_code, personality_label` 추가 — 기존 select 컬럼이지만 RLS 확인 필요 (persona leak 아님, 코드와 label 은 비개인정보. 단 `persona_prompt_fragment`, `persona_answers` 는 절대 노출 X)
- 최근 일기 3장 이미지 URL (`image_url_45`, fallback `image_url_11`)

**반응형:**
- 모바일 (< 640w): stack 중앙 정렬, 이름 42px
- 데스크톱 (≥ 640w): stack + 이름 좌/우 나란히, 이름 56px

**수용 기준:**
- [ ] 첫 뷰포트에서 stack + 이름 + 성격 + 스탯 모두 보임 (390×844 기준)
- [ ] 스크린샷 시 카카오톡 / 인스타 스토리에 붙여도 예쁨 (시각적 중심선 명확)
- [ ] `persona_prompt_fragment` 등 PII 절대 fetch X — RLS 정책 재검토
- [ ] 일기 0개일 때 stack 자리에 `buddy-resting` 일러스트 (D-4 연결)
- [ ] OG metadata 변경 없음 (기존 `image_url_11` 우선 로직 유지)

---

# 🟡 Tier 2 — 브랜드 규율 살짝 확장, 깊이 추가

## D-6 · 명조체 key moment 확장 `[design-system]`

**문제:** 현재 명조체는 `diary.body` 에만. "쓰여진 기록" 메타포가 body 에만 갇혀 있음.

**목표:** 감정적 moment (강아지 이름, 마일스톤 숫자, hero 카피) 에 명조체를 extend 해 identity 를 2배로.

**DESIGN.md §2 수정 제안:**

```diff
 **Display / Heading (Korean):** Pretendard Variable
+
+**Emotional / Name 강조:** Nanum Myeongjo — 강아지 이름 (홈 hero, 공개 프로필),
+마일스톤 숫자 (N일째), 생성 완료 confirmation ("저장됐어") 등 "이것은 기록이다"
+감정이 강해지는 포인트에만. 본문 텍스트와 스탯·인터랙티브 UI 는 계속 sans.
```

**적용 위치:**
- D-1 홈 Hero 이름
- D-5 공개 프로필 이름
- D-3 shutter-reveal "저장됐어"
- `app/diary/[id]/page.tsx` 폴라로이드 내 이름 (이미 명조체) 유지
- 캘린더 월 label ("4월") — D-7 과 연결

**수용 기준:**
- [ ] `DESIGN.md` §2 "Emotional / Name 강조" 섹션 추가, PR 제목 `[design-system]` 접두
- [ ] `app/globals.css` 변경 없음 (font 자체는 이미 로드됨, `var(--font-serif)` 재사용)
- [ ] 변경 완료 후 디자인 스크린샷 diff 문서화 (선택)

---

## D-7 · 캘린더 → 폴라로이드 타임라인

**문제:** 42칸 그리드 + 작은 점 = "관리 도구" 느낌. 쌓임의 감정 없음. 빈 날이 대부분이라 "아직 텅 비어 있구나" 만 각인.

**목표:** *지층이 두꺼워지는 감각*. 스크롤할수록 과거로 들어가고, 기록 있는 날만 보이며, 마일스톤에서 색이 warmer.

**수정 파일:**
- **신규:** `components/home/timeline-home.tsx`
- **수정:** `app/page.tsx` — `CalendarHome` 을 `TimelineHome` 으로 교체 (또는 유저 설정으로 toggle)
- **삭제 candidates:** `components/home/calendar-home.tsx` (또는 `/logs` 페이지로 이관)

**UI 구성:**

```
오늘 (4월 21일)
  [ 작은 폴라로이드 썸네일 60x75, 기울기 -1.2° ]
  제목 1줄 + 날짜

4월 20일
  [ ... ]

━━━━ 4월 ━━━━  (명조체, 18px, 섹션 구분)
  빈 기간은 날짜 생략, 기록 있는 날만 표시

━━━━ 3월 ━━━━

┌─ 100일째 ─ (특별 구분선, warm cream #f4e4c1 배경)
│  이 날의 폴라로이드가 약간 더 큼 (80x100)

━━━━ 2월 ━━━━
```

**인터랙션:**
- 각 썸네일 클릭 → `/diary/[id]` 이동 (기존 sheet 걷어내기 or 유지 선택)
- 상단 "오늘 아직 안 적었어요" CTA 버디 카드 (D-1 과 연결, D-1 에 포함되어 있으면 duplicate 제거)
- 월 헤더는 sticky (scrolling 시 현재 월 상단 고정)

**캘린더를 원하는 유저:** `/logs` 페이지 (이미 존재) 를 "월간 보기" 로 rebrand. 홈 = 타임라인, `/logs` = 달력 뷰 로 분기.

**수용 기준:**
- [ ] 홈 메인 feed 가 타임라인
- [ ] `/logs` 페이지가 달력 뷰 접근성 제공 (유저 selection)
- [ ] 마일스톤 day (7, 30, 100, 365) 에 시각 differentiation
- [ ] 무한 스크롤 or "더 보기" 버튼 (180개 초과 일기)
- [ ] Empty state: 일기 0개 → D-4 buddy-resting + "첫 폴라로이드를 기다리는 중"

---

## D-8 · Onboarding Step 6 (확정) 리빌 재설계

**문제:** 4문항 다 답하고 step 6 가면 *카드 한 장에 코드 + 프롬프트 fragment* 만 보임. 짠! 순간이 없음.

**목표:** *"와, 이게 우리 강아지구나"* 모먼트. 폴라로이드 스타일 대형 이름표 + 3 키워드 카드.

**수정 파일:**
- `app/onboarding/steps/[step]/page.tsx` — `ConfirmStep` 섹션 전체 재작성

**UI 구성:**

```
(step 6 입장 시 stagger animation)

  [ 프로필 사진 원형, 120px, onboarding 에서 업로드된 이미지 ]
                  (0ms)

              마루는  (200ms fade-in)
               (14px, mute)

              ENFP
       (64px, 명조체, bold, 400ms, scale 0.9 → 1)

           · 냄새 탐정 ·  (600ms)
           (18px, 명조체, accent color)

  ┌─────────────────────────────────┐  (800ms, slide up)
  │ 이런 친구야:                      │
  │                                  │
  │  - 사람 많은 데 좋아함              │
  │  - 현재 순간 중심                  │
  │  - 감정 교감 (~야/~어 말투)        │
  │  - 즉흥적 탐험가                  │
  └─────────────────────────────────┘

     [ 저장할게요 (primary button) ]  (1000ms)
     [ 다시 답할래요 (ghost) ]
```

**카피 pool:**
- 각 MBTI 코드마다 3~4 줄 "이런 친구야" 키워드. `lib/pet-mbti.ts` 에 `characterTraits: Record<PersonalityCode, string[]>` 추가.
- 예 ENFP: `["사람 많은 데 좋아함", "현재 순간 중심", "감정 교감 (~야/~어 말투)", "즉흥적 탐험가"]`

**수용 기준:**
- [ ] 16개 성격 코드 모두 traits 작성 완료
- [ ] stagger reveal 1.0s 안에 완료
- [ ] reduced-motion 시 전부 즉시 노출
- [ ] "다시 답할래요" → step 2 로 back, draft 유지
- [ ] 저장 실패 시 draft 유지, 에러 메시지 노출 (기존 로직)

---

## D-9 · 빈 상태 & 에러 페이지 일러스트 통합

**문제:** `EmptyState`, `error.tsx`, `not-found.tsx`, `global-error.tsx` 가 텍스트만. 실패/비어있음이 "차가운 시스템 에러" 감각.

**목표:** D-4 일러스트 + D-2 1인칭 카피로 모든 빈/에러 상태를 따뜻하게 재정비.

**수정 파일:**
- `app/error.tsx` — `buddy-tilted` + `"뭐가 잘 안 됐어. 잠깐 다시 해볼래?"`
- `app/not-found.tsx` — `buddy-tilted` + `"이 페이지는 없는 것 같아."`
- `app/global-error.tsx` — `buddy-tilted` (상자 밖이라 currentColor fallback 고려) + `"이런. 잠깐 크게 엇나갔어."`
- `components/empty/empty-state.tsx` — prop `variant: 'resting' | 'tilted' | 'happy' | 'none'` 추가. 기본 `none` (현재 동작 유지).
- `app/b/[slug]/page.tsx` — EmptyState 에 `variant="resting"` 적용

**수용 기준:**
- [ ] 모든 에러/빈 화면에 일러스트
- [ ] 카피 1인칭 일관
- [ ] global-error 는 font 가 아직 로드 안 됐을 수 있으므로 system-ui fallback 준비

---

## D-10 · 감정 스티커 (캘린더 점 대체)

**문제:** 현재 캘린더 그리드의 기록 있는 날 표시 = 6px 테라코타 점. 의미 없음.

**목표:** LLM 생성 시 그 날의 **감정 키워드** 1개 추출 → 색상으로 표시. 1년 보면 *감정 지도* 자동 완성. 공유 가능 asset.

**기술 스펙:**

1. **DB 변경:**
   ```sql
   -- supabase/migrations/20260421_add_diary_mood.sql
   ALTER TABLE diaries ADD COLUMN mood TEXT;
   -- enum: 'bright', 'calm', 'tired', 'curious', 'grumpy', 'lonely'
   ```
2. **LLM 프롬프트 수정:** system prompt 에 *"mood 1개 선택 (bright/calm/tired/curious/grumpy/lonely)"* 추가. Structured output.
3. **시각 매핑 (DESIGN.md §3 추가 토큰, `[design-system]` 라벨):**
   - bright: `#e07a5f` (accent 그대로)
   - calm: `#a8b5a0` (세이지)
   - tired: `#6b7280` (mute 그대로)
   - curious: `#d4a256` (warn 그대로, 호박색)
   - grumpy: `#8a6fa3` (muted 라벤더)
   - lonely: `#5a7a8a` (blue-grey)
4. **UI:** 캘린더 점 대신 6색 원. 타임라인 (D-7) 썸네일 border 색으로도 사용.

**수용 기준:**
- [ ] Migration forward-only, 기존 diary 는 `mood=NULL` 허용
- [ ] LLM 호출 성공 시 mood 채움. 실패 시 fallback `calm`
- [ ] 색상 토큰 DESIGN.md §3 에 "Mood palette" 섹션 추가
- [ ] "감정 지도" 뷰 (`/logs/mood-map`) 는 별도 티켓 (D-10.1 차후)

---

# 🔴 Tier 3 — Moat, 10x 아이디어

## D-11 · "오늘의 callback" 홈 모듈

**문제:** `pet_memory_summary.recent_callbacks` 는 DB에 쌓이고 있지만 UI에 전혀 안 드러남. 제품의 moat 가 투명.

**목표:** *매일 볼 이유*. 강아지가 나랑 시간을 쌓고 있다는 증거를 UI 에 expose.

**수정 파일:**
- **신규:** `components/home/callback-strip.tsx`
- **수정:** `app/page.tsx` — fetch `pet_memory_summary.recent_callbacks` 추가
- **수정:** `components/home/buddy-card.tsx` 아래에 삽입

**UI:**

```
┌──────────────────────────────────────────────┐
│  지난 이야기                                    │
│  ────────────────────────                     │
│  "1주일 전엔 비 와서 산책 못 갔는데,             │
│   오늘은 쨍해서 신나!"                          │
│                                               │
│  (명조체, 14px, mute 배경 paper)                │
└──────────────────────────────────────────────┘
```

**데이터 형태:**
- `recent_callbacks: [{ref_date, ref_diary_id, fragment, created_at}[]]`
- 가장 최근 1개를 홈에 노출. 클릭 → 원본 diary

**초기 상태 (기록 < 3개):**
- callback 대신 forward-tease:
  `"아직 기록이 적어. 3일만 더 쌓이면 나 너랑 이야기 꺼낼 수 있어."`

**수용 기준:**
- [ ] 기록 3개 이상 시 자동 expose
- [ ] `recent_callbacks` 비어있으면 기본 인사로 fallback
- [ ] 클릭 시 원본 diary 로 이동
- [ ] pet_memory_summary worker (pg_cron) 가 callback 을 정기 업데이트 (LLM pipeline 연결은 별도 티켓)

---

## D-12 · 마일스톤 자동 Recap 폴라로이드

**문제:** 7일, 30일, 100일, 365일 moment 가 지나가도 UI 에서 축하 없음.

**목표:** 자동으로 **recap 폴라로이드 카드** 생성 → 공유 가능 asset. Retention × viral 동시.

**기술:**
- pg_cron: 매일 00:00 Asia/Seoul, 각 pet 의 `days_since_created` 가 7/30/100/365 에 닿으면 `milestone_cards` 테이블 INSERT.
- Edge Function: satori 템플릿으로 `milestone-7/30/100.png` 생성. 대표 사진 3장 + MBTI + "이런 아이야" 1줄 + days stat.
- UI: 홈 상단 dismissible banner `"100일 축하 카드가 도착했어! [보러가기]"`.

**마일스톤 템플릿 (`components/milestone/recap-template.tsx`, satori):**

```
┌─ 1080x1920 (9:16) ─────────────────────────┐
│                                            │
│     100일째 (명조체, 72px, accent)           │
│     마루의 이야기                             │
│                                            │
│    [3장 부채꼴 폴라로이드 stack]              │
│                                            │
│  ENFP · 냄새 탐정                           │
│  폴라로이드 47장 · 100일                     │
│                                            │
│  "사람 많은 데 좋아하고                       │
│   냄새를 잘 맡는 우리 아기"                    │
│                                            │
│  ─ buddy-note                              │
└────────────────────────────────────────────┘
```

**수용 기준:**
- [ ] `milestone_cards` 테이블 + RLS (owner only)
- [ ] 공유 URL `/m/[id]` 공개 (slug_reserved 테이블에 `m` 추가)
- [ ] 9:16 / 4:5 / 1:1 3 포맷 렌더
- [ ] 홈 배너 dismiss 후 30일 재노출 금지 (localStorage)

---

## D-13 · Upload = 대화형 UX

**문제:** 현재 upload form = `[사진 고르기] [태그 풍선] [메모] [버튼]`. 필드 병렬 배치, 강아지 대화 감각 없음.

**목표:** *질문-대답 sequence*. "오늘 뭐 했어?" → 태그 → 사진 → 메모 → submit.

**수정 파일:**
- `app/log/upload-form.tsx` — 전체 리팩토링 (기존 form 데이터 구조 유지, UI 만 step-wise)
- **신규:** `components/log/conversational-upload.tsx`

**UI flow (모바일 full-screen):**

```
  Step 1:
    [ 버디 아바타 말풍선 ]  "오늘 뭐 했어?"
    [ 산책 ] [ 밥 ] [ 놀이 ] [ 낮잠 ] ...
    [ 다음 (선택한 태그 1개 이상) ]

  Step 2:
    [ 말풍선 ] "사진 찍어둔 거 있어?"
    [ 폴라로이드 드롭존 -1.2° ]
    [ 다음 ]

  Step 3:
    [ 말풍선 ] "엄마가 뭐 말해줄 거 있어?" (선택)
    [ textarea ]
    [ 이야기 만들어줘 (submit) ]
```

**기존 UploadForm 호환:**
- Server action `createLog` 변경 없음 (FormData 계약 유지)
- Storybook stories 업데이트

**수용 기준:**
- [ ] 3 step state machine (back/next, draft localStorage persist)
- [ ] 기존 EXIF strip + 업로드 로직 그대로
- [ ] 태그 0개여도 진행 가능 (v1 정책 유지)
- [ ] Accessibility: step 전환 시 focus management, `aria-live` 상태 알림

---

## D-14 · 야간 warm-dark 모드 `[design-system]`

**문제:** `.dark` 테마 정의는 있지만 검정 계열 (#111). 저녁 산책 시간 (실제 사용 시간대) 에 cold. `prefers-color-scheme` 자동 전환 미구현.

**목표:** *저녁 산책 시간용 warm-dark*. 검정 아닌 **어두운 베이지**. 종이 느낌 유지.

**DESIGN.md 수정:**

```diff
 ## Color
 ...
+
+### Dark (warm-dark)
+- --bg-dark: #2a241f (warm brown-black, 종이 느낌)
+- --paper-dark: #342c25
+- --ink-dark: #f4eee5 (crème white)
+- --ink-soft-dark: #c9bfb0
+- --mute-dark: #8a8073
+- --line-dark: rgba(244, 238, 229, 0.08)
+- accent: unchanged (#e07a5f, warm → 자연스럽게 읽힘)
+- accent-soft-dark: #4a3029
```

**수정 파일:**
- `app/globals.css` `.dark` 블록 값 교체
- `app/layout.tsx` — `class` toggle 로직 (기본 시스템 prefers, 저녁 시간 (19:00-06:00 KST) 에 자동 활성화는 optional)

**수용 기준:**
- [ ] `prefers-color-scheme: dark` 감지 시 자동 적용
- [ ] 수동 toggle `/pet` 설정 페이지에 "자동 / 라이트 / 다크" 3 옵션 (v1.5 로 defer OK)
- [ ] 모든 페이지 검수 (대비 4.5:1 WCAG AA 유지)
- [ ] 폴라로이드 카드는 다크 모드에서 `paper-dark` 배경, ink-dark 텍스트 — "갈색 크라프트지" 느낌

---

## D-15 · 커스텀 커서 & 폴라로이드 pin hover

**문제:** 데스크톱 공개 프로필 방문 시 특별한 게 없음. 모바일과 동일.

**목표:** *데스크톱 한정* micro-delight. 커서 = 압정. 폴라로이드 hover 시 *pin-drop* 애니메이션.

**수정 파일:**
- `app/b/[slug]/page.tsx` — 상단에 `cursor: url(...), auto` CSS
- **신규:** `public/cursor-pin.svg` 20×20 압정 SVG (테라코타 + 그림자)
- `components/public/public-diary-card.tsx` — hover 시 기존 rotate 0 + translateY 외에 *tiny shake* 추가 (80ms)

**조건:**
- `pointer: fine` + `min-width: 1024px` 미디어쿼리 안에서만
- 터치 디바이스 영향 X

**수용 기준:**
- [ ] 데스크톱 방문 시 커서 교체
- [ ] 모바일 영향 0
- [ ] 접근성: custom cursor 가 link/button focus 에 방해 X (focus ring 우선)

---

# 🟢 추가 요청 (2026-04-22 반영)

## D-16 · 하단 네비게이션 3-탭 재편

**문제:** 현재 bottom nav = `홈 / 마이페이지` 2탭. 홈이 캘린더 뷰지만 주간/월간 전환 UI가 없음. 정보 아키텍처가 평탄해 "뷰 전환" 개념이 숨어 있음.

**목표:** 주요 사용 시나리오인 *"이번 주 기록 훑기"* 와 *"한 달 통째로 보기"* 를 탭으로 분리 → discoverability + 탭별 목적 명확화.

**수정 파일:**
- `components/layout/bottom-nav.tsx` — 3-탭 구조로 변경
- **신규:** `app/week/page.tsx` — 주간 뷰 (현재 `/` 의 buddy card + 이번 주 타임라인)
- `app/page.tsx` — 홈(기본)을 주간 뷰로 redirect 또는 `/week` 과 합치기. 결정: `/` = 주간 뷰 유지, `/month` 를 새로 생성
- **신규:** `app/month/page.tsx` — 월간 캘린더 뷰 (기존 `CalendarHome` 이관 + 발자국 적용, D-17 연결)
- `app/pet/page.tsx` — 그대로 `/pet` (`내 정보` 탭 target)
- `components/layout/bottom-nav.tsx` `HIDDEN_PREFIXES` 업데이트

**탭 구조:**

```
┌─────────────────────────────────────────────┐
│   [ 주간 ]     [ 월간 ]     [ 내 정보 ]          │
│   CalendarDays  Grid3X3     UserRound          │
│   (lucide)      (lucide)    (lucide)           │
└─────────────────────────────────────────────┘
```

| 탭 | 라벨 | 아이콘 (Lucide) | 경로 | 역할 |
|---|---|---|---|---|
| 1 | **주간** | `CalendarDays` (2px stroke) | `/` | buddy card + 이번 주 타임라인 (D-1, D-7, D-11 통합) |
| 2 | **월간** | `Grid3X3` or `LayoutGrid` | `/month` | 캘린더 그리드 + 발자국 마커 (D-17) |
| 3 | **내 정보** | `UserRound` | `/pet` | 기존 마이페이지 |

**"+" FAB (optional):**
3-탭 하단 중앙에 **elevated 기록 버튼** 은 **v1.5 로 defer**. 현재 v1 은 cell-tap(월간) 또는 주간 "오늘 기록하기" CTA 로 진입 — double entry 혼선 방지 위해 FAB 제외.

**라벨링 원칙:**
- 한글 2글자 유지 (탭 간 정렬)
- Active 탭: 테라코타 + 아이콘 stroke 2.2px
- Inactive: mute 컬러 + stroke 1.8px (기존 유지)

**수용 기준:**
- [ ] 3 탭 모두 `min-height: 56px`, touch target 44×44 이상
- [ ] 주간/월간 탭 전환 시 상태 유지 (scroll position 각각 유지)
- [ ] 주간 ↔ 월간 간 **같은 pet 컨텍스트 유지** (month picker 상태는 개별)
- [ ] 공개 프로필 `/b/[slug]`, 온보딩, auth 페이지에서는 hidden (기존 HIDDEN_PREFIXES 확장)
- [ ] aria-current="page" active 탭에 명시
- [ ] 3-탭 그리드 (`grid-cols-3`) 반응형 (모바일 기본, 태블릿에서 컨텐츠 max-width 제한)

**D-1 / D-7 / D-11 연결:** D-16 의 주간 탭이 D-1 (버디 카드) + D-7 (타임라인) + D-11 (callback) 통합 컨테이너가 됨.

---

## D-17 · 캘린더 기록 마커 → 강아지 발자국

**문제:** 월간 캘린더에서 기록 있는 날 = 6px 테라코타 점. 강아지 서비스인데 생명감 없음.

**목표:** 점 대신 **강아지 발자국 SVG**. 브랜드 정체성 (강아지 = 주인공) 을 캘린더에까지 확장.

**수정 파일:**
- **신규:** `components/icons/paw-print.tsx` — 16px 기본 SVG 아이콘
- `components/home/calendar-home.tsx` — 셀 내 dot 위치에 `<PawPrint />` 렌더 (D-16 이관 후엔 `app/month/page.tsx` 의 grid)
- `app/globals.css` — 필요 시 `.paw-marker` utility 추가

**SVG 스펙:**

```tsx
// components/icons/paw-print.tsx
export function PawPrint({
  size = 16,
  className,
  ...props
}: SVGProps<SVGSVGElement> & { size?: number }) {
  return (
    <svg
      width={size} height={size}
      viewBox="0 0 24 24"
      fill="currentColor" stroke="none"
      aria-hidden="true"
      className={className}
      {...props}
    >
      {/* 4 toe pads — 좌측부터 시계 방향 arc */}
      <ellipse cx="6.5" cy="9.5" rx="1.6" ry="2.2" transform="rotate(-25 6.5 9.5)" />
      <ellipse cx="10" cy="6"   rx="1.7" ry="2.4" transform="rotate(-8 10 6)" />
      <ellipse cx="14" cy="6"   rx="1.7" ry="2.4" transform="rotate(8 14 6)" />
      <ellipse cx="17.5" cy="9.5" rx="1.6" ry="2.2" transform="rotate(25 17.5 9.5)" />
      {/* Main pad — 하트 형태 */}
      <path d="M12 11.5c-3.6 0-5.5 2.6-5 5.5.4 2.7 2.3 4 5 4s4.6-1.3 5-4c.5-2.9-1.4-5.5-5-5.5z" />
    </svg>
  )
}
```

**색상 전략:**
- 기본: `currentColor` → 셀 안에서 `text-[var(--color-accent-brand)]` 상속
- mood 연동 시 (D-10): 해당 mood 컬러로 paw 색 변화
- 오늘 셀의 paw: stroke 살짝 더 굵게 or scale 1.1
- Multi-entry 하루(향후): paw 2개 겹침 (시각 누적감)

**크기:**
- 캘린더 셀 내부: 14~16px (셀 크기 42-44px 기준)
- 타임라인 thumb 코너 (D-7 연결): 12px, 폴라로이드 하단 오른쪽 모서리 accent
- 공개 프로필 footer 장식: 20px, opacity 0.25

**접근성:**
- 아이콘 자체는 `aria-hidden`
- 셀의 `aria-label` 에 "기록 있음" 유지 (scr reader 는 텍스트로만)

**수용 기준:**
- [ ] `<PawPrint />` inline SVG 컴포넌트 구현
- [ ] 캘린더 셀 dot 전부 교체 (4군데 이상 DOM 검색 필요)
- [ ] 오늘 셀 paw 는 `accent-brand` + 2% darker stroke
- [ ] 다크 모드 (D-14) 에서 paw 색 자동 반전 (currentColor)
- [ ] Storybook 카드: 4 size × 3 color

---

## D-18 · Onboarding 자유 기술 단계 (최대 200자)

**문제:** 4문항 MBTI + 이름/견종/호칭만으로는 **개별성** 이 부족. 같은 ENFP 강아지라도 "혼자서도 잘 놀지만 엄마 없으면 짖음" 같은 실제 디테일은 못 담음. LLM 페르소나가 flat.

**목표:** 마지막 확정 직전 **1 step 추가** — "내 강아지에 대해 더 알려줄래?" 자유 기술 (최대 200자). 이 값이 `persona_prompt_fragment` 에 append 되어 LLM 호출의 tone/callback 품질을 즉시 올림.

**수정 파일:**
- `app/onboarding/steps/[step]/page.tsx` — TOTAL_STEPS 7 → **8**, step 6 = 자유 기술, step 7 = confirm
- **신규:** `components/onboarding/free-description-form.tsx`
- `components/onboarding/onboarding-storage.ts` — draft 타입에 `additionalInfo: string` 추가
- `app/onboarding/actions.ts` — `savePet` FormData 에 `additionalInfo` 받기 + DB insert
- `lib/pet-mbti.ts` — `buildPersonaPromptFragment` 시그니처에 `additionalInfo?: string` 추가. 있으면 ` / 보호자가 들려준 이야기: "..."` 추가
- **Migration:** `supabase/migrations/20260422_add_pet_additional_info.sql`

```sql
-- forward-only
ALTER TABLE pets ADD COLUMN additional_info TEXT;
ALTER TABLE pets ADD CONSTRAINT additional_info_length
  CHECK (additional_info IS NULL OR char_length(additional_info) <= 200);
```

**Step 배치:**

| Step | 내용 |
|---|---|
| 0 | 이름 + 견종 + 프로필 사진 |
| 1 | 반려인 호칭 |
| 2~5 | MBTI 4문항 |
| **6 (신규)** | **자유 기술 — 200자** |
| 7 | 확정 (기존 6) |

**UI 구성:**

```
(폴라로이드 카드, -0.6deg)

  시작하기
  ──────────────

  마루에 대해 더 알려줄래?  (H1, 20px)

  버디만의 습관이나 좋아하는 것, 성격.
  한두 줄이면 충분해요. 나중에 수정할 수 있어요.
  (14px, ink-soft)

  ┌──────────────────────────────────────┐
  │ (textarea, 명조체 15px, 5행, placeholder:
  │  "예) 산책 가면 집 앞 전봇대에 꼭 인사함.
  │   엄마랑 눈 맞추면 반드시 한 번 짖음.")   │
  │                                       │
  │                                       │
  └──────────────────────────────────────┘
                              128 / 200
```

**카피:**
- Heading: `"${petName}에 대해 더 알려줄래?"` (강아지 이름 동적 삽입)
- Hint (1인칭 voice bending, D-2 연결):
  - `"버디만의 습관이나 좋아하는 것, 어떻게 봐도 '얘다' 싶은 순간. 한두 줄이면 충분해."` (강아지 voice)
  - 또는 (보호자 voice): `"우리 아이의 성격이 잘 드러나는 버릇이나 일화를 짧게 남겨주세요."`
- Placeholder 예시 (persona-aware, 선택): 랜덤 로테이션으로 3-4개
  - `"예) 산책 가면 집 앞 전봇대에 꼭 인사함."`
  - `"예) 엄마 퇴근 발소리를 3층 밑에서 알아채요."`
  - `"예) 간식 받을 때만 앉아—평소엔 절대 앉지 않음."`
- Skip 허용: "건너뛰기" 텍스트 링크. 빈 값이면 `NULL` 저장

**글자 수 카운트:**
- 실시간 `128 / 200` 우하단 표시
- 200자 초과 시 입력 블록 + `"200자까지만 담을 수 있어."` 경고
- 160자 넘으면 숫자 색 `--color-warn` 으로 전환

**LLM 프롬프트 주입:**
```ts
// lib/pet-mbti.ts — buildPersonaPromptFragment
let fragment = `나는 ${name}, ${breed} 강아지야. ...`  // 기존
if (additionalInfo?.trim()) {
  fragment += ` / 보호자가 들려준 이야기: "${additionalInfo.trim()}"`
}
```

**수용 기준:**
- [ ] Migration forward-only, 기존 pet 은 `additional_info = NULL` 허용
- [ ] Onboarding 진행률 바 (Progress) total 이 8 로 업데이트
- [ ] 확정 step 에서 자유 기술 값 preview 표시 (명조체 blockquote)
- [ ] 자유 기술 없어도 저장 성공
- [ ] 200자 초과 server-side validation (`actions.ts`) + client-side 모두
- [ ] `/pet/edit` 에서 수정 가능 (차후 티켓)
- [ ] draft localStorage 에 persist

---

# 📋 교차 관심사

## 체크리스트 (T1 완료 후 공통)

- [ ] `DESIGN.md` change log 에 v0.2 entry 추가 (D-6, D-10, D-14 수정분)
- [ ] `CLAUDE.md` "파일 수정 전 읽을 것" 표에 `DESIGN_TODOS.md` 추가
- [ ] Storybook 모든 신규 컴포넌트 (buddy-card, shutter-reveal, illustrations, profile-hero) stories 작성
- [ ] Lighthouse 퍼포먼스 회귀 검사 (T1 merge 전후)
- [ ] a11y pass (axe-core): focus order, `aria-label`, contrast
- [ ] 모바일 Safari / Chrome / Firefox 실기기 검수

## 의존성 그래프

```
D-4 (일러스트) ──┬──> D-3 (찰칵)
                └──> D-9 (빈상태)
                └──> D-1 (홈 hero, 아바타 fallback)

D-6 (명조체 확장) ──> D-1, D-5, D-8

D-1 (홈 hero) ──> D-7 (타임라인, 상단 CTA 중복 제거)
             └──> D-11 (callback, 아래 삽입)

D-10 (mood) ──> D-7 (타임라인 색상)

D-2 (카피) ──> 모든 티켓 (voice guideline 참조)
```

→ **시작 순서:** D-4 → D-6 → D-2 → D-1 → D-3 → D-5 → (T1 완료) → D-8, D-9, D-7, D-10 병렬.

## 측정 지표

- **D-1 효과:** 홈 → `/log` 이동률. 홈 체류 시간.
- **D-3 효과:** diary 생성 → `/b/[slug]` 공유 클릭률.
- **D-5 효과:** 공개 프로필 방문 → "나도 만들어보기" CTA 클릭률.
- **D-11, D-12 효과:** DAU retention (D7, D30, D100).

---

## 📎 참고 외부 아티팩트

- `~/.gstack/projects/new-project/bao-main-design-review-20260419-150058.md` — 폴라로이드 확정 배경
- `~/.gstack/projects/new-project/ceo-plans/2026-04-19-buddy-note.md` — 공개 프로필 = 바이럴 자산 논의
- `DESIGN.md` v0.1 — 현행 SSOT (수정 시 `[design-system]` PR 라벨)
- `rules/code-conventions.md` — 톤/카피 규율 원칙

---

**문의/이터레이션:** 이 파일이 v0. 실제 구현 중 발견되는 edge case 는 각 티켓 하단 `## 진행 노트` 섹션을 추가해 기록.

**변경 로그**
- **v0 — 2026-04-21** — 초안 생성. 15 티켓, 3 tier.
