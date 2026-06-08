import { redirect } from 'next/navigation'

import {
  CalendarHome,
  type CalendarDiary,
  type CalendarPet,
} from '@/components/home/calendar-home'
import { canRewriteDiary } from '@/lib/billing/entitlements'
import { getMembershipSnapshot } from '@/lib/billing/server'
import { resolveDiaryFontPreset } from '@/lib/diary-fonts/presets'
import { getPetDiaryFontKey } from '@/lib/diary-fonts/server'
import { createClient } from '@/lib/supabase/server'
import { getSignedPhotoUrl } from '@/lib/storage'
import { FIRST_ENTRY_TUTORIAL_VERSION } from '@/lib/tutorial/first-entry-tutorial'
import { shouldShowFirstEntryTutorial } from '@/lib/tutorial/visibility'
import { getPetThemeKey } from '@/lib/themes/server'
import type { DiaryMood } from '@/types/database'

export const dynamic = 'force-dynamic'

type PetSummary = {
  id: string
  name: string
  created_at: string
  companion_relationship: string | null
  guardian_relationship: string | null
  personality_code: string | null
  personality_label: string | null
}

type DiaryCalendarRow = {
  id: string
  title: string
  body: string
  image_url_916: string | null
  image_url_45: string | null
  image_url_11: string | null
  mood: DiaryMood | null
  created_at: string
  log: {
    log_date: string
    photo_url: string | null
    photo_storage_path: string | null
  } | null
}

type TutorialStateRow = {
  completed_at: string | null
  dismissed_at: string | null
}

export default async function Home() {
  const supabase = await createClient()

  if (!supabase) {
    redirect('/auth/login')
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  const { data: pet } = await supabase
    .from('pets')
    .select(
      'id, name, created_at, companion_relationship, guardian_relationship, personality_code, personality_label',
    )
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle<PetSummary>()

  if (!pet) {
    redirect('/onboarding')
  }

  const { data: tutorialState } = await supabase
    .from('user_tutorial_state')
    .select('completed_at, dismissed_at')
    .eq('user_id', user.id)
    .eq('tutorial_version', FIRST_ENTRY_TUTORIAL_VERSION)
    .maybeSingle<TutorialStateRow>()

  const [themeKey, diaryFontKey] = await Promise.all([
    getPetThemeKey(supabase, pet.id),
    getPetDiaryFontKey(supabase, pet.id),
  ])
  const diaryFont = resolveDiaryFontPreset(diaryFontKey)

  const [diaryResult, unreadResult, membership] = await Promise.all([
    supabase
      .from('diaries')
      .select(
        'id, title, body, image_url_916, image_url_45, image_url_11, mood, created_at, log:logs(log_date, photo_url, photo_storage_path)',
      )
      .eq('pet_id', pet.id)
      .order('created_at', { ascending: false })
      .limit(180)
      .returns<DiaryCalendarRow[]>(),
    supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .is('read_at', null),
    getMembershipSnapshot(supabase, user.id),
  ])

  const diaries: CalendarDiary[] = await Promise.all(
    (diaryResult.data ?? []).map(async (diary): Promise<CalendarDiary> => {
      let imageUrl: string | null =
        diary.image_url_45 ?? diary.image_url_11 ?? diary.log?.photo_url ?? null

      const path = diary.log?.photo_storage_path
      if (path) {
        const signed = await getSignedPhotoUrl(path)
        if ('url' in signed) imageUrl = signed.url
      }

      return {
        id: diary.id,
        title: diary.title,
        body: diary.body,
        shareImages: {
          '9:16': diary.image_url_916,
          '4:5': diary.image_url_45,
          '1:1': diary.image_url_11,
        },
        imageUrl,
        mood: diary.mood,
        logDate: diary.log?.log_date ?? diary.created_at.slice(0, 10),
        createdAt: diary.created_at,
      }
    }),
  )

  const calendarPet: CalendarPet = {
    id: pet.id,
    name: pet.name,
    createdAt: pet.created_at,
    personalityCode: pet.personality_code,
    personalityLabel: pet.personality_label,
    companionRelationship:
      pet.companion_relationship ?? pet.guardian_relationship ?? null,
  }

  const showFirstEntryTutorial = shouldShowFirstEntryTutorial({
    hasUser: true,
    hasPet: true,
    pathname: '/',
    completedAt: tutorialState?.completed_at ?? null,
    dismissedAt: tutorialState?.dismissed_at ?? null,
  })

  return (
    <CalendarHome
      pet={calendarPet}
      diaries={diaries}
      unreadNotificationCount={unreadResult.count ?? 0}
      showFirstEntryTutorial={showFirstEntryTutorial}
      themeKey={themeKey}
      canRewrite={canRewriteDiary(membership)}
      diaryFontCssValue={diaryFont.cssValue}
    />
  )
}
