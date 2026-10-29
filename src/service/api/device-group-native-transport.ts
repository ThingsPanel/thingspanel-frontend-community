import type { components, operations } from './generated/device-metadata/types'

export type DeviceGroup = components['schemas']['DeviceGroup']
export type CreateDeviceGroup = components['schemas']['CreateDeviceGroup']
export type UpdateDeviceGroup = components['schemas']['UpdateDeviceGroup']
export type MoveDeviceGroup = components['schemas']['MoveDeviceGroup']
export type GroupTree = components['schemas']['GroupTree']
export type GroupTreeNode = components['schemas']['GroupTreeNode']
export type GroupMemberPage = components['schemas']['GroupMemberPage']
export type GroupMember = components['schemas']['GroupMember']
export type GroupMemberListQuery = NonNullable<operations['listDeviceGroupMembers']['parameters']['query']>
export type SetGroupMembers = components['schemas']['SetGroupMembers']
type DeviceGroupPageResponse = components['schemas']['DeviceGroupPageResponse']
type DeviceGroupResponse = components['schemas']['DeviceGroupResponse']
type GroupTreeResponse = components['schemas']['GroupTreeResponse']
type RequestMeta = components['schemas']['RequestMeta']
export type Problem = components['schemas']['Problem']
export type EncoreAuthError = components['schemas']['EncoreAuthError']
export type DeviceGroupNativeErrorBody = Problem | EncoreAuthError

export interface DeviceGroupNativeOptions {
  fetch: typeof globalThis.fetch
  getToken: () => string | undefined | null
  getLanguage: () => string | undefined | null
}

export interface DeviceGroupListQuery {
  page: number
  pageSize: number
  parentId?: string
  rootOnly?: boolean
  search?: string
}

export interface DeviceGroupNativeClient {
  list(query: DeviceGroupListQuery): Promise<DeviceGroupPageResponse['data']>
  tree(maxDepth?: number): Promise<GroupTree>
  get(id: string): Promise<{ group: DeviceGroup; etag: string }>
  create(body: CreateDeviceGroup, idempotencyKey: string): Promise<DeviceGroup>
  update(
    id: string,
    body: UpdateDeviceGroup,
    etag: string,
    idempotencyKey: string
  ): Promise<{ group: DeviceGroup; etag: string }>
  move(id: string, body: MoveDeviceGroup, idempotencyKey: string): Promise<DeviceGroup>
  delete(id: string, etag: string, idempotencyKey: string): Promise<DeviceGroup>
  members(groupId: string, query: GroupMemberListQuery): Promise<GroupMemberPage>
  addMembers(groupId: string, body: SetGroupMembers, idempotencyKey: string): Promise<DeviceGroup>
  removeMembers(groupId: string, body: SetGroupMembers, idempotencyKey: string): Promise<DeviceGroup>
}

/** Safe typed error for RFC 9457 business failures and pre-handler Encore auth failures. */
export class DeviceGroupNativeError extends Error {
  constructor(
    readonly status: number,
    readonly body?: DeviceGroupNativeErrorBody
  ) {
    const message = body && 'detail' in body ? body.detail : body?.message
    super(message || `Device group request failed (${status})`)
    this.name = 'DeviceGroupNativeError'
  }

  get code(): string | undefined {
    return this.body?.code
  }
}

export function createDeviceGroupOperationKey(): string {
  const crypto = globalThis.crypto
  if (!crypto?.getRandomValues) throw new Error('Secure random number generation is unavailable')
  const bytes = crypto.getRandomValues(new Uint8Array(16))
  bytes[6] = (bytes[6] & 0x0f) | 0x40
  bytes[8] = (bytes[8] & 0x3f) | 0x80
  const hex = Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}

function queryString(query: object): string {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(query)) if (value !== undefined) params.set(key, String(value))
  return `?${params.toString()}`
}

function isProblem(value: unknown): value is Problem {
  return Boolean(value && typeof value === 'object' && 'status' in value && 'detail' in value && 'code' in value)
}

function isEncoreAuthError(value: unknown): value is EncoreAuthError {
  return Boolean(value && typeof value === 'object' && 'code' in value && 'message' in value && !('status' in value))
}

function sanitizeBody(body: DeviceGroupNativeErrorBody, token: string | undefined): DeviceGroupNativeErrorBody {
  if (!token) return body
  if ('detail' in body) return { ...body, detail: body.detail.split(token).join('[redacted]') }
  return { ...body, message: body.message.split(token).join('[redacted]') }
}

function unwrap<T>(envelope: { data: T; meta: RequestMeta }): T {
  if (!envelope || envelope.data === undefined || !envelope.meta || typeof envelope.meta.requestId !== 'string') {
    throw new Error('Device group service returned an invalid data/meta response')
  }
  return envelope.data
}

