import { NextResponse } from 'next/server'

import { processMilestones } from '@/lib/milestones/process'
import { hasValidBearerToken } from '@/lib/ops/cron-auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function POST(request: Request): Promise<Response> {
  const expected = process.env.MEMORY_WORKER_SECRET
  if (!expected || expected.length < 16) {
    return NextResponse.json(
      { ok: false, error: 'unauthorized' },
      { status: 401 },
    )
  }

  if (!hasValidBearerToken(request.headers, expected)) {
    return NextResponse.json(
      { ok: false, error: 'unauthorized' },
      { status: 401 },
    )
  }

  const result = await processMilestones()
  if (!result.ok) {
    return NextResponse.json(result, { status: 500 })
  }

  return NextResponse.json(result)
}
