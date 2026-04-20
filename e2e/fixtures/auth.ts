import { test as base, type Page } from '@playwright/test'

/**
 * Auth 전략
 * ─────────────────────────────────────────────────────────────────
 * buddy-note 의 1차 auth 는 Supabase 이메일 **매직 링크**.
 * 브라우저 E2E 로 이 flow 를 "정직하게" 재현하려면 메일박스 브릿지(inbucket,
 * mailpit, mailosaur 등) 가 필요한데 v1 범위 밖이다.
 *
 * 대안: Supabase `auth.admin.createUser` + `generateLink('magiclink')` →
 *   access_token 추출 → Playwright `context.addCookies` 로 세션 쿠키 주입.
 *
 * 이 fixture 파일은 **스캐폴드**이다. 실제 구현은 C2 (Supabase env 세팅) 이후
 * `SUPABASE_SERVICE_ROLE_KEY` 가 주어졌을 때만 동작하도록 열어둔다. env 없으면
 * `test.skip()` 처리해 false negative 를 막는다.
 *
 * TODO(C2 이후):
 *   1) `createServiceClient()` 로 test 유저 upsert
 *   2) `supabase.auth.admin.generateLink({ type: 'magiclink', email })` 호출
 *   3) 반환되는 `properties.action_link` 를 Playwright 로 fetch → code exchange
 *   4) 응답의 `sb-<project>-auth-token` 쿠키를 `addCookies` 로 주입
 *   5) 정리(cleanup) 에서 `auth.admin.deleteUser` 호출
 */

export type AuthenticatedUser = {
  id: string
  email: string
}

type Fixtures = {
  authenticatedUser: AuthenticatedUser
  freshUser: AuthenticatedUser
}

export const test = base.extend<Fixtures>({
  authenticatedUser: async ({ page: _page }, use, testInfo) => {
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

    if (!serviceKey || !supabaseUrl) {
      testInfo.skip(
        true,
        'authenticatedUser fixture 가 구현되지 않았거나 SUPABASE_SERVICE_ROLE_KEY / NEXT_PUBLIC_SUPABASE_URL 이 설정되지 않았어요. e2e/fixtures/auth.ts 의 TODO 참고.',
      )
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await use(undefined as any)
      return
    }

    // 실 구현 전이라 placeholder — 이 브랜치에 도달한 테스트는 위 skip 으로 인해
    // 실행되지 않는다. C2 이후 아래 블록을 채운다.
    testInfo.skip(true, 'authenticatedUser 실 구현 대기 중 (C2 이후).')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await use(undefined as any)
  },

  freshUser: async ({ page: _page }, use, testInfo) => {
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!serviceKey) {
      testInfo.skip(
        true,
        'freshUser fixture 는 SUPABASE_SERVICE_ROLE_KEY 가 필요해요. C2 이후 활성화.',
      )
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await use(undefined as any)
      return
    }

    testInfo.skip(true, 'freshUser 실 구현 대기 중 (C2 이후).')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await use(undefined as any)
  },
})

/**
 * 헬퍼: session 쿠키가 이미 Playwright context 에 주입됐는지 확인.
 * 실 구현에서 session 주입 직후 sanity check 용.
 */
export async function hasSupabaseSession(page: Page): Promise<boolean> {
  const cookies = await page.context().cookies()
  return cookies.some((c) => c.name.startsWith('sb-') && c.name.endsWith('-auth-token'))
}

export { expect } from '@playwright/test'
