import type { components, operations } from './generated/device-metadata/types'
import {
  createMetadataNativeRequester,
  requireNativeStrongEtag,
  type MetadataNativeErrorBody
} from './metadata-native-http'

export type DeviceListQuery = NonNullable<operations['listDevices']['parameters']['query']>
export type DeviceStatisticsQuery = NonNullable<operations['getDeviceStatistics']['parameters']['query']>
export type DeviceStatistics = components['schemas']['DeviceStatistics']
export type DevicePage = components['schemas']['DevicePage']
export type Device = components['schemas']['Device']
export type DeviceTemplateBinding = components['schemas']['DeviceTemplateBinding']
export type DeviceTemplateBindingResponse = components['schemas']['DeviceTemplateBindingResponse']
export type CreateDevice = components['schemas']['CreateDevice']
export type UpdateDevice = components['schemas']['UpdateDevice']
export type DeviceNativeErrorBody = MetadataNativeErrorBody

export interface DeviceNativeOptions {
  fetch: typeof globalThis.fetch
  getToken: () => string | undefined | null
  getLanguage: () => string | undefined | null
}

export interface DeviceNativeClient {
  list(query: DeviceListQuery): Promise<DevicePage>
  listSubdevices(id: string, query: { page?: number; pageSize?: number; search?: string }): Promise<DevicePage>
  statistics(query?: DeviceStatisticsQuery): Promise<DeviceStatistics>
  /** Advice for forms only; the database unique index is the real guard. */
  checkNumber(deviceNumber: string, excludeDeviceId?: string): Promise<{ deviceNumber: string; available: boolean }>
  get(id: string): Promise<{ device: Device; etag: string }>
  readTemplateBinding(id: string): Promise<{ binding: DeviceTemplateBinding; etag: string }>
  create(body: CreateDevice, idempotencyKey: string): Promise<{ device: Device; etag?: string; location: string }>
  update(
    id: string,
    body: UpdateDevice,
    etag: string,
    idempotencyKey: string
  ): Promise<{ device: Device; etag: string }>
}

export class DeviceNativeError extends Error {
  constructor(
    readonly status: number,
    readonly body?: DeviceNativeErrorBody
  ) {
    super(body && 'detail' in body ? body.detail : body?.message || `Device service request failed (${status})`)
    this.name = 'DeviceNativeError'
  }

  get code(): string | undefined {
    return this.body?.code
  }
}

function queryString(query: DeviceListQuery): string {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined) params.set(key, String(value))
  }
  return `?${params.toString()}`
}

function requireKey(key: string): string {
  if (!/^[A-Za-z0-9._:-]{8,128}$/.test(key)) throw new Error('Idempotency-Key must be 8 to 128 allowed characters')
  return key
}

function isCreatedDevice(value: unknown): value is Device {
  if (!value || typeof value !== 'object') return false
  const device = value as Partial<Device>
  const isUUID = (candidate: unknown) =>
    typeof candidate === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(candidate)
  return (
    isUUID(device.id) &&
    isUUID(device.tenantId) &&
    typeof device.name === 'string' &&
    device.name.length > 0 &&
    typeof device.deviceNumber === 'string' &&
    device.deviceNumber.length > 0 &&
    ['standalone', 'gateway', 'subdevice'].includes(String(device.deviceKind)) &&
    ['enabled', 'disabled'].includes(String(device.administrativeState)) &&
    ['inactive', 'active'].includes(String(device.activationState)) &&
    Array.isArray(device.tags) &&
    device.tags.every(tag => typeof tag === 'string')
  )
}

export function createDeviceNativeClient(options: DeviceNativeOptions): DeviceNativeClient {
  const request = createMetadataNativeRequester({ ...options, resourceName: 'Device' })

  return {
    async checkNumber(deviceNumber, excludeDeviceId) {
      const { data } = await request<{ deviceNumber: string; available: boolean }, DeviceNativeError>(
        '/api/v2/device-number-validations',
        200,
        (status, body) => new DeviceNativeError(status, body),
        {
          method: 'POST',
          headers: new Headers({ 'Content-Type': 'application/json' }),
          body: JSON.stringify({ deviceNumber, excludeDeviceId: excludeDeviceId ?? null })
        }
      )
      return data
    },
    async statistics(query = {}) {
      const { data } = await request<DeviceStatistics, DeviceNativeError>(
        `/api/v2/device-statistics${queryString(query)}`,
        200,
        (status, body) => new DeviceNativeError(status, body),
        { method: 'GET' }
      )
      return data
    },
    async list(query) {
      const { data } = await request<DevicePage, DeviceNativeError>(
        `/api/v2/devices${queryString(query)}`,
        200,
        (status, body) => new DeviceNativeError(status, body),
        { method: 'GET' }
      )
      return data
    },
    async listSubdevices(id, query) {
      const { data } = await request<DevicePage, DeviceNativeError>(
        `/api/v2/devices/${encodeURIComponent(id)}/subdevices${queryString(query)}`,
        200,
        (status, body) => new DeviceNativeError(status, body),
        { method: 'GET' }
      )
      return data
    },
    async get(id) {
      const { data: device, response } = await request<Device, DeviceNativeError>(
        `/api/v2/devices/${encodeURIComponent(id)}`,
        200,
        (status, body) => new DeviceNativeError(status, body),
        { method: 'GET' }
      )
      return { device, etag: requireNativeStrongEtag(response.headers.get('ETag'), 'Device') }
    },
    async readTemplateBinding(id) {
      const { data: binding, response } = await request<DeviceTemplateBindingResponse['data'], DeviceNativeError>(
        `/api/v2/devices/${encodeURIComponent(id)}/template-binding`,
        200,
        (status, body) => new DeviceNativeError(status, body),
        { method: 'GET', redirect: 'manual' }
      )
      return { binding, etag: requireNativeStrongEtag(response.headers.get('ETag'), 'Device template binding') }
    },
    async create(body, idempotencyKey) {
      const headers = new Headers({ 'Idempotency-Key': requireKey(idempotencyKey) })
      const { data, response } = await request<unknown, DeviceNativeError>(
        '/api/v2/devices',
        201,
        (status, errorBody) => new DeviceNativeError(status, errorBody),
        { method: 'POST', headers, body: JSON.stringify(body) }
      )
      if (!isCreatedDevice(data)) throw new Error('Device service returned an invalid created device')
      const location = response.headers.get('Location')
      if (!location) throw new Error('Device create response is missing Location')
      let locationPath = ''
      try {
        locationPath = new URL(location, 'http://native-device.invalid').pathname
      } catch {
        throw new Error('Device create response has an invalid Location')
      }
      if (locationPath !== `/api/v2/devices/${encodeURIComponent(data.id)}`) {
        throw new Error('Device create response Location does not match the created device')
      }
      const etag = response.headers.get('ETag')
      return { device: data, ...(etag ? { etag: requireNativeStrongEtag(etag, 'Device') } : {}), location }
    },
    async update(id, body, etag, idempotencyKey) {
      const headers = new Headers({
        'If-Match': requireNativeStrongEtag(etag, 'Device'),
        'Idempotency-Key': requireKey(idempotencyKey)
      })
      const { data: device, response } = await request<Device, DeviceNativeError>(
        `/api/v2/devices/${encodeURIComponent(id)}`,
        200,
        (status, errorBody) => new DeviceNativeError(status, errorBody),
        { method: 'PATCH', headers, body: JSON.stringify(body) }
      )
      return { device, etag: requireNativeStrongEtag(response.headers.get('ETag'), 'Device') }
    }
  }
}
