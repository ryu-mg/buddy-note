export type JosaPair = '은/는' | '이/가' | '을/를' | '와/과' | '이야/야'

const HANGUL_START = 0xac00
const HANGUL_END = 0xd7a3
const BATCHIM_MOD = 28

const JOSA_BY_PAIR: Record<
  JosaPair,
  { withBatchim: string; withoutBatchim: string }
> = {
  '은/는': { withBatchim: '은', withoutBatchim: '는' },
  '이/가': { withBatchim: '이', withoutBatchim: '가' },
  '을/를': { withBatchim: '을', withoutBatchim: '를' },
  '와/과': { withBatchim: '과', withoutBatchim: '와' },
  '이야/야': { withBatchim: '이야', withoutBatchim: '야' },
}

/**
 * 마지막 한글 음절에 받침이 있는지 판단한다.
 * 비한글/영문은 자연스러운 구어형을 위해 받침 없음으로 처리한다.
 */
export function hasBatchim(word: string): boolean {
  const last = lastMeaningfulChar(word)
  if (!last) return false

  const code = last.charCodeAt(0)
  if (code < HANGUL_START || code > HANGUL_END) return false

  return (code - HANGUL_START) % BATCHIM_MOD !== 0
}

export function selectJosa(word: string, pair: JosaPair): string {
  const options = JOSA_BY_PAIR[pair]
  return hasBatchim(word) ? options.withBatchim : options.withoutBatchim
}

export function withJosa(word: string, pair: JosaPair): string {
  const trimmed = word.trim()
  return `${trimmed}${selectJosa(trimmed, pair)}`
}

function lastMeaningfulChar(word: string): string {
  const trimmed = word.trim()
  if (!trimmed) return ''

  for (let i = trimmed.length - 1; i >= 0; i -= 1) {
    const char = trimmed[i]
    if (!/[\s.,!?;:()[\]{}'"“”‘’]/.test(char)) return char
  }

  return ''
}
