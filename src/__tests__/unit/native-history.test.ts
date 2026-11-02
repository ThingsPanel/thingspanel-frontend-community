import { describe, expect, it, vi } from 'vitest'
import { fetchNativeHistoryRows } from '@/utils/thingsvis/native-history'

const now = Date.parse('2026-10-29T12:00:00.000Z')
const request = { timeRange: 'last_24h', aggFunction: 'avg', aggWindow: '5m' }
const item = (at: string, value: unknown) => ({ observedAt: at, value })
const page = (items: unknown[], total = items.length) => ({ items, page: 1, pageSize: 100, total })

describe('native chart history', () => {
  it('asks for the aggregated range ending now and returns ascending numeric rows', async () => {
    const client = {
      listReadings: vi
        .fn()
        .mockResolvedValue(
          page([
            item('2026-10-29T11:05:00.000Z', 2),
            item('2026-10-29T11:00:00.000Z', '1.5'),
            item('x', 9),
            item('2026-10-29T10:55:00.000Z', null)
          ])
        )
    }
    const rows = await fetchNativeHistoryRows(client as any, 'd1', 'temp', request, now)
    expect(client.listReadings).toHaveBeenCalledWith('d1', {
      kind: 'telemetry',
      identifier: 'temp',
      from: '2026-10-28T12:00:00.000Z',
      to: '2026-10-29T12:00:00.000Z',
      aggregation: 'avg',
      window: '5m',
      page: 1,
      pageSize: 100
    })
    expect(rows!.map(r => r.value)).toEqual([1.5, 2])
  })

  it('follows pages until the total is reached', async () => {
    const client = {
      listReadings: vi
        .fn()
        .mockResolvedValueOnce(
          page(
            Array.from({ length: 100 }, (_, i) => item(new Date(now - i * 60000).toISOString(), i)),
            101
          )
        )
        .mockResolvedValueOnce(page([item(new Date(now - 200 * 60000).toISOString(), 7)], 101))
    }
    const rows = await fetchNativeHistoryRows(client as any, 'd1', 'temp', request, now)
    expect(client.listReadings).toHaveBeenCalledTimes(2)
    expect(rows).toHaveLength(101)
  })

  it('declines unsupported windows, functions and ranges without calling the API', async () => {
    const client = { listReadings: vi.fn() }
    for (const bad of [
      { ...request, aggWindow: '1mo' },
      { ...request, aggFunction: 'median' },
      { ...request, timeRange: 'last_999d' }
    ]) {
      expect(await fetchNativeHistoryRows(client as any, 'd1', 'temp', bad, now)).toBeNull()
    }
    expect(client.listReadings).not.toHaveBeenCalled()
  })

  it('falls back (null) when the API fails, so the legacy path can answer', async () => {
    const client = { listReadings: vi.fn().mockRejectedValue(new Error('exceeds 50000')) }
    expect(await fetchNativeHistoryRows(client as any, 'd1', 'temp', request, now)).toBeNull()
  })

  it('returns an empty list, not a fallback, when the window genuinely has no data', async () => {
    const client = { listReadings: vi.fn().mockResolvedValue(page([])) }
    expect(await fetchNativeHistoryRows(client as any, 'd1', 'temp', request, now)).toEqual([])
  })
})
