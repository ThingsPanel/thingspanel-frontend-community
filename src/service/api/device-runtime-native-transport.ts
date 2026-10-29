import type { components } from './generated/device-metadata/types'
import { createMetadataNativeRequester, type MetadataNativeErrorBody } from './metadata-native-http'

export type Reading = components['schemas']['Reading']
export type ReadingPage = components['schemas']['ReadingPage']
export type RuntimeState = components['schemas']['RuntimeState']
export type ConnectionInfo = components['schemas']['ConnectionInfo']
export type DeviceStatusEventPage = components['schemas']['DeviceStatusEventPage']

export interface StatusHistoryQuery {
  page?: number
  pageSize?: number
  /** RFC 3339, whole seconds. The Community adapter has no upper bound filter. */
  from?: string
  connectivity?: 'online' | 'offline' | 'unknown'
}

export interface DeviceRuntimeNativeOptions {
  fetch: typeof globalThis.fetch
  getToken: () => string | undefined | null
  getLanguage: () => string | undefined | null
}

export interface ReadingQuery {
  page?: number
  pageSize?: number
  kind?: 'telemetry' | 'attribute' | 'event'
  identifier?: string
  latestOnly?: boolean
  /** RFC 3339; history range is [from, to) and at most 24 hours. */
  from?: string
  to?: string
  /** Aggregated history needs both; the range is then at most 366 days. */
  aggregation?: 'min' | 'max' | 'avg' | 'sum' | 'diff' | 'last'
  window?: string
}

/** Service-unavailable and generic server failures read as a plain Chinese sentence instead of the raw English detail. */
export function runtimeErrorMessage(status: number, body?: MetadataNativeErrorBody): string {
  if (status === 503) return '设备运行时暂时不可用，请确认设备平台已连接后重试'
  const detail = body && 'detail' in body ? body.detail : body?.message
  if (status >= 500 && (!detail || /^internal server error$/i.test(detail))) return '服务暂时出错，请稍后重试'
  return detail || `Device runtime request failed (${status})`
}

export class DeviceRuntimeNativeError extends Error {
  constructor(
    readonly status: number,
    readonly body?: MetadataNativeErrorBody
  ) {
    super(runtimeErrorMessage(status, body))
    this.name = 'DeviceRuntimeNativeError'
  }

  get code(): string | undefined {
    return this.body?.code
  }
}

export interface DeviceRuntimeNativeClient {
  readRuntimeState(deviceId: string): Promise<RuntimeState>
  /** Redacted by the server: protocol, optional endpoint/client id, gateway. Never a secret. */
  readConnectionInfo(deviceId: string): Promise<ConnectionInfo>
  listReadings(deviceId: string, query: ReadingQuery): Promise<ReadingPage>
  listStatusHistory(deviceId: string, query: StatusHistoryQuery): Promise<DeviceStatusEventPage>
  /** Raw telemetry export; the server finishes the job before answering 202, so the operation carries the download id. */
  exportReadings(deviceId: string, body: ReadingExportBody, idempotencyKey: string): Promise<ReadingExportResult>
  /** Current state of an export job; long exports finish asynchronously. */
  getReadingExport(operationId: string): Promise<ReadingExportResult>
  /** Fetches an exported artifact with the caller's token. */
  downloadArtifact(downloadId: string): Promise<{ blob: Blob; fileName: string }>
}

export interface ReadingExportBody {
  identifiers: string[]
  from: string
  to: string
  format: 'csv' | 'jsonl'
}

export interface ReadingExportResult {
  operationId: string
  state: string
  downloadId: string | null
  checksum: string | null
  /** Problem detail when the job failed. */
  failure?: string | null
  progress?: { total: number; completed: number } | null
}

function isReadingPage(value: unknown): value is ReadingPage {
  if (!value || typeof value !== 'object') return false
  const page = value as Partial<ReadingPage>
  return (
    Array.isArray(page.items) &&
    typeof page.page === 'number' &&
    typeof page.pageSize === 'number' &&
    typeof page.total === 'number'
  )
}

function isStatusPage(value: unknown): value is DeviceStatusEventPage {
  if (!value || typeof value !== 'object') return false
  const page = value as Partial<DeviceStatusEventPage>
  return (
    Array.isArray(page.items) &&
    page.items.every(
      item =>
        typeof item?.id === 'string' &&
        ['online', 'offline', 'unknown'].includes(String(item.connectivity)) &&
        typeof item.observedAt === 'string'
    ) &&
    typeof page.page === 'number' &&
    typeof page.pageSize === 'number' &&
    typeof page.total === 'number'
  )
}

