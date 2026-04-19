# TODOS

Deferred work from `/office-hours` + `/plan-ceo-review` sessions.
Format: Priority (P1/P2/P3) + Effort (S/M/L/XL, 인간 teams / CC+gstack compressed).

---

## 🟠 당신(bao)이 할 일 — Week 0 Critical Path

> 내(Claude)가 코드는 병렬로 만들어놨고, 이 항목들은 **당신만 할 수 있는 일**. 하나씩 처리하고 알려주면 다음 단계 이어감.

### [C1] 🔴 카카오 비즈앱 등록 (최우선, 3-7일 승인 대기)
- **소요**: 10분 신청 + 3-7일 대기
- **링크**: <https://developers.kakao.com>
- **단계**: 애플리케이션 추가 → 앱 이름 `buddy-note` → 사업자 카카오 채널 연결 → 도메인/Redirect URI는 나중에 Vercel 도메인 확정 후 추가
- **왜 지금**: Week 3 OAuth 연동 시점에 승인 완료되어 있어야 함. 지금 신청 안 하면 critical path 밀림.
- **끝나고 알려줄 것**: 앱 REST API 키, JavaScript 키 (Supabase 연동 시 필요)

### [C2] 🔴 Supabase 프로젝트 생성 (블로커 해제)
- **소요**: 5분
- **링크**: <https://supabase.com/dashboard>
- **단계**: New project → 이름 `buddy-note` → **Region: Northeast Asia (Seoul, ap-northeast-2)** ← 중요 → DB password 생성 + 안전한 곳에 저장
- **왜 지금**: 모든 schema/auth/storage/RLS 작업의 블로커. 이거 안 되면 dev 환경에서 로그인조차 안 됨.
- **끝나고 할 일**: Settings → API에서 URL + anon key + service role key 복사 → 아래 C3 진행

