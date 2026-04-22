import { test, expect } from '@playwright/test'

// 익명 smoke — auth / Supabase env 없이도 동작해야 하는 path.
// env 없으면 landing 이 "Supabase 환경 설정이 필요해요" 안내로 떨어지고, env 있으면
// "시작하기" CTA 가 노출된다. 둘 중 하나는 반드시 보여야 pass.

test.describe('anonymous smoke', () => {
  test('홈 페이지 로드 — 익명 랜딩 또는 env 안내 보임', async ({ page }) => {
    await page.goto('/')

    const envMissing = page.getByText('Supabase 환경 설정이 필요해요')
    const cta = page.getByRole('link', { name: '시작하기' })

    // 둘 중 하나는 보여야 한다 — env 설정 여부에 관계없이 페이지가 크래시 나면 안됨.
    await expect(envMissing.or(cta)).toBeVisible()
  })

  test('/auth/login — 카카오 로그인 진입점 보임', async ({ page }) => {
    await page.goto('/auth/login')

    // env 미설정이면 "Supabase 설정이 필요해요" 안내. env 있으면 로그인 폼.
    const envMissing = page.getByText('Supabase 설정이 필요해요')
    if (await envMissing.isVisible().catch(() => false)) {
      test.skip(true, 'Supabase env 미설정 — 로그인 폼 렌더 검증 생략.')
      return
    }

    await expect(page.getByRole('button', { name: /카카오/ })).toBeVisible()
  })

  test('/b/[slug] 존재하지 않는 슬러그 → not-found UI', async ({ page }) => {
    // 예약 slug 들과 겹치지 않는 충분히 랜덤한 값.
    const unlikelySlug = `nonexistent-${Date.now()}-xyz`
    await page.goto(`/b/${unlikelySlug}`)

    // Next App Router can stream custom not-found UI with a 200 status in dev.
    // User-visible contract is that missing/private public profiles render the
    // route-level not-found page without leaking existence state.
    await expect(
      page.getByRole('heading', { name: '찾을 수 없어요' }),
    ).toBeVisible()
    await expect(page.getByText('비공개로 돌렸거나 사라진 친구')).toBeVisible()
  })

  test('/robots.txt 응답 200 + Sitemap 라인 포함', async ({ request }) => {
    const res = await request.get('/robots.txt')
    expect(res.status()).toBe(200)

    const body = await res.text()
    expect(body).toContain('Sitemap:')
    expect(body).toContain('User-Agent: *')
  })

  test('/sitemap.xml 응답 200 + xml 컨텐츠', async ({ request }) => {
    const res = await request.get('/sitemap.xml')
    expect(res.status()).toBe(200)

    const contentType = res.headers()['content-type'] ?? ''
    expect(contentType).toMatch(/xml/)

    const body = await res.text()
    expect(body).toContain('<urlset')
  })
})
