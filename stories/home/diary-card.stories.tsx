import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { DiaryCard } from '@/components/home/diary-card'

const meta = {
  title: 'Home/DiaryCard',
  component: DiaryCard,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  args: {
    id: 'storybook-diary',
    title: '햇빛 아래서 뒹군 날',
    body: '오늘은 창가 자리를 먼저 차지했어. 따뜻해서 눈이 자꾸 감겼고, 네가 부르면 꼬리만 살짝 흔들었지.',
    imageUrl: null,
    createdAt: '2026-04-21T09:30:00.000Z',
    tilt: 'left',
  },
  decorators: [
    (Story) => (
      <div className="w-[320px] p-8">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof DiaryCard>

export default meta
type Story = StoryObj<typeof meta>

export const EmptyPhoto: Story = {}

export const RightTilt: Story = {
  args: {
    tilt: 'right',
  },
}
