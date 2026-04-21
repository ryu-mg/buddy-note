import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { PawPrint } from '@/components/icons/paw-print'

const meta = {
  title: 'Icons/PawPrint',
  component: PawPrint,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  args: {
    className: 'h-10 w-10',
    color: 'var(--color-accent-brand)',
  },
} satisfies Meta<typeof PawPrint>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
