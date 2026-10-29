import type { components } from './generated/device-metadata/types'
import { createMetadataNativeRequester, type MetadataNativeErrorBody } from './metadata-native-http'

export type CommandReceipt = components['schemas']['CommandReceipt']
export type CommandReceiptPage = components['schemas']['CommandReceiptPage']

export interface DeviceCommandNativeOptions {
  fetch: typeof globalThis.fetch
  getToken: () => string | undefined | null
  getLanguage: () => string | undefined | null
}

export interface CommandSubmitBody {
  identifier: string
  snapshotId: string
  parameters: Record<string, unknown>
  timeoutSeconds?: number
  label?: string | null
  deliveryMode?: 'immediate' | 'when_online'
  /** RFC 3339; only with when_online. */
  expiresAt?: string | null
}

export interface CommandListQuery {
  page?: number
  pageSize?: number
  state?: CommandReceipt['state']
  deliveryMode?: CommandReceipt['deliveryMode']
  identifier?: string
  labelContains?: string
}

export class DeviceCommandNativeError extends Error {
  constructor(
    readonly status: number,
    readonly body?: MetadataNativeErrorBody
  ) {
    super(body && 'detail' in body ? body.detail : body?.message || `Device command request failed (${status})`)
    this.name = 'DeviceCommandNativeError'
  }

  get code(): string | undefined {
    return this.body?.code
  }
}

export interface DeviceCommandNativeClient {
  /** 202 means "recorded and handed to the runtime", never "executed by the device". */
  submit(deviceId: string, body: CommandSubmitBody, idempotencyKey: string): Promise<CommandReceipt>
  list(deviceId: string, query: CommandListQuery): Promise<CommandReceiptPage>
  get(deviceId: string, executionId: string): Promise<CommandReceipt>
  /** Only a queued when_online command can be cancelled; a delivered one is a 409. */
  cancel(deviceId: string, executionId: string, reason: string, idempotencyKey: string): Promise<CommandReceipt>
}

const STATES = [
  'pending',
  'accepted',
  'delivered',
  'acknowledged',
  'failed',
  'timed_out',
  'expired',
  'cancelled',
  'unknown'
]

function isReceipt(value: unknown): value is CommandReceipt {
  if (!value || typeof value !== 'object') return false
  const receipt = value as Partial<CommandReceipt>
  return (
    typeof receipt.id === 'string' &&
    typeof receipt.deviceId === 'string' &&
    typeof receipt.identifier === 'string' &&
    typeof receipt.acceptedAt === 'string' &&
    STATES.includes(String(receipt.state))
  )
}

function isReceiptPage(value: unknown): value is CommandReceiptPage {
  if (!value || typeof value !== 'object') return false
  const page = value as Partial<CommandReceiptPage>
  return (
    Array.isArray(page.items) &&
    page.items.every(isReceipt) &&
    typeof page.page === 'number' &&
    typeof page.pageSize === 'number' &&
    typeof page.total === 'number'
  )
}

function requireKey(key: string): string {
  if (!/^[A-Za-z0-9._:-]{8,128}$/.test(key)) throw new Error('Idempotency-Key must be 8 to 128 allowed characters')
  return key
}

export function createDeviceCommandNativeClient(options: DeviceCommandNativeOptions): DeviceCommandNativeClient {
  const request = createMetadataNativeRequester({ ...options, resourceName: 'Device command' })
  const fail = (status: number, body: MetadataNativeErrorBody | undefined) => new DeviceCommandNativeError(status, body)
  const base = (id: string) => `/api/v2/devices/${encodeURIComponent(id)}/command-executions`
  return {
    async submit(deviceId, body, idempotencyKey) {
      const payload = {
        identifier: body.identifier,
        snapshotId: body.snapshotId,
        parameters: body.parameters,
        timeoutSeconds: body.timeoutSeconds ?? 30,
        deliveryMode: body.deliveryMode ?? 'immediate',
        ...(body.expiresAt ? { expiresAt: body.expiresAt } : {}),
        ...(body.label ? { label: body.label } : {})
      }
      const { data } = await request<unknown, DeviceCommandNativeError>(base(deviceId), 202, fail, {
        method: 'POST',
        headers: { 'Idempotency-Key': requireKey(idempotencyKey) },
        body: JSON.stringify(payload)
      })
      if (!isReceipt(data)) throw new Error('Device command service returned an invalid receipt')
      return data
    },
    async list(deviceId, query) {
      const params = new URLSearchParams()
      for (const [key, value] of Object.entries(query)) {
        if (value !== undefined) params.set(key, String(value))
      }
      const suffix = params.toString() ? `?${params.toString()}` : ''
      const { data } = await request<unknown, DeviceCommandNativeError>(`${base(deviceId)}${suffix}`, 200, fail, {
        method: 'GET'
      })
      if (!isReceiptPage(data)) throw new Error('Device command service returned an invalid receipt page')
      return data
    },
    async cancel(deviceId, executionId, reason, idempotencyKey) {
      const { data } = await request<unknown, DeviceCommandNativeError>(
        `${base(deviceId)}/${encodeURIComponent(executionId)}/cancellations`,
        200,
        fail,
        { method: 'POST', headers: { 'Idempotency-Key': requireKey(idempotencyKey) }, body: JSON.stringify({ reason }) }
      )
      if (!isReceipt(data)) throw new Error('Device command service returned an invalid receipt')
      return data
    },
    async get(deviceId, executionId) {
      const { data } = await request<unknown, DeviceCommandNativeError>(
        `${base(deviceId)}/${encodeURIComponent(executionId)}`,
        200,
        fail,
        { method: 'GET' }
      )
      if (!isReceipt(data)) throw new Error('Device command service returned an invalid receipt')
      return data
    }
  }
}