export function createDeviceGroupNativeClient(options: DeviceGroupNativeOptions): DeviceGroupNativeClient {
  async function request<T>(
    path: string,
    init: RequestInit = {},
    idempotencyKey?: string
  ): Promise<{ body: T; response: Response }> {
    const token = options.getToken()
    const language = options.getLanguage()
    const headers = new Headers(init.headers)
    headers.set('Accept', 'application/json, application/problem+json')
    if (init.body !== undefined) headers.set('Content-Type', 'application/json')
    if (token) headers.set('Authorization', `Bearer ${token}`)
    if (language) headers.set('Accept-Language', language)
    if (idempotencyKey !== undefined) headers.set('Idempotency-Key', idempotencyKey)

    let response: Response
    try {
      response = await options.fetch(path, { ...init, headers })
    } catch {
      throw new Error('Device group service is unreachable')
    }
    if (!response.ok) {
      let body: DeviceGroupNativeErrorBody | undefined
      try {
        const payload: unknown = await response.json()
        if (isProblem(payload) || isEncoreAuthError(payload)) body = sanitizeBody(payload, token || undefined)
      } catch {
        /* Keep a status-only error for non-JSON failure bodies. */
      }
      throw new DeviceGroupNativeError(response.status, body)
    }
    try {
      return { body: (await response.json()) as T, response }
    } catch {
      throw new Error('Device group service returned an invalid JSON response')
    }
  }

  function strongEtag(response: Response): string {
    const etag = response.headers.get('ETag')
    if (!etag || etag.startsWith('W/') || etag === '*')
      throw new Error('Device group response is missing a strong ETag')
    return etag
  }

  function requireKey(key: string): string {
    if (!/^[A-Za-z0-9._:-]{8,128}$/.test(key)) throw new Error('Idempotency-Key must be 8 to 128 allowed characters')
    return key
  }

  function withJson(method: string, body: unknown, etag?: string): RequestInit {
    const headers = new Headers()
    if (etag) headers.set('If-Match', etag)
    return { method, headers, body: JSON.stringify(body) }
  }

  return {
    async list(query) {
      const { body } = await request<DeviceGroupPageResponse>(`/api/v2/device-groups${queryString(query)}`)
      return unwrap(body)
    },
    async tree(maxDepth = 32) {
      const { body } = await request<GroupTreeResponse>(`/api/v2/device-group-tree${queryString({ maxDepth })}`)
      return unwrap(body)
    },
    async get(id) {
      const { body, response } = await request<DeviceGroupResponse>(`/api/v2/device-groups/${encodeURIComponent(id)}`)
      return { group: unwrap(body), etag: strongEtag(response) }
    },
    async create(body, idempotencyKey) {
      const { body: response } = await request<DeviceGroupResponse>(
        '/api/v2/device-groups',
        withJson('POST', body),
        requireKey(idempotencyKey)
      )
      return unwrap(response)
    },
    async update(id, body, etag, idempotencyKey) {
      const { body: response, response: httpResponse } = await request<DeviceGroupResponse>(
        `/api/v2/device-groups/${encodeURIComponent(id)}`,
        withJson('PATCH', body, etag),
        requireKey(idempotencyKey)
      )
      return { group: unwrap(response), etag: strongEtag(httpResponse) }
    },
    async move(id, body, idempotencyKey) {
      const { body: response } = await request<DeviceGroupResponse>(
        `/api/v2/device-groups/${encodeURIComponent(id)}/moves`,
        withJson('POST', body),
        requireKey(idempotencyKey)
      )
      return unwrap(response)
    },
    async delete(id, etag, idempotencyKey) {
      const init: RequestInit = { method: 'DELETE', headers: { 'If-Match': etag } }
      const { body } = await request<DeviceGroupResponse>(
        `/api/v2/device-groups/${encodeURIComponent(id)}`,
        init,
        requireKey(idempotencyKey)
      )
      return unwrap(body)
    },
    async members(groupId, query) {
      const { body } = await request<components['schemas']['GroupMemberPageResponse']>(
        `/api/v2/device-groups/${encodeURIComponent(groupId)}/members${queryString(query)}`
      )
      return unwrap(body)
    },
    async addMembers(groupId, body, idempotencyKey) {
      const { body: response } = await request<DeviceGroupResponse>(
        `/api/v2/device-groups/${encodeURIComponent(groupId)}/member-additions`,
        withJson('POST', body),
        requireKey(idempotencyKey)
      )
      return unwrap(response)
    },
    async removeMembers(groupId, body, idempotencyKey) {
      const { body: response } = await request<DeviceGroupResponse>(
        `/api/v2/device-groups/${encodeURIComponent(groupId)}/member-removals`,
        withJson('POST', body),
        requireKey(idempotencyKey)
      )
      return unwrap(response)
    }
  }
}
