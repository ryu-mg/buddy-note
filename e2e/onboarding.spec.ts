import { test, expect } from './fixtures/auth'

// 온보딩 flow 는 "로그인된 유저 + pet 미등록" 상태가 필요해서 authenticatedUser fixture 가
// 실 구현되기 전까지 전 케이스 skip. 스켈레톤으로 남겨둬 C2 이후 바로 채울 수 있게.

test.describe('onboarding flow (auth-dependent)', () => {
  test('새 유저 온보딩 1–6 스텝 완주 → / 로 리다이렉트', async ({
    page,
    freshUser,
  }) => {
    // freshUser fixture 가 구현되면 아래 주석 풀면서 진행.
    expect(freshUser).toBeTruthy()

    await page.goto('/onboarding')
    // step 0: 이름 + 종
    await page.getByLabel('이름').fill('테스트')
    await page.getByRole('button', { name: /다음/ }).click()

    // step 1~5: MBTI 5문항 — 각 카드의 첫번째 선지 클릭.
    for (let i = 1; i <= 5; i += 1) {
      await expect(page).toHaveURL(new RegExp(`/onboarding/steps/${i}$`))
      await page.getByRole('button').first().click()
    }

    // step 6: confirm
    await expect(page).toHaveURL(/\/onboarding\/steps\/6$/)
    await page.getByRole('button', { name: /확인|시작/ }).click()

    await expect(page).toHaveURL('/')
  })

  test('이름 빈 값 제출 → 에러 안내', async ({ page, freshUser }) => {
    expect(freshUser).toBeTruthy()

    await page.goto('/onboarding/steps/0')
    await page.getByRole('button', { name: /다음/ }).click()
    await expect(page.getByRole('alert')).toBeVisible()
  })
})
