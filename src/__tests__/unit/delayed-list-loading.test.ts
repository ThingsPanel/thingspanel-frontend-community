import { effectScope, ref } from 'vue'
import { expect, test, vi } from 'vitest'
import { useDelayedListLoading } from '../../hooks/common/delayed-list-loading'

test('skips the spinner for short reads and clears it when a slow read finishes', () => {
  vi.useFakeTimers()
  const scope = effectScope()
  try {
    const pending = ref(false)
    const showLoading = scope.run(() => useDelayedListLoading(pending))!

    pending.value = true
    vi.advanceTimersByTime(100)
    pending.value = false
    vi.advanceTimersByTime(100)
    expect(showLoading.value).toBe(false)

    pending.value = true
    vi.advanceTimersByTime(180)
    expect(showLoading.value).toBe(true)
    pending.value = false
    expect(showLoading.value).toBe(false)
  } finally {
    scope.stop()
    vi.useRealTimers()
  }
})
