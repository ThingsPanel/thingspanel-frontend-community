import { describe, expect, it } from 'vitest'
import { eventRowsFromReadings, latestRowsFromReadings, readingValueText } from './device-runtime-rows'

describe('event rows from native readings', () => {
  it('keeps string payloads and JSON-encodes structured ones', () => {
    expect(readingValueText('plain')).toBe('plain')
    expect(readingValueText({ a: 1 })).toBe('{"a":1}')
    expect(readingValueText(null)).toBe('null')
  })

  it('maps readings to the old table row shape and keeps the server total', () => {
    const result = eventRowsFromReadings({
      items: [
        {
          deviceId: 'd',
          identifier: 'overheat',
          kind: 'event',
          value: { t: 90 },
          observedAt: '2026-10-28T01:02:03.000Z',
          snapshotId: null,
          sampleId: 'e1',
          cacheVersion: null,
          aggregation: 'raw',
          windowStart: null,
          windowEnd: null,
          sampleCount: null
        }
      ],
      page: 1,
      pageSize: 4,
      total: 9
    })
    expect(result.count).toBe(9)
    expect(result.list[0]).toMatchObject({
      id: 'e1',
      identify: 'overheat',
      ts: '2026-10-28T01:02:03.000Z',
      data: '{"t":90}'
    })
  })
})

describe('latest rows from native readings', () => {
  const reading = (identifier: string, value: unknown, kind: 'attribute' | 'telemetry' = 'attribute') => ({
    deviceId: 'd',
    identifier,
    kind,
    value,
    observedAt: '2026-10-28T01:02:03.000Z',
    snapshotId: null,
    sampleId: `s-${identifier}`,
    cacheVersion: null,
    aggregation: 'last' as const,
    windowStart: null,
    windowEnd: null,
    sampleCount: null
  })
  it('keeps raw values and flags a truncated page', () => {
    const result = latestRowsFromReadings(
      {
        items: [reading('fw', '1.2'), reading('on', true), reading('t', 3, 'telemetry')],
        page: 1,
        pageSize: 100,
        total: 120
      } as any,
      'attribute'
    )
    expect(result.list).toEqual([
      { id: 's-fw', key: 'fw', ts: '2026-10-28T01:02:03.000Z', value: '1.2' },
      { id: 's-on', key: 'on', ts: '2026-10-28T01:02:03.000Z', value: true }
    ])
    expect(result.count).toBe(120)
    expect(result.truncated).toBe(true)
  })
})
