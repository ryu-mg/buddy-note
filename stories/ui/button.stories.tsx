import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { Button } from '@/components/ui/button'

const meta = {
  title: 'UI/Button',
  component: Button,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'secondary', 'outline', 'ghost', 'destructive', 'link'],
    },
    size: {
      control: 'select',
      options: ['xs', 'sm', 'default', 'lg', 'icon'],
    },
  },
  args: {
    children: '오늘 기록 남기기',
    variant: 'default',
    size: 'default',
  },
} satisfies Meta<typeof Button>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Variants: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <Button>기록 만들기</Button>
      <Button variant="secondary">다음에 할게요</Button>
      <Button variant="outline">다시 보기</Button>
      <Button variant="ghost">건너뛰기</Button>
      <Button variant="link">자세히 보기</Button>
    </div>
  ),
}
