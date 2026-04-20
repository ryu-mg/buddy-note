import type { MetadataRoute } from 'next'

import { createClient } from '@/lib/supabase/server'

// 매 시간 sitemap 재생성 — 새 공개 프로필이 빠르게 색인되도록.
// 정적인 루트 2개 + 공개 강아지 프로필만 포함 (RLS가 anon 으로도 public 만 반환).
export const revalidate = 3600

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:4000'

type SitemapPet = {
  slug: string
  updated_at: string | null
  created_at: string
}

function staticEntries(): MetadataRoute.Sitemap {
  const now = new Date()
  return [
    {
      url: `${SITE_URL}/`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: `${SITE_URL}/auth/login`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.3,
    },
  ]
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient()

  // env 미설정 dev 환경에서 sitemap 자체는 static routes 로 graceful fallback.
  if (!supabase) return staticEntries()

  // anon client + RLS 정책 (`pets_select_public`) 으로 자동 필터링 — is_public=true 만 반환.
  // v1 DAU 100 목표 기준 공개 프로필 < 수백 개 예상이라 단일 쿼리로 전부 가져옴.
  // 수천 개로 늘면 chunked pagination + 분할 sitemap index 로 전환 (아래 보고서 참조).
  const { data, error } = await supabase
    .from('pets')
    .select('slug, updated_at, created_at')
    .eq('is_public', true)

  if (error) {
    console.warn('[sitemap] 공개 프로필 쿼리 실패, static 만 반환:', error.message)
    return staticEntries()
  }

  const dynamicEntries: MetadataRoute.Sitemap = (data as SitemapPet[] | null ?? [])
    .filter((pet) => typeof pet.slug === 'string' && pet.slug.length > 0)
    .map((pet) => ({
      url: `${SITE_URL}/b/${pet.slug}`,
      lastModified: new Date(pet.updated_at ?? pet.created_at),
      changeFrequency: 'daily' as const,
      priority: 0.7,
    }))

  return [...staticEntries(), ...dynamicEntries]
}
