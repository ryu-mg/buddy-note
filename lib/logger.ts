// TODO: swap to Sentry captureException / breadcrumb when DSN configured (env SENTRY_DSN).
//
// 의도적으로 의존성 0. 구조화된 한 줄 로그를 stdout/stderr 로 흘리고,
// 나중에 Sentry / Log Drain 이 붙으면 이 파일 내부만 교체한다 (call site는 불변).
//
// 사용 예:
//   const log = createLogger('log:action')
//   log.warn('memory summary fetch skipped', { petId, err })
//
// Next.js 서버 전용 — client component 에서 import 하면 build-time 에 실패.
import 'server-only'

type Level = 'error' | 'warn' | 'info' | 'debug'

const LEVEL_ORDER: Record<Level, number> = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
}

const REDACT_KEYS: ReadonlySet<string> = new Set([
  'email',
  'token',
  'password',
  'apikey',
  'authorization',
  'cookie',
])

const REDACTED = '[redacted]'

/**
 * 현재 threshold. `LOG_LEVEL` 환경변수 기준, 파싱 실패 시 `info`.
 * 호출 시점마다 읽는 게 아니라 모듈 load 시 한 번 — hot path 에서 env 조회
 * 오버헤드를 피한다. 테스트/스크립트에서 동적으로 바꾸려면 모듈을 다시 import.
 */
const currentThreshold: number = (() => {
  const raw = (process.env.LOG_LEVEL ?? '').toLowerCase()
  if (raw === 'error' || raw === 'warn' || raw === 'info' || raw === 'debug') {
    return LEVEL_ORDER[raw]
  }
  return LEVEL_ORDER.info
})()

/** Error 는 `{ name, message, stack }` 만 — 그 외 enumerable 프로퍼티/원본 객체는 버린다. */
function serializeError(err: Error): { name: string; message: string; stack?: string } {
  return {
    name: err.name,
    message: err.message,
    stack: err.stack,
  }
}

/**
 * context 를 재귀적으로 훑으며 (a) PII 키 redact (b) Error → plain object 변환.
 * 순환 참조는 `seen` WeakSet 으로 끊어서 `[circular]` 로 대체한다.
 */
function sanitize(value: unknown, seen: WeakSet<object>): unknown {
  if (value === null || value === undefined) return value
  if (value instanceof Error) return serializeError(value)

  const t = typeof value
  if (t === 'string' || t === 'number' || t === 'boolean' || t === 'bigint') {
    return t === 'bigint' ? (value as bigint).toString() : value
  }
  if (t !== 'object') {
    // function, symbol 등 — 직렬화 포기
    return `[${t}]`
  }

  const obj = value as object
  if (seen.has(obj)) return '[circular]'
  seen.add(obj)

  if (Array.isArray(obj)) {
    return obj.map((item) => sanitize(item, seen))
  }

  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(obj)) {
    if (REDACT_KEYS.has(k.toLowerCase())) {
      out[k] = REDACTED
      continue
    }
    out[k] = sanitize(v, seen)
  }
  return out
}

function stringifyContext(ctx: Record<string, unknown>): string {
  const cleaned = sanitize(ctx, new WeakSet()) as Record<string, unknown>
  try {
    return JSON.stringify(cleaned)
  } catch {
    // sanitize 가 순환을 끊었어도 BigInt 등 엣지 케이스가 남을 수 있어 한 번 더 guard.
    return '"[unserializable-context]"'
  }
}

function format(level: Level, scope: string, message: string, ctx?: Record<string, unknown>): string {
  const ts = new Date().toISOString()
  const head = `${ts} [${level}] [${scope}] ${message}`
  if (!ctx || Object.keys(ctx).length === 0) return head
  return `${head} · ${stringifyContext(ctx)}`
}

function emit(level: Level, scope: string, message: string, ctx?: Record<string, unknown>): void {
  if (LEVEL_ORDER[level] > currentThreshold) return
  const line = format(level, scope, message, ctx)
  if (level === 'error' || level === 'warn') {
    process.stderr.write(`${line}\n`)
  } else {
    process.stdout.write(`${line}\n`)
  }
}

export type Logger = {
  info: (message: string, context?: Record<string, unknown>) => void
  warn: (message: string, context?: Record<string, unknown>) => void
  error: (message: string, context?: Record<string, unknown>) => void
}

export function createLogger(scope: string): Logger {
  return {
    info: (message, context) => emit('info', scope, message, context),
    warn: (message, context) => emit('warn', scope, message, context),
    error: (message, context) => emit('error', scope, message, context),
  }
}

/** 스코프 지정이 번거로운 일회성 호출용 기본 logger. */
export const log: Logger = createLogger('app')