export function createDeviceRuntimeNativeClient(options: DeviceRuntimeNativeOptions): DeviceRuntimeNativeClient {
  const request = createMetadataNativeRequester({ ...options, resourceName: 'Device runtime' })
  const fail = (status: number, body: MetadataNativeErrorBody | undefined) => new DeviceRuntimeNativeError(status, body)
  const base = (id: string) => `/api/v2/devices/${encodeURIComponent(id)}`
  return {
    async readRuntimeState(deviceId) {
      const { data } = await request<RuntimeState, DeviceRuntimeNativeError>(
        `${base(deviceId)}/runtime-state`,
        200,
        fail,
        { method: 'GET' }
      )
      return data
    },
    async readConnectionInfo(deviceId) {
      const { data } = await request<ConnectionInfo, DeviceRuntimeNativeError>(
        `${base(deviceId)}/connection-info`,
        200,
        fail,
        { method: 'GET' }
      )
      if (!data || typeof data.protocol !== 'string' || !data.protocol) {
        throw new Error('Device runtime service returned invalid connection info')
      }
      return data
    },
    async listReadings(deviceId, query) {
      const params = new URLSearchParams()
      for (const [key, value] of Object.entries(query)) {
        if (value !== undefined) params.set(key, String(value))
      }
      const suffix = params.toString() ? `?${params.toString()}` : ''
      const { data } = await request<unknown, DeviceRuntimeNativeError>(
        `${base(deviceId)}/readings${suffix}`,
        200,
        fail,
        { method: 'GET' }
      )
      if (!isReadingPage(data)) throw new Error('Device runtime service returned an invalid reading page')
      return data
    },
    async exportReadings(deviceId, body, idempotencyKey) {
      if (!/^[A-Za-z0-9._:-]{8,128}$/.test(idempotencyKey))
        throw new Error('Idempotency-Key must be 8 to 128 allowed characters')
      const { data } = await request<
        { id: string; state: string; result?: { downloadId?: string; checksum?: string } | null },
        DeviceRuntimeNativeError
      >(`${base(deviceId)}/reading-exports`, 202, fail, {
        method: 'POST',
        headers: new Headers({ 'Content-Type': 'application/json', 'Idempotency-Key': idempotencyKey }),
        body: JSON.stringify({ kind: 'telemetry', ...body, aggregation: 'raw', window: null })
      })
      return {
        operationId: data.id,
        state: data.state,
        downloadId: data.result?.downloadId ?? null,
        checksum: data.result?.checksum ?? null
      }
    },
    async getReadingExport(operationId) {
      const { data } = await request<
        {
          id: string
          state: string
          result?: { downloadId?: string; checksum?: string } | null
          failure?: { detail?: string; code?: string } | null
          progress?: { total: number; completed: number } | null
        },
        DeviceRuntimeNativeError
      >(`/api/v2/reading-exports/${encodeURIComponent(operationId)}`, 200, fail, { method: 'GET' })
      return {
        operationId: data.id,
        state: data.state,
        downloadId: data.result?.downloadId ?? null,
        checksum: data.result?.checksum ?? null,
        failure: data.failure ? data.failure.detail || data.failure.code || 'failed' : null,
        progress: data.progress ?? null
      }
    },
    async downloadArtifact(downloadId) {
      const headers = new Headers({ Accept: 'application/octet-stream, text/csv, application/x-ndjson' })
      const token = options.getToken()
      if (token) headers.set('Authorization', `Bearer ${token}`)
      const language = options.getLanguage()
      if (language) headers.set('Accept-Language', language)
      const response = await options.fetch(`/api/v2/metadata-downloads/${encodeURIComponent(downloadId)}`, {
        method: 'GET',
        headers
      })
      if (!response.ok) {
        let body: MetadataNativeErrorBody | undefined
        try {
          body = (await response.json()) as MetadataNativeErrorBody
        } catch {
          body = undefined
        }
        throw new DeviceRuntimeNativeError(response.status, body)
      }
      const disposition = response.headers.get('Content-Disposition') ?? ''
      const match = /filename="([^"]+)"/.exec(disposition)
      return { blob: await response.blob(), fileName: match?.[1] ?? 'readings.csv' }
    },
    async listStatusHistory(deviceId, query) {
      const params = new URLSearchParams()
      for (const [key, value] of Object.entries(query)) {
        if (value !== undefined) params.set(key, String(value))
      }
      const suffix = params.toString() ? `?${params.toString()}` : ''
      const { data } = await request<unknown, DeviceRuntimeNativeError>(
        `${base(deviceId)}/status-history${suffix}`,
        200,
        fail,
        { method: 'GET' }
      )
      if (!isStatusPage(data)) throw new Error('Device runtime service returned an invalid status history page')
      return data
    }
  }
}
