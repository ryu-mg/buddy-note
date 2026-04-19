import Link from 'next/link'

type VerifyPageProps = {
  searchParams: Promise<{ email?: string }>
}

export default async function VerifyPage({ searchParams }: VerifyPageProps) {
  const { email } = await searchParams
  const maskedEmail = email?.trim() || '입력하신 이메일'

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-[var(--ink,#1a1a1a)]">
        이메일을 확인해주세요
      </h1>
      <p className="text-sm leading-6 text-[var(--ink-soft,#3f3f3f)]">
        <span className="font-semibold">{maskedEmail}</span>로 로그인 링크를
        보냈어요. 메일함 열어보시면 돼요.
      </p>
      <div className="rounded-[8px] border border-zinc-100 bg-zinc-50 px-3 py-2 text-xs text-zinc-500">
        메일이 안 보이면 스팸함도 한번 확인해주세요. 링크는 1시간 뒤에
        만료돼요.
      </div>
      <div className="pt-2">
        <Link
          href="/auth/login"
          className="text-sm font-medium text-[var(--accent,#e07a5f)] hover:underline"
        >
          다른 이메일로 다시 보내기
        </Link>
      </div>
    </div>
  )
}
