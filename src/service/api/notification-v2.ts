import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosResponse } from 'axios'
import { useAuthStore } from '@/store/modules/auth'
import type * as NotificationV2 from './notification-v2.types'

export type NotificationPage<T> = NotificationV2.Page<T>
export type NotificationPlugin = NotificationV2.PluginView
export type NotificationInstance = NotificationV2.InstanceView
export type NotificationPluginGrant = NotificationV2.PluginGrantView

type SessionSnapshot = { token: string; tenantId: string; principalId: string; generation: number }
type ErrorBody = {
  code?: number | string
  message?: string
  requestId?: string
  details?: NotificationV2.DomainError['details'] | NotificationV2.RuntimeError['details']
}
type Cleanup = () => void

let generation = 0
let lastScope = ''
const cleanups = new Set<Cleanup>()
const inflight = new Set<AbortController>()

function readSession() {
  const auth = useAuthStore()
  const user = auth.userInfo
  return {
    token: String(auth.token || ''),
    tenantId: String(user.tenant_id || ''),
    principalId: String(user.userId || user.id || '')
  }
}

function syncSessionScope() {
  const session = readSession()
  const scope = `${session.tenantId}\u0000${session.principalId}\u0000${session.token}`
  if (lastScope && lastScope !== scope) invalidateNotificationSession()
  lastScope = scope
  return { ...session, generation }
}

export function invalidateNotificationSession() {
  generation += 1
  inflight.forEach(controller => controller.abort())
  inflight.clear()
  cleanups.forEach(cleanup => {
    try {
      cleanup()
    } catch {
      // One view cleanup must not prevent the other notification views from clearing.
    }
  })
}

export function registerNotificationSessionCleanup(cleanup: Cleanup) {
  cleanups.add(cleanup)
  return () => cleanups.delete(cleanup)
}

export function getNotificationUiCapabilities() {
  const auth = useAuthStore()
  const roles = new Set([...(auth.userInfo.roles || []), auth.userInfo.authority].filter(Boolean))
  const canManage = roles.has('SYS_ADMIN') || roles.has('TENANT_ADMIN')
  return {
    canRead: canManage || roles.has('TENANT_USER'),
    canManage,
    canSendTest: canManage,
    canManagePlugins: roles.has('SYS_ADMIN')
  }
}

export function stripSecretConfig(config: Record<string, unknown>, secretFields: string[]) {
  const secrets = new Set(secretFields)
  return Object.fromEntries(Object.entries(config).filter(([name]) => !secrets.has(name)))
}

export function parseNotificationIdentityFields(value: unknown): string[] | undefined {
  if (value === undefined) return undefined
  if (
    !Array.isArray(value) ||
    value.length < 1 ||
    value.length > 64 ||
    value.some(field => typeof field !== 'string' || field.length > 128 || !/^[A-Za-z_][A-Za-z0-9_]*$/.test(field)) ||
    new Set(value).size !== value.length
  ) {
    throw new Error('identity_fields must contain 1 to 64 unique valid field names.')
  }
  return value as string[]
}

const supportedSchemaKeys = new Set([
  'type',
  'title',
  'description',
  'default',
  'enum',
  'const',
  'properties',
  'required',
  'additionalProperties',
  'items',
  'minItems',
  'maxItems',
  'uniqueItems',
  'minLength',
  'maxLength',
  'format',
  'pattern',
  'minimum',
  'maximum',
  'exclusiveMinimum',
  'exclusiveMaximum',
  'multipleOf'
])

type JsonSchema = Record<string, unknown>

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value))
}

function hasExactKeys(value: Record<string, unknown>, keys: string[]) {
  return Object.keys(value).length === keys.length && keys.every(key => Object.hasOwn(value, key))
}

function safePluginGrantView(value: unknown): NotificationV2.PluginGrantView | null {
  const keys = ['pluginRegistrationId', 'tenantId', 'enabled', 'version', 'createdAt', 'updatedAt']
  if (!isRecord(value) || !hasExactKeys(value, keys)) return null
  if (
    typeof value.pluginRegistrationId !== 'string' ||
    !value.pluginRegistrationId.trim() ||
    typeof value.tenantId !== 'string' ||
    !value.tenantId.trim() ||
    value.tenantId.length > 128 ||
    typeof value.enabled !== 'boolean' ||
    !Number.isInteger(value.version) ||
    (value.version as number) < 1 ||
    typeof value.createdAt !== 'string' ||
    !Number.isFinite(Date.parse(value.createdAt)) ||
    typeof value.updatedAt !== 'string' ||
    !Number.isFinite(Date.parse(value.updatedAt))
  ) {
    return null
  }
  return value as unknown as NotificationV2.PluginGrantView
}

