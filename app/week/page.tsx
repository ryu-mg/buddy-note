import { redirect } from 'next/navigation'

import { WeeklyHome } from '@/components/home/weekly-home'
import { createClient } from '@/lib/supabase/server'
import { getSignedPhotoUrl } from '@/lib/storage'
import type { DiaryMood, RecentCallback } from '@/types/database'

export const dynamic = 'force-dynamic'

type PetSummary = {
  id: string
  name: string
  slug: string
  created_at: string
  profile_photo_storage_path: string | null
  personality_code: string | null
  personality_label: string | null
}

type DiaryCalendarRow = {
  id: string
  title: string
  body: string
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

type MemoryRow = {
  recent_callbacks: RecentCallback[] | null
}

export default async function WeekPage() {
  const supabase = await createClient()
  if (!supabase) redirect('/auth/login')

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const { data: pet } = await supabase
    .from('pets')
    .select(
      'id, name, slug, created_at, profile_photo_storage_path, personality_code, personality_label',
    )
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle<PetSummary>()

  if (!pet) redirect('/onboarding')

  const { data: rowsRaw } = await supabase
    .from('diaries')
    .select(
      'id, title, body, image_url_45, image_url_11, mood, created_at, log:logs(log_date, photo_url, photo_storage_path)',
    )
    .eq('pet_id', pet.id)
    .order('created_at', { ascending: false })
    .limit(7)
    .returns<DiaryCalendarRow[]>()

  const diaries = await Promise.all(
    (rowsRaw ?? []).map(async (diary) => {
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
        imageUrl,
        logDate: diary.log?.log_date ?? diary.created_at.slice(0, 10),
        createdAt: diary.created_at,
        mood: diary.mood,
      }
    }),
  )

  const [{ count: diaryCount }, { data: memoryRaw }] = await Promise.all([
    supabase
      .from('diaries')
      .select('id', { count: 'exact', head: true })
      .eq('pet_id', pet.id),
    supabase
      .from('pet_memory_summary')
      .select('recent_callbacks')
      .eq('pet_id', pet.id)
      .maybeSingle<MemoryRow>(),
  ])

  let avatarUrl: string | null = null
  if (pet.profile_photo_storage_path) {
    const signed = await getSignedPhotoUrl(pet.profile_photo_storage_path)
    if ('url' in signed) avatarUrl = signed.url
  }

  const todayKey = todayInSeoul()
  const todayHasDiary = diaries.some((diary) => diary.logDate === todayKey)

  return (
    <WeeklyHome
      pet={{
        id: pet.id,
        name: pet.name,
        slug: pet.slug,
        createdAt: pet.created_at,
        avatarUrl,
        personalityCode: pet.personality_code,
        personalityLabel: pet.personality_label,
      }}
      diaries={diaries}
      diaryCount={diaryCount ?? diaries.length}
      recentCallbacks={memoryRaw?.recent_callbacks ?? []}
      todayHasDiary={todayHasDiary}
    />
  )
}

function todayInSeoul(): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date())
  const year = parts.find((p) => p.type === 'year')?.value ?? '1970'
  const month = parts.find((p) => p.type === 'month')?.value ?? '01'
  const day = parts.find((p) => p.type === 'day')?.value ?? '01'
  return `${year}-${month}-${day}`
}
