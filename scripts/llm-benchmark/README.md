# LLM Benchmark Harness

buddy-note v1 에서 사용할 비전-LLM을 데이터로 결정하기 위한 **실증 A/B 테스트 하네스**.
같은 사진 + 같은 한국어 프롬프트를 GPT-4o / Claude Sonnet 4.6 / Gemini 2.5 Flash 에
병렬로 던지고, 결과를 side-by-side 로 비교하여 사람이 루브릭으로 수동 채점한다.

## 목적

- "어느 모델이 반려동물 1인칭 일기를 제일 잘 쓰는가?" 를 **느낌이 아니라 데이터**로 결정.
- 축은 4개: 창의성 / 페르소나 적합성 / 한국어 자연스러움 / 디테일 근거.
- 비용/속도까지 함께 측정하여 **품질-비용 trade-off** 를 가시화.

## 사용법 (3단계)

### 1. API 키 설정

```bash
cp .env.example .env
```

`.env` 에 3개 키를 넣는다:

- `OPENAI_API_KEY`
- `ANTHROPIC_API_KEY`
- `GOOGLE_API_KEY`

### 2. 사진 준비

`./photos/` 디렉토리에 강아지/고양이 사진을 5~10장 넣는다.

- 포맷: `.jpg` / `.jpeg` / `.png`
- 파일명은 **영문** 권장 (한글도 동작하지만 결과 디렉토리 경로가 깔끔하지 않을 수 있음)
- 다양한 장면(실내/야외/산책/잠/간식)을 섞으면 모델 특성이 더 잘 드러남

### 3. 실행

```bash
bun install
bun run bench
```

사진 1장당 3개 모델을 병렬 호출하므로, 10장 × ~3–8초 ≈ 30–80초 정도 걸린다.

## 결과 해석

실행이 끝나면 아래 파일들이 생성된다:

```
results/
  <photo-basename>/
    gpt-4o.md
    claude-sonnet-4-6.md
    gemini-2.5-flash.md
  comparison-<timestamp>.md
```

1. `comparison-<timestamp>.md` 파일을 연다. 상단에 레이턴시/토큰/비용 요약이 있고,
   이어서 사진별 side-by-side 출력이 나온다.
2. **수동 채점 루브릭** 섹션으로 내려가면 사진별 채점 표가 있다. 각 모델에 대해
   4개 축(창의성 / 페르소나 / 한국어 / 디테일 근거)을 **1–5점**으로 채워 넣는다.
3. 사진을 다 채점했다면 **최종 모델별 평균** 표에 각 모델의 축별 평균과 종합 평균을 적는다.

### 판정 기준

- **종합 평균 4.0 이상** 모델만 v1 후보.
- 후보 중 비용/속도 최선을 선택.
- 동점이면 창의성/페르소나 축을 우선 (마케팅 임팩트 관점).

## 비용 추정 (2026-04 기준)

| 모델 | Input ($/1M tok) | Output ($/1M tok) |
| --- | ---: | ---: |
| GPT-4o | $2.50 | $10.00 |
| Claude Sonnet 4.6 | $3.00 | $15.00 |
| Gemini 2.5 Flash | $0.30 | $2.50 |

실제 호출당 비용은 `comparison-*.md` 의 요약 테이블과 모델별 합계에 자동 표시된다.

## 구조

- `benchmark.ts` — 메인 스크립트 (사진 로드 → 3모델 병렬 호출 → 결과 쓰기)
- `package.json` / `tsconfig.json` — 자립형 Bun 서브프로젝트
- `.env.example` — API 키 템플릿
- `photos/` — 입력 사진 디렉토리
- `results/` — 실행 결과 (gitignore됨)

이 디렉토리는 완전히 자립적이다. 필요 없어지면 `scripts/llm-benchmark/` 를 통째로
지워도 메인 프로젝트에 영향 없음.
