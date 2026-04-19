# TODOS

Deferred work from `/office-hours` + `/plan-ceo-review` sessions.
Format: Priority (P1/P2/P3) + Effort (S/M/L/XL, 인간 teams / CC+gstack compressed).

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
