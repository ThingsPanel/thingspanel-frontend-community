import { describe, expect, it } from 'vitest'
import { parseStoredDebugSession } from '@/service/api/device-debug-native-transport'

describe('stored debug session', () => {
  const now = Date.parse('2026-10-28T00:00:00Z')
  it('keeps an unexpired session', () => {
    expect(parseStoredDebugSession('{"id":"s","expiresAt":"2026-10-28T00:05:00Z"}', now)).toEqual({
      id: 's',
      expiresAt: '2026-10-28T00:05:00Z'
    })
  })
  it('drops expired, malformed or missing values', () => {
    expect(parseStoredDebugSession('{"id":"s","expiresAt":"2026-10-27T00:00:00Z"}', now)).toBe(null)
    expect(parseStoredDebugSession('{bad', now)).toBe(null)
    expect(parseStoredDebugSession('{"id":1}', now)).toBe(null)
    expect(parseStoredDebugSession(null, now)).toBe(null)
  })
})
