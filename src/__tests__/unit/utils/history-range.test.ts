import { describe, expect, it } from 'vitest'
import { earliestStartWithin, exceedsInclusiveSpan } from '@/utils/history-range'

const DAY = 24 * 60 * 60 * 1000

describe('history range limits', () => {
  it('keeps the default window within the limit once the end is made exclusive', () => {
    const end = 1_700_000_000_000
    const start = earliestStartWithin(end, DAY)
    expect(exceedsInclusiveSpan(start, end, DAY)).toBe(false)
    expect(end + 1 - start).toBe(DAY)
  })

  it('rejects a range one millisecond longer than the limit', () => {
    const end = 1_700_000_000_000
    expect(exceedsInclusiveSpan(earliestStartWithin(end, DAY) - 1, end, DAY)).toBe(true)
  })
})
