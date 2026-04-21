import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { ProfileHero } from '@/components/public/profile-hero'

const meta = {
  title: 'Public/ProfileHero',
  component: ProfileHero,
  parameters: { layout: 'fullscreen' },
  tags: ['autodocs'],
  args: {
    name: '마루',
    days: 42,
    diaryCount: 12,
    personalityCode: 'ENFP',
    personalityLabel: '문앞 탐험가',
    images: [],
  },
  decorators: [
    (Story) => (
      <main className="mx-auto max-w-5xl px-6 py-10">
        <Story />
      </main>
    ),
  ],
} satisfies Meta<typeof ProfileHero>

export default meta
type Story = StoryObj<typeof meta>

export const Empty: Story = {}
