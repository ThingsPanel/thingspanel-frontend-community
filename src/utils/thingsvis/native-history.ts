import type { DeviceRuntimeNativeClient } from '@/service/api/device-runtime-native-transport'

export interface NativeHistoryRequest {
  timeRange: string
  aggFunction: string
  aggWindow: string
}

export interface NativeHistoryRow {
  timestamp: string
  ts: number
  value: number
}

const MINUTE = 60_000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

/** Relative ranges the chart can ask for; anything else is left to the legacy path. */
const RANGE_MS: Record<string, number> = {
  last_5m: 5 * MINUTE,
  last_15m: 15 * MINUTE,
  last_30m: 30 * MINUTE,
  last_1h: HOUR,
  last_3h: 3 * HOUR,
  last_6h: 6 * HOUR,
  last_12h: 12 * HOUR,
  last_24h: DAY,
  last_3d: 3 * DAY,
  last_7d: 7 * DAY,
  last_15d: 15 * DAY,
  last_30d: 30 * DAY,
  last_60d: 60 * DAY,
  last_90d: 90 * DAY,
  last_6m: 180 * DAY,
  last_1y: 365 * DAY
}

/** Windows the Encore aggregate API accepts. The chart's `1mo` is not among them. */
const NATIVE_WINDOWS = new Set(['30s', '1m', '2m', '5m', '10m', '30m', '1h', '3h', '6h', '1d', '7d', '30d'])
const NATIVE_FUNCTIONS = new Set(['min', 'max', 'avg', 'sum', 'diff'])
const PAGE_SIZE = 100
const MAX_PAGES = 100

/**
 * Reads aggregated telemetry history from the Encore API. Returns null when the
 * request cannot be answered natively (unsupported window or range, a result too
 * large to page, or any request failure) so the caller keeps using the legacy
 * aggregate path instead of showing a broken chart.
 */
export async function fetchNativeHistoryRows(
  client: Pick<DeviceRuntimeNativeClient, 'listReadings'>,
  deviceId: string,
  identifier: string,
  request: NativeHistoryRequest,
  now: number = Date.now()
): Promise<NativeHistoryRow[] | null> {
  const span = RANGE_MS[request.timeRange]
  if (!span || !NATIVE_WINDOWS.has(request.aggWindow) || !NATIVE_FUNCTIONS.has(request.aggFunction)) return null
  const from = new Date(now - span).toISOString()
  const to = new Date(now).toISOString()
  const rows: NativeHistoryRow[] = []
  try {
    for (let page = 1; page <= MAX_PAGES; page += 1) {
      const result = await client.listReadings(deviceId, {
        kind: 'telemetry',
        identifier,
        from,
        to,
        aggregation: request.aggFunction as 'avg',
        window: request.aggWindow,
        page,
        pageSize: PAGE_SIZE
      })
      for (const item of result.items) {
        // Number(null) is 0; a bucket without a value must stay absent, not become a zero point.
        const value = item.value === null || item.value === '' ? Number.NaN : Number(item.value)
        const ts = Date.parse(item.observedAt)
        if (Number.isFinite(value) && Number.isFinite(ts)) rows.push({ timestamp: item.observedAt, ts, value })
      }
      if (result.items.length === 0 || page * PAGE_SIZE >= result.total) {
        return rows.sort((a, b) => a.ts - b.ts)
      }
    }
    return null
  } catch {
    return null
  }
}
