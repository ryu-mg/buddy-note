import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { WeeklyHome } from '@/components/home/weekly-home'

const meta = {
  title: 'Home/WeeklyHome',
  component: WeeklyHome,
  parameters: { layout: 'fullscreen' },
  tags: ['autodocs'],
  args: {
    pet: {
      id: 'pet-1',
      name: '마루',
      slug: 'maru',
      createdAt: '2026-04-15T00:00:00.000Z',
      avatarUrl: null,
      personalityCode: 'ENFP',
      personalityLabel: '문앞 탐험가',
    },
    diaryCount: 4,
    todayHasDiary: false,
    recentCallbacks: [
      {
        note: '공원에서 새 친구 만난 날',
        source: 'diary',
        referenceDate: '2026-04-20',
      },
    ],
    diaries: [
      {
        id: 'diary-1',
        title: '하천길 탐험',
        body: '오늘은 늘 가던 길 말고 다른 쪽으로 갔어. 새 냄새가 많았다.',
        imageUrl: null,
        logDate: '2026-04-21',
        createdAt: '2026-04-21T08:00:00.000Z',
        mood: 'curious',
      },
    ],
  },
} satisfies Meta<typeof WeeklyHome>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Empty: Story = {
  args: {
    diaries: [],
    diaryCount: 0,
    recentCallbacks: [],
  },
}
