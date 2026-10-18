import { v4 as uuidv4 } from 'uuid'

export type ModelLifecycle = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
export type FieldKind = 'TELEMETRY' | 'ATTRIBUTE' | 'EVENT' | 'COMMAND'
export type ValueKind = 'INT' | 'FLOAT' | 'NUMBER' | 'BOOL' | 'STRING' | 'ENUM'
// Frozen HTTP wire uses BOOLEAN; Encore maps it to internal core BOOL.
export type EnumBaseKind = 'STRING' | 'NUMBER' | 'BOOLEAN'
export interface NumericConstraint { min?: number; max?: number; step?: number; precision?: number }
export interface StringConstraint { pattern?: string; maxLength?: number }
export interface BooleanConstraint { trueText?: string; falseText?: string }
export type ValueConstraint = NumericConstraint | StringConstraint | BooleanConstraint
export interface EnumOption { code: string | number | boolean; label: I18nString }
export type ValueType =
  | { kind: 'INT' | 'FLOAT' | 'NUMBER'; constraint?: NumericConstraint; enumValues?: never }
  | { kind: 'STRING'; constraint?: StringConstraint; enumValues?: never }
  | { kind: 'BOOL'; constraint?: BooleanConstraint; enumValues?: never }
  | { kind: 'ENUM'; baseKind: EnumBaseKind; constraint?: never; enumValues: [EnumOption, ...EnumOption[]] }
export interface I18nString { default: string; locales?: Record<string, string> }
export interface Access { read: boolean; write: boolean; observe: boolean }
export interface ParameterDefinition {
  identifier: string
  nameI18n: I18nString
  descriptionI18n?: I18nString | null
  valueType: ValueType
}
export interface Parameters { schemaVersion: 1; items: ParameterDefinition[] }
export interface ModelFieldBase {
  fieldID?: string
  identifier: string
  nameI18n: I18nString
  descriptionI18n?: I18nString | null
  access: Access
  unit?: string | null
  sortOrder?: number
}
export type ModelField =
  | (ModelFieldBase & { kind: 'TELEMETRY' | 'ATTRIBUTE'; valueType: ValueType; parameters?: never })
  | (ModelFieldBase & { kind: 'EVENT' | 'COMMAND'; valueType?: never; parameters: Parameters })
export interface ModelDraft {
  name: string
  descriptionI18n?: I18nString | null
  category?: string | null
  fields: ModelField[]
}
export interface NativeModelProfile {
  author: string
  tags: string[]
  cover: string
  version: string
  brand: string
  modelNumber: string
}
export interface ResourcesDocument {
  profile: NativeModelProfile
  webChartConfig: Record<string, unknown> | null
  appChartConfig: Record<string, unknown> | null
}
export interface ModelResources extends ResourcesDocument {
  modelID: string
  revision: number
}
export interface CreateModelRequest { model: ModelDraft; resources: ResourcesDocument }
export interface UpdateModelRequest {
  modelID: string
  expectedDraftRevision: number
  model: ModelDraft
  resources?: ResourcesDocument
  expectedResourcesRevision?: number
}
export interface UpdateResourcesRequest { modelID: string; expectedRevision: number; resources: ResourcesDocument }
export interface PublishModelRequest { modelID: string; expectedDraftRevision: number; expectedResourcesRevision: number; changelog?: string }
export type ConsumerState = 'NOT_REQUESTED' | 'PENDING' | 'APPLIED' | 'FAILED' | 'UNSUPPORTED_REFERENCE_AMBIGUITY'
export type CommandStatus = 'SAVED' | 'PENDING_CONSUMER' | 'APPLIED' | 'FAILED' | 'CONFLICT'
export interface ModelCommandResult {
  status: CommandStatus
  lifecycle: ModelLifecycle
  modelID: string
  draftRevision: number
  resourcesRevision?: number
  publishedRevision?: number | null
  consumerState: ConsumerState
  consumerRevision?: number | null
  checksum?: string | null
  errorCode?: string | null
  errorMessage?: string | null
  replayed: boolean
  templateID?: string | null
}
export interface ModelSummary {
  modelID: string; name: string; lifecycle: ModelLifecycle; draftRevision: number
  publishedRevision: number | null; updatedAt: string
}
export interface PageModelSummary { items: ModelSummary[]; page: number; pageSize: number; total: number }
export interface ModelDetail {
  modelID: string; draft: ModelDraft; draftRevision: number; lifecycle: ModelLifecycle
  publishedRevision?: number | null; publishedSnapshotID?: string | null; presentationRevision?: number
}
export interface VersionSummary {
  publishedRevision: number; snapshotID: string; checksum: string; createdAt: string; changelog?: string | null
}
export interface PageVersionSummary { items: VersionSummary[]; page: number; pageSize: number; total: number }
export interface SnapshotDetail extends VersionSummary { modelID: string; model: ModelDraft; resources: ResourcesDocument }
export interface APIError { code: string; message: string; requestID: string; details?: Record<string, unknown> }
export interface NativeClientOptions {
  fetch: typeof globalThis.fetch
  getToken: () => string | undefined | null
  getLanguage: () => string | undefined | null
}
export interface ThingModelNativeClient {
  create(request: CreateModelRequest, idempotencyKey: string): Promise<ModelCommandResult>
  update(request: UpdateModelRequest, idempotencyKey: string): Promise<ModelCommandResult>
  publish(request: PublishModelRequest, idempotencyKey: string): Promise<ModelCommandResult>
  list(options?: { page?: number; pageSize?: number; query?: string; kind?: FieldKind; lifecycle?: ModelLifecycle }): Promise<PageModelSummary>
  get(modelID: string): Promise<ModelDetail>
  getResources(modelID: string): Promise<ModelResources>
  updateResources(request: UpdateResourcesRequest, idempotencyKey: string): Promise<ModelCommandResult>
  versions(modelID: string, options?: { page?: number; pageSize?: number }): Promise<PageVersionSummary>
  version(modelID: string, publishedRevision: number): Promise<SnapshotDetail>
}

