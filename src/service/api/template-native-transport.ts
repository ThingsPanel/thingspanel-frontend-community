import type { components, operations } from './generated/device-metadata/types'
import {
  createMetadataNativeRequester,
  requireNativeStrongEtag,
  type MetadataNativeErrorBody,
  type MetadataNativeHttpOptions
} from './metadata-native-http'

export type DeviceAccessTemplateListQuery = NonNullable<operations['listDeviceAccessTemplates']['parameters']['query']>
export type DeviceAccessTemplatePage = components['schemas']['DeviceAccessTemplatePage']
export type DeviceAccessTemplate = components['schemas']['DeviceAccessTemplate']
export type CreateDeviceAccessTemplate = components['schemas']['CreateDeviceAccessTemplate']
export type UpdateDeviceAccessTemplate = components['schemas']['UpdateDeviceAccessTemplate']
export type TemplateNativeErrorBody = MetadataNativeErrorBody
export type ProcessingScriptTestRequest = components['schemas']['ProcessingScriptTest']
export type ProcessingScriptTestResult = components['schemas']['ProcessingScriptTestResult']

export interface TemplateNativeClient {
  list(query?: DeviceAccessTemplateListQuery): Promise<DeviceAccessTemplatePage>
  get(id: string): Promise<{ template: DeviceAccessTemplate; etag: string }>
  /**
   * Same read as `get`, plus the exact response text. Callers that must
   * re-submit the whole `configuration` object use it to keep the server's
   * original JSON tokens instead of re-encoding parsed numbers.
   */
  getRaw(id: string): Promise<{ template: DeviceAccessTemplate; etag: string; rawText: string }>
  create(
    body: CreateDeviceAccessTemplate,
    idempotencyKey: string
  ): Promise<{ template: DeviceAccessTemplate; etag?: string; location: string }>
  update(
    id: string,
    body: UpdateDeviceAccessTemplate,
    etag: string,
    idempotencyKey: string
  ): Promise<{ template: DeviceAccessTemplate; etag: string }>
  /** Sandboxed debug run of one processing script; it has no downlink side effect. */
  testProcessingScript(body: ProcessingScriptTestRequest): Promise<ProcessingScriptTestResult>
  /** Replaces the whole current configuration with the exact JSON text supplied. */
  replaceConfiguration(
    id: string,
    configurationJson: string,
    etag: string,
    idempotencyKey: string
  ): Promise<{ template: DeviceAccessTemplate; etag: string }>
  /**
   * Sends the exact PATCH body text supplied. Used for members that live next
   * to `configuration` (cover asset, administrative state) so their request
   * never rewrites the configuration the server already stored.
   */
  patchBody(
    id: string,
    bodyJson: string,
    etag: string,
    idempotencyKey: string
  ): Promise<{ template: DeviceAccessTemplate; etag: string }>
}

export class TemplateNativeError extends Error {
  constructor(
    readonly status: number,
    readonly body?: TemplateNativeErrorBody
  ) {
    super(body && 'detail' in body ? body.detail : body?.message || `Device access template request failed (${status})`)
    this.name = 'TemplateNativeError'
  }

  get code(): string | undefined {
    return this.body?.code
  }
}

function queryString(query: DeviceAccessTemplateListQuery = {}): string {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined) params.set(key, String(value))
  }
  const serialized = params.toString()
  return serialized ? `?${serialized}` : ''
}

function requireIdempotencyKey(key: string): string {
  if (!/^[A-Za-z0-9._:-]{8,128}$/.test(key)) {
    throw new Error('Idempotency-Key must be 8 to 128 allowed characters')
  }
  return key
}

function requireCreateLocation(location: string | null, id: string): string {
  if (!location) throw new Error('Device access template create response is missing Location')
  const expectedPath = `/api/v2/device-access-templates/${encodeURIComponent(id)}`
  let parsed: URL
  try {
    parsed = new URL(location, 'http://native.local/api/v2/device-access-templates/')
  } catch {
    throw new Error('Device access template create response has an invalid Location')
  }
  if (
    !['http:', 'https:'].includes(parsed.protocol) ||
    parsed.username !== '' ||
    parsed.password !== '' ||
    parsed.pathname !== expectedPath ||
    parsed.search !== '' ||
    parsed.hash !== ''
  ) {
    throw new Error('Device access template create response Location does not match the created resource')
  }
  return location
}

