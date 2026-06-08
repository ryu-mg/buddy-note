import { z } from 'zod'

import type {
  SupportInquiryCategory,
  SupportInquiryStatus,
  SupportInquiryTopic,
} from '@/types/database'

export type InquiryMenuItem = {
  category: SupportInquiryCategory
  label: string
  description: string
}

export type InquiryTopicOption = {
  topic: SupportInquiryTopic
  label: string
}

export const MAX_INQUIRY_ATTACHMENTS = 3
export const MAX_INQUIRY_ATTACHMENT_BYTES = 5 * 1024 * 1024
export const SUPPORT_INQUIRY_ATTACHMENT_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
] as const

export const INQUIRY_MENU_ITEMS: InquiryMenuItem[] = [
  {
    category: 'question',
    label: '문의하기',
    description: '사용 중 막힌 부분을 남겨주세요.',
  },
  {
    category: 'bug',
    label: '버그 제보',
    description: '화면이 이상하거나 저장이 안 될 때 알려주세요.',
  },
  {
    category: 'feature',
    label: '기능 제안',
    description: '버디노트에 있으면 좋을 기능을 적어주세요.',
  },
]

export const INQUIRY_TOPIC_OPTIONS: Record<
  SupportInquiryCategory,
  InquiryTopicOption[]
> = {
  question: [
    { topic: 'account', label: '계정' },
    { topic: 'diary', label: '일기 작성' },
    { topic: 'membership', label: '멤버십' },
    { topic: 'notification', label: '알림' },
    { topic: 'profile', label: '버디 정보' },
    { topic: 'other', label: '기타' },
  ],
  bug: [
    { topic: 'login', label: '로그인' },
    { topic: 'upload', label: '사진 업로드' },
    { topic: 'diary', label: '일기 생성' },
    { topic: 'payment', label: '결제' },
    { topic: 'layout', label: '화면 표시' },
    { topic: 'other', label: '기타' },
  ],
  feature: [
    { topic: 'diary', label: '일기' },
    { topic: 'sharing', label: '공유' },
    { topic: 'theme', label: '테마/글꼴' },
    { topic: 'membership', label: '멤버십' },
    { topic: 'notification', label: '알림' },
    { topic: 'other', label: '기타' },
  ],
}

export const supportInquirySchema = z.object({
  category: z.enum(['question', 'bug', 'feature']),
  topic: z.enum([
    'account',
    'diary',
    'membership',
    'notification',
    'payment',
    'profile',
    'login',
    'upload',
    'layout',
    'performance',
    'sharing',
    'theme',
    'other',
  ]),
  title: z
    .string()
    .trim()
    .min(2, '제목을 두 글자 이상 적어주세요.')
    .max(80, '제목은 80자 안으로 적어주세요.'),
  body: z
    .string()
    .trim()
    .min(10, '내용을 조금만 더 자세히 적어주세요.')
    .max(1000, '내용은 1000자 안으로 적어주세요.'),
})
  .refine(
    (value) =>
      INQUIRY_TOPIC_OPTIONS[value.category].some(
        (option) => option.topic === value.topic,
      ),
    {
      message: '카테고리를 다시 선택해주세요.',
      path: ['topic'],
    },
  )

export type SupportInquiryInput = z.infer<typeof supportInquirySchema>

export function inquiryCategoryLabel(category: SupportInquiryCategory): string {
  switch (category) {
    case 'question':
      return '문의'
    case 'bug':
      return '버그'
    case 'feature':
      return '제안'
  }
}

export function inquiryTopicLabel(
  category: SupportInquiryCategory,
  topic: SupportInquiryTopic | null,
): string {
  if (!topic) return '분류 없음'
  return (
    INQUIRY_TOPIC_OPTIONS[category].find((option) => option.topic === topic)
      ?.label ?? '기타'
  )
}

export function inquiryStatusLabel(status: SupportInquiryStatus): string {
  switch (status) {
    case 'open':
      return '접수'
    case 'reviewing':
      return '확인 중'
    case 'answered':
      return '답변 완료'
    case 'closed':
      return '종료'
  }
}

export function parseSupportInquiryForm(
  formData: FormData,
): { ok: true; data: SupportInquiryInput } | { ok: false; error: string } {
  const parsed = supportInquirySchema.safeParse({
    category: formData.get('category'),
    topic: formData.get('topic'),
    title: formData.get('title'),
    body: formData.get('body'),
  })

  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? '입력을 다시 확인해주세요.',
    }
  }

  return { ok: true, data: parsed.data }
}

export type SupportInquiryAttachmentInput = {
  file: File
  fileName: string
  contentType: (typeof SUPPORT_INQUIRY_ATTACHMENT_TYPES)[number]
  fileSize: number
  ext: 'jpg' | 'png' | 'webp'
}

export function parseSupportInquiryAttachments(
  formData: FormData,
): { ok: true; files: SupportInquiryAttachmentInput[] } | { ok: false; error: string } {
  const files = formData
    .getAll('attachments')
    .filter((entry): entry is File => entry instanceof File && entry.size > 0)

  if (files.length > MAX_INQUIRY_ATTACHMENTS) {
    return {
      ok: false,
      error: `이미지는 최대 ${MAX_INQUIRY_ATTACHMENTS}장까지 올릴 수 있어요.`,
    }
  }

  const parsed: SupportInquiryAttachmentInput[] = []
  for (const file of files) {
    if (!isSupportedAttachmentType(file.type)) {
      return {
        ok: false,
        error: '이미지는 JPG, PNG, WebP만 올릴 수 있어요.',
      }
    }
    if (file.size > MAX_INQUIRY_ATTACHMENT_BYTES) {
      return {
        ok: false,
        error: '이미지는 한 장당 5MB 이하로 올려주세요.',
      }
    }

    parsed.push({
      file,
      fileName: file.name || `attachment.${extensionForContentType(file.type)}`,
      contentType: file.type,
      fileSize: file.size,
      ext: extensionForContentType(file.type),
    })
  }

  return { ok: true, files: parsed }
}

function isSupportedAttachmentType(
  type: string,
): type is (typeof SUPPORT_INQUIRY_ATTACHMENT_TYPES)[number] {
  return SUPPORT_INQUIRY_ATTACHMENT_TYPES.some((supported) => supported === type)
}

function extensionForContentType(type: string): 'jpg' | 'png' | 'webp' {
  switch (type) {
    case 'image/png':
      return 'png'
    case 'image/webp':
      return 'webp'
    default:
      return 'jpg'
  }
}
