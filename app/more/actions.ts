'use server'

import { revalidatePath } from 'next/cache'
import type { SupabaseClient } from '@supabase/supabase-js'

import { createNotificationIfAllowed } from '@/lib/notifications/delivery'
import {
  parseSupportInquiryAttachments,
  parseSupportInquiryForm,
} from '@/lib/support/inquiry'
import { deletePhoto, uploadSupportInquiryImage } from '@/lib/storage'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

type UntypedSupabase = SupabaseClient

export type SubmitSupportInquiryResult =
  | { ok: true }
  | { ok: false; error: string; code?: 'auth' | 'validation' | 'db' }

export async function submitSupportInquiry(
  formData: FormData,
): Promise<SubmitSupportInquiryResult> {
  const parsed = parseSupportInquiryForm(formData)
  if (!parsed.ok) {
    return { ok: false, error: parsed.error, code: 'validation' }
  }
  const attachments = parseSupportInquiryAttachments(formData)
  if (!attachments.ok) {
    return { ok: false, error: attachments.error, code: 'validation' }
  }

  const supabase = await createClient()
  if (!supabase) {
    return {
      ok: false,
      error: 'Supabase 설정이 필요해요. 관리자에게 문의해주세요.',
      code: 'db',
    }
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { ok: false, error: '로그인이 필요해요.', code: 'auth' }
  }

  const inquiryId = crypto.randomUUID()
  const uploadedAttachments = []

  for (const attachment of attachments.files) {
    const attachmentId = crypto.randomUUID()
    const upload = await uploadSupportInquiryImage({
      userId: user.id,
      inquiryId,
      attachmentId,
      file: attachment.file,
      ext: attachment.ext,
    })

    if ('error' in upload) {
      await cleanupUploadedSupportImages(
        uploadedAttachments.map((item) => item.storage_path),
      )
      return { ok: false, error: upload.error, code: 'db' }
    }

    uploadedAttachments.push({
      id: attachmentId,
      inquiry_id: inquiryId,
      user_id: user.id,
      storage_path: upload.path,
      file_name: attachment.fileName,
      content_type: attachment.contentType,
      file_size: attachment.fileSize,
    })
  }

  const { error } = await supabase.from('support_inquiries').insert({
    id: inquiryId,
    user_id: user.id,
    category: parsed.data.category,
    topic: parsed.data.topic,
    title: parsed.data.title,
    body: parsed.data.body,
  })

  if (error) {
    await cleanupUploadedSupportImages(
      uploadedAttachments.map((item) => item.storage_path),
    )
    return {
      ok: false,
      error: '문의를 남기지 못했어요. 잠시 후 다시 시도해주세요.',
      code: 'db',
    }
  }

  if (uploadedAttachments.length > 0) {
    const { error: attachmentError } = await supabase
      .from('support_inquiry_attachments')
      .insert(uploadedAttachments)

    if (attachmentError) {
      await cleanupUploadedSupportImages(
        uploadedAttachments.map((item) => item.storage_path),
      )
      const adminForCleanup = createAdminClient()
      await adminForCleanup
        ?.from('support_inquiries')
        .delete()
        .eq('id', inquiryId)
        .eq('user_id', user.id)

      return {
        ok: false,
        error: '첨부 이미지를 저장하지 못했어요. 다시 시도해주세요.',
        code: 'db',
      }
    }
  }

  const admin = createAdminClient()
  if (admin) {
    const adminDb = admin as unknown as UntypedSupabase
    await createNotificationIfAllowed(adminDb, {
      userId: user.id,
      kind: 'support',
      title: '문의가 접수됐어요',
      body: '남겨준 내용을 확인하고 필요한 답을 준비할게요.',
      href: '/more',
    })
  }

  revalidatePath('/more')
  revalidatePath('/more/inquiries')
  revalidatePath('/notifications')

  return { ok: true }
}

async function cleanupUploadedSupportImages(paths: string[]) {
  await Promise.all(paths.map((path) => deletePhoto(path)))
}
