// Pet MBTI 5문항 데이터 + 페르소나 프롬프트 조립.
// Source of truth: docs/pet-mbti-questions-v0.md (v0).
// 질문/선지 한글 문장은 해당 문서와 verbatim 일치해야 함.

export type AxisKey =
  | 'energy'
  | 'social'
  | 'attachment'
  | 'stimulus'
  | 'routine'

export type OptionKey = 'A' | 'B' | 'C' | 'D'

export type QuestionId = 'q1' | 'q2' | 'q3' | 'q4' | 'q5'

export type Option = {
  key: OptionKey
  /** 유저에게 보이는 선지 카피 */
  label: string
  /**
   * 1인칭 자기소개 문장의 조각 (자연 연결형).
   * 예: "문 앞에 이미 도착해 있고".
   * buildPersonaPromptFragment 가 " / " 로 이어서 system prompt 에 주입.
   */
  prompt_fragment: string
}

export type Question = {
  id: QuestionId
  axis: AxisKey
  /** 상황 — 카드 상단 eyebrow */
  headline: string
  /** 질문 — 권유형 ("어떻게 반응해요?") */
  prompt: string
  options: Option[]
}

export type Answers = Record<QuestionId, OptionKey>

export const QUESTIONS: Question[] = [
  {
    id: 'q1',
    axis: 'energy',
    headline: '"산책 가자" 했을 때',
    prompt: '우리 아이는 어떻게 반응해요?',
    options: [
      {
        key: 'A',
        label: '문 앞에 이미 도착해있다',
        prompt_fragment: '에너지 폭발, 문 앞에 이미 도착해 있고',
      },
      {
        key: 'B',
        label: '꼬리만 흔들고 천천히 온다',
        prompt_fragment: '꼬리부터 살랑살랑 흔들면서 천천히 다가오고',
      },
      {
        key: 'C',
        label: '한 번 더 불러야 움직인다',
        prompt_fragment: '한 번 더 불러줘야 느긋하게 일어나고',
      },
      {
        key: 'D',
        label: '자고 있으면 산책보다 잠이 먼저다',
        prompt_fragment: '자고 있을 땐 산책보다 잠이 먼저인 차분한 타입이고',
      },
    ],
  },
  {
    id: 'q2',
    axis: 'social',
    headline: '공원에서 낯선 강아지가 다가올 때',
    prompt: '우리 아이는 어떻게 반응해요?',
    options: [
      {
        key: 'A',
        label: '먼저 달려가서 인사한다',
        prompt_fragment: '공원에서 처음 본 친구한테도 먼저 달려가서 인사하고',
      },
      {
        key: 'B',
        label: '관심은 있지만 주인 뒤에서 살핀다',
        prompt_fragment: '관심은 많지만 일단 엄마 뒤에서 살짝 살피고',
      },
      {
        key: 'C',
        label: '시선 돌리고 우리 갈 길 간다',
        prompt_fragment: '낯선 강아지는 슬쩍 지나치고 내 갈 길 가는 편이고',
      },
      {
        key: 'D',
        label: '짖거나 피한다',
        prompt_fragment: '낯선 애들한테는 조금 긴장해서 "나랑 거리 좀 둬" 하는 쪽이고',
      },
    ],
  },
  {
    id: 'q3',
    axis: 'attachment',
    headline: '가족이 화장실에 들어갈 때',
    prompt: '우리 아이는 어떻게 반응해요?',
    options: [
      {
        key: 'A',
        label: '문 앞에서 운다/긁는다',
        prompt_fragment: '엄마가 잠깐 화장실만 가도 문 앞에서 끙끙거리고',
      },
      {
        key: 'B',
        label: '문 앞에 앉아서 기다린다',
        prompt_fragment: '문 앞에 얌전히 앉아서 가족을 기다리고',
      },
      {
        key: 'C',
        label: '같은 방에서 잔다',
        prompt_fragment: '가족이랑 같은 방에서 자는 걸 좋아하고',
      },
      {
        key: 'D',
        label: '소파에서 혼자 잘 논다',
        prompt_fragment: '소파에서 혼자서도 잘 노는 독립적인 편이고',
      },
    ],
  },
  {
    id: 'q4',
    axis: 'stimulus',
    headline: '청소기 (또는 드라이기) 소리가 나면',
    prompt: '우리 아이는 어떻게 반응해요?',
    options: [
      {
        key: 'A',
        label: '일단 달려가서 짖는다',
        prompt_fragment: '청소기 소리에는 일단 달려가서 짖고 보는 대담한 쪽이고',
      },
      {
        key: 'B',
        label: '관찰한다, 천천히 다가간다',
        prompt_fragment: '새로운 소리나 물건은 천천히 관찰하면서 다가가보고',
      },
      {
        key: 'C',
        label: '멀찍이 자리 잡고 지켜본다',
        prompt_fragment: '멀찍이 자리 잡고 신중하게 지켜보고',
      },
      {
        key: 'D',
        label: '방에 숨는다',
        prompt_fragment: '예상 못한 소리엔 "깜짝 놀랐어" 하고 방으로 숨고',
      },
    ],
  },
  {
    id: 'q5',
    axis: 'routine',
    headline: '산책 루트를 바꾸면',
    prompt: '우리 아이는 어떻게 반응해요?',
    options: [
      {
        key: 'A',
        label: '새 길에 더 신난다',
        prompt_fragment: '새 길에 더 신나하는 탐험가 타입이야',
      },
      {
        key: 'B',
        label: '잠깐 헤매지만 금방 적응',
        prompt_fragment: '처음엔 잠깐 헤매도 금방 적응하는 유연한 타입이야',
      },
      {
        key: 'C',
        label: '원래 길 쪽으로 자꾸 끌어당긴다',
        prompt_fragment: '"맨날 가던 거기가 좋아" 하고 원래 길로 자꾸 끌어당기는 타입이야',
      },
      {
        key: 'D',
        label: '새 길은 거부하고 가만히 선다',
        prompt_fragment: '새 길은 단호하게 거부하고 멈춰 서는 루틴파야',
      },
    ],
  },
]

