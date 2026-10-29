import { describe, expect, it } from 'vitest'
import { administrativeStateLabel } from '@/utils/administrative-state'

describe('administrative state label', () => {
  it('translates the two known states and keeps anything else', () => {
    expect(administrativeStateLabel('enabled')).toBe('已启用')
    expect(administrativeStateLabel('disabled')).toBe('已停用')
    expect(administrativeStateLabel('suspended')).toBe('suspended')
    expect(administrativeStateLabel(null)).toBe('--')
  })
})
