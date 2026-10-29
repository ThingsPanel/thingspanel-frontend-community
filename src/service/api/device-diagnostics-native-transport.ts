import { createMetadataNativeRequester, type MetadataNativeErrorBody } from './metadata-native-http'

export interface DiagnosticCheck {
  stage: string
  state: 'pass' | 'fail' | 'unknown'
  code: string
  message: string
}

export interface DiagnosticCounter {
  success: number | null
  total: number | null
  successRate: number | null
  complete: boolean
}

export interface DiagnosticFailure {
  id: string
  timestamp: string
  direction: 'uplink' | 'downlink' | 'internal'
  stage: string
  code: string
  message: string
  requestId: string | null
}

export interface DeviceDiagnostic {
  deviceId: string
  observedAt: string
  checks: DiagnosticCheck[]
  windowFrom: string
  windowTo: string
  stats: { uplink: DiagnosticCounter; downlink: DiagnosticCounter; storage: DiagnosticCounter }
  recentFailures: DiagnosticFailure[]
  recentFailuresTruncated: boolean
}

export interface DiagnosticsQuery {
  from?: string
  to?: string
  recentFailureLimit?: number
}

export class DeviceDiagnosticsNativeError extends Error {
  constructor(
    readonly status: number,
    readonly body?: MetadataNativeErrorBody
  ) {
    super(body && 'detail' in body ? body.detail : body?.message || `Device diagnostics request failed (${status})`)
    this.name = 'DeviceDiagnosticsNativeError'
  }
}

export interface DeviceDiagnosticsNativeOptions {
  fetch: typeof globalThis.fetch
  getToken: () => string | undefined | null
  getLanguage: () => string | undefined | null
}

export interface DeviceDiagnosticsNativeClient {
  get(deviceId: string, query?: DiagnosticsQuery): Promise<DeviceDiagnostic>
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value && typeof value === 'object' && !Array.isArray(value))
const nullableCount = (value: unknown) => value === null || (Number.isSafeInteger(value) && Number(value) >= 0)

function isCounter(value: unknown): value is DiagnosticCounter {
  if (!isRecord(value) || typeof value.complete !== 'boolean') return false
  if (!nullableCount(value.success) || !nullableCount(value.total)) return false
  const rate = value.successRate
  if (!(rate === null || (typeof rate === 'number' && rate >= 0 && rate <= 1))) return false
  // An incomplete window must not carry numbers: they would read as real results.
  return value.complete || (value.success === null && value.total === null && rate === null)
}

function isDiagnostic(value: unknown): value is DeviceDiagnostic {
  if (
    !isRecord(value) ||
    !Array.isArray(value.checks) ||
    !Array.isArray(value.recentFailures) ||
    !isRecord(value.stats)
  )
    return false
  const stats = value.stats
  return (
    typeof value.deviceId === 'string' &&
    typeof value.observedAt === 'string' &&
    typeof value.windowFrom === 'string' &&
    typeof value.windowTo === 'string' &&
    typeof value.recentFailuresTruncated === 'boolean' &&
    isCounter(stats.uplink) &&
    isCounter(stats.downlink) &&
    isCounter(stats.storage) &&
    value.checks.every(
      check =>
        isRecord(check) && ['pass', 'fail', 'unknown'].includes(String(check.state)) && typeof check.stage === 'string'
    ) &&
    value.recentFailures.every(
      failure => isRecord(failure) && typeof failure.id === 'string' && typeof failure.timestamp === 'string'
    )
  )
}

export function createDeviceDiagnosticsNativeClient(
  options: DeviceDiagnosticsNativeOptions
): DeviceDiagnosticsNativeClient {
  const request = createMetadataNativeRequester({ ...options, resourceName: 'Device diagnostics' })
  return {
    async get(deviceId, query = {}) {
      const params = new URLSearchParams()
      for (const [key, value] of Object.entries(query)) {
        if (value !== undefined) params.set(key, String(value))
      }
      const suffix = params.toString() ? `?${params.toString()}` : ''
      const { data } = await request<unknown, DeviceDiagnosticsNativeError>(
        `/api/v2/devices/${encodeURIComponent(deviceId)}/diagnostics${suffix}`,
        200,
        (status, body) => new DeviceDiagnosticsNativeError(status, body),
        { method: 'GET' }
      )
      if (!isDiagnostic(data)) throw new Error('Device diagnostics service returned an invalid response')
      return data
    }
  }
}

export interface CounterView {
  /** Percent text, or null when the runtime could not supply a complete window. */
  rate: string | null
  detail: string
}

/** Never turns a missing count into 0 or 100%: incomplete and empty windows show "--". */
export function counterView(counter: DiagnosticCounter): CounterView {
  if (!counter.complete || counter.total === null || counter.success === null) {
    return { rate: null, detail: '运行时未提供完整统计' }
  }
  if (counter.total === 0 || counter.successRate === null) return { rate: null, detail: '窗口内没有记录' }
  return { rate: (counter.successRate * 100).toFixed(1), detail: `${counter.success}/${counter.total}条` }
}
