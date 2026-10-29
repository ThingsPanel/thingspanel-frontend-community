import type { components } from './generated/device-metadata/types'
import { createMetadataNativeRequester, type MetadataNativeErrorBody } from './metadata-native-http'

export type DebugSession = components['schemas']['DebugSession']
export type DebugLog = components['schemas']['DebugLog']
export type DebugLogPage = components['schemas']['DebugLogPage']

export interface DeviceDebugNativeOptions {
  fetch: typeof globalThis.fetch
  getToken: () => string | undefined | null
  getLanguage: () => string | undefined | null
}

export class DeviceDebugNativeError extends Error {
  constructor(
    readonly status: number,
    readonly body?: MetadataNativeErrorBody
  ) {
    super(body && 'detail' in body ? body.detail : body?.message || `Device debug request failed (${status})`)
    this.name = 'DeviceDebugNativeError'
  }
}

export interface DeviceDebugNativeClient {
  createSession(deviceId: string, durationSeconds: number, idempotencyKey: string): Promise<DebugSession>
  stopSession(deviceId: string, sessionId: string, idempotencyKey: string): Promise<DebugSession>
  listLogs(deviceId: string, query: { page?: number; pageSize?: number }): Promise<DebugLogPage>
}

function requireKey(key: string): string {
  if (!/^[A-Za-z0-9._:-]{8,128}$/.test(key)) throw new Error('Idempotency-Key must be 8 to 128 allowed characters')
  return key
}

function isSession(value: unknown): value is DebugSession {
  if (!value || typeof value !== 'object') return false
  const session = value as Partial<DebugSession>
  return (
    typeof session.id === 'string' &&
    typeof session.expiresAt === 'string' &&
    ['active', 'stopped', 'expired'].includes(String(session.state))
  )
}

function isLogPage(value: unknown): value is DebugLogPage {
  if (!value || typeof value !== 'object') return false
  const page = value as Partial<DebugLogPage>
  return (
    Array.isArray(page.items) &&
    page.items.every(
      item => typeof item?.id === 'string' && typeof item.timestamp === 'string' && typeof item.message === 'string'
    ) &&
    typeof page.page === 'number' &&
    typeof page.pageSize === 'number' &&
    typeof page.total === 'number'
  )
}

export function createDeviceDebugNativeClient(options: DeviceDebugNativeOptions): DeviceDebugNativeClient {
  const request = createMetadataNativeRequester({ ...options, resourceName: 'Device debug' })
  const fail = (status: number, body: MetadataNativeErrorBody | undefined) => new DeviceDebugNativeError(status, body)
  const base = (id: string) => `/api/v2/devices/${encodeURIComponent(id)}`
  return {
    async createSession(deviceId, durationSeconds, key) {
      const { data } = await request<unknown, DeviceDebugNativeError>(`${base(deviceId)}/debug-sessions`, 201, fail, {
        method: 'POST',
        headers: { 'Idempotency-Key': requireKey(key) },
        body: JSON.stringify({ level: 'info', durationSeconds })
      })
      if (!isSession(data)) throw new Error('Device debug service returned an invalid session')
      return data
    },
    async stopSession(deviceId, sessionId, key) {
      const { data } = await request<unknown, DeviceDebugNativeError>(
        `${base(deviceId)}/debug-sessions/${encodeURIComponent(sessionId)}`,
        200,
        fail,
        { method: 'DELETE', headers: { 'Idempotency-Key': requireKey(key) } }
      )
      if (!isSession(data)) throw new Error('Device debug service returned an invalid session')
      return data
    },
    async listLogs(deviceId, query) {
      const params = new URLSearchParams()
      if (query.page !== undefined) params.set('page', String(query.page))
      if (query.pageSize !== undefined) params.set('pageSize', String(query.pageSize))
      const suffix = params.toString() ? `?${params.toString()}` : ''
      const { data } = await request<unknown, DeviceDebugNativeError>(
        `${base(deviceId)}/debug-logs${suffix}`,
        200,
        fail,
        {
          method: 'GET'
        }
      )
      if (!isLogPage(data)) throw new Error('Device debug service returned an invalid log page')
      return data
    }
  }
}

export interface StoredDebugSession {
  id: string
  expiresAt: string
}

/** Per-browser memory of the session this viewer started; the contract has no read-current-session call. */
export function parseStoredDebugSession(raw: string | null, now: number): StoredDebugSession | null {
  if (!raw) return null
  try {
    const value = JSON.parse(raw) as Partial<StoredDebugSession>
    if (typeof value.id !== 'string' || typeof value.expiresAt !== 'string') return null
    const expires = Date.parse(value.expiresAt)
    if (!Number.isFinite(expires) || expires <= now) return null
    return { id: value.id, expiresAt: value.expiresAt }
  } catch {
    return null
  }
}
