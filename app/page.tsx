import { createClient } from '@/lib/supabase/server'

export default async function Home() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-8">
      <h1 className="text-3xl font-semibold">안녕하세요, buddy-note!</h1>
      <p className="text-zinc-600 dark:text-zinc-400">
        {user ? `로그인됨: ${user.email}` : '로그인 필요'}
      </p>
    </main>
  )
}
