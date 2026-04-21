import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { PhaseCopy } from '@/components/log/phase-copy'

const meta = {
  title: 'Log/PhaseCopy',
  component: PhaseCopy,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  args: {
    petName: '콩이',
  },
} satisfies Meta<typeof PhaseCopy>

export default meta
type Story = StoryObj<typeof meta>

export const FirstPhase: Story = {
  args: {
    startedAt: Date.now(),
  },
}

export const DraftPhase: Story = {
  args: {
    startedAt: Date.now() - 16_000,
    onCancel: () => undefined,
  },
}