function invalidPluginGrantResponse(httpStatus: number, mutating: boolean): never {
  throw new NotificationClientError(
    'The notification service returned an invalid plugin grant response.',
    httpStatus,
    undefined,
    undefined,
    undefined,
    mutating
  )
}

function safePluginGrantPage(value: unknown, httpStatus: number): NotificationV2.PluginGrantPage {
  const keys = ['items', 'page', 'pageSize', 'total']
  if (
    !isRecord(value) ||
    !hasExactKeys(value, keys) ||
    !Array.isArray(value.items) ||
    !Number.isInteger(value.page) ||
    (value.page as number) < 1 ||
    !Number.isInteger(value.pageSize) ||
    (value.pageSize as number) < 1 ||
    (value.pageSize as number) > 100 ||
    !Number.isInteger(value.total) ||
    (value.total as number) < 0
  ) {
    return invalidPluginGrantResponse(httpStatus, false)
  }
  const items = value.items.map(safePluginGrantView)
  if (items.some(item => item === null)) return invalidPluginGrantResponse(httpStatus, false)
  return {
    items: items as NotificationV2.PluginGrantView[],
    page: value.page as number,
    pageSize: value.pageSize as number,
    total: value.total as number
  }
}

function validatePluginGrantUpdate(body: NotificationV2.PluginGrantUpdate) {
  const value = body as unknown as Record<string, unknown>
  if (
    !isRecord(value) ||
    !hasExactKeys(value, ['pluginRegistrationId', 'tenantId', 'enabled', 'expectedVersion']) ||
    typeof value.pluginRegistrationId !== 'string' ||
    !value.pluginRegistrationId.trim() ||
    typeof value.tenantId !== 'string' ||
    !value.tenantId.trim() ||
    value.tenantId.length > 128 ||
    typeof value.enabled !== 'boolean' ||
    !Number.isInteger(value.expectedVersion) ||
    (value.expectedVersion as number) < 0
  ) {
    throw new Error('The plugin grant update does not match the notification contract.')
  }
}

function hasSafePattern(pattern: string) {
  return (
    pattern.length <= 128 &&
    !/\\[1-9]|\(\?/.test(pattern) &&
    !/\([^)]*[+*{][^)]*\)[+*{]/.test(pattern) &&
    !/\([^)]*\|[^)]*\)[+*{]/.test(pattern)
  )
}

export function unsupportedNotificationSchemaPaths(schema: unknown, path = ''): string[] {
  if (!isRecord(schema)) return [path || '$']
  const unsupported = Object.keys(schema)
    .filter(key => !supportedSchemaKeys.has(key))
    .map(key => (path ? `${path}.${key}` : key))
  const type = schema.type
  if (type !== undefined && !['string', 'integer', 'number', 'boolean', 'object', 'array'].includes(String(type))) {
    unsupported.push(path ? `${path}.type` : 'type')
  }
  if (typeof schema.pattern === 'string' && !hasSafePattern(schema.pattern)) {
    unsupported.push(path ? `${path}.pattern` : 'pattern')
  }
  if (schema.format !== undefined && !['email', 'uri'].includes(String(schema.format))) {
    unsupported.push(path ? `${path}.format` : 'format')
  }
  if (isRecord(schema.properties)) {
    Object.entries(schema.properties).forEach(([name, child]) => {
      unsupported.push(...unsupportedNotificationSchemaPaths(child, path ? `${path}.${name}` : name))
    })
  }
  if (schema.items !== undefined) {
    unsupported.push(...unsupportedNotificationSchemaPaths(schema.items, `${path || '$'}[]`))
  }
  if (isRecord(schema.additionalProperties)) {
    unsupported.push(...unsupportedNotificationSchemaPaths(schema.additionalProperties, `${path || '$'}.*`))
  }
  return unsupported
}