### [C3] 🔴 `.env.local` 채우기
- **소요**: 3분
- **단계**:
  ```bash
  cd /Users/bao/dev/new-project
  cp .env.example .env.local
  ```
  Supabase 값 4개 채우기:
  - `NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY=...`
  - `SUPABASE_SERVICE_ROLE_KEY=...`
  - `ANTHROPIC_API_KEY=...` (Claude Sonnet 4.6용, <https://console.anthropic.com>)
- **끝나면**: dev server 자동 리로드, "로그인 필요"로 표시됨 (env 경고 사라짐)

### [C4] 🟡 Supabase schema migration 적용
- **소요**: 5분
- **전제**: C2 완료, Supabase CLI 설치 (`brew install supabase/tap/supabase`)
- **단계**:
  ```bash
  cd /Users/bao/dev/new-project
  supabase link --project-ref <프로젝트 ref>   # Supabase 대시보드 URL에서 복사
  supabase db push                              # migrations/ 아래 SQL 자동 적용
  ```
- **검증**: Supabase 대시보드 → Table Editor에 `pets`, `logs`, `diaries`, `pet_memory_summary`, `memory_update_queue`, `slug_reserved` 6개 테이블 보이면 OK
- **RLS 체크**: 각 테이블 → Policies 탭에 정책 들어가 있는지

### [C5] 🟡 LLM A/B 벤치마크 실제 실행 (Week 2 블로커)
- **소요**: 30-45분
- **단계**:
  1. 본인/친구 강아지·고양이 사진 5-10장 준비 (jpg/png, 영문 파일명 권장)
  2. `scripts/llm-benchmark/photos/` 에 복사
  3. `cp scripts/llm-benchmark/.env.example scripts/llm-benchmark/.env` → 3개 API 키 입력 (OpenAI, Anthropic, Google)
     - OpenAI: <https://platform.openai.com>
     - Anthropic: <https://console.anthropic.com>
     - Google AI: <https://aistudio.google.com/apikey>
  4. `cd scripts/llm-benchmark && bun install && bun run bench`
  5. `results/comparison-*.md` 열어서 rubric 4축(창의성 / 페르소나 / 한국어 / 디테일) 각 1-5점 수동 채점
- **판정**: 평균 4.0+ 모델 중 **비용·속도 최선**을 v1 LLM으로 확정
- **끝나고 알려줄 것**: 선택한 모델 — CEO plan의 "Claude Sonnet 4.6" 가정이 맞는지, 아니면 변경할지

### [C6] 🟢 친구 강아지 3마리로 MBTI 5문항 검증
- **소요**: 주말 1-2시간
- **단계**: `docs/pet-mbti-questions-v0.md` 열어서 친구한테 카톡으로 5문항 물어보기 (3마리 주인, 서로 다른 성격대)
- **검증**: 각 답변을 LLM에 돌려서 diary 생성 → 주인한테 "우리 아이 같은가?" 1-5점 평가
- **기준**: 평균 4.0+ = 합격. 미만이면 문항 수정해서 v0.1
- **끝나고 알려줄 것**: 합격/수정 결과 → v0.1 업데이트

### [C7] 🟢 GitHub repo 생성 + push (v1 ship 준비)
- **소요**: 3분
- **단계**:
  ```bash
  gh repo create buddy-note --private --source=. --remote=origin
  git push -u origin main
  ```
  (`gh` 설치되어 있다면. 아니면 github.com에서 New repo 만들고 remote add)
- **왜 필요**: Vercel 배포 트리거 + CI/CD + 팀 협업 시.
- **끝나면 알려줄 것**: repo URL

### [C8] 🟢 폰트 라이선스 최종 확인
- **소요**: 10분
- **Pretendard**: OFL-1.1 (상업 사용 OK, <https://cactus.tistory.com/306>)
- **Nanum Myeongjo**: SIL OFL 1.1 (상업 사용 OK)
- **확인 포인트**: satori 서버사이드 렌더 + 공유 이미지 상업 배포 용도로 문제 없는지 재확인. 문제 있으면 대체 폰트 물색.

---

## 🟢 내(Claude)가 이 세션에서 병렬로 처리 중 — 자동 진행

> 4 에이전트 동시 작업. 각자 파일 영역 독립.

- [ ] **Agent A**: `supabase/migrations/` — 테이블 6개 + RLS 전수 + slug_reserved 시드
- [ ] **Agent B**: shadcn/ui init + `app/globals.css`에 DESIGN.md 토큰 주입 + Tailwind 연결
- [ ] **Agent C**: `app/auth/` — 이메일 매직링크 login/callback/verify/signout
- [ ] **Agent D**: `app/onboarding/` — Pet 등록 + MBTI 5문항 stepper (폴라로이드 느낌)
- [ ] **메인 세션**: Pretendard/Nanum Myeongjo 폰트 셋업 + `app/layout.tsx` 통합 + 최종 커밋

완료 시 dev server에서 "로그인 → 강아지 등록 → MBTI 답 → 홈" vertical slice 동작 확인 가능. 단 C3 (env 채우기) 완료 후에 실제 login 동작.

---

## P1 — v1.5 (post-ship, DAU 50+)

### 월별 BEST MOMENT 투표 카드
- **What**: 매월 1일 cron이 지난 달 top 3 일기를 골라 유저에게 "이번 달 BEST?" 투표 카드 제시. 선택된 것이 공개 프로필 하이라이트 슬롯에 영구 박힘.
- **Why**: 30일 retention 앵커. 매월 앱을 다시 열 이유. 공개 프로필에 누적되는 자산.
- **Pros**: retention 직접 영향, 공유 유혹 강함.
- **Cons**: DAU 50 이상이어야 충분한 데이터 누적 (주당 기록 >3개). 초반 cold start 시 fallback 로직 필요.
- **Context**: CEO 리뷰에서 "DEFERRED" 판정. Week 5-6 ship 후 리텐션 데이터 보고 v1.5.
- **Effort**: M (2-3일) / CC+gstack S (1시간).
- **Depends on**: v1 ship, DAU 50+ 도달, diaries 테이블 월간 조회 쿼리.

### ~~LLM API 장애 시 알림 + fallback 템플릿~~ → v1 승격 (2026-04-19 업데이트)
- **Status**: 원래 v1.5였으나 `/plan-eng-review` + `/plan-design-review` 두 리뷰가 독립적으로 "v1 승격" 권고 → **v1 scope로 이동**. CEO plan에 반영 완료.
- **v1 포함된 것**: template diary (`diaries.is_fallback=true`) + 재시도 1회 + 재시도 쿨다운 UI + 백그라운드 복구 cron + 정상 지연은 phase copy 4단계 UX.
- **여전히 v1.5**: LLM API health check cron + Discord webhook 관리자 알림 (API 키 quota/만료 감지). 이건 운영 관측 쪽이라 v1 밖.
- **Effort (v1.5 잔여)**: XS (2시간) / CC+gstack XS (15분).

---

## P2 — v2 (DAU 100+ 달성 후)

### Memorial 페이지 (떠나간 반려동물 영구 보관)
- **What**: `pets.deceased_at` 컬럼 + 메모리얼 모드 UI + 공개 추모 페이지. 무료, 영구.
- **Why**: 감정적 lock-in 최강. "다른 앱으로 옮기면 내 강아지가 두 번 죽는다"는 retention 앵커.
- **Pros**: 경쟁자가 따라하기 심리적 부담 큼.
- **Cons**: 감정적으로 민감한 UX 설계 필요, 법적 검토 (떠난 동물의 개인정보 처리).
- **Context**: CEO 리뷰에서 "v1 focus 유지" 이유로 SKIPPED. v1 유저 확보 후 재검토.
- **Effort**: M (2-3일) / CC+gstack S (30분 코드만). UX 설계는 별도.
- **Depends on**: 감정 UX 리서치, v1 유저 피드백.

### 산책 중 "오늘 마주친 친구" 매칭
- **What**: 유저가 산책 기록 시 위치/시간 유사한 다른 강아지를 자동 제안. 옵트인 하면 친구 맺기.
- **Why**: 네트워크 효과의 씨앗. 같은 동네 유저 있으면 앱이 즉시 유용해짐.
- **Pros**: community 가치, sticky, 오프라인 연결.
- **Cons**: 프라이버시 (위치 데이터), 안전 (모르는 사람 만남), cold start 문제.
- **Context**: CEO 리뷰에서 안전/프라이버시 이유로 SKIPPED. v2에서 설계.
- **Effort**: L (1-2주) / CC+gstack M (3-5시간 기술만). 법적/안전 검토 별도.
- **Depends on**: DAU 500+ (같은 동네 2명 이상 확률), PostGIS 설정, 프라이버시 정책.

---

## P3 — v2+ (장기)

### 1년 다큐멘터리 자동 편집 (유료 tier)
- **What**: 365일치 diary + 사진 + pet_memory_summary를 AI가 모아서 "OOO와 나의 1년" 릴스/숏츠 자동 편집.
- **Why**: 원래 사용자가 10x vision으로 제시한 것. 유료 전환의 강력한 훅.
- **Pros**: 감동 ceiling 가장 높음, 유료화 자연스러움.
- **Cons**: 영상 AI 비용 큼, 첫 유저가 1년치 데이터 가지려면 최소 12개월 대기.
- **Effort**: L / CC+gstack M. 인프라 구축 + 영상 AI 검증.

### 수의사/펫샵 B2B 파트너십 (QR 데이터 공유)
- **What**: 강아지 프로필에서 "병원용 요약" QR 생성. 수의사가 스캔하면 최근 30일 식사/운동/배변 패턴 확인.
- **Why**: 기록 앱의 "진지한" 가치 증명, B2B 유입 채널.
- **Effort**: M / CC+gstack S.

### 다국어 (영/일/중) 자동 번역
- **What**: 사용자 언어 설정에 따라 diary 번역본 동시 생성. 공개 프로필은 양쪽 다 보여짐.
- **Why**: 글로벌 SNS 확장, 해외 반려인 유입.
- **Effort**: S / CC+gstack XS (프롬프트 수정).

---

## 완료된 아이템 (v1 scope에 반영됨)

- ~~공개 강아지 프로필 URL~~ — v1 포함
- ~~AI 태그 자동 추천~~ — v1 포함
- ~~일기 제목에 이름~~ — v1 포함 (micro)
- ~~공유 이미지 날짜+날씨~~ — v1 포함 (micro)
