import type { components, operations } from './generated/device-metadata/types'
import {
  createMetadataNativeRequester,
  type MetadataNativeErrorBody,
  type MetadataNativeHttpOptions
} from './metadata-native-http'

export type DeviceCredentialSummary = components['schemas']['CredentialDetail']
export type DeviceCredentialSummaryPage = components['schemas']['CredentialSummaryPage']
export type CreateDeviceCredential = components['schemas']['CreateCredential']
export type DeviceCredentialSecret = components['schemas']['CredentialSecret']
export type DeviceCredentialListQuery = NonNullable<operations['listDeviceCredentials']['parameters']['query']>
export type DeviceCredentialNativeErrorBody = MetadataNativeErrorBody

export interface CredentialChangeAccepted {
  operationId: string
  state: string
}

export interface DeviceCredentialNativeClient {
  /** 202 means "recorded for the runtime", never "applied"; poll the operation for the outcome. */
  rotate(
    deviceId: string,
    credentialId: string,
    body: { replacementCredentialId: string; overlapSeconds: number; expectedDeviceVersion: number },
    idempotencyKey: string
  ): Promise<CredentialChangeAccepted>
  revoke(
    deviceId: string,
    credentialId: string,
    body: { expectedDeviceVersion: number; reason: string },
    idempotencyKey: string
  ): Promise<CredentialChangeAccepted>
  list(deviceId: string, query?: DeviceCredentialListQuery): Promise<DeviceCredentialSummaryPage>
  create(
    deviceId: string,
    body: CreateDeviceCredential,
    idempotencyKey: string
  ): Promise<{ credential: DeviceCredentialSecret; location: string; requestId: string }>
}

export class DeviceCredentialNativeError extends Error {
  constructor(
    readonly status: number,
    readonly body: DeviceCredentialNativeErrorBody | undefined,
    readonly outcomeUnknown = false,
    message?: string
  ) {
    super(
      message ??
        (body && 'detail' in body ? body.detail : body?.message || `Device credential request failed (${status})`)
    )
    this.name = 'DeviceCredentialNativeError'
  }

  get code(): string | undefined {
    return this.body?.code
  }
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function requireUUID(value: string, field: string): string {
  if (!UUID_PATTERN.test(value) || /^0{8}-0{4}-0{4}-0{4}-0{12}$/i.test(value))
    throw new Error(`${field} must be a UUID`)
  return value.toLowerCase()
}

function requireIdempotencyKey(key: string): string {
  if (!/^[A-Za-z0-9._:-]{8,128}$/.test(key)) {
    throw new Error('Idempotency-Key must be 8 to 128 allowed characters')
  }
  return key
}

function queryString(query: DeviceCredentialListQuery = {}): string {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined) params.set(key, String(value))
  }
  const serialized = params.toString()
  return serialized ? `?${serialized}` : ''
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value))
}

function isValidTimestamp(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0 && Number.isFinite(Date.parse(value))
}

function isCredentialSummary(value: unknown): value is DeviceCredentialSummary {
  if (!isRecord(value)) return false
  return (
    typeof value.id === 'string' &&
    UUID_PATTERN.test(value.id) &&
    typeof value.deviceId === 'string' &&
    UUID_PATTERN.test(value.deviceId) &&
    ['token', 'username_password', 'x509'].includes(String(value.kind)) &&
    ['pending', 'active', 'revoked'].includes(String(value.status)) &&
    (typeof value.publicIdentifier === 'string' || value.publicIdentifier === null) &&
    typeof value.fingerprint === 'string' &&
    /^[0-9a-f]{64}$/i.test(value.fingerprint) &&
    isValidTimestamp(value.createdAt) &&
    (isValidTimestamp(value.revokedAt) || value.revokedAt === null)
  )
}

