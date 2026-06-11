import { describe, expect, it } from 'vitest'
import { ApiError, localizeError } from '../client'

describe('thingmodel client helpers', () => {
  it('creates ApiError with code and details', () => {
    const error = new ApiError('VALIDATION_FAILED', 'invalid payload', { field: 'name' })
    expect(error).toBeInstanceOf(Error)
    expect(error.name).toBe('ApiError')
    expect(error.code).toBe('VALIDATION_FAILED')
    expect(error.message).toBe('invalid payload')
    expect(error.details).toEqual({ field: 'name' })
  })

  it('localizes ApiError to its message', () => {
    const error = new ApiError('NOT_FOUND', 'thing model not found')
    expect(localizeError(error)).toBe('thing model not found')
  })

  it('localizes generic Error to its message', () => {
    expect(localizeError(new Error('network down'))).toBe('network down')
  })

  it('falls back for unknown errors', () => {
    expect(localizeError('boom')).toBe('Request failed')
    expect(localizeError(null)).toBe('Request failed')
  })
})
