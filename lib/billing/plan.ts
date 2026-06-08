export const MEMBERSHIP_PLAN_KEY = 'buddy_note_monthly' as const
export const MEMBERSHIP_ORDER_NAME = '버디노트 멤버십' as const
export const MEMBERSHIP_MONTHLY_AMOUNT_KRW = 4900

export const MEMBERSHIP_FEATURES = [
  {
    key: 'diaryRewrite',
    label: '일기 다시 작성하기',
    description: '오늘 남긴 사진과 메모로 버디가 한 번 더 써줘요.',
  },
  {
    key: 'fontChange',
    label: '글꼴 변경',
    description: '강아지의 말투에 어울리는 일기 글꼴을 고를 수 있어요.',
  },
  {
    key: 'themeChange',
    label: '테마 변경',
    description: '홈과 공유 이미지의 앨범 색을 바꿀 수 있어요.',
  },
] as const
