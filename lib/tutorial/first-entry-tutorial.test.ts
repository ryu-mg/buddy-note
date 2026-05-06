import { describe, expect, it } from 'bun:test'

import {
  FIRST_ENTRY_TUTORIAL_STEPS,
  FIRST_ENTRY_TUTORIAL_VERSION,
  type FirstEntryTutorialStepId,
} from '@/lib/tutorial/first-entry-tutorial'

describe('FIRST_ENTRY_TUTORIAL_STEPS', () => {
  it('uses a stable version key', () => {
    expect(FIRST_ENTRY_TUTORIAL_VERSION).toBe('first-entry-v1')
  })

  it('contains the three product steps in order', () => {
    expect(FIRST_ENTRY_TUTORIAL_STEPS.map((step) => step.id)).toEqual([
      'calendar-view',
      'week-view',
      'ai-diary',
    ] satisfies FirstEntryTutorialStepId[])
  })

  it('explains the left bottom nav as the week view', () => {
    const weekStep = FIRST_ENTRY_TUTORIAL_STEPS[1]
    expect(weekStep?.title).toContain('왼쪽 탭')
    expect(weekStep?.body).toContain('주간 뷰')
    expect(weekStep?.targetHref).toBe('/week')
  })

  it('keeps only the final primary CTA pointed at log creation', () => {
    expect(FIRST_ENTRY_TUTORIAL_STEPS[0]?.primaryCta.href).toBeUndefined()
    expect(FIRST_ENTRY_TUTORIAL_STEPS[1]?.primaryCta.href).toBeUndefined()
    expect(FIRST_ENTRY_TUTORIAL_STEPS[2]?.primaryCta).toEqual({
      label: '첫 일기 쓰기',
      href: '/log',
      completion: 'completed',
    })
  })

  it('uses Korean copy without emoji or banned SaaS words', () => {
    for (const step of FIRST_ENTRY_TUTORIAL_STEPS) {
      const copy = `${step.title} ${step.body}`
      expect(copy).not.toMatch(/[✨🐶🐾]/)
      expect(copy).not.toContain('스마트')
      expect(copy).not.toContain('혁신')
      expect(copy).not.toContain('올인원')
    }
  })
})