export function createTemplateNativeClient(options: MetadataNativeHttpOptions): TemplateNativeClient {
  const request = createMetadataNativeRequester({ ...options, resourceName: 'Device access template' })

  async function patchBody(
    id: string,
    bodyJson: string,
    etag: string,
    idempotencyKey: string
  ): Promise<{ template: DeviceAccessTemplate; etag: string }> {
    if (!bodyJson.trimStart().startsWith('{')) {
      throw new Error('Device access template patch body must be a JSON object')
    }
    const headers = new Headers({
      'If-Match': requireNativeStrongEtag(etag, 'Device access template'),
      'Idempotency-Key': requireIdempotencyKey(idempotencyKey)
    })
    const { data: template, response } = await request<DeviceAccessTemplate, TemplateNativeError>(
      `/api/v2/device-access-templates/${encodeURIComponent(id)}`,
      200,
      (status, errorBody) => new TemplateNativeError(status, errorBody),
      { method: 'PATCH', headers, body: bodyJson, redirect: 'manual' }
    )
    return { template, etag: requireNativeStrongEtag(response.headers.get('ETag'), 'Device access template') }
  }

  return {
    async list(query) {
      const { data } = await request<DeviceAccessTemplatePage, TemplateNativeError>(
        `/api/v2/device-access-templates${queryString(query)}`,
        200,
        (status, body) => new TemplateNativeError(status, body),
        { method: 'GET' }
      )
      return data
    },
    async get(id) {
      const { data: template, response } = await request<DeviceAccessTemplate, TemplateNativeError>(
        `/api/v2/device-access-templates/${encodeURIComponent(id)}`,
        200,
        (status, body) => new TemplateNativeError(status, body),
        { method: 'GET' }
      )
      return { template, etag: requireNativeStrongEtag(response.headers.get('ETag'), 'Device access template') }
    },
    async getRaw(id) {
      const {
        data: template,
        response,
        text
      } = await request<DeviceAccessTemplate, TemplateNativeError>(
        `/api/v2/device-access-templates/${encodeURIComponent(id)}`,
        200,
        (status, body) => new TemplateNativeError(status, body),
        { method: 'GET' }
      )
      return {
        template,
        etag: requireNativeStrongEtag(response.headers.get('ETag'), 'Device access template'),
        rawText: text
      }
    },
    async create(body, idempotencyKey) {
      const headers = new Headers({ 'Idempotency-Key': requireIdempotencyKey(idempotencyKey) })
      const { data: template, response } = await request<DeviceAccessTemplate, TemplateNativeError>(
        '/api/v2/device-access-templates',
        201,
        (status, errorBody) => new TemplateNativeError(status, errorBody),
        { method: 'POST', headers, body: JSON.stringify(body), redirect: 'manual' }
      )
      const location = requireCreateLocation(response.headers.get('Location'), template.id)
      const etag = response.headers.get('ETag')
      return {
        template,
        ...(etag ? { etag: requireNativeStrongEtag(etag, 'Device access template') } : {}),
        location
      }
    },
    async update(id, body, etag, idempotencyKey) {
      const headers = new Headers({
        'If-Match': requireNativeStrongEtag(etag, 'Device access template'),
        'Idempotency-Key': requireIdempotencyKey(idempotencyKey)
      })
      const { data: template, response } = await request<DeviceAccessTemplate, TemplateNativeError>(
        `/api/v2/device-access-templates/${encodeURIComponent(id)}`,
        200,
        (status, errorBody) => new TemplateNativeError(status, errorBody),
        { method: 'PATCH', headers, body: JSON.stringify(body), redirect: 'manual' }
      )
      return { template, etag: requireNativeStrongEtag(response.headers.get('ETag'), 'Device access template') }
    },
    async testProcessingScript(body) {
      const { data } = await request<ProcessingScriptTestResult, TemplateNativeError>(
        '/api/v2/processing-script-tests',
        200,
        (status, errorBody) => new TemplateNativeError(status, errorBody),
        { method: 'POST', headers: new Headers({ 'Content-Type': 'application/json' }), body: JSON.stringify(body) }
      )
      return data
    },
    async replaceConfiguration(id, configurationJson, etag, idempotencyKey) {
      if (!configurationJson.trimStart().startsWith('{')) {
        throw new Error('Device access template configuration must be a JSON object')
      }
      return patchBody(id, `{"configuration":${configurationJson}}`, etag, idempotencyKey)
    },
    async patchBody(id, bodyJson, etag, idempotencyKey) {
      return patchBody(id, bodyJson, etag, idempotencyKey)
    }
  }
}
