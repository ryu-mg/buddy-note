import { describe, expect, test } from 'bun:test'

import {
  collectReferencedDiaryImageNames,
  extractDiaryImageName,
  findOrphanDiaryImageNames,
} from '@/lib/ops/diary-image-cleanup'

describe('extractDiaryImageName', () => {
  test('Supabase public diary-images URL에서 object name을 뽑는다', () => {
    expect(
      extractDiaryImageName(
        'https://example.supabase.co/storage/v1/object/public/diary-images/card-916.png',
      ),
    ).toBe('card-916.png')
  })

  test('다른 bucket URL은 무시한다', () => {
    expect(
      extractDiaryImageName(
        'https://example.supabase.co/storage/v1/object/public/photos/card-916.png',
      ),
    ).toBeNull()
  })

  test('legacy bare filename도 처리한다', () => {
    expect(extractDiaryImageName('card-45.png')).toBe('card-45.png')
  })

  test('null/blank은 null', () => {
    expect(extractDiaryImageName(null)).toBeNull()
    expect(extractDiaryImageName('   ')).toBeNull()
  })
})

describe('collectReferencedDiaryImageNames', () => {
  test('세 이미지 컬럼을 dedupe해서 모은다', () => {
    const names = collectReferencedDiaryImageNames([
      {
        image_url_916:
          'https://example.supabase.co/storage/v1/object/public/diary-images/a.png',
        image_url_45: 'b.png',
        image_url_11: 'a.png',
      },
    ])

    expect([...names].sort()).toEqual(['a.png', 'b.png'])
  })
})

describe('findOrphanDiaryImageNames', () => {
  test('참조되지 않은 object만 정렬해서 반환한다', () => {
    expect(
      findOrphanDiaryImageNames(['b.png', 'a.png', '.emptyFolderPlaceholder'], new Set(['a.png'])),
    ).toEqual(['b.png'])
  })
})