export function validateNotificationConfigValue(
  value: unknown,
  schema: JsonSchema,
  path = 'config',
  depth = 0
): string | null {
  if (depth > 32) return `${path}: nested value is too deep`
  if (schema.type === 'string' && typeof value !== 'string') return `${path}: expected string`
  if (schema.type === 'integer' && (!Number.isInteger(value) || typeof value !== 'number'))
    return `${path}: expected integer`
  if (schema.type === 'number' && (typeof value !== 'number' || !Number.isFinite(value)))
    return `${path}: expected number`
  if (schema.type === 'boolean' && typeof value !== 'boolean') return `${path}: expected boolean`
  if (schema.type === 'array' && !Array.isArray(value)) return `${path}: expected array`
  if (schema.type === 'object' && !isRecord(value)) return `${path}: expected object`

  if (Array.isArray(schema.enum) && !schema.enum.some(option => JSON.stringify(option) === JSON.stringify(value)))
    return `${path}: value is not allowed`
  if ('const' in schema && JSON.stringify(schema.const) !== JSON.stringify(value))
    return `${path}: value is not allowed`

  if (typeof value === 'string') {
    if (schema.format === 'email' && !/^[^\s@]+@[^\s@]+$/.test(value)) return `${path}: expected email address`
    if (schema.format === 'uri') {
      try {
        const parsed = new URL(value)
        if (!parsed.protocol) return `${path}: expected absolute URI`
      } catch {
        return `${path}: expected absolute URI`
      }
    }
    const length = Array.from(value).length
    if (typeof schema.minLength === 'number' && length < schema.minLength) return `${path}: value is too short`
    if (typeof schema.maxLength === 'number' && length > schema.maxLength) return `${path}: value is too long`
    if (typeof schema.pattern === 'string' && hasSafePattern(schema.pattern)) {
      try {
        if (!new RegExp(schema.pattern).test(value)) return `${path}: value does not match the required pattern`
      } catch {
        return `${path}: schema pattern is invalid`
      }
    }
  }
  if (typeof value === 'number') {
    if (typeof schema.minimum === 'number' && value < schema.minimum) return `${path}: value is too small`
    if (typeof schema.maximum === 'number' && value > schema.maximum) return `${path}: value is too large`
    if (typeof schema.exclusiveMinimum === 'number' && value <= schema.exclusiveMinimum)
      return `${path}: value is too small`
    if (typeof schema.exclusiveMaximum === 'number' && value >= schema.exclusiveMaximum)
      return `${path}: value is too large`
    if (typeof schema.multipleOf === 'number' && schema.multipleOf > 0 && (value / schema.multipleOf) % 1 !== 0)
      return `${path}: value has an invalid increment`
  }
  if (Array.isArray(value)) {
    if (typeof schema.minItems === 'number' && value.length < schema.minItems) return `${path}: add more items`
    if (typeof schema.maxItems === 'number' && value.length > schema.maxItems) return `${path}: remove extra items`
    if (schema.uniqueItems === true && new Set(value.map(item => JSON.stringify(item))).size !== value.length)
      return `${path}: items must be unique`
    if (isRecord(schema.items)) {
      for (let index = 0; index < value.length; index += 1) {
        const failure = validateNotificationConfigValue(value[index], schema.items, `${path}[${index}]`, depth + 1)
        if (failure) return failure
      }
    }
  }
  if (isRecord(value)) {
    const properties = isRecord(schema.properties) ? schema.properties : {}
    if (Array.isArray(schema.required)) {
      const missing = schema.required.find(name => typeof name === 'string' && !(name in value))
      if (missing) return `${path}.${String(missing)}: field is required`
    }
    for (const [name, childValue] of Object.entries(value)) {
      const childSchema = properties[name]
      if (isRecord(childSchema)) {
        const failure = validateNotificationConfigValue(childValue, childSchema, `${path}.${name}`, depth + 1)
        if (failure) return failure
      } else if (schema.additionalProperties === false) {
        return `${path}.${name}: field is not allowed`
      } else if (isRecord(schema.additionalProperties)) {
        const failure = validateNotificationConfigValue(
          childValue,
          schema.additionalProperties,
          `${path}.${name}`,
          depth + 1
        )
        if (failure) return failure
      }
    }
  }
  return null
}

