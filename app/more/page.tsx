import Link from 'next/link'
import { redirect } from 'next/navigation'
import type { ReactNode } from 'react'
import {
  Bell,
  ChevronRight,
  Crown,
  FileText,
  HelpCircle,
  LogOut,
  Megaphone,
  MessageCircle,
  PenLine,
  ScrollText,
  Trash2,
  type LucideIcon,
} from 'lucide-react'

import { BuddyHappy } from '@/components/illustrations/buddy-happy'
import { resolveEntitlements } from '@/lib/billing/entitlements'
import { getMembershipSnapshot } from '@/lib/billing/server'
import { notificationPreferencesFromRow } from '@/lib/notifications/preferences'
import { getSignedPhotoUrl } from '@/lib/storage'
import { createClient } from '@/lib/supabase/server'
import type { NotificationPreferenceRow } from '@/types/database'

export const dynamic = 'force-dynamic'

type PetOverview = {
  id: string
  name: string
  breed: string | null
  profile_photo_storage_path: string | null
  personality_code: string | null
  personality_label: string | null
  created_at: string
}

export default async function MorePage() {
  const supabase = await createClient()
  if (!supabase) redirect('/auth/login')

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const [
    petResult,
    preferenceResult,
    membership,
  ] = await Promise.all([
    supabase
      .from('pets')
      .select(
        [
          'id',
          'name',
          'breed',
          'profile_photo_storage_path',
          'personality_code',
          'personality_label',
          'created_at',
        ].join(', '),
      )
      .eq('user_id', user.id)
      .limit(1)
      .maybeSingle<PetOverview>(),
    supabase
      .from('notification_preferences')
      .select(
        [
          'user_id',
          'all_notifications_enabled',
          'diary_reminder_enabled',
          'diary_complete_enabled',
          'notice_enabled',
          'membership_enabled',
          'support_enabled',
          'reminder_time',
          'created_at',
          'updated_at',
        ].join(', '),
      )
      .eq('user_id', user.id)
      .maybeSingle<NotificationPreferenceRow>(),
    getMembershipSnapshot(supabase, user.id),
  ])

  const pet = petResult.data
  if (!pet) redirect('/onboarding')

  const photoUrl = pet.profile_photo_storage_path
    ? await getSignedProfilePhotoUrl(pet.profile_photo_storage_path)
    : null
  const daysSinceCreated = daysSince(pet.created_at)
  const preferences = notificationPreferencesFromRow(preferenceResult.data)
  const enabledNotificationCount = [
    preferences.diaryReminderEnabled,
    preferences.diaryCompleteEnabled,
    preferences.noticeEnabled,
    preferences.membershipEnabled,
    preferences.supportEnabled,
  ].filter(Boolean).length
  const notificationSummary = preferences.allNotificationsEnabled
    ? `${enabledNotificationCount}가지 알림을 ${preferences.reminderTime}에 받아요`
    : '앱 밖 알림을 쉬고 있어요'
  const membershipEntitlements = resolveEntitlements(membership)
  const isMembershipActive = membershipEntitlements.themeChange
  const membershipDescription = isMembershipActive
    ? '구독 내역과 다음 결제일을 확인해요'
    : '버디노트의 다양한 혜택을 받을 수 있어요.'

  return (
    <main className="mx-auto min-h-screen w-full max-w-md bg-[var(--color-bg)] px-4 pb-28 pt-8">
      <SectionLabel>버디 정보</SectionLabel>
      <MenuGroup>
        <PetInfoRow
          name={pet.name}
          photoUrl={photoUrl}
          personalityCode={pet.personality_code}
          personalityLabel={pet.personality_label}
          breed={pet.breed}
          daysSinceCreated={daysSinceCreated}
        />
        <MenuRow
          href="/pet/edit"
          icon={PenLine}
          title="버디 정보 수정"
          description="이름, 사진, 성격을 다시 살펴봐요"
        />
      </MenuGroup>

      <SectionLabel>모아보기</SectionLabel>
      <MenuGroup>
        <MenuRow
          href="/"
          icon={FileText}
          title="내 기록"
          description={`${daysSinceCreated}일째 기록을 모아봐요`}
        />
      </MenuGroup>

      <SectionLabel>관리</SectionLabel>
      <MenuGroup>
        <MenuRow
          href="/membership"
          icon={Crown}
          title="멤버십"
          description={membershipDescription}
        />
        <MenuRow
          href="/more/notifications"
          icon={Bell}
          title="알림 설정"
          description={notificationSummary}
        />
      </MenuGroup>

      <SectionLabel>고객센터</SectionLabel>
      <MenuGroup>
        <MenuRow
          href="/more/notices"
          icon={Megaphone}
          title="공지사항"
          description="버디노트의 소식을 확인해요"
        />
        <MenuRow
          href="/more/faq"
          icon={HelpCircle}
          title="FAQ"
          description="자주 묻는 질문을 확인해요"
        />
        <MenuRow
          href="/more/inquiries"
          icon={MessageCircle}
          title="내문의"
          description="남긴 문의와 답변을 확인해요"
        />
        <MenuRow
          href="/more/policies"
          icon={ScrollText}
          title="약관 및 정책"
          description="서비스 이용 기준을 확인해요"
        />
      </MenuGroup>

      <SectionLabel>기타</SectionLabel>
      <MenuGroup>
        <SignoutRow />
        <MenuRow
          href="/pet/delete"
          icon={Trash2}
          title="탈퇴하기"
          description="계정과 기록을 삭제해요"
          tone="danger"
        />
      </MenuGroup>

    </main>
  )
}

