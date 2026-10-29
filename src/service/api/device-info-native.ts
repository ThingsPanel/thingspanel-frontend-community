import { localStg } from '@/utils/storage'
import {
  createMetadataNativeRequester,
  requireNativeStrongEtag,
  type MetadataNativeHttpOptions
} from './metadata-native-http'
import { DeviceNativeError, type Device } from './device-native-transport'

/** JSON scalar tokens retain untouched values when the API replaces an object. */
export type InfoScalarTokens = Record<string, string>

export interface DeviceInfoSnapshot {
  device: Device
  etag: string
  customFieldTokens: InfoScalarTokens
  locationTokens: InfoScalarTokens | null
}

function skipSpace(text: string, start: number): number {
  while (/\s/.test(text[start] ?? '') && start < text.length) start += 1
  return start
}

function stringEnd(text: string, start: number): number {
  for (let index = start + 1; index < text.length; index += 1) {
    if (text[index] === '\\') index += 1
    else if (text[index] === '"') return index + 1
  }
  throw new Error('设备资料响应包含无效字符串。')
}

// JSON.parse validates the input before this scanner is used. The scanner only
// locates member boundaries; it never converts number tokens to JS numbers.
function valueEnd(text: string, start: number): number {
  if (text[start] === '"') return stringEnd(text, start)
  if (text[start] === '{' || text[start] === '[') {
    let depth = 0
    for (let index = start; index < text.length; index += 1) {
      const char = text[index]
      if (char === '"') index = stringEnd(text, index) - 1
      else if (char === '{' || char === '[') depth += 1
      else if ((char === '}' || char === ']') && --depth === 0) return index + 1
    }
    throw new Error('设备资料响应包含无效对象。')
  }
  let end = start
  while (end < text.length && !/[\s,}\]]/.test(text[end])) end += 1
  return end
}

function rawObjectMembers(text: string): InfoScalarTokens {
  const parsed: unknown = JSON.parse(text)
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('设备资料必须是对象。')
  const members: InfoScalarTokens = Object.create(null)
  let index = skipSpace(text, 0) + 1
  while ((index = skipSpace(text, index)) < text.length && text[index] !== '}') {
    const endKey = stringEnd(text, index)
    const key: string = JSON.parse(text.slice(index, endKey))
    index = skipSpace(text, endKey) + 1
    index = skipSpace(text, index)
    const endValue = valueEnd(text, index)
    members[key] = text.slice(index, endValue)
    index = skipSpace(text, endValue)
    if (text[index] === ',') index += 1
  }
  return members
}

function scalarToken(token: string): string {
  const value: unknown = JSON.parse(token)
  if (value !== null && typeof value !== 'string' && typeof value !== 'number' && typeof value !== 'boolean') {
    throw new Error('设备资料字段必须是字符串、数字、布尔或 null。')
  }
  return token.trim()
}

function scalarObject(tokens: InfoScalarTokens): string {
  return `{${Object.entries(tokens)
    .map(([key, token]) => `${JSON.stringify(key)}:${scalarToken(token)}`)
    .join(',')}}`
}

/** Undefined omits a property; null explicitly clears the whole location. */
export function encodeInfoPayload(customFields?: InfoScalarTokens, location?: InfoScalarTokens | null): string {
  const properties: string[] = []
  if (customFields !== undefined) properties.push(`"customFields":${scalarObject(customFields)}`)
  if (location !== undefined) properties.push(`"location":${location === null ? 'null' : scalarObject(location)}`)
  if (!properties.length) throw new Error('没有需要保存的设备资料。')
  return `{${properties.join(',')}}`
}

export function readDeviceInfoTokens(body: string): Pick<DeviceInfoSnapshot, 'customFieldTokens' | 'locationTokens'> {
  const envelope = rawObjectMembers(body)
  const device = rawObjectMembers(envelope.data)
  const customFieldTokens = rawObjectMembers(device.customFields)
  for (const token of Object.values(customFieldTokens)) scalarToken(token)
  const locationTokens = device.location.trim() === 'null' ? null : rawObjectMembers(device.location)
  if (locationTokens) for (const token of Object.values(locationTokens)) scalarToken(token)
  return { customFieldTokens, locationTokens }
}

export function createDeviceInfoNativeClient(options: MetadataNativeHttpOptions) {
  async function call(id: string, init: RequestInit): Promise<DeviceInfoSnapshot> {
    // The capture belongs to this invocation, so parallel reads cannot mix data.
    let rawBody = ''
    const request = createMetadataNativeRequester({
      ...options,
      resourceName: 'Device',
      fetch: async (input, requestInit) => {
        const response = await options.fetch(input, requestInit)
        if (response.status === 200) rawBody = await response.clone().text()
        return response
      }
    })
    const { data: device, response } = await request<Device, DeviceNativeError>(
      `/api/v2/devices/${encodeURIComponent(id)}`,
      200,
      (status, body) => new DeviceNativeError(status, body),
      init
    )
    return {
      device,
      etag: requireNativeStrongEtag(response.headers.get('ETag'), 'Device'),
      ...readDeviceInfoTokens(rawBody)
    }
  }

  return {
    get: (id: string) => call(id, { method: 'GET' }),
    update(id: string, payloadJSON: string, etag: string, key: string): Promise<DeviceInfoSnapshot> {
      const body: unknown = JSON.parse(payloadJSON)
      if (
        !body ||
        typeof body !== 'object' ||
        Array.isArray(body) ||
        !Object.keys(body).length ||
        Object.keys(body).some(name => name !== 'customFields' && name !== 'location')
      )
        throw new Error('设备信息保存只允许扩展资料与位置。')
      if (!/^[A-Za-z0-9._:-]{8,128}$/.test(key)) throw new Error('Idempotency-Key must be 8 to 128 allowed characters')
      return call(id, {
        method: 'PATCH',
        headers: { 'If-Match': requireNativeStrongEtag(etag, 'Device'), 'Idempotency-Key': key },
        body: payloadJSON,
        redirect: 'manual'
      })
    }
  }
}

export const deviceInfoNative = createDeviceInfoNativeClient({
  fetch: (input, init) => globalThis.fetch(input, init),
  getToken: () => localStg.get('token') as string | undefined,
  getLanguage: () => localStg.get('lang') as string | undefined
})