export class NotificationClientError extends Error {
  readonly name = 'NotificationClientError'
  readonly httpStatus: number | null
  readonly code?: number | string
  readonly requestId?: string
  readonly details?: NotificationV2.DomainError['details'] | NotificationV2.RuntimeError['details']
  private readonly uncertain: boolean

  constructor(
    message: string,
    httpStatus: number | null,
    code?: number | string,
    requestId?: string,
    details?: NotificationV2.DomainError['details'] | NotificationV2.RuntimeError['details'],
    outcomeUncertain = false
  ) {
    super(message)
    this.httpStatus = httpStatus
    this.code = code
    this.requestId = requestId
    this.details = details
    this.uncertain = outcomeUncertain
  }

  get outcomeUncertain() {
    return this.uncertain || this.httpStatus === null || this.httpStatus >= 500
  }
}

export class NotificationSessionChangedError extends Error {
  constructor() {
    super('The notification session changed while the request was in progress.')
    this.name = 'NotificationSessionChangedError'
  }
}

export class NotificationServiceUnavailableError extends Error {
  constructor() {
    super('Notification service is not enabled. Configure VITE_NOTIFICATION_API_BASE_URL.')
    this.name = 'NotificationServiceUnavailableError'
  }
}

function apiBaseUrl() {
  const configured = import.meta.env.VITE_NOTIFICATION_API_BASE_URL?.trim()
  if (!configured) throw new NotificationServiceUnavailableError()
  return configured.replace(/\/+$/, '')
}

export function resolveNotificationPluginOrigin(
  value: string,
  options = {
    development: import.meta.env.DEV,
    allowInsecureLoopback: import.meta.env.VITE_NOTIFICATION_ALLOW_INSECURE_PLUGIN_ORIGIN === 'true'
  }
) {
  let parsed: URL
  try {
    parsed = new URL(value)
  } catch {
    throw new Error('Enter a valid plugin origin.')
  }
  const loopback = ['localhost', '127.0.0.1', '[::1]'].includes(parsed.hostname.toLowerCase())
  const secure = parsed.protocol === 'https:'
  const optedInLoopback =
    options.development && options.allowInsecureLoopback && parsed.protocol === 'http:' && loopback
  if (
    (!secure && !optedInLoopback) ||
    parsed.username ||
    parsed.password ||
    !['', '/'].includes(parsed.pathname) ||
    parsed.search ||
    parsed.hash
  ) {
    throw new Error(
      'The plugin origin must be HTTPS; HTTP is allowed only for opted-in Vite development loopback hosts.'
    )
  }
  return parsed.origin
}

function createTransport(): AxiosInstance {
  return axios.create({ baseURL: apiBaseUrl(), timeout: 15000, withCredentials: true })
}

function normalizeError(response: AxiosResponse | undefined, fallback: string) {
  const status = response?.status ?? null
  const body = response?.data as ErrorBody | undefined
  const message = typeof body?.message === 'string' && body.message.trim() ? body.message : fallback
  return new NotificationClientError(
    message,
    status,
    typeof body?.code === 'string' || typeof body?.code === 'number' ? body.code : undefined,
    typeof body?.requestId === 'string' ? body.requestId : undefined,
    body?.details as NotificationClientError['details']
  )
}

function validateEnvelope<T>(response: AxiosResponse, session: SessionSnapshot, expected: number[], mutating: boolean) {
  if (session.generation !== generation) throw new NotificationSessionChangedError()
  if (!expected.includes(response.status)) {
    const error = normalizeError(response, `Unexpected HTTP status ${response.status}.`)
    if (mutating && response.status >= 200 && response.status < 300) {
      throw new NotificationClientError(
        error.message,
        error.httpStatus,
        error.code,
        error.requestId,
        error.details,
        true
      )
    }
    throw error
  }
  const body = response.data as Partial<NotificationV2.Envelope<T>> | undefined
  if (!body || body.code !== 200 || !('data' in body) || typeof body.requestId !== 'string') {
    throw new NotificationClientError(
      'The notification service returned an invalid response.',
      response.status,
      undefined,
      undefined,
      undefined,
      mutating
    )
  }
  return { ...(body as NotificationV2.Envelope<T>), httpStatus: response.status }
}

