/**
 * LLM 경계용 input 위생 처리.
 *
 * 프롬프트 인젝션 방어의 마지막 방어선 — 유저/DB 에서 온 문자열이
 * system prompt 의 delimiter 나 data-block 구조를 깨뜨리지 못하도록
 * 최소한의 치환만 한다.
 *
 * 원칙:
 * - 제거가 아니라 **동등한 시각적 stand-in** 으로 치환해 모델이 여전히
 *   원문 의미를 읽도록 한다. (예: 작은 따옴표 대신 Unicode guillemet.)
 * - Newline 제거는 과하다 — memo 는 200자 cap 안에서 다줄 서술도 허용.
 *   대신 delimiter로 쓰이는 `<` / `>` 와 프롬프트 레이블 (`USER DATA`, `---`)
 *   형태를 못 찍도록 가장 위험한 문자만 바꾼다.
 *
 * 적용 대상: `memo`, `personaFragment`, `recentCallbacks[].note`, `petName`,
 * `breed` 등 외부/DB 에서 온 자유 텍스트 전부 (buildUserDataBlock, memory
 * generate 직렬화 시점에서 경유).
 */

/**
 * `<`, `>` 를 Unicode 단일 guillemet 로 치환해 XML-like tag smuggling 방어.
 * 추가로 system prompt 가 쓰는 핵심 delimiter (`USER DATA`, `---`) 를
 * 행 시작 위치에서 찍어 블록을 흉내 내는 것도 막는다.
 */
export function sanitizeUserText(raw: string | null | undefined): string {
  if (!raw) return ''
  return raw
    // 1) XML-like tag 차단 — Claude 가 보는 텍스트에는 시각적으로 동일한 문자를 남긴다.
    .replaceAll('<', '‹')
    .replaceAll('>', '›')
    // 2) system prompt delimiter 흉내 차단. '---' 로 시작하는 행을 '--·' 로 변형.
    //    중간 '---' 은 일반 줄표이므로 건드리지 않는다.
    .replace(/(^|\n)---(\s|$)/g, '$1--·$2')
    // 3) 'USER DATA' 헤더 smuggling 차단 (대소문자 무관, 행 시작).
    .replace(/(^|\n)\s*USER DATA/gi, '$1(U)SER DATA')
}
