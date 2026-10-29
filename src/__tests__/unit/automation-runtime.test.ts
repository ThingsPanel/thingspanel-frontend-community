import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getAutomationMode, routeAutomationCall } from '@/service/api/automation-runtime'

const { get } = vi.hoisted(() => ({ get: vi.fn() }))
vi.mock('@/service/request', () => ({ request: { get } }))

describe('automation uses the active backend engine', () => {
  beforeEach(() => get.mockReset())

  it('uses legacy by default and follows a backend switch without rebuilding', async () => {
    const legacy = vi.fn().mockResolvedValue({ data: 'old', error: null })
    const native = vi.fn().mockResolvedValue({ data: 'new', error: null })
    get.mockResolvedValueOnce({ data: { mode: 'legacy' } }).mockResolvedValueOnce({ data: { mode: 'native' } })
    const save = routeAutomationCall(legacy, native)
    expect((await save('rule-a')).data).toBe('old')
    expect((await save('rule-b')).data).toBe('new')
    expect(legacy).toHaveBeenCalledTimes(1)
    expect(legacy).toHaveBeenCalledWith('rule-a')
    expect(native).toHaveBeenCalledTimes(1)
    expect(native).toHaveBeenCalledWith('rule-b')
  })

  it('does not write to either database when the mode cannot be determined', async () => {
    get.mockResolvedValue({ data: null, error: new Error('unavailable') })
    const legacy = vi.fn()
    const native = vi.fn()
    expect((await routeAutomationCall(legacy, native)()).error).toBeInstanceOf(Error)
    expect(legacy).not.toHaveBeenCalled()
    expect(native).not.toHaveBeenCalled()
  })

  it('does not replay a failed native write against legacy', async () => {
    get.mockResolvedValue({ data: { mode: 'native' } })
    const legacy = vi.fn()
    const native = vi.fn().mockRejectedValue(new Error('unknown outcome'))
    expect((await routeAutomationCall(legacy, native)()).data).toBeNull()
    expect(legacy).not.toHaveBeenCalled()
    expect(native).toHaveBeenCalledTimes(1)
  })

  it('rejects an invalid mode instead of guessing', async () => {
    get.mockResolvedValue({ data: { mode: 'unexpected' } })
    await expect(getAutomationMode()).rejects.toThrow('无法确认')
  })
})
