import { createClient } from '@/lib/supabase/server'

export default async function Home() {
  const supabase = await createClient()
  const user = supabase ? (await supabase.auth.getUser()).data.user : null
  const configured = supabase !== null

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-8">
      <h1 className="text-3xl font-semibold">안녕하세요, buddy-note!</h1>
      <p className="text-zinc-600 dark:text-zinc-400">
        {!configured
          ? '⚠ Supabase env 미설정 — .env.local에 URL/anon key 채워주세요'
          : user
            ? `로그인됨: ${user.email}`
            : '로그인 필요'}
      </p>
    </main>
  )
}
