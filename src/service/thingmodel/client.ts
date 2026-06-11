import axios from 'axios'
import { localStg } from '@/utils/storage'

function handleAuthExpiry() {
  localStg.remove('token')
  localStg.remove('refreshToken')
  localStg.remove('userInfo')
  window.location.reload()
}

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
const thingmodelRequest = axios.create({
  timeout: 30000
})

// Clear session and reload on 401 — matches the legacy backend client behaviour
thingmodelRequest.interceptors.response.use(
  response => response,
  error => {
    if (error?.response?.status === 401) {
      handleAuthExpiry()
    }
    return Promise.reject(error)
  }
)

function buildThingmodelUrl(path: string) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `${THINGMODEL_PROXY_PATH}${normalizedPath}`
}

function buildThingmodelHeaders() {
  const token = localStg.get('token')
  if (!token) return undefined
  return { Authorization: `Bearer ${token}` }
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

/**
 * Probe whether the thingmodel backend is reachable.
 * Result is cached for the lifetime of the page so it only hits the network once.
 */
let _availabilityCache: Promise<boolean> | null = null

export function checkThingmodelAvailability(): Promise<boolean> {
  if (_availabilityCache !== null) return _availabilityCache
  _availabilityCache = thingmodelRequest
    .get(`${THINGMODEL_PROXY_PATH}/api/device-metadata/healthz`, { timeout: 4000 })
    .then(() => true)
    .catch(() => false)
  return _availabilityCache
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