/** Endpoint-shaped error deliberately excludes request headers and response bodies. */
export class ThingModelNativeError extends Error {
  constructor(readonly status: number, readonly apiError?: APIError) {
    super(apiError?.message || `Thing model request failed (${status})`)
    this.name = 'ThingModelNativeError'
  }
}

function requireKey(key: string): string {
  if (key.length < 8 || key.length > 128) throw new Error('Idempotency-Key must be 8 to 128 characters')
  return key
}

export function createOperationKey(): string {
  const crypto = globalThis.crypto
  if (!crypto?.getRandomValues) throw new Error('Secure random number generation is unavailable')
  return uuidv4({ random: crypto.getRandomValues(new Uint8Array(16)) })
}

function queryString(values: Record<string, string | number | undefined>): string {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(values)) if (value !== undefined) params.set(key, String(value))
  const query = params.toString()
  return query ? `?${query}` : ''
}

export function createThingModelNativeClient(options: NativeClientOptions): ThingModelNativeClient {
  async function request<T>(path: string, init: RequestInit = {}, idempotencyKey?: string): Promise<T> {
    const token = options.getToken()
    const language = options.getLanguage()
    const headers = new Headers(init.headers)
    headers.set('Accept', 'application/json')
    if (init.body !== undefined) headers.set('Content-Type', 'application/json')
    if (token) headers.set('Authorization', `Bearer ${token}`)
    if (language) headers.set('Accept-Language', language)
    if (idempotencyKey !== undefined) headers.set('Idempotency-Key', requireKey(idempotencyKey))

    let response: Response
    try {
      response = await options.fetch(path, { ...init, headers })
    } catch {
      throw new Error('Thing model service is unreachable')
    }
    if (!response.ok) {
      let apiError: APIError | undefined
      try {
        const payload: unknown = await response.json()
        if (payload && typeof payload === 'object' && 'message' in payload && typeof payload.message === 'string') {
          apiError = payload as APIError
        }
      } catch { /* Keep the safe status-only message when the body is not a valid API error. */ }
      if (apiError) {
        apiError = {
          code: apiError.code,
          message: token ? apiError.message.split(token).join('[redacted]') : apiError.message,
          requestID: apiError.requestID,
        }
      }
      throw new ThingModelNativeError(response.status, apiError)
    }
    try {
      return await response.json() as T
    } catch {
      throw new Error('Thing model service returned an invalid JSON response')
    }
  }

  function post<T>(path: string, body: unknown, key: string): Promise<T> {
    return request(path, { method: 'POST', body: JSON.stringify(body) }, key)
  }

  return {
    create: (body, key) => post('/api/v2/thing-model-commands/create', body, key),
    update: (body, key) => post('/api/v2/thing-model-commands/update', body, key),
    publish: (body, key) => post('/api/v2/thing-model-commands/publish', body, key),
    list: (params = {}) => request(`/api/v2/thing-models${queryString(params)}`),
    get: (modelID) => request(`/api/v2/thing-models/${encodeURIComponent(modelID)}`),
    getResources: (modelID) => request(`/api/v2/thing-models/${encodeURIComponent(modelID)}/resources`),
    updateResources: (body, key) => post('/api/v2/thing-model-commands/update-resources', body, key),
    versions: (modelID, params = {}) => request(`/api/v2/thing-models/${encodeURIComponent(modelID)}/versions${queryString(params)}`),
    version: (modelID, publishedRevision) => request(`/api/v2/thing-models/${encodeURIComponent(modelID)}/versions/${encodeURIComponent(String(publishedRevision))}`),
  }
}
