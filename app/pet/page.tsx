import Link from 'next/link'
import { redirect } from 'next/navigation'

import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

type PetOverview = {
  id: string
  name: string
  breed: string | null
  slug: string
  is_public: boolean
  guardian_relationship: string | null
  personality_code: string | null
  personality_label: string | null
  persona_prompt_fragment: string | null
  created_at: string
}

/**
 * /pet — 반려동물 프로필 오버뷰 (소유자 뷰).
 *
 * - 인증 없으면 /auth/login
 * - pet 없으면 /onboarding
 * - 폴라로이드 카드로 이름·품종·생성일 + persona 5줄 trait.
 * - "프로필 수정" / "계정 탈퇴" 액션 2개.
 *
 * 공개 여부는 표시만. 토글은 홈 헤더의 PublicToggle 에서 계속 담당.
 */
export default async function PetOverviewPage() {
  const supabase = await createClient()
  if (!supabase) redirect('/auth/login')

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: pet } = await supabase
    .from('pets')
    .select(
      'id, name, breed, slug, is_public, guardian_relationship, personality_code, personality_label, persona_prompt_fragment, created_at',
    )
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle<PetOverview>()

  if (!pet) redirect('/onboarding')

  const traits = splitPersonaFragment(pet.persona_prompt_fragment)
  const createdLabel = formatDate(pet.created_at)

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col gap-8 px-4 pb-20 pt-8 sm:px-6 md:pt-10">
      <header className="flex flex-col gap-1">
        <p className="text-[12px] font-medium uppercase tracking-[0.14em] text-[var(--color-mute)]">
          프로필
        </p>
        <h1 className="text-[24px] font-semibold leading-[1.25] text-[var(--color-ink)]">
          {pet.name}의 프로필
        </h1>
        <p className="text-[13px] leading-[1.5] text-[var(--color-mute)]">
          성격은 언제든 다시 답할 수 있어요.
        </p>
      </header>

      <section
        aria-label="프로필 요약"
        className="mx-auto w-full max-w-md motion-safe:[transform:rotate(-0.6deg)] motion-reduce:rotate-0"
      >
        <article className="rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-paper)] px-6 py-7 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_-12px_rgba(0,0,0,0.08)]">
          <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-[var(--color-mute)]">
            우리 아이
          </p>
          <h2 className="mt-3 text-[22px] font-bold leading-[1.3] text-[var(--color-ink)]">
            {pet.name}
          </h2>
          {pet.breed ? (
            <p className="mt-1 text-[14px] text-[var(--color-ink-soft)]">
              {pet.breed}
            </p>
          ) : null}
          <dl className="mt-5 flex flex-col gap-2 text-[13px]">
            <div className="flex items-baseline gap-3">
              <dt className="w-20 shrink-0 text-[var(--color-mute)]">함께한 날</dt>
              <dd className="text-[var(--color-ink-soft)]">{createdLabel} 부터</dd>
            </div>
            {pet.guardian_relationship ? (
              <div className="flex items-baseline gap-3">
                <dt className="w-20 shrink-0 text-[var(--color-mute)]">보호자</dt>
                <dd className="text-[var(--color-ink-soft)]">
                  {pet.guardian_relationship}
                </dd>
              </div>
            ) : null}
            {pet.personality_code && pet.personality_label ? (
              <div className="flex items-baseline gap-3">
                <dt className="w-20 shrink-0 text-[var(--color-mute)]">성격</dt>
                <dd className="text-[var(--color-ink-soft)]">
                  {pet.personality_code} · {pet.personality_label}
                </dd>
              </div>
            ) : null}
            <div className="flex items-baseline gap-3">
              <dt className="w-20 shrink-0 text-[var(--color-mute)]">공개 주소</dt>
              <dd className="text-[var(--color-ink-soft)]">
                <span className="font-mono text-[12px]">/b/{pet.slug}</span>
                <span className="ml-2 text-[12px] text-[var(--color-mute)]">
                  · {pet.is_public ? '공개중' : '비공개'}
                </span>
              </dd>
            </div>
          </dl>
        </article>
      </section>

      <section aria-labelledby="persona-title" className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <h2
            id="persona-title"
            className="text-[16px] font-semibold text-[var(--color-ink)]"
          >
            {pet.name}의 성격
          </h2>
          <p className="text-[12px] text-[var(--color-mute)]">
            4문항으로 기록한 우리 아이의 MBTI 한 줄 소개에요.
          </p>
        </div>

        {traits.length > 0 ? (
          <ol className="flex flex-col gap-1.5 rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-bg)] px-4 py-4">
            {traits.map((t, i) => (
              <li
                key={i}
                className="flex items-baseline gap-3 text-[14px] leading-[1.6] text-[var(--color-ink)]"
              >
                <span
                  aria-hidden
                  className="w-5 shrink-0 text-[11px] font-medium text-[var(--color-mute)]"
                >
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span
                  className="flex-1"
                  style={{ fontFamily: 'var(--font-serif)' }}
                >
                  {t}
                </span>
              </li>
            ))}
          </ol>
        ) : (
          <p className="rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-bg)] px-4 py-4 text-[13px] text-[var(--color-mute)]">
            아직 성격 정보가 비어있어요. 프로필을 수정해서 다시 답해주세요.
          </p>
        )}
      </section>

      <section
        aria-label="프로필 작업"
        className="flex flex-col items-stretch gap-3 pt-2"
      >
        <Link
          href="/pet/edit"
          className="inline-flex items-center justify-center rounded-[var(--radius-button)] bg-[var(--color-accent-brand)] px-5 py-3 text-[15px] font-semibold text-white transition-opacity duration-200 hover:opacity-90"
        >
          프로필 수정
        </Link>
        <Link
          href="/pet/delete"
          className="inline-flex items-center justify-center rounded-[var(--radius-button)] px-5 py-2.5 text-[13px] font-medium text-[var(--color-mute)] underline-offset-4 transition-colors hover:text-[var(--color-error)] hover:underline"
        >
          계정 탈퇴
        </Link>
      </section>
    </main>
  )
}

/**
 * persona_prompt_fragment 예:
 *   "나는 마루, 푸들이야. 나를 한 줄로 말하면:\n에너지 폭발, … / 꼬리부터 … / …."
 *
 * 앞 인트로(콜론까지) 제거하고 마지막 마침표를 떼낸 뒤 " / " 로 split.
 * 포맷이 예상과 다르면 빈 배열을 돌려 호출 측이 fallback 문구 표시.
 */
function splitPersonaFragment(raw: string | null): string[] {
  if (!raw) return []
  const idx = raw.indexOf(':')
  const body = idx >= 0 ? raw.slice(idx + 1) : raw
  const trimmed = body.trim().replace(/\.$/, '')
  if (!trimmed) return []
  return trimmed
    .split(' / ')
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(
    d.getDate(),
  ).padStart(2, '0')}`
}
