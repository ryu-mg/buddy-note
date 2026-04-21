// Pet MBTI 4축 데이터 + 페르소나 프롬프트 조립.
// MVP는 강아지 전용이며, 사람 MBTI 코드(E/I, S/N, T/F, J/P)를 차용한다.

export type AxisKey = 'ei' | 'sn' | 'tf' | 'jp'

export type MbtiLetter = 'E' | 'I' | 'S' | 'N' | 'T' | 'F' | 'J' | 'P'

export type PersonalityCode =
  | 'ISTJ'
  | 'ISFJ'
  | 'INFJ'
  | 'INTJ'
  | 'ISTP'
  | 'ISFP'
  | 'INFP'
  | 'INTP'
  | 'ESTP'
  | 'ESFP'
  | 'ENFP'
  | 'ENTP'
  | 'ESTJ'
  | 'ESFJ'
  | 'ENFJ'
  | 'ENTJ'

export type OptionKey = 'A' | 'B'

export type QuestionId = 'q1' | 'q2' | 'q3' | 'q4'

export type Option = {
  key: OptionKey
  letter: MbtiLetter
  /** 유저에게 보이는 선지 카피 */
  label: string
  /**
   * 1인칭 자기소개 문장의 조각.
   * buildPersonaPromptFragment 가 " / " 로 이어서 system prompt 에 주입.
   */
  prompt_fragment: string
}

export type Question = {
  id: QuestionId
  axis: AxisKey
  /** 상황 — 카드 상단 eyebrow */
  headline: string
  /** 질문 — 권유형 */
  prompt: string
  options: [Option, Option]
}

export type Answers = Record<QuestionId, OptionKey>

export type PersonalityResult = {
  code: PersonalityCode
  label: string
}

export const QUESTIONS: Question[] = [
  {
    id: 'q1',
    axis: 'ei',
    headline: '처음 보는 친구가 다가올 때',
    prompt: '버디는 보통 어떻게 반응해요?',
    options: [
      {
        key: 'A',
        letter: 'E',
        label: '먼저 다가가서 냄새 맡고 인사한다',
        prompt_fragment: '처음 보는 친구에게도 먼저 다가가 인사하는 외향적인 쪽이고',
      },
      {
        key: 'B',
        letter: 'I',
        label: '반려인 곁에서 천천히 살핀다',
        prompt_fragment: '낯선 친구 앞에서는 반려인 곁에서 천천히 살피는 신중한 쪽이고',
      },
    ],
  },
  {
    id: 'q2',
    axis: 'sn',
    headline: '새 장난감이나 새 장소를 만났을 때',
    prompt: '버디에게 더 가까운 모습은요?',
    options: [
      {
        key: 'A',
        letter: 'N',
        label: '일단 궁금해서 탐험부터 한다',
        prompt_fragment: '새 장난감과 새 장소를 만나면 궁금해서 먼저 탐험하고',
      },
      {
        key: 'B',
        letter: 'S',
        label: '익숙한 냄새와 물건을 먼저 찾는다',
        prompt_fragment: '익숙한 냄새와 늘 알던 물건에서 편안함을 찾고',
      },
    ],
  },
  {
    id: 'q3',
    axis: 'tf',
    headline: '하고 싶은 것과 반려인 반응이 다를 때',
    prompt: '버디는 어느 쪽에 가까워요?',
    options: [
      {
        key: 'A',
        letter: 'T',
        label: '자기 페이스가 뚜렷하다',
        prompt_fragment: '하고 싶은 게 있으면 자기 페이스를 분명히 보여주고',
      },
      {
        key: 'B',
        letter: 'F',
        label: '반려인 표정과 목소리를 먼저 본다',
        prompt_fragment: '반려인 표정과 목소리에 민감하게 반응하는 다정한 쪽이고',
      },
    ],
  },
  {
    id: 'q4',
    axis: 'jp',
    headline: '하루 루틴이 바뀌었을 때',
    prompt: '버디는 어떻게 받아들여요?',
    options: [
      {
        key: 'A',
        letter: 'J',
        label: '정해진 시간과 순서를 좋아한다',
        prompt_fragment: '정해진 시간과 익숙한 순서를 좋아하는 루틴파야',
      },
      {
        key: 'B',
        letter: 'P',
        label: '바뀐 흐름에도 금방 맞춘다',
        prompt_fragment: '바뀐 흐름에도 금방 맞추는 유연한 타입이야',
      },
    ],
  },
]

export const QUESTION_IDS: QuestionId[] = ['q1', 'q2', 'q3', 'q4']

export const PERSONALITY_LABELS: Record<PersonalityCode, string> = {
  ISTJ: '차분한 루틴 수호자',
  ISFJ: '다정한 집 지킴이',
  INFJ: '섬세한 마음 탐정',
  INTJ: '조용한 작전가',
  ISTP: '느긋한 관찰 장인',
  ISFP: '포근한 감성 친구',
  INFP: '꿈꾸는 담요 애호가',
  INTP: '궁금한 냄새 연구원',
  ESTP: '문앞 행동대장',
  ESFP: '햇살 산책 스타',
  ENFP: '문앞 탐험가',
  ENTP: '장난꾸러기 발명가',
  ESTJ: '든든한 산책 반장',
  ESFJ: '사교적인 애교 대장',
  ENFJ: '마음 읽는 리더',
  ENTJ: '당당한 골목 대장',
}

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
    return v === 'A' || v === 'B'
  })
}

export function calculatePersonality(answers: Answers): PersonalityResult {
  const letters = QUESTION_IDS.map((id) => {
    const q = getQuestion(id)
    const choice = answers[id]
    const opt = q.options.find((o) => o.key === choice)
    if (!opt) {
      throw new Error(`Missing answer for ${id}`)
    }
    return opt.letter
  }).join('') as PersonalityCode

  return {
    code: letters,
    label: PERSONALITY_LABELS[letters],
  }
}

/**
 * 4문항 답 + 반려인 호칭 + 이름/견종을 1인칭 자기소개 문장으로 조립.
 *
 * 예시 출력:
 * "나는 마루, 푸들이야. 누나는 내 반려인이야.
 * 내 성격 유형은 ENFP · 문앞 탐험가.
 * 나를 한 줄로 말하면:
 * 처음 보는 친구에게도 먼저 다가가 인사하는 외향적인 쪽이고 / ..."
 */
export function buildPersonaPromptFragment(input: {
  name: string
  breed: string
  companionRelationship: string
  answers: Answers
}): string {
  const name = input.name.trim()
  const breed = input.breed.trim()
  const companionRelationship = input.companionRelationship.trim()
  const personality = calculatePersonality(input.answers)

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
  const companion = companionRelationship || '반려인'
  return `나는 ${subject}${josaYa(subject)}. ${companion}${josaNeun(companion)} 내 반려인이야.\n내 성격 유형은 ${personality.code} · ${personality.label}.\n나를 한 줄로 말하면:\n${joined}.`
}

// 마지막 음절에 받침이 있으면 '이야', 없으면 '야'. 한글이 아니면 '야'로 폴백.
function josaYa(word: string): '이야' | '야' {
  if (!word) return '야'
  const last = word[word.length - 1]
  const code = last.charCodeAt(0)
  if (code < 0xac00 || code > 0xd7a3) return '야'
  return (code - 0xac00) % 28 === 0 ? '야' : '이야'
}

function josaNeun(word: string): '은' | '는' {
  if (!word) return '는'
  const last = word[word.length - 1]
  const code = last.charCodeAt(0)
  if (code < 0xac00 || code > 0xd7a3) return '는'
  return (code - 0xac00) % 28 === 0 ? '는' : '은'
}
