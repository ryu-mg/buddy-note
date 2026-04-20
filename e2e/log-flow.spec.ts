import path from 'node:path'

import { test, expect } from './fixtures/auth'

// 일기 생성 flow 는 auth + Supabase + Anthropic 3 depenency 가 동시에 필요해서
// fixture 구현 전까지 전 케이스 skip. C2 + C4 (Anthropic key) 이후 실 동작.

test.describe('log → diary flow (full stack)', () => {
  test('사진 업로드 + memo 입력 → /diary/[id] 리다이렉트 (< 60s)', async ({
    page,
    authenticatedUser,
  }) => {
    expect(authenticatedUser).toBeTruthy()

    await page.goto('/log')

    const fixturePath = path.join(__dirname, 'fixtures', 'sample-dog.jpg')
    await page.setInputFiles('input[type="file"]', fixturePath)

    await page.getByLabel(/메모|일기/).fill('오늘 산책 잘 했다')
    await page.getByRole('button', { name: /일기 만들기|저장/ }).click()

    // LLM 호출 최대 대기 60s — architecture.md 상 p95 < 8s 지만 cold start 여유.
    await page.waitForURL(/\/diary\/[0-9a-f-]{36}$/, { timeout: 60_000 })
  })

  test('Rate limit 11번째 시도 → 에러 안내', async ({ page, authenticatedUser }) => {
    expect(authenticatedUser).toBeTruthy()

    // 10회 이내는 성공이 기대됨. 11회째는 rate limit 에러 토스트/alert.
    // 실 구현 시: 10개 log 를 fixture 세팅 단계에서 미리 insert 하고 11번째만 UI 로 시도.
    test.fail(true, '실 구현은 C2 + C4 (Anthropic key) 이후. Upstash mock 또는 실키 필요.')
    await page.goto('/log')
    await expect(page.getByRole('alert')).toBeVisible()
  })
})