function isCredentialSummaryPage(value: unknown): value is DeviceCredentialSummaryPage {
  if (!isRecord(value) || !Array.isArray(value.items)) return false
  return (
    Number.isSafeInteger(value.page) &&
    Number(value.page) >= 1 &&
    Number.isSafeInteger(value.pageSize) &&
    Number(value.pageSize) >= 1 &&
    Number.isSafeInteger(value.total) &&
    Number(value.total) >= 0 &&
    value.items.every(isCredentialSummary)
  )
}

function isCredentialSecret(value: unknown): value is DeviceCredentialSecret {
  if (!isRecord(value) || !isCredentialSummary(value.credential) || !isValidTimestamp(value.expiresAt)) return false
  if (!(typeof value.secret === 'string' || value.secret === null)) return false
  if (
    value.secret !== null &&
    (new TextEncoder().encode(value.secret).length < 1 || new TextEncoder().encode(value.secret).length > 8192)
  ) {
    return false
  }
  if (value.credential.status !== 'pending') return false
  if (value.credential.kind === 'x509' && value.secret !== null) return false
  if (value.credential.kind !== 'x509' && value.secret === null) return false
  return Date.parse(value.expiresAt) > Date.parse(value.credential.createdAt)
}

function requireCreatedLocation(location: string | null, deviceId: string, credentialId: string): string {
  if (!location) throw new Error('Device credential create response is missing Location')
  let parsed: URL
  try {
    parsed = new URL(location, 'http://native-device-credential.invalid/')
  } catch {
    throw new Error('Device credential create response has an invalid Location')
  }
  const expected = `/api/v2/devices/${encodeURIComponent(deviceId)}/credentials/${encodeURIComponent(credentialId)}`
  if (
    parsed.origin !== 'http://native-device-credential.invalid' ||
    parsed.pathname !== expected ||
    parsed.search !== '' ||
    parsed.hash !== '' ||
    parsed.username !== '' ||
    parsed.password !== ''
  ) {
    throw new Error('Device credential create response Location does not match the created credential')
  }
  return location
}

function hasNoStore(value: string | null): boolean {
  return Boolean(value && value.split(',').some(directive => directive.trim().toLowerCase() === 'no-store'))
}

function unknownOutcomeError(error: unknown): DeviceCredentialNativeError {
  if (error instanceof DeviceCredentialNativeError) return error
  return new DeviceCredentialNativeError(
    0,
    undefined,
    true,
    'Credential creation outcome is unknown; verify before retrying'
  )
}

function safeCredentialWriteErrorBody(
  body: DeviceCredentialNativeErrorBody | undefined
): DeviceCredentialNativeErrorBody | undefined {
  if (!body) return undefined
  if ('detail' in body) {
    return {
      type: 'about:blank',
      title: 'Credential request failed',
      status: body.status,
      detail: 'Credential request failed',
      instance: '',
      code: body.code,
      requestId: body.requestId
    }
  }
  return { code: body.code, message: 'Credential request failed', details: {} }
}

