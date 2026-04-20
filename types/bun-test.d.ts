// bun:test 앰비언트 타입 선언.
// `@types/bun` 이 설치돼 있지 않은 환경에서 `bunx tsc --noEmit` 이 테스트 파일을
// 타입체크할 수 있도록 최소 API 만 선언한다. 실제 런타임은 Bun 이 제공.
// 참고: https://bun.sh/docs/cli/test

declare module 'bun:test' {
  type TestFn = () => void | Promise<void>

  export function describe(name: string, fn: () => void): void
  export function it(name: string, fn: TestFn): void
  export function test(name: string, fn: TestFn): void
  export function beforeAll(fn: TestFn): void
  export function afterAll(fn: TestFn): void
  export function beforeEach(fn: TestFn): void
  export function afterEach(fn: TestFn): void

  interface Matchers<T = unknown> {
    toBe(expected: T): void
    toEqual(expected: unknown): void
    toStrictEqual(expected: unknown): void
    toBeTruthy(): void
    toBeFalsy(): void
    toBeNull(): void
    toBeUndefined(): void
    toBeDefined(): void
    toBeGreaterThan(n: number): void
    toBeGreaterThanOrEqual(n: number): void
    toBeLessThan(n: number): void
    toBeLessThanOrEqual(n: number): void
    toContain(item: unknown): void
    toHaveLength(n: number): void
    toMatch(pattern: RegExp | string): void
    toThrow(expected?: string | RegExp | Error): void
    not: Matchers<T>
  }

  export function expect<T>(actual: T): Matchers<T>
}
