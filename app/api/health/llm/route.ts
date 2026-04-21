import { NextResponse, type NextRequest } from 'next/server'

import { DIARY_MODEL, getAnthropic } from '@/lib/llm/client'
import { createLogger } from '@/lib/logger'
import { hasValidBearerToken } from '@/lib/ops/cron-auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const log = createLogger('health:llm')

function getHealthSecret(): string {
  return process.env.LLM_HEALTH_SECRET || process.env.CRON_SECRET || ''
}

async function notifyDiscord(message: string): Promise<boolean> {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL
  if (!webhookUrl) return false

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        content: message,
        allowed_mentions: { parse: [] },
      }),
    })

    if (!response.ok) {
      log.warn('Discord webhook returned non-2xx', { status: response.status })
      return false
    }

    return true
  } catch (err) {
    log.warn('Discord webhook failed', { err })
    return false
  }
}

async function reportFailure(reason: string, detail?: string) {
  const notified = await notifyDiscord(
    [
      '[buddy-note] LLM health check 실패',
      `reason: ${reason}`,
      detail ? `detail: ${detail}` : null,
    ]
      .filter(Boolean)
      .join('\n'),
  )

  return { notified }
}

async function handleHealthCheck(request: NextRequest) {
  if (!hasValidBearerToken(request.headers, getHealthSecret())) {
    return NextResponse.json(
      { ok: false, error: 'health check secret이 필요해요.' },
      { status: 401 },
    )
  }

  const client = getAnthropic()
  if (!client) {
    const { notified } = await reportFailure('ANTHROPIC_API_KEY missing')
    return NextResponse.json(
      {
        ok: false,
        error: 'Anthropic 설정이 필요해요.',
        notified,
      },
      { status: 503 },
    )
  }

  const startedAt = Date.now()

  try {
    const response = await client.messages.create({
      model: DIARY_MODEL,
      max_tokens: 12,
      messages: [
        {
          role: 'user',
          content: 'pong 한 단어만 답해줘.',
        },
      ],
    })

    const first = response.content.at(0)
    const text = first?.type === 'text' ? first.text.trim() : ''
    const latencyMs = Date.now() - startedAt

    if (!text) {
      const { notified } = await reportFailure('empty model response')
      return NextResponse.json(
        {
          ok: false,
          error: 'LLM 응답이 비어 있어요.',
          model: DIARY_MODEL,
          latencyMs,
          notified,
        },
        { status: 502 },
      )
    }

    return NextResponse.json({
      ok: true,
      model: DIARY_MODEL,
      latencyMs,
      tokensInput: response.usage.input_tokens,
      tokensOutput: response.usage.output_tokens,
    })
  } catch (err) {
    const latencyMs = Date.now() - startedAt
    const detail = err instanceof Error ? err.message : 'unknown error'
    log.error('LLM health check failed', { err, latencyMs })
    const { notified } = await reportFailure('Anthropic request failed', detail)

    return NextResponse.json(
      {
        ok: false,
        error: 'LLM health check가 실패했어요.',
        model: DIARY_MODEL,
        latencyMs,
        notified,
      },
      { status: 502 },
    )
  }
}

export async function GET(request: NextRequest) {
  return handleHealthCheck(request)
}

export async function POST(request: NextRequest) {
  return handleHealthCheck(request)
}
