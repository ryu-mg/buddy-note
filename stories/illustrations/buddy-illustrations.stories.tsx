import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { BuddyHappy } from '@/components/illustrations/buddy-happy'
import { BuddyResting } from '@/components/illustrations/buddy-resting'
import { BuddyTilted } from '@/components/illustrations/buddy-tilted'

function IllustrationSet() {
  return (
    <div className="grid grid-cols-3 gap-8 p-8">
      <BuddyResting className="h-32 w-40" />
      <BuddyTilted className="h-32 w-40" />
      <BuddyHappy className="h-32 w-40" />
    </div>
  )
}

const meta = {
  title: 'Illustrations/Buddy',
  component: IllustrationSet,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof IllustrationSet>

export default meta
type Story = StoryObj<typeof meta>

export const All: Story = {}