export const QUESTION_IDS: QuestionId[] = ['q1', 'q2', 'q3', 'q4', 'q5']

export function getQuestion(id: QuestionId): Question {
  const q = QUESTIONS.find((x) => x.id === id)
  if (!q) throw new Error(`Unknown question id: ${id}`)
  return q
}

export function isCompleteAnswers(
  partial: Partial<Answers> | undefined | null,
): partial is Answers {
  if (!partial) return false
  return QUESTION_IDS.every((id) => {
    const v = partial[id]
    return v === 'A' || v === 'B' || v === 'C' || v === 'D'
  })
}

/**
 * 5문항 답 + 이름/품종을 1인칭 자기소개 문장으로 조립.
 * docs/pet-mbti-questions-v0.md 의 "LLM 프롬프트 주입 포맷" 참조.
 *
 * 예시 출력:
 * "나는 마루, 푸들이야. 나를 한 줄로 말하면:
 *  에너지 폭발, 문 앞에 이미 도착해 있고 / 공원에서 처음 본 친구한테도 먼저 달려가서 인사하고
 *  / 엄마가 잠깐 화장실만 가도 문 앞에서 끙끙거리고 / 청소기 소리에는 일단 달려가서 짖고 보는 대담한 쪽이고
 *  / 새 길에 더 신나하는 탐험가 타입이야."
 */
export function buildPersonaPromptFragment(input: {
  name: string
  breed: string
  answers: Answers
}): string {
  const name = input.name.trim()
  const breed = input.breed.trim()

  const fragments = QUESTION_IDS.map((id) => {
    const q = getQuestion(id)
    const choice = input.answers[id]
    const opt = q.options.find((o) => o.key === choice)
    if (!opt) {
      throw new Error(`Missing answer for ${id}`)
    }
    return opt.prompt_fragment
  })

  const joined = fragments.join(' / ')
  const subject = breed ? `${name}, ${breed}` : name
  return `나는 ${subject}야. 나를 한 줄로 말하면:\n${joined}.`
}
