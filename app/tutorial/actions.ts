'use server'

import { redirect } from 'next/navigation'

import { createClient } from '@/lib/supabase/server'
import { FIRST_ENTRY_TUTORIAL_VERSION } from '@/lib/tutorial/first-entry-tutorial'

export type TutorialActionResult = { error: string } | void

async function saveTutorialState(
  state: 'completed' | 'dismissed',
): Promise<TutorialActionResult> {
  const supabase = await createClient()
  if (!supabase) return { error: 'Supabase 설정이 필요해요.' }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: '로그인이 필요해요.' }

  const now = new Date().toISOString()
  const payload =
    state === 'completed'
      ? { completed_at: now, dismissed_at: null }
      : { completed_at: null, dismissed_at: now }

  const { error } = await supabase.from('user_tutorial_state').upsert(
    {
      user_id: user.id,
      tutorial_version: FIRST_ENTRY_TUTORIAL_VERSION,
      ...payload,
    },
    {
      onConflict: 'user_id,tutorial_version',
    },
  )

  if (error) {
    return {
      error: '튜토리얼 상태를 저장하지 못했어요. 다시 시도해주세요.',
    }
  }

  return undefined
}

export async function completeFirstEntryTutorial(): Promise<TutorialActionResult> {
  const result = await saveTutorialState('completed')
  if (result) return result
  redirect('/log')
}

export async function dismissFirstEntryTutorial(): Promise<TutorialActionResult> {
  return saveTutorialState('dismissed')
}
