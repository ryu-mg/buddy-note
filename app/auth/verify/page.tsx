import Link from 'next/link'

type VerifyPageProps = {
  searchParams: Promise<{ email?: string }>
}

export default async function VerifyPage({ searchParams }: VerifyPageProps) {
  const { email } = await searchParams
  const maskedEmail = email?.trim() || '입력하신 이메일'

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-[var(--color-ink)]">
        이메일을 확인해주세요
      </h1>
      <p className="text-sm leading-6 text-[var(--color-ink-soft)]">
        <span className="font-semibold">{maskedEmail}</span>로 로그인 링크를
        보냈어요. 메일함 열어보시면 돼요.
      </p>
      <div className="rounded-[var(--radius-input)] border border-[var(--color-line)] bg-[var(--color-bg)] px-3 py-2 text-xs text-[var(--color-mute)]">
        메일이 안 보이면 스팸함도 한번 확인해주세요. 링크는 1시간 뒤에
        만료돼요.
      </div>
      <div className="pt-2">
        <Link
          href="/auth/login"
          className="text-sm font-medium text-[var(--color-accent-brand)] hover:underline"
        >
          다른 이메일로 다시 보내기
        </Link>
      </div>
    </div>
  )
}
