import { defineConfig, devices } from '@playwright/test'

// baseURL: `bun run dev` 기본 포트 4000. CI/스테이징은 PLAYWRIGHT_BASE_URL 로 override.
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:4000'

// webServer: 기본은 dev 서버를 외부에서 따로 띄운다 (`bun run dev`) — Supabase env 설정이
// 필요하고, 매 테스트 실행마다 auto-start 하면 실수로 prod env 을 쏠 위험이 있어서.
// CI/로컬에서 "테스트가 알아서 서버 올려주길" 원하면 PLAYWRIGHT_AUTOSTART=1 설정.
const shouldAutostart = process.env.PLAYWRIGHT_AUTOSTART === '1'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['list'], ['html', { open: 'never' }]],

  use: {
    baseURL,
    locale: 'ko-KR',
    colorScheme: 'light',
    // 모바일 SNS 사용자가 primary target이라 iPhone SE 기본 뷰포트.
    viewport: { width: 375, height: 667 },
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], viewport: { width: 375, height: 667 } },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'], viewport: { width: 375, height: 667 } },
    },
  ],

  ...(shouldAutostart
    ? {
        webServer: {
          command: 'bun run dev',
          url: baseURL,
          reuseExistingServer: !process.env.CI,
          timeout: 120_000,
          stdout: 'pipe',
          stderr: 'pipe',
        },
      }
    : {}),
})