function ProfileAvatar({
  name,
  photoUrl,
  size = 'sm',
}: {
  name: string
  photoUrl: string | null
  size?: 'sm' | 'lg'
}) {
  const sizeClass = size === 'lg' ? 'size-28' : 'size-12'
  const fallbackSizeClass = size === 'lg' ? 'size-24' : 'size-10'
  const radiusClass = size === 'lg' ? 'rounded-full' : 'rounded-[var(--radius-card)]'

  return (
    <div
      className={[
        'flex shrink-0 items-center justify-center overflow-hidden bg-[var(--color-accent-brand-soft)]',
        sizeClass,
        radiusClass,
      ].join(' ')}
    >
      {photoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={photoUrl}
          alt={`${name} 사진`}
          className="size-full object-cover"
        />
      ) : (
        <BuddyHappy className={fallbackSizeClass} />
      )}
    </div>
  )
}

function PetInfoRow({
  name,
  photoUrl,
  personalityCode,
  personalityLabel,
  breed,
  daysSinceCreated,
}: {
  name: string
  photoUrl: string | null
  personalityCode: string | null
  personalityLabel: string | null
  breed: string | null
  daysSinceCreated: number
}) {
  const mbtiLabel = personalityCode ?? 'MBTI 설정 전'
  const mbtiDescription = personalityLabel ?? '성격을 다시 살펴볼 수 있어요'
  const breedLabel = breed?.trim() || '견종 미입력'

  return (
    <div className="px-4 py-5">
      <div className="flex items-center gap-4">
        <ProfileAvatar name={name} photoUrl={photoUrl} size="lg" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[18px] font-semibold leading-tight text-[var(--color-ink)]">
            {name}
          </p>
          <p className="mt-1 truncate text-[12px] text-[var(--color-mute)]">
            {daysSinceCreated}일째 함께 기록 중
          </p>
          <div className="mt-3 flex min-w-0 flex-wrap gap-1.5">
            <span className="inline-flex max-w-full items-center rounded-[var(--radius-pill)] bg-[var(--color-bg)] px-2.5 py-1 text-[11px] font-semibold text-[var(--color-ink-soft)]">
              <span className="truncate">{breedLabel}</span>
            </span>
            <span className="inline-flex max-w-full items-center rounded-[var(--radius-pill)] bg-[var(--color-bg)] px-2.5 py-1 text-[11px] font-semibold text-[var(--color-ink-soft)]">
              {mbtiLabel}
            </span>
          </div>
          <p className="mt-2 line-clamp-1 text-[12px] text-[var(--color-mute)]">
            {mbtiDescription}
          </p>
        </div>
      </div>
    </div>
  )
}

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <h2 className="mb-2 mt-7 px-1 text-[13px] font-semibold text-[var(--color-ink-soft)]">
      {children}
    </h2>
  )
}

function MenuGroup({ children }: { children: ReactNode }) {
  return (
    <section className="overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-paper)] shadow-[var(--shadow-soft)]">
      <div className="divide-y divide-[var(--color-line)]">{children}</div>
    </section>
  )
}

function MenuRow({
  href,
  icon: Icon,
  title,
  description,
  tone = 'default',
}: {
  href: string
  icon: LucideIcon
  title: string
  description?: string
  tone?: 'default' | 'danger'
}) {
  const danger = tone === 'danger'

  return (
    <Link
      href={href}
      className="flex min-h-14 items-center gap-3 px-4 py-3 transition-colors hover:bg-[var(--color-bg)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-brand)] focus-visible:ring-inset"
    >
      <span
        className={[
          'flex size-8 shrink-0 items-center justify-center rounded-[var(--radius-button)] bg-[var(--color-bg)]',
          danger ? 'text-[var(--color-error)]' : 'text-[var(--color-ink-soft)]',
        ].join(' ')}
      >
        <Icon aria-hidden className="size-4" strokeWidth={1.8} />
      </span>
      <span className="min-w-0 flex-1">
        <span
          className={[
            'block truncate text-[14px] font-semibold',
            danger ? 'text-[var(--color-error)]' : 'text-[var(--color-ink)]',
          ].join(' ')}
        >
          {title}
        </span>
        {description ? (
          <span className="mt-0.5 block truncate text-[12px] text-[var(--color-mute)]">
            {description}
          </span>
        ) : null}
      </span>
      <ChevronRight
        aria-hidden
        className={[
          'size-4 shrink-0',
          danger ? 'text-[var(--color-error)]' : 'text-[var(--color-mute)]',
        ].join(' ')}
        strokeWidth={1.8}
      />
    </Link>
  )
}

function SignoutRow() {
  return (
    <form action="/auth/signout" method="post">
      <button
        type="submit"
        className="flex min-h-14 w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-[var(--color-bg)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-brand)] focus-visible:ring-inset"
      >
        <span className="flex size-8 shrink-0 items-center justify-center rounded-[var(--radius-button)] bg-[var(--color-bg)] text-[var(--color-ink-soft)]">
          <LogOut aria-hidden className="size-4" strokeWidth={1.8} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[14px] font-semibold text-[var(--color-ink)]">
            로그아웃
          </span>
          <span className="mt-0.5 block truncate text-[12px] text-[var(--color-mute)]">
            이 기기에서 잠시 나가요
          </span>
        </span>
      </button>
    </form>
  )
}

async function getSignedProfilePhotoUrl(path: string): Promise<string | null> {
  const result = await getSignedPhotoUrl(path)
  return 'url' in result ? result.url : null
}

function daysSince(iso: string): number {
  const start = new Date(iso).getTime()
  if (Number.isNaN(start)) return 1
  const diff = Date.now() - start
  return Math.max(1, Math.floor(diff / 86_400_000) + 1)
}
