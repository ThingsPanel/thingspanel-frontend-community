import { describe, expect, it } from 'vitest'
import {
  classifyWriteFailure,
  describeAccepted,
  freezeAttempt,
  newIdempotencyKey
} from '@/service/api/device-write-attempt'

describe('device write attempt', () => {
  it('freezes the request so a retry cannot change it', () => {
    const attempt = freezeAttempt('d1', { gatewayId: 'g', subdeviceAddress: 'a' }, '"v1"', 'dev-12345678')
    expect(Object.isFrozen(attempt)).toBe(true)
    expect(attempt.key).toBe('dev-12345678')
  })

  it('only treats a failure without an HTTP status as unknown', () => {
    expect(classifyWriteFailure(new Error('unreachable'))).toBe('unknown')
    expect(classifyWriteFailure({ status: 412 })).toBe('stale')
    expect(classifyWriteFailure({ status: 428 })).toBe('stale')
    expect(classifyWriteFailure({ status: 409 })).toBe('conflict')
    expect(classifyWriteFailure({ status: 422 })).toBe('rejected')
    expect(classifyWriteFailure({ status: 503 })).toBe('rejected')
  })

  it('generates keys the server accepts', () => {
    expect(newIdempotencyKey(() => 'abcdef12-0000')).toMatch(/^[A-Za-z0-9._:-]{8,128}$/)
  })

  it('never calls a pending operation applied', () => {
    expect(describeAccepted('pending')).toContain('尚未生效')
    expect(describeAccepted('succeeded')).toBe('已完成')
  })
})