async function send<T>(
  config: AxiosRequestConfig,
  expected: number[],
  mutating = false,
  signal?: AbortSignal
): Promise<NotificationV2.Envelope<T> & { httpStatus: number }> {
  const session = syncSessionScope()
  if (!session.token) throw new NotificationClientError('Please sign in again.', 401)
  let controller: AbortController | undefined
  const abortRequest = () => controller?.abort()
  try {
    controller = new AbortController()
    if (signal?.aborted) controller.abort()
    else signal?.addEventListener('abort', abortRequest, { once: true })
    inflight.add(controller)
    const response = await createTransport().request({
      ...config,
      signal: controller.signal,
      headers: { Authorization: `Bearer ${session.token}`, ...(config.headers || {}) }
    })
    return validateEnvelope<T>(response, session, expected, mutating)
  } catch (error) {
    if (session.generation !== generation) throw new NotificationSessionChangedError()
    if (signal?.aborted) throw error
    if (
      error instanceof NotificationClientError ||
      error instanceof NotificationSessionChangedError ||
      error instanceof NotificationServiceUnavailableError
    )
      throw error
    const axiosError = axios.isAxiosError(error) ? error : undefined
    const normalized = normalizeError(axiosError?.response, error instanceof Error ? error.message : 'Request failed.')
    if (normalized.httpStatus === 401) void useAuthStore().resetStore()
    throw normalized
  } finally {
    signal?.removeEventListener('abort', abortRequest)
    if (controller) inflight.delete(controller)
  }
}

function key() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID()
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, value => value.toString(16).padStart(2, '0')).join('')
}

