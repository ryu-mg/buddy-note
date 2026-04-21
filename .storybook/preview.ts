import type { Preview } from '@storybook/nextjs-vite'

import '../app/globals.css'

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },

    backgrounds: {
      default: 'paper',
      values: [
        { name: 'paper', value: 'var(--color-bg)' },
        { name: 'warm paper', value: 'var(--color-paper)' },
      ],
    },

    layout: 'centered',
  },
}

export default preview