export function createDeviceCredentialNativeClient(options: MetadataNativeHttpOptions): DeviceCredentialNativeClient {
  const request = createMetadataNativeRequester({ ...options, resourceName: 'Device credential' })

  async function change(
    deviceId: string,
    credentialId: string,
    action: 'rotations' | 'revocations',
    body: unknown,
    idempotencyKey: string
  ) {
    const device = requireUUID(deviceId, 'deviceId')
    const credential = requireUUID(credentialId, 'credentialId')
    let result: Awaited<ReturnType<typeof request<unknown, DeviceCredentialNativeError>>>
    try {
      result = await request<unknown, DeviceCredentialNativeError>(
        `/api/v2/devices/${encodeURIComponent(device)}/credentials/${encodeURIComponent(credential)}/${action}`,
        202,
        (status, errorBody) =>
          new DeviceCredentialNativeError(
            status,
            safeCredentialWriteErrorBody(errorBody),
            status < 200 || (status >= 300 && status < 400) || status >= 500
          ),
        {
          method: 'POST',
          headers: new Headers({
            'Idempotency-Key': requireIdempotencyKey(idempotencyKey),
            'Cache-Control': 'no-store'
          }),
          body: JSON.stringify(body),
          redirect: 'error',
          cache: 'no-store'
        }
      )
    } catch (error) {
      if (error instanceof DeviceCredentialNativeError) throw error
      throw new DeviceCredentialNativeError(
        0,
        undefined,
        true,
        'Credential change outcome is unknown; verify before retrying'
      )
    }
    const data = result.data
    if (
      !isRecord(data) ||
      typeof data.id !== 'string' ||
      !UUID_PATTERN.test(data.id) ||
      typeof data.state !== 'string'
    ) {
      throw new DeviceCredentialNativeError(
        202,
        undefined,
        true,
        'Credential change outcome is unknown; response data was invalid'
      )
    }
    return { operationId: data.id, state: data.state }
  }

  return {
    rotate: (deviceId, credentialId, body, key) => change(deviceId, credentialId, 'rotations', body, key),
    revoke: (deviceId, credentialId, body, key) => change(deviceId, credentialId, 'revocations', body, key),
    async list(deviceId, query = {}) {
      const normalizedID = requireUUID(deviceId, 'deviceId')
      const { data } = await request<unknown, DeviceCredentialNativeError>(
        `/api/v2/devices/${encodeURIComponent(normalizedID)}/credentials${queryString(query)}`,
        200,
        (status, body) => new DeviceCredentialNativeError(status, body),
        { method: 'GET', redirect: 'error' }
      )
      if (!isCredentialSummaryPage(data)) throw new Error('Device credential service returned an invalid summary page')
      if (data.items.some(item => item.deviceId.toLowerCase() !== normalizedID)) {
        throw new Error('Device credential service returned a credential for another device')
      }
      return data
    },

    async create(deviceId, body, idempotencyKey) {
      const normalizedID = requireUUID(deviceId, 'deviceId')
      const key = requireIdempotencyKey(idempotencyKey)
      const serializedBody = JSON.stringify(body)
      const headers = new Headers({
        'Idempotency-Key': key,
        'Cache-Control': 'no-store'
      })
      let result: Awaited<ReturnType<typeof request<unknown, DeviceCredentialNativeError>>>
      try {
        result = await request<unknown, DeviceCredentialNativeError>(
          `/api/v2/devices/${encodeURIComponent(normalizedID)}/credentials`,
          201,
          (status, errorBody) =>
            new DeviceCredentialNativeError(
              status,
              safeCredentialWriteErrorBody(errorBody),
              status < 200 || (status >= 300 && status < 400) || status >= 500
            ),
          { method: 'POST', headers, body: serializedBody, redirect: 'error', cache: 'no-store' }
        )
      } catch (error) {
        throw unknownOutcomeError(error)
      }
      const unknown = (message: string): never => {
        throw new DeviceCredentialNativeError(201, undefined, true, message)
      }
      if (!isCredentialSecret(result.data)) {
        throw new DeviceCredentialNativeError(
          201,
          undefined,
          true,
          'Credential creation outcome is unknown; response data was invalid'
        )
      }
      const credential = result.data
      if (credential.credential.deviceId.toLowerCase() !== normalizedID) {
        unknown('Credential creation outcome is unknown; response owner did not match the request')
      }
      if (!result.meta.requestId.trim())
        unknown('Credential creation outcome is unknown; response metadata was invalid')
      if (!hasNoStore(result.response.headers.get('Cache-Control'))) {
        unknown('Credential creation outcome is unknown; response cache policy was missing')
      }
      let location: string
      try {
        location = requireCreatedLocation(
          result.response.headers.get('Location'),
          normalizedID,
          credential.credential.id
        )
      } catch {
        throw new DeviceCredentialNativeError(
          201,
          undefined,
          true,
          'Credential creation outcome is unknown; response Location was invalid'
        )
      }
      return { credential, location, requestId: result.meta.requestId }
    }
  }
}
