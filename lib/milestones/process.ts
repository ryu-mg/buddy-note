import 'server-only'

import { createLogger } from '@/lib/logger'
import { getEligibleMilestones } from '@/lib/milestones/eligibility'
import { createAdminClient } from '@/lib/supabase/admin'
import type { SupabaseClient } from '@supabase/supabase-js'

const log = createLogger('milestones:process')

type ProcessResult =
  | { ok: true; scanned: number; created: number }
  | { ok: false; error: string }

type PetCandidate = {
  id: string
  name: string
  created_at: string
}

type ExistingCard = {
  pet_id: string
  milestone_day: number
}

type RecentDiaryImage = {
  image_url_916: string | null
  image_url_45: string | null
  image_url_11: string | null
}

export async function processMilestones(): Promise<ProcessResult> {
  const admin = createAdminClient()
  if (!admin) return { ok: false, error: 'supabase-admin-not-configured' }
  const db = admin as unknown as SupabaseClient

  const { data: pets, error: petsError } = await db
    .from('pets')
    .select('id, name, created_at')
    .is('deceased_at', null)
    .limit(500)
    .returns<PetCandidate[]>()

  if (petsError) {
    log.error('pet fetch failed', { err: petsError })
    return { ok: false, error: 'pet-fetch-failed' }
  }

  const petRows = pets ?? []
  if (petRows.length === 0) return { ok: true, scanned: 0, created: 0 }

  const petIds = petRows.map((pet) => pet.id)
  const { data: existingRaw, error: existingError } = await db
    .from('milestone_cards')
    .select('pet_id, milestone_day')
    .in('pet_id', petIds)
    .returns<ExistingCard[]>()

  if (existingError) {
    log.error('existing milestone fetch failed', { err: existingError })
    return { ok: false, error: 'existing-fetch-failed' }
  }

  const existingByPet = new Map<string, number[]>()
  for (const row of existingRaw ?? []) {
    existingByPet.set(row.pet_id, [
      ...(existingByPet.get(row.pet_id) ?? []),
      row.milestone_day,
    ])
  }

  let created = 0
  for (const pet of petRows) {
    const candidates = getEligibleMilestones({
      createdAt: pet.created_at,
      existingDays: existingByPet.get(pet.id),
    })

    for (const candidate of candidates) {
      const { data: recentImage } = await db
        .from('diaries')
        .select('image_url_916, image_url_45, image_url_11')
        .eq('pet_id', pet.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle<RecentDiaryImage>()

      const { error } = await db.from('milestone_cards').insert({
        pet_id: pet.id,
        milestone_day: candidate.day,
        title: `${pet.name}, ${candidate.title}`,
        caption: candidate.caption,
        image_url_916: recentImage?.image_url_916 ?? null,
        image_url_45: recentImage?.image_url_45 ?? null,
        image_url_11: recentImage?.image_url_11 ?? null,
        is_public: false,
      })

      if (!error) {
        created += 1
        continue
      }

      if (error.code !== '23505') {
        log.warn('milestone insert skipped', { petId: pet.id, day: candidate.day, err: error })
      }
    }
  }

  return { ok: true, scanned: petRows.length, created }
}
