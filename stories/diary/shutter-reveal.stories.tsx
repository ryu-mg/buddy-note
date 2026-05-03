import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { ShutterReveal } from '@/components/diary/shutter-reveal'

const meta = {
  title: 'Diary/ShutterReveal',
  component: ShutterReveal,
  parameters: { layout: 'fullscreen' },
  tags: ['autodocs'],
  args: {
    title: '하천길에서 오리랑 눈 마주쳤다',
    petName: '코코',
    imageUrl: null,
  },
} satisfies Meta<typeof ShutterReveal>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