export const notificationV2 = {
  listPlugins() {
    return send<{ items: NotificationPlugin[] }>({ method: 'GET', url: '/api/v2/notification-plugins' }, [200])
  },
  registerPlugin(body: NotificationV2.PluginRegistration, idempotencyKey = key()) {
    return send<NotificationPlugin>(
      {
        method: 'POST',
        url: '/api/v2/notification-plugins',
        data: body,
        headers: { 'Idempotency-Key': idempotencyKey }
      },
      [201],
      true
    )
  },
  updatePlugin(id: string, body: NotificationV2.PluginUpdate, idempotencyKey = key()) {
    return send<NotificationPlugin>(
      {
        method: 'PUT',
        url: `/api/v2/notification-plugins/${encodeURIComponent(id)}`,
        data: body,
        headers: { 'Idempotency-Key': idempotencyKey }
      },
      [200],
      true
    )
  },
  async listPluginGrants(params: NotificationV2.PluginGrantListQuery, signal?: AbortSignal) {
    const allowedKeys = ['pluginRegistrationId', 'page', 'pageSize']
    if (
      Object.keys(params).some(name => !allowedKeys.includes(name)) ||
      !Number.isInteger(params.page) ||
      params.page < 1 ||
      !Number.isInteger(params.pageSize) ||
      params.pageSize < 1 ||
      params.pageSize > 100 ||
      (params.pluginRegistrationId !== undefined &&
        (typeof params.pluginRegistrationId !== 'string' || !params.pluginRegistrationId.trim()))
    ) {
      throw new Error('The plugin grant query does not match the notification contract.')
    }
    const response = await send<NotificationV2.PluginGrantPage>(
      { method: 'GET', url: '/api/v2/notification-plugin-grants', params },
      [200],
      false,
      signal
    )
    return { ...response, data: safePluginGrantPage(response.data, response.httpStatus) }
  },
  async setPluginGrant(body: NotificationV2.PluginGrantUpdate, idempotencyKey = key()) {
    validatePluginGrantUpdate(body)
    if (typeof idempotencyKey !== 'string' || !idempotencyKey.trim()) {
      throw new Error('A non-empty Idempotency-Key is required for plugin grant updates.')
    }
    const response = await send<NotificationV2.PluginGrantView>(
      {
        method: 'PUT',
        url: '/api/v2/notification-plugin-grants',
        data: body,
        headers: { 'Idempotency-Key': idempotencyKey }
      },
      [200, 201],
      true
    )
    const data = safePluginGrantView(response.data)
    if (!data) return invalidPluginGrantResponse(response.httpStatus, true)
    return { ...response, data }
  },
  listInstances(params: { page: number; pageSize: number; pluginId?: string; channel?: NotificationV2.Channel }) {
    return send<NotificationPage<NotificationInstance>>(
      { method: 'GET', url: '/api/v2/notification-instances', params },
      [200]
    )
  },
  listGroups(params: { page: number; pageSize: number }, signal?: AbortSignal) {
    return send<NotificationV2.Page<NotificationV2.GroupView>>(
      { method: 'GET', url: '/api/v2/notification-groups', params },
      [200],
      false,
      signal
    )
  },
  getGroup(id: string, signal?: AbortSignal) {
    return send<NotificationV2.GroupView>(
      { method: 'GET', url: `/api/v2/notification-groups/${encodeURIComponent(id)}` },
      [200],
      false,
      signal
    )
  },
  createGroup(body: NotificationV2.GroupCreate, idempotencyKey = key()) {
    return send<NotificationV2.GroupView>(
      {
        method: 'POST',
        url: '/api/v2/notification-groups',
        data: body,
        headers: { 'Idempotency-Key': idempotencyKey }
      },
      [201],
      true
    )
  },
  updateGroup(id: string, body: NotificationV2.GroupUpdate, idempotencyKey = key()) {
    return send<NotificationV2.GroupView>(
      {
        method: 'PUT',
        url: `/api/v2/notification-groups/${encodeURIComponent(id)}`,
        data: body,
        headers: { 'Idempotency-Key': idempotencyKey }
      },
      [200],
      true
    )
  },
  listDeliveries(
    params: {
      page: number
      pageSize: number
      instanceId?: string
      sourceId?: string
      dispatchStatus?: NotificationV2.DispatchStatus
      deliveryStatus?: NotificationV2.DeliveryStatus
      from?: string
      to?: string
    },
    signal?: AbortSignal
  ) {
    return send<NotificationV2.Page<NotificationV2.DeliveryView>>(
      { method: 'GET', url: '/api/v2/notification-deliveries', params },
      [200],
      false,
      signal
    )
  },
  getDelivery(id: string, signal?: AbortSignal) {
    return send<NotificationV2.DeliveryView>(
      { method: 'GET', url: `/api/v2/notification-deliveries/${encodeURIComponent(id)}` },
      [200],
      false,
      signal
    )
  },
  getInstance(id: string) {
    return send<NotificationInstance>(
      { method: 'GET', url: `/api/v2/notification-instances/${encodeURIComponent(id)}` },
      [200]
    )
  },
  createInstance(body: NotificationV2.InstanceCreate, idempotencyKey = key()) {
    return send<NotificationInstance>(
      {
        method: 'POST',
        url: '/api/v2/notification-instances',
        data: body,
        headers: { 'Idempotency-Key': idempotencyKey }
      },
      [201],
      true
    )
  },
  updateInstance(id: string, body: NotificationV2.InstanceUpdate, idempotencyKey = key()) {
    return send<NotificationInstance>(
      {
        method: 'PUT',
        url: `/api/v2/notification-instances/${encodeURIComponent(id)}`,
        data: body,
        headers: { 'Idempotency-Key': idempotencyKey }
      },
      [200],
      true
    )
  },
  validateInstance(body: NotificationV2.InstanceValidate) {
    return send<NotificationV2.ValidationResult>(
      { method: 'POST', url: '/api/v2/notification-instances/validate', data: body },
      [200]
    )
  },
  testInstance(id: string, body: NotificationV2.TestSendRequest, idempotencyKey: string) {
    return send<NotificationV2.AcceptedData>(
      {
        method: 'POST',
        url: `/api/v2/notification-instances/${encodeURIComponent(id)}/test`,
        data: body,
        headers: { 'Idempotency-Key': idempotencyKey }
      },
      [202],
      true
    )
  },
  getNotification(id: string, signal?: AbortSignal) {
    return send<NotificationV2.NotificationView>(
      { method: 'GET', url: `/api/v2/notifications/${encodeURIComponent(id)}` },
      [200],
      false,
      signal
    )
  },
  listNotifications(params: NotificationV2.NotificationListQuery, signal?: AbortSignal) {
    return send<NotificationV2.Page<NotificationV2.NotificationView>>(
      { method: 'GET', url: '/api/v2/notifications', params },
      [200],
      false,
      signal
    )
  },
  createIdempotencyKey: key
}
