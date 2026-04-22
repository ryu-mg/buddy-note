// Pet MBTI 4축 데이터 + 페르소나 프롬프트 조립.
// MVP는 강아지 전용이며, 사람 MBTI 코드(E/I, S/N, T/F, J/P)를 차용한다.

import { selectJosa, withJosa } from '@/lib/korean-josa'

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

export type PersonalityTraitMap = Record<PersonalityCode, readonly string[]>

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

export const CHARACTER_TRAITS: PersonalityTraitMap = {
  ISTJ: ['익숙한 루틴을 좋아해', '차분히 살피고 기억해', '약속한 시간을 잘 알아차려'],
  ISFJ: ['곁을 조용히 지켜줘', '익숙한 사람에게 깊이 다정해', '집의 작은 변화를 잘 알아'],
  INFJ: ['반려인 마음을 오래 바라봐', '조용한 교감을 좋아해', '낯선 일에도 의미를 찾아'],
  INTJ: ['혼자 생각하는 시간이 필요해', '새 규칙을 빠르게 파악해', '원하는 길이 분명해'],
  ISTP: ['냄새와 소리를 오래 관찰해', '느긋하게 자기 속도를 지켜', '필요할 때만 딱 움직여'],
  ISFP: ['포근한 분위기에 마음을 열어', '감정 표현이 부드러워', '좋아하는 감각을 오래 기억해'],
  INFP: ['상상하듯 냄새를 따라가', '편한 사람에게 마음을 깊게 줘', '담요 같은 안정감을 좋아해'],
  INTP: ['궁금한 건 끝까지 확인해', '새 냄새를 연구하듯 맡아', '예상 밖 장면에 눈이 반짝여'],
  ESTP: ['문이 열리면 바로 움직여', '새 친구에게 겁 없이 다가가', '순간의 재미를 놓치지 않아'],
  ESFP: ['분위기를 금방 환하게 만들어', '칭찬에 꼬리가 먼저 반응해', '산책길의 주인공이 돼'],
  ENFP: ['새로운 장면을 먼저 탐험해', '사람과 친구를 좋아해', '기분 좋은 변화를 반겨'],
  ENTP: ['놀이 방법을 자꾸 바꿔봐', '장난감의 다른 쓰임을 찾아', '예상 못한 행동으로 웃겨줘'],
  ESTJ: ['산책 순서를 잘 기억해', '해야 할 일을 씩씩하게 해', '무리를 든든하게 이끌어'],
  ESFJ: ['사람들 사이에서 빛나', '반려인 반응을 빠르게 읽어', '다정한 애교를 아낌없이 줘'],
  ENFJ: ['분위기를 먼저 살펴줘', '함께 움직일 때 더 신나', '마음을 읽고 다가와'],
  ENTJ: ['원하는 방향이 또렷해', '새 공간에서도 당당해', '놀이의 흐름을 주도해'],
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
  additionalInfo?: string | null
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
  const base = `나는 ${subject}${selectJosa(subject, '이야/야')}. ${withJosa(companion, '은/는')} 내 반려인이야.\n내 성격 유형은 ${personality.code} · ${personality.label}.\n나를 한 줄로 말하면:\n${joined}.`
  const additionalInfo = input.additionalInfo?.trim()

  if (!additionalInfo) return base

  return `${base}\n반려인이 들려준 이야기: "${additionalInfo}"`
}
