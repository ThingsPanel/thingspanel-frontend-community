import { describe, expect, it, vi } from 'vitest'
import {
  classifyMaintenance,
  clampPercent,
  createMaintenancePoller,
  type MaintenanceStatus
} from '@/utils/system-maintenance'

describe('classifyMaintenance', () => {
  it.each([
    [undefined, 'running'],
    [{ state: 'running' }, 'running'],
    [{ state: 'idle' }, 'running'],
    [{ state: 'done' }, 'done'],
    [{ state: 'failed', code: 'upgrade_failed_rolled_back' }, 'rolled_back'],
    [{ state: 'failed', code: 'restore_failed_rolled_back' }, 'rolled_back'],
    [{ state: 'failed', code: 'upgrade_needs_human' }, 'needs_human'],
    [{ state: 'failed', code: 'rollback_failed_needs_human' }, 'needs_human'],
    [{ state: 'aborted', code: 'upgrade_not_newer' }, 'failed'],
    [{ state: 'failed' }, 'failed']
  ] as Array<[MaintenanceStatus | undefined, string]>)('%j -> %s', (input, expected) => {
    expect(classifyMaintenance(input)).toBe(expected)
  })

  it('clampPercent', () => {
    expect(clampPercent(NaN)).toBe(0)
    expect(clampPercent(150)).toBe(100)
    expect(clampPercent(42.4)).toBe(42)
    expect(clampPercent(undefined)).toBe(0)
  })
})

describe('createMaintenancePoller', () => {
  function setup(responses: Array<Response | Error>) {
    const timers: Array<() => void> = []
    const fetchMock = vi.fn(async () => {
      const next = responses.shift()!
      if (next instanceof Error) throw next
      return next
    })
    const onStatus = vi.fn()
    const onUnreachable = vi.fn()
    const poller = createMaintenancePoller({
      fetch: fetchMock as unknown as typeof fetch,
      onStatus,
      onUnreachable,
      setTimer: fn => timers.push(fn),
      clearTimer: () => {}
    })
    const flush = async () => {
      await Promise.resolve()
      await new Promise(r => setTimeout(r, 0))
    }
    return { poller, fetchMock, onStatus, onUnreachable, timers, flush }
  }
  const doc = (d: object) => new Response(JSON.stringify(d), { status: 200 })

  it('polls the public status file without credentials, keeps going while running, stops on done', async () => {
    const t = setup([
      doc({ state: 'running', step: 'a', percent: 10 }),
      doc({ state: 'done', step: 'z', percent: 100 })
    ])
    t.poller.start()
    await t.flush()
    expect(t.fetchMock.mock.calls[0]).toEqual([
      '/system-status/status.json',
      expect.objectContaining({ cache: 'no-store' })
    ])
    expect(JSON.stringify(t.fetchMock.mock.calls[0])).not.toMatch(/authorization|x-token/i)
    expect(t.onStatus).toHaveBeenCalledTimes(1)
    expect(t.timers).toHaveLength(1)
    t.timers.shift()!()
    await t.flush()
    expect(t.onStatus).toHaveBeenCalledTimes(2)
    expect(t.timers).toHaveLength(0) // terminal: no further polling
    expect(t.poller.running).toBe(false)
  })

  it('stops after failed/aborted too (no retry loop)', async () => {
    const t = setup([doc({ state: 'failed', code: 'upgrade_needs_human' })])
    t.poller.start()
    await t.flush()
    expect(t.timers).toHaveLength(0)
    expect(t.fetchMock).toHaveBeenCalledTimes(1)
  })

  it('treats network errors, non-200 and junk as unreachable and keeps polling', async () => {
    const t = setup([new TypeError('down'), new Response('', { status: 503 }), doc({ nope: 1 })])
    t.poller.start()
    await t.flush()
    t.timers.shift()!()
    await t.flush()
    t.timers.shift()!()
    await t.flush()
    expect(t.onUnreachable).toHaveBeenCalledTimes(3)
    expect(t.onStatus).not.toHaveBeenCalled()
    expect(t.timers).toHaveLength(1)
  })

  it('stop() prevents further ticks', async () => {
    const t = setup([doc({ state: 'running' })])
    t.poller.start()
    await t.flush()
    t.poller.stop()
    t.timers.shift()!()
    await t.flush()
    expect(t.fetchMock).toHaveBeenCalledTimes(1)
  })
})
