import type { components } from './generated/device-metadata/types'
import {
  createMetadataNativeRequester,
  requireNativeStrongEtag,
  type MetadataNativeErrorBody
} from './metadata-native-http'

export type DeviceOperation = components['schemas']['Operation']
export type GatewayMembership = components['schemas']['GatewayMembership']
export type SetGatewayMembership = components['schemas']['SetGatewayMembership']
export type AdministrativeState = components['schemas']['AdministrativeState']
export type SetAdministrativeState = components['schemas']['SetAdministrativeState']
export type SetTemplateBinding = components['schemas']['SetTemplateBinding']

export interface DeviceLifecycleNativeOptions {
  fetch: typeof globalThis.fetch
  getToken: () => string | undefined | null
  getLanguage: () => string | undefined | null
}

export class DeviceLifecycleNativeError extends Error {
  constructor(
    readonly status: number,
    readonly body?: MetadataNativeErrorBody
  ) {
    super(body && 'detail' in body ? body.detail : body?.message || `Device lifecycle request failed (${status})`)
    this.name = 'DeviceLifecycleNativeError'
  }

  get code(): string | undefined {
    return this.body?.code
  }
}

/** A 202 write: the server accepted it, which is not the same as "applied by the runtime". */
export interface AcceptedOperation {
  operation: DeviceOperation
  /** New resource ETag returned with the 202, when present. */
  etag?: string
  location?: string
}

function requireKey(key: string): string {
  if (!/^[A-Za-z0-9._:-]{8,128}$/.test(key)) throw new Error('Idempotency-Key must be 8 to 128 allowed characters')
  return key
}

function isOperation(value: unknown): value is DeviceOperation {
  if (!value || typeof value !== 'object') return false
  const op = value as Partial<DeviceOperation>
  return (
    typeof op.id === 'string' &&
    typeof op.kind === 'string' &&
    ['pending', 'running', 'succeeded', 'failed', 'cancelled'].includes(String(op.state))
  )
}

export interface DeviceLifecycleNativeClient {
  readGatewayMembership(deviceId: string): Promise<{ membership: GatewayMembership; etag: string }>
  /** `body.gatewayId`/`subdeviceAddress` both null = unbind. */
  setGatewayMembership(
    deviceId: string,
    body: SetGatewayMembership,
    etag: string,
    idempotencyKey: string
  ): Promise<AcceptedOperation>
  readAdministrativeState(deviceId: string): Promise<{ state: AdministrativeState; etag: string }>
  setAdministrativeState(
    deviceId: string,
    body: SetAdministrativeState,
    etag: string,
    idempotencyKey: string
  ): Promise<AcceptedOperation>
  /**
   * `rawBody` is sent byte-for-byte so nested parameters are never parsed and re-encoded.
   * Build it with JSON.stringify only from values the user typed in this session.
   */
  setTemplateBinding(
    deviceId: string,
    rawBody: string,
    etag: string,
    idempotencyKey: string
  ): Promise<AcceptedOperation>
  requestDeletion(deviceId: string, etag: string, idempotencyKey: string): Promise<AcceptedOperation>
  /** The version guard travels in the body (expectedDeviceVersion), not If-Match. */
  changeNumber(
    deviceId: string,
    body: { deviceNumber: string; expectedDeviceVersion: number; reason: string },
    idempotencyKey: string
  ): Promise<AcceptedOperation>
  getOperation(operationId: string): Promise<DeviceOperation>
}

export function createDeviceLifecycleNativeClient(options: DeviceLifecycleNativeOptions): DeviceLifecycleNativeClient {
  const request = createMetadataNativeRequester({ ...options, resourceName: 'Device' })
  const fail = (status: number, body: MetadataNativeErrorBody | undefined) =>
    new DeviceLifecycleNativeError(status, body)
  const device = (id: string) => `/api/v2/devices/${encodeURIComponent(id)}`

  async function accepted(
    path: string,
    init: RequestInit,
    etag: string,
    idempotencyKey: string
  ): Promise<AcceptedOperation> {
    const headers = new Headers({
      'If-Match': requireNativeStrongEtag(etag, 'Device'),
      'Idempotency-Key': requireKey(idempotencyKey)
    })
    const { data, response } = await request<unknown, DeviceLifecycleNativeError>(path, 202, fail, {
      ...init,
      headers
    })
    if (!isOperation(data)) throw new Error('Device service returned an invalid operation')
    const newEtag = response.headers.get('ETag')
    const location = response.headers.get('Location') ?? undefined
    return {
      operation: data,
      ...(newEtag ? { etag: requireNativeStrongEtag(newEtag, 'Device') } : {}),
      ...(location ? { location } : {})
    }
  }

  return {
    async readGatewayMembership(deviceId) {
      const { data, response } = await request<GatewayMembership, DeviceLifecycleNativeError>(
        `${device(deviceId)}/gateway-membership`,
        200,
        fail,
        { method: 'GET' }
      )
      return { membership: data, etag: requireNativeStrongEtag(response.headers.get('ETag'), 'Gateway membership') }
    },
    setGatewayMembership(deviceId, body, etag, idempotencyKey) {
      return accepted(
        `${device(deviceId)}/gateway-membership`,
        { method: 'PUT', body: JSON.stringify(body) },
        etag,
        idempotencyKey
      )
    },
    async readAdministrativeState(deviceId) {
      const { data, response } = await request<AdministrativeState, DeviceLifecycleNativeError>(
        `${device(deviceId)}/administrative-state`,
        200,
        fail,
        { method: 'GET' }
      )
      return { state: data, etag: requireNativeStrongEtag(response.headers.get('ETag'), 'Administrative state') }
    },
    setAdministrativeState(deviceId, body, etag, idempotencyKey) {
      return accepted(
        `${device(deviceId)}/administrative-state`,
        { method: 'PUT', body: JSON.stringify(body) },
        etag,
        idempotencyKey
      )
    },
    setTemplateBinding(deviceId, rawBody, etag, idempotencyKey) {
      return accepted(`${device(deviceId)}/template-binding`, { method: 'PUT', body: rawBody }, etag, idempotencyKey)
    },
    requestDeletion(deviceId, etag, idempotencyKey) {
      return accepted(device(deviceId), { method: 'DELETE' }, etag, idempotencyKey)
    },
    async changeNumber(deviceId, body, idempotencyKey) {
      const { data, response } = await request<unknown, DeviceLifecycleNativeError>(
        `${device(deviceId)}/number-changes`,
        202,
        fail,
        {
          method: 'POST',
          headers: new Headers({ 'Idempotency-Key': requireKey(idempotencyKey) }),
          body: JSON.stringify(body)
        }
      )
      if (!isOperation(data)) throw new Error('Device service returned an invalid operation')
      const location = response.headers.get('Location') ?? undefined
      return { operation: data, ...(location ? { location } : {}) }
    },
    async getOperation(operationId) {
      const { data } = await request<unknown, DeviceLifecycleNativeError>(
        `/api/v2/metadata-operations/${encodeURIComponent(operationId)}`,
        200,
        fail,
        { method: 'GET' }
      )
      if (!isOperation(data)) throw new Error('Device service returned an invalid operation')
      return data
    }
  }
}
