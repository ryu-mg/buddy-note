import { describe, expect, it } from 'bun:test'

import {
  INQUIRY_MENU_ITEMS,
  INQUIRY_TOPIC_OPTIONS,
  MAX_INQUIRY_ATTACHMENTS,
  inquiryCategoryLabel,
  inquiryStatusLabel,
  inquiryTopicLabel,
  parseSupportInquiryAttachments,
  parseSupportInquiryForm,
} from '@/lib/support/inquiry'

function form(values: Record<string, string>): FormData {
  const formData = new FormData()
  for (const [key, value] of Object.entries(values)) {
    formData.set(key, value)
  }
  return formData
}

describe('support inquiry', () => {
  it('exposes the three inquiry menu choices', () => {
    expect(INQUIRY_MENU_ITEMS.map((item) => item.category)).toEqual([
      'question',
      'bug',
      'feature',
    ])
  })

  it('validates and trims inquiry form input', () => {
    const result = parseSupportInquiryForm(
      form({
        category: 'bug',
        topic: 'upload',
        title: '  저장 오류  ',
        body: '사진을 올린 뒤 완료 화면으로 넘어가지 않아요.',
      }),
    )

    expect(result).toEqual({
      ok: true,
      data: {
        category: 'bug',
        topic: 'upload',
        title: '저장 오류',
        body: '사진을 올린 뒤 완료 화면으로 넘어가지 않아요.',
      },
    })
  })

  it('rejects short inquiry body copy', () => {
    const result = parseSupportInquiryForm(
      form({
        category: 'question',
        topic: 'account',
        title: '질문',
        body: '짧음',
      }),
    )

    expect(result.ok).toBe(false)
  })

  it('rejects a topic that does not belong to the selected inquiry category', () => {
    const result = parseSupportInquiryForm(
      form({
        category: 'bug',
        topic: 'sharing',
        title: '공유 버튼',
        body: '버그 제보에서는 공유 제안 카테고리를 고르면 안 돼요.',
      }),
    )

    expect(result.ok).toBe(false)
  })

  it('validates image attachments', () => {
    const formData = new FormData()
    formData.append(
      'attachments',
      new File(['image'], 'screen.png', { type: 'image/png' }),
    )

    const result = parseSupportInquiryAttachments(formData)

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.files).toHaveLength(1)
    expect(result.files[0]?.fileName).toBe('screen.png')
    expect(result.files[0]?.contentType).toBe('image/png')
    expect(result.files[0]?.fileSize).toBe(5)
    expect(result.files[0]?.ext).toBe('png')
  })

  it('rejects too many image attachments', () => {
    const formData = new FormData()
    for (let index = 0; index < MAX_INQUIRY_ATTACHMENTS + 1; index += 1) {
      formData.append(
        'attachments',
        new File(['image'], `screen-${index}.png`, { type: 'image/png' }),
      )
    }

    const result = parseSupportInquiryAttachments(formData)

    expect(result.ok).toBe(false)
  })

  it('maps categories and statuses to Korean labels', () => {
    expect(inquiryCategoryLabel('feature')).toBe('제안')
    expect(inquiryTopicLabel('feature', 'sharing')).toBe('공유')
    expect(inquiryStatusLabel('reviewing')).toBe('확인 중')
  })

  it('exposes topic choices for every inquiry menu choice', () => {
    for (const item of INQUIRY_MENU_ITEMS) {
      expect(INQUIRY_TOPIC_OPTIONS[item.category].length).toBeGreaterThan(0)
    }
  })
})
