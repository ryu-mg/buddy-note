import { describe, expect, it } from 'bun:test'

import { shouldShowFirstEntryTutorial } from '@/lib/tutorial/visibility'

const base = {
  hasUser: true,
  hasPet: true,
  pathname: '/',
  completedAt: null,
  dismissedAt: null,
}

describe('shouldShowFirstEntryTutorial', () => {
  it('shows on the first authenticated home entry after pet registration', () => {
    expect(shouldShowFirstEntryTutorial(base)).toBe(true)
  })

  it('does not show for anonymous users', () => {
    expect(
      shouldShowFirstEntryTutorial({
        ...base,
        hasUser: false,
      }),
    ).toBe(false)
  })

  it('does not show before pet registration is complete', () => {
    expect(
      shouldShowFirstEntryTutorial({
        ...base,
        hasPet: false,
      }),
    ).toBe(false)
  })

  it('does not show outside home', () => {
    expect(
      shouldShowFirstEntryTutorial({
        ...base,
        pathname: '/week',
      }),
    ).toBe(false)
  })

  it('does not show after completion', () => {
    expect(
      shouldShowFirstEntryTutorial({
        ...base,
        completedAt: '2026-05-06T00:00:00.000Z',
      }),
    ).toBe(false)
  })

  it('does not show after dismissal', () => {
    expect(
      shouldShowFirstEntryTutorial({
        ...base,
        dismissedAt: '2026-05-06T00:00:00.000Z',
      }),
    ).toBe(false)
  })
})
