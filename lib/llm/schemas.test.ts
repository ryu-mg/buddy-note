import { describe, expect, it } from 'bun:test'

import {
  diaryInputSchema,
  diarySchema,
  LOG_TAG_VALUES,
  logTagSchema,
} from '@/lib/llm/schemas'

const validCallback = {
  note: '공원에서 새 친구 만난 날',
  source: 'log' as const,
  referenceDate: '2026-04-20',
}

const validDiaryInput = {
  photoBase64: 'aGVsbG8=',
  photoMediaType: 'image/jpeg',
  petName: '마루',
  personaFragment: '나는 마루, 푸들이야. 사람 옆을 좋아해.',
  memo: '오늘 산책했어',
  recentCallbacks: [validCallback],
}

describe('logTagSchema', () => {
  it('모든 LOG_TAG_VALUES를 허용한다', () => {
    for (const tag of LOG_TAG_VALUES) {
      expect(logTagSchema.safeParse(tag).success).toBeTruthy()
    }
  })

  it('vocabulary 밖의 태그를 거절한다', () => {
    expect(logTagSchema.safeParse('vet').success).toBeFalsy()
    expect(logTagSchema.safeParse('').success).toBeFalsy()
  })
})

describe('diarySchema', () => {
  const valid = {
    title: '오늘의 마루',
    body: '오늘 나는 공원에서 냄새를 잔뜩 맡았다. 집에 와서는 조금 졸렸다.',
    suggestedTags: ['walk', 'sleep'],
  }

  it('유효한 LLM 출력 payload를 허용한다', () => {
    expect(diarySchema.safeParse(valid).success).toBeTruthy()
  })

  it('title은 빈 문자열이면 실패한다', () => {
    expect(diarySchema.safeParse({ ...valid, title: '' }).success).toBeFalsy()
  })

  it('title은 40자를 넘으면 실패한다', () => {
    expect(
      diarySchema.safeParse({ ...valid, title: '가'.repeat(41) }).success,
    ).toBeFalsy()
  })

  it('body는 20자 미만이면 실패한다', () => {
    expect(diarySchema.safeParse({ ...valid, body: '짧다' }).success).toBeFalsy()
  })

  it('body는 600자를 넘으면 실패한다', () => {
    expect(
      diarySchema.safeParse({ ...valid, body: '가'.repeat(601) }).success,
    ).toBeFalsy()
  })

  it('suggestedTags는 빈 배열도 허용한다', () => {
    expect(
      diarySchema.safeParse({ ...valid, suggestedTags: [] }).success,
    ).toBeTruthy()
  })

  it('suggestedTags는 8개 초과면 실패한다', () => {
    expect(
      diarySchema.safeParse({
        ...valid,
        suggestedTags: Array.from({ length: 9 }, () => 'walk'),
      }).success,
    ).toBeFalsy()
  })

  it('suggestedTags에 모르는 태그가 있으면 실패한다', () => {
    expect(
      diarySchema.safeParse({ ...valid, suggestedTags: ['walk', 'vet'] })
        .success,
    ).toBeFalsy()
  })
})

describe('diaryInputSchema', () => {
  it('유효한 diary 생성 입력을 허용한다', () => {
    expect(diaryInputSchema.safeParse(validDiaryInput).success).toBeTruthy()
  })

  it('memo와 recentCallbacks는 생략 시 기본값으로 채워진다', () => {
    const minimal = {
      photoBase64: validDiaryInput.photoBase64,
      photoMediaType: validDiaryInput.photoMediaType,
      petName: validDiaryInput.petName,
      personaFragment: validDiaryInput.personaFragment,
    }
    const parsed = diaryInputSchema.safeParse(minimal)

    expect(parsed.success).toBeTruthy()
    if (parsed.success) {
      expect(parsed.data.memo).toBe('')
      expect(parsed.data.recentCallbacks).toEqual([])
    }
  })

  it('photoBase64는 빈 문자열이면 실패한다', () => {
    expect(
      diaryInputSchema.safeParse({ ...validDiaryInput, photoBase64: '' })
        .success,
    ).toBeFalsy()
  })

  it('지원하지 않는 media type은 실패한다', () => {
    expect(
      diaryInputSchema.safeParse({
        ...validDiaryInput,
        photoMediaType: 'image/svg+xml',
      }).success,
    ).toBeFalsy()
  })

  it('허용된 media type은 통과한다', () => {
    for (const mediaType of [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
    ]) {
      expect(
        diaryInputSchema.safeParse({
          ...validDiaryInput,
          photoMediaType: mediaType,
        }).success,
      ).toBeTruthy()
    }
  })

  it('petName은 trim 후 빈 문자열이면 실패한다', () => {
    expect(
      diaryInputSchema.safeParse({ ...validDiaryInput, petName: '   ' })
        .success,
    ).toBeFalsy()
  })

  it('petName은 24자를 넘으면 실패한다', () => {
    expect(
      diaryInputSchema.safeParse({
        ...validDiaryInput,
        petName: '가'.repeat(25),
      }).success,
    ).toBeFalsy()
  })

  it('personaFragment는 빈 문자열이면 실패한다', () => {
    expect(
      diaryInputSchema.safeParse({ ...validDiaryInput, personaFragment: '' })
        .success,
    ).toBeFalsy()
  })

  it('personaFragment는 500자를 넘으면 실패한다', () => {
    expect(
      diaryInputSchema.safeParse({
        ...validDiaryInput,
        personaFragment: 'a'.repeat(501),
      }).success,
    ).toBeFalsy()
  })

  it('memo는 200자를 넘으면 실패한다', () => {
    expect(
      diaryInputSchema.safeParse({
        ...validDiaryInput,
        memo: '가'.repeat(201),
      }).success,
    ).toBeFalsy()
  })

  it('recentCallbacks는 10개까지 허용한다', () => {
    expect(
      diaryInputSchema.safeParse({
        ...validDiaryInput,
        recentCallbacks: Array.from({ length: 10 }, () => validCallback),
      }).success,
    ).toBeTruthy()
  })

  it('recentCallbacks는 11개면 실패한다', () => {
    expect(
      diaryInputSchema.safeParse({
        ...validDiaryInput,
        recentCallbacks: Array.from({ length: 11 }, () => validCallback),
      }).success,
    ).toBeFalsy()
  })
})
