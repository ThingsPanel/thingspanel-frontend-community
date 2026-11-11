import type { Reading, ReadingPage } from './device-runtime-native-transport'

/** Row shape the existing event table already renders (identify / ts / data). */
export interface EventRow {
  id: string
  identify: string
  ts: string
  data: string
  error_message: string
}

/** A reading's value as the text the old tables showed: strings stay as-is, everything else is JSON. */
export function readingValueText(value: unknown): string {
  if (typeof value === 'string') return value
  if (value === undefined) return ''
  return JSON.stringify(value)
}

export function eventRowsFromReadings(page: ReadingPage): { list: EventRow[]; count: number } {
  const list = page.items
    .filter((item: Reading) => item.kind === 'event')
    .map(item => ({
      id: item.sampleId,
      identify: item.identifier,
      ts: item.observedAt,
      data: readingValueText(item.value),
      error_message: ''
    }))
  return { list, count: page.total }
}

/** Row shape of the latest attribute table: raw JSON value, never stringified or coerced. */
export interface LatestRow {
  id: string
  key: string
  ts: string
  value: unknown
}

export function latestRowsFromReadings(
  page: ReadingPage,
  kind: 'attribute' | 'telemetry'
): { list: LatestRow[]; count: number; truncated: boolean } {
  const list = page.items
    .filter((item: Reading) => item.kind === kind)
    .map(item => ({ id: item.sampleId, key: item.identifier, ts: item.observedAt, value: item.value }))
  return { list, count: page.total, truncated: page.total > page.items.length }
}
