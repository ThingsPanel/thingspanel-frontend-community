import { afterEach, describe, expect, it, vi } from 'vitest'
import { createObservedAttributePoller } from '@/utils/thingsvis/observed-attribute-poller'

afterEach(() => vi.useRealTimers())
describe('observed attribute refresh', () => {
  it('pushes reported false without overlapping reads and drops late responses after stop', async () => {
    vi.useFakeTimers()
    let resolve!: (values: Record<string, unknown>) => void
    const read = vi.fn(
      () =>
        new Promise<Record<string, unknown>>(done => {
          resolve = done
        })
    )
    const push = vi.fn()
    const poller = createObservedAttributePoller({ read, push, isVisible: () => true, onError: vi.fn() })
    poller.start()
    await vi.advanceTimersByTimeAsync(15000)
    expect(read).toHaveBeenCalledTimes(1)
    resolve({ qa_switch: false })
    await vi.advanceTimersByTimeAsync(0)
    expect(push).toHaveBeenCalledWith({ qa_switch: false })
    await vi.advanceTimersByTimeAsync(5000)
    poller.stop()
    resolve({ qa_switch: true })
    await vi.advanceTimersByTimeAsync(20000)
    expect(push).toHaveBeenCalledTimes(1)
    expect(read).toHaveBeenCalledTimes(2)
  })
  it('pauses hidden views, reports read errors without publishing values, then resumes', async () => {
    vi.useFakeTimers()
    let visible = false
    const read = vi.fn().mockRejectedValueOnce(new Error('503')).mockResolvedValue({ qa_switch: false })
    const push = vi.fn(),
      onError = vi.fn()
    const poller = createObservedAttributePoller({ read, push, onError, isVisible: () => visible })
    poller.start()
    await vi.advanceTimersByTimeAsync(10000)
    expect(read).not.toHaveBeenCalled()
    visible = true
    await vi.advanceTimersByTimeAsync(5000)
    expect(onError).toHaveBeenCalledTimes(1)
    expect(push).not.toHaveBeenCalled()
    await vi.advanceTimersByTimeAsync(5000)
    expect(push).toHaveBeenCalledWith({ qa_switch: false })
    poller.stop()
  })
})
