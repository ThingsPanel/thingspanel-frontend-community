import axios from 'axios'
import { localStg } from '@/utils/storage'

export class ApiError extends Error {
  code: string
  details?: unknown

  constructor(code: string, message: string, details?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.code = code
    this.details = details
  }
}

export function localizeError(error: unknown) {
  if (error instanceof ApiError) {
    return error.message
  }
  if (error instanceof Error) {
    return error.message
  }
  return 'Request failed'
}

const THINGMODEL_PROXY_PATH = '/proxy-thingmodel'
const THINGMODEL_BASE_URL = 'http://127.0.0.1:4000'
const thingmodelRequest = axios.create({
  timeout: 30000
})

type LegacyJwtClaims = {
  id?: string
  user_id?: string
  tenant_id?: string
  authority?: string
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}

function toUuidFromHex(hexValue: string) {
  const hex = hexValue.toLowerCase().padEnd(32, '0').slice(0, 32)
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`
}

function normalizeTenantId(tenantId: string) {
  const raw = tenantId.trim()
  if (!raw) return ''
  if (isUuid(raw)) return raw

  const compactHex = raw.replace(/[^0-9a-f]/gi, '')
  if (compactHex) {
    return toUuidFromHex(compactHex)
  }

  const encoded = Array.from(raw)
    .map(char => char.charCodeAt(0).toString(16).padStart(2, '0'))
    .join('')

  return toUuidFromHex(encoded)
}

function decodeBase64Url(value: string) {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/')
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=')
  return atob(padded)
}

function buildDevTokenFromLegacyJwt(token: string | null) {
  if (!token) return ''

  try {
    const [, payload] = token.split('.')
    if (!payload) return ''

    const claims = JSON.parse(decodeBase64Url(payload)) as LegacyJwtClaims
    const userId = claims.id || claims.user_id || ''
    const tenantId = normalizeTenantId(claims.tenant_id || '')
    const role = claims.authority || 'TENANT_ADMIN'

    if (!userId || !tenantId) return ''

    return `${userId}:${tenantId}:${role}:*`
  } catch {
    return ''
  }
}

function buildThingmodelUrl(path: string) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`

  if (import.meta.env.VITE_HTTP_PROXY === 'Y') {
    return `${THINGMODEL_PROXY_PATH}${normalizedPath}`
  }

  return new URL(normalizedPath, THINGMODEL_BASE_URL).toString()
}

function buildThingmodelHeaders() {
  const legacyToken = localStg.get('token')
  const devToken = buildDevTokenFromLegacyJwt(legacyToken)

  if (!devToken) return undefined

  return {
    Authorization: `Bearer ${devToken}`
  }
}

async function wrap<T>(promise: Promise<T>): Promise<T> {
  try {
    return await promise
  } catch (error: any) {
    const code = error?.response?.data?.code || 'UNKNOWN'
    const message = error?.response?.data?.message || error?.message || 'Request failed'
    throw new ApiError(code, message, error?.response?.data?.details)
  }
}

function withDataAlias<T>(payload: T): T {
  if (payload && typeof payload === 'object' && !Array.isArray(payload)) {
    return {
      ...(payload as Record<string, unknown>),
      data: payload
    } as T
  }

  return {
    data: payload
  } as T
}

export const thingmodelClient = {
  get: <T>(url: string, params?: any) =>
    wrap(
      thingmodelRequest.get<T>(buildThingmodelUrl(url), { params, headers: buildThingmodelHeaders() })
        .then(response => withDataAlias(response.data))
    ),
  post: <T>(url: string, data?: any) =>
    wrap(
      thingmodelRequest.post<T>(buildThingmodelUrl(url), data, { headers: buildThingmodelHeaders() })
        .then(response => withDataAlias(response.data))
    ),
  put: <T>(url: string, data?: any) =>
    wrap(
      thingmodelRequest.put<T>(buildThingmodelUrl(url), data, { headers: buildThingmodelHeaders() })
        .then(response => withDataAlias(response.data))
    ),
  delete: <T>(url: string, params?: any) =>
    wrap(
      thingmodelRequest.delete<T>(buildThingmodelUrl(url), { params, headers: buildThingmodelHeaders() })
        .then(response => withDataAlias(response.data))
    )
}
