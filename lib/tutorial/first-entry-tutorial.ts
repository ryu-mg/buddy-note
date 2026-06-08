export const FIRST_ENTRY_TUTORIAL_VERSION = 'first-entry-v1' as const

export type FirstEntryTutorialStepId =
  | 'calendar-view'
  | 'week-view'
  | 'ai-diary'

export type TutorialCompletionIntent = 'completed' | 'dismissed'

export type FirstEntryTutorialCta = {
  label: string
  href?: string
  completion?: TutorialCompletionIntent
}

export type FirstEntryTutorialStep = {
  id: FirstEntryTutorialStepId
  title: string
  body: string
  visualTitle: string
  visualBody: string
  targetHref?: string
  primaryCta: FirstEntryTutorialCta
  secondaryCta?: FirstEntryTutorialCta
}

export const FIRST_ENTRY_TUTORIAL_STEPS: FirstEntryTutorialStep[] = [
  {
    id: 'calendar-view',
    title: '캘린더에서 하루를 볼 수 있어',
    body: '홈에서는 날짜마다 남긴 일기를 한눈에 볼 수 있어. 사진이 있는 날은 작은 썸네일로 표시돼.',
    visualTitle: '사진 한 장',
    visualBody: '오늘을 남기는 가장 작은 시작',
    targetHref: '/',
    primaryCta: {
      label: '다음',
    },
  },
  {
    id: 'week-view',
    title: '왼쪽 탭에서 이번 주를 모아봐',
    body: '하단 왼쪽 탭은 주간 뷰야. 최근 일기와 기억 포인트를 짧게 모아서 볼 수 있어.',
    visualTitle: '쌓이는 기억',
    visualBody: '지난 일기가 버디의 말투가 돼요',
    targetHref: '/week',
    primaryCta: {
      label: '다음',
    },
  },
  {
    id: 'ai-diary',
    title: '사진을 남기면 일기가 써져',
    body: '사진과 짧은 메모를 올리면 AI가 우리 강아지 말투로 오늘의 일기를 만들어줘. 첫 장부터 남겨볼까?',
    visualTitle: '버디의 한마디',
    visualBody: '내가 적고, 버디가 일기로 남겨요',
    targetHref: '/log',
    primaryCta: {
      label: '첫 일기 쓰기',
      href: '/log',
      completion: 'completed',
    },
    secondaryCta: {
      label: '나중에 볼게',
      completion: 'dismissed',
    },
  },
]
