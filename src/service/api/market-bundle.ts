/**
 * Market Bundle API - 市场解决方案包发布与安装
 * 契约版本: v1
 *
 * 所有请求走项目 request 封装（/api/v1 + x-token 鉴权）
 */

import { request } from '../request'

// ========== Types ==========

/** 发布草稿请求（对齐后端 PublishDraftRequest） */
export interface PublishDraftRequest {
  deviceTemplateIds: string[]
  dashboardIds: string[]
  bundleKey: string
  version: string
  marketToken: string
  category?: string
  brand?: string
  description?: string
  coverAssetKey?: string
  minThingsPanel?: string
  minThingsVis?: string
}

/** 预检项（展示层） */
export interface PrecheckResult {
  code: string
  level: 'PASS' | 'FAIL' | 'WARN' | 'INFO'
  message: string
  details?: Record<string, unknown>
  resource?: {
    type: 'deviceTemplate' | 'dashboard' | 'fieldBinding' | 'plugin'
    id: string
    name: string
  }
}

/** 后端预检报告 */
export interface PublishDraftPrecheckReport {
  passed: boolean
  errors?: Array<{ code: string; message: string; field?: string; details?: string }>
  warnings?: Array<{ code: string; message: string; field?: string }>
  suggestions?: Array<{ code: string; message: string; field?: string }>
}

/** 发布草稿响应（单步发布，无 confirm 阶段） */
export interface PublishDraftResponse {
  bundleKey: string
  version: string
  contentHash: string
  status: string
  precheckReport?: PublishDraftPrecheckReport
}

/** 发布的 Bundle 状态 */
export interface PublishedBundle {
  bundleKey: string
  version: string
  contentHash: string
  status: string
  publishedAt?: string | null
  reviewedAt?: string | null
  reviewComment?: string
}

/** 安装请求（对齐后端 InstallBundleRequest） */
export interface InstallBundleRequest {
  bundleKey: string
  version: string
  marketToken: string
  deviceBindings?: Array<{ bindingKey: string; localDeviceId: string }>
  idempotencyKey?: string
  overwritePolicy?: string
}

/** 安装结果（对齐后端 InstallBundleResponse） */
export interface InstallResult {
  installationId: string
  bundleKey: string
  version: string
  status:
    | 'DOWNLOADING'
    | 'DOWNLOADED'
    | 'VERIFIED'
    | 'MODELS_INSTALLED'
    | 'DASHBOARDS_CREATED'
    | 'WAITING_FOR_BINDINGS'
    | 'COMPLETED'
    | 'FAILED'
    | 'COMPENSATION_REQUIRED'
  resourceMappings?: Array<{
    resourceType: string
    marketResourceKey: string
    localId: string
    localName?: string
    status: string
  }>
  bindingStatus?: Array<{
    bindingKey: string
    deviceTemplateKey?: string
    required: boolean
    localDeviceId?: string
    status: string
    errorMessage?: string
  }>
  warnings?: string[]
  errors?: string[]
  isIdempotent?: boolean
  existingInstallId?: string
}

/** 已安装的 Bundle 记录（前端展示模型） */
export interface InstalledBundle {
  installationId: string
  bundleKey: string
  bundleName: string
  version: string
  installedAt: string
  status: InstallResult['status']
  bindingStatus: 'BOUND' | 'UNBOUND' | 'PARTIAL'
  deviceTemplates: Array<{ resourceKey: string; localId: string; name: string }>
  dashboards: Array<{ resourceKey: string; localId: string; name: string }>
  bindings: Array<{
    bindingKey: string
    displayName: string
    dashboardKey: string
    deviceId: string | null
    deviceName: string | null
    required: boolean
  }>
}

/** 市场 API 错误类型 */
export interface MarketApiError {
  code: string
  message: string
  details?: Record<string, unknown>
  httpStatus: number
}

/** 设备绑定规格 */
export interface DeviceBindingSpec {
  bindingKey: string
  displayName: string
  description?: string
  required: boolean
  deviceTemplateKey?: string
  deviceTemplateName?: string
}

/** 看板绑定规格 */
export interface DashboardBindingSpec {
  dashboardKey: string
  dashboardName: string
  bindings: DeviceBindingSpec[]
}

/** 市场 Bundle 列表项（browse API 尚未接通后端，保留类型） */
export interface MarketBundleListItem {
  bundleKey: string
  name: string
  description?: string
  category: string
  author?: string
  tags?: string[]
  latestVersion: string
  publishedAt: string
  installCount: number
  thumbnail?: string
  rating?: number
}

export interface MarketBundleListResult {
  list: MarketBundleListItem[]
  total: number
}

/** Bundle 详情（browse API 尚未接通后端，保留类型） */
export interface MarketBundleDetail {
  bundleKey: string
  name: string
  description?: string
  category: string
  author?: string
  contact?: string
  tags?: string[]
  versions: Array<{
    version: string
    publishedAt: string
    contentHash: string
    deviceTemplateCount: number
    dashboardCount: number
    contentSize: number
    compatibility: {
      minPlatformVersion?: string
      requiredPlugins?: Array<{ key: string; name: string; version?: string }>
    }
    deviceBindings: DeviceBindingSpec[]
  }>
  totalInstalls: number
  rating: number
  reviewCount: number
}

// ========== Helpers ==========

const NOT_IMPLEMENTED: MarketApiError = {
  code: 'NOT_IMPLEMENTED',
  message: '该接口尚未接通后端，请等待后续版本',
  httpStatus: 501
}

function generateIdempotencyKey(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
}

function parseMarketError(err: unknown): MarketApiError {
  const axiosError = err as {
    response?: { status?: number; data?: { code?: number | string; message?: string; data?: unknown } }
    error?: {
      status?: number
      code?: number | string
      message?: string
      data?: { code?: number | string; message?: string; data?: unknown }
    }
    message?: string
  }

  const status = axiosError.error?.status || axiosError.response?.status || 500
  const body = axiosError.error?.data || axiosError.response?.data

  return {
    code: String(body?.code ?? axiosError.error?.code ?? `HTTP_${status}`),
    message: body?.message || axiosError.error?.message || axiosError.message || '请求失败',
    details: body?.data as Record<string, unknown> | undefined,
    httpStatus: status
  }
}

export function isMarketAuthenticationError(error: MarketApiError | null): boolean {
  if (!error) return false
  if (error.httpStatus === 401 || error.code === '401' || error.code === 'UNAUTHORIZED') return true

  const upstreamError = error.details?.error
  return (
    typeof upstreamError === 'string' &&
    /Horizon .*status 401:.*(?:invalid|missing) authentication/i.test(upstreamError)
  )
}

async function marketApiCall<T>(
  fn: () => Promise<{ data: T | null; error: unknown | null }>
): Promise<{ data: T | null; error: MarketApiError | null }> {
  try {
    const result = await fn()
    if (result.error) {
      return { data: null, error: parseMarketError({ error: result.error }) }
    }
    return { data: result.data, error: null }
  } catch (err) {
    return { data: null, error: parseMarketError(err) }
  }
}

/**
 * Normalize the catalog response during the API contract transition.
 *
 * The shared request client already unwraps the outer `{ code, data }` envelope.
 * Newer ThingsPanel backends return `{ list, total }`, while older deployments
 * and direct Horizon proxies can still return the list array itself.
 */
export function normalizeMarketBundleList(payload: unknown): MarketBundleListResult {
  if (Array.isArray(payload)) {
    return {
      list: payload as MarketBundleListItem[],
      total: payload.length
    }
  }

  if (payload && typeof payload === 'object') {
    const result = payload as Record<string, unknown>

    if (Array.isArray(result.list)) {
      return {
        list: result.list as MarketBundleListItem[],
        total: typeof result.total === 'number' ? result.total : result.list.length
      }
    }

    if (Array.isArray(result.data)) {
      return {
        list: result.data as MarketBundleListItem[],
        total: typeof result.total === 'number' ? result.total : result.data.length
      }
    }
  }

  throw new Error('Invalid dashboard market list response')
}

function computeBindingStatus(bindings: InstalledBundle['bindings']): InstalledBundle['bindingStatus'] {
  if (!bindings.length) return 'UNBOUND'
  const bound = bindings.filter(b => b.deviceId).length
  if (bound === 0) return 'UNBOUND'
  if (bound === bindings.length) return 'BOUND'
  return 'PARTIAL'
}

/** 将后端安装响应映射为前端展示模型 */
export function mapInstallResponseToInstalledBundle(resp: InstallResult, installedAt?: string): InstalledBundle {
  const deviceTemplates =
    resp.resourceMappings
      ?.filter(m => m.resourceType === 'device_template')
      .map(m => ({
        resourceKey: m.marketResourceKey,
        localId: m.localId,
        name: m.localName || m.marketResourceKey
      })) ?? []

  const dashboards =
    resp.resourceMappings
      ?.filter(m => m.resourceType === 'dashboard')
      .map(m => ({
        resourceKey: m.marketResourceKey,
        localId: m.localId,
        name: m.localName || m.marketResourceKey
      })) ?? []

  const bindings =
    resp.bindingStatus?.map(b => ({
      bindingKey: b.bindingKey,
      displayName: b.bindingKey,
      dashboardKey: '',
      deviceId: b.localDeviceId || null,
      deviceName: null,
      required: b.required !== false
    })) ?? []

  return {
    installationId: resp.installationId,
    bundleKey: resp.bundleKey,
    bundleName: resp.bundleKey,
    version: resp.version,
    installedAt: installedAt || new Date().toISOString(),
    status: resp.status,
    bindingStatus: computeBindingStatus(bindings),
    deviceTemplates,
    dashboards,
    bindings
  }
}

/** 将后端预检报告转为展示项 */
export function mapPrecheckReportToResults(report: PublishDraftPrecheckReport): PrecheckResult[] {
  const results: PrecheckResult[] = []
  report.errors?.forEach(item => {
    results.push({ code: item.code, level: 'FAIL', message: item.message })
  })
  report.warnings?.forEach(item => {
    results.push({ code: item.code, level: 'WARN', message: item.message })
  })
  report.suggestions?.forEach(item => {
    results.push({ code: item.code, level: 'INFO', message: item.message })
  })
  if (report.passed && results.length === 0) {
    results.push({ code: 'PRECHECK_PASSED', level: 'PASS', message: '所有检查项均已通过' })
  }
  return results
}

// ========== API Functions ==========

/**
 * 发布 Bundle 到市场（单步：publish-draft 直接完成发布）
 * POST /device/market/bundles/publish-draft
 */
export async function createPublishDraft(params: PublishDraftRequest): Promise<{
  data: PublishDraftResponse | null
  error: MarketApiError | null
  precheckReport?: PublishDraftPrecheckReport
}> {
  try {
    const data = await request.post<PublishDraftResponse>('/device/market/bundles/publish-draft', params)
    return { data, error: null, precheckReport: data.precheckReport }
  } catch (err) {
    const error = parseMarketError(err)
    const body = (err as { response?: { data?: { data?: { precheckReport?: PublishDraftPrecheckReport } } } }).response
      ?.data
    const precheckReport = body?.data?.precheckReport
    if (precheckReport) {
      return { data: null, error, precheckReport }
    }
    return { data: null, error }
  }
}

/** @deprecated 后端无 confirm-publish 路由，发布已在 publish-draft 一步完成 */
export async function confirmPublish(_params: {
  draftId: string
  idempotentKey?: string
}): Promise<{ data: PublishedBundle | null; error: MarketApiError | null }> {
  return { data: null, error: NOT_IMPLEMENTED }
}

/** @deprecated 后端无 cancel-draft 路由 */
export async function cancelDraft(_draftId: string): Promise<{ data: null; error: MarketApiError | null }> {
  return { data: null, error: NOT_IMPLEMENTED }
}

export async function getBundleVersions(
  bundleKey: string,
  params?: { page?: number; pageSize?: number }
): Promise<{ data: PublishedBundle[] | null; error: MarketApiError | null }> {
  return marketApiCall(() =>
    request.get<PublishedBundle[]>(`/device/market/bundles/${encodeURIComponent(bundleKey)}/versions`, {
      params
    })
  )
}

/**
 * 从市场安装 Bundle
 * POST /device/market/bundles/install
 */
export async function installBundle(
  params: InstallBundleRequest
): Promise<{ data: InstallResult | null; error: MarketApiError | null }> {
  return marketApiCall(() =>
    request.post<InstallResult>('/device/market/bundles/install', {
      bundleKey: params.bundleKey,
      version: params.version,
      marketToken: params.marketToken,
      deviceBindings: params.deviceBindings,
      idempotencyKey: params.idempotencyKey || generateIdempotencyKey(),
      overwritePolicy: params.overwritePolicy
    })
  )
}

/** @deprecated 后端无 HEAD 版本检查路由 */
export async function checkBundleVersionExists(
  _bundleKey: string,
  _version: string
): Promise<{ exists: boolean; status?: string }> {
  return { exists: false, status: 'not_implemented' }
}

/**
 * 获取安装状态 / 详情
 * GET /device/market/bundles/install/:id
 */
export async function pollInstallationStatus(
  installationId: string
): Promise<{ data: { status: InstallResult['status']; progress?: number } | null; error: MarketApiError | null }> {
  const result = await getInstallationDetail(installationId)
  if (result.error || !result.data) {
    return { data: null, error: result.error }
  }
  return { data: { status: result.data.status }, error: null }
}

/**
 * 获取单个安装详情
 * GET /device/market/bundles/install/:id
 */
export async function getInstallationDetail(
  installationId: string
): Promise<{ data: InstalledBundle | null; error: MarketApiError | null }> {
  const result = await marketApiCall(() =>
    request.get<InstallResult>(`/device/market/bundles/install/${installationId}`)
  )
  if (!result.data) {
    return { data: null, error: result.error }
  }
  return { data: mapInstallResponseToInstalledBundle(result.data), error: null }
}

/**
 * 获取已安装的 Bundle 列表
 * GET /device/market/bundles/installations
 */
export async function getInstalledBundles(params?: {
  page?: number
  page_size?: number
  bundleKey?: string
  status?: string
}): Promise<{ data: { list: InstalledBundle[]; total: number } | null; error: MarketApiError | null }> {
  const result = await marketApiCall(() =>
    request.get<{
      data: Array<{
        id: string
        bundleKey: string
        bundleVersion: string
        status: InstallResult['status']
        createdAt: string
      }>
      total: number
      page: number
      pageSize: number
    }>('/device/market/bundles/installations', {
      params: {
        page: params?.page,
        pageSize: params?.page_size,
        bundleKey: params?.bundleKey,
        status: params?.status
      }
    })
  )

  if (!result.data) {
    return { data: null, error: result.error }
  }

  const list: InstalledBundle[] = (result.data.data || []).map(item => ({
    installationId: item.id,
    bundleKey: item.bundleKey,
    bundleName: item.bundleKey,
    version: item.bundleVersion,
    installedAt: item.createdAt,
    status: item.status,
    bindingStatus: 'UNBOUND',
    deviceTemplates: [],
    dashboards: [],
    bindings: []
  }))

  return { data: { list, total: result.data.total || 0 }, error: null }
}

/**
 * 更新安装的设备绑定（后端每次 PUT 只接受一条）
 * PUT /device/market/bundles/install/:id/bindings
 */
export async function updateInstallationBindings(
  installationId: string,
  bindings: Array<{ bindingKey: string; deviceId: string | null }>
): Promise<{ data: InstalledBundle | null; error: MarketApiError | null }> {
  const toUpdate = bindings.filter(b => b.deviceId)

  for (const binding of toUpdate) {
    const result = await marketApiCall(() =>
      request.put(`/device/market/bundles/install/${installationId}/bindings`, {
        bindingKey: binding.bindingKey,
        localDeviceId: binding.deviceId
      })
    )
    if (result.error) {
      return { data: null, error: result.error }
    }
  }

  return getInstallationDetail(installationId)
}

export async function retryInstallation(
  installationId: string
): Promise<{ data: InstallResult | null; error: MarketApiError | null }> {
  return marketApiCall(() => request.post<InstallResult>(`/device/market/bundles/install/${installationId}/retry`, {}))
}

export async function compensateInstallation(
  installationId: string
): Promise<{ data: null | { message: string }; error: MarketApiError | null }> {
  return marketApiCall(() =>
    request.post<{ message: string }>(`/device/market/bundles/install/${installationId}/compensate`, {})
  )
}

export async function browseMarketBundles(params?: {
  keyword?: string
  category?: string
  sort_by?: 'latest' | 'hottest'
  page?: number
  page_size?: number
}): Promise<{ data: MarketBundleListResult | null; error: MarketApiError | null }> {
  const result = await marketApiCall(() =>
    request.get<unknown>('/device/market/bundles', {
      params
    })
  )

  if (result.error) {
    return { data: null, error: result.error }
  }

  try {
    return { data: normalizeMarketBundleList(result.data), error: null }
  } catch (err) {
    return { data: null, error: parseMarketError(err) }
  }
}

export async function getMarketBundleDetail(
  bundleKey: string,
  params?: { version?: string }
): Promise<{ data: MarketBundleDetail | null; error: MarketApiError | null }> {
  return marketApiCall(() =>
    request.get<MarketBundleDetail>(`/device/market/bundles/${encodeURIComponent(bundleKey)}`, {
      params,
      silentError: true
    } as any)
  )
}

export async function getBundlePrecheckInfo(
  bundleKey: string,
  params?: { version?: string }
): Promise<{
  data: {
    warnings: string[]
    requiredPlugins: Array<{ key: string; name: string; installed: boolean }>
    bindingPreview: DashboardBindingSpec[]
  } | null
  error: MarketApiError | null
}> {
  return marketApiCall(() =>
    request.get(`/device/market/bundles/${encodeURIComponent(bundleKey)}/precheck`, {
      params
    })
  )
}

// ========== Error Handling ==========

const ERROR_CODE_MESSAGES: Record<string, { zh: string; en: string; isBlocking: boolean }> = {
  NOT_IMPLEMENTED: {
    zh: '该功能尚未接通后端',
    en: 'This feature is not yet available',
    isBlocking: true
  },
  BUNDLE_SCHEMA_INVALID: {
    zh: 'Bundle 格式不符合规范，请检查输入内容',
    en: 'Bundle format does not comply with specification',
    isBlocking: true
  },
  FIELD_BINDING_INVALID: {
    zh: '看板字段绑定无效，该字段在物模型中不存在',
    en: 'Dashboard field binding is invalid - field not found in model',
    isBlocking: true
  },
  SECRET_DETECTED: {
    zh: '检测到敏感信息，请移除后再试',
    en: 'Sensitive information detected, please remove before retry',
    isBlocking: true
  },
  BUNDLE_VERSION_CONFLICT: {
    zh: '相同版本已存在但内容不同，请使用新版本号',
    en: 'Version exists with different content, please use a new version',
    isBlocking: true
  },
  RESOURCE_FORBIDDEN: {
    zh: '您没有权限访问该资源',
    en: 'You do not have permission to access this resource',
    isBlocking: true
  },
  PLUGIN_INCOMPATIBLE: {
    zh: '缺少必需的插件或插件版本不足',
    en: 'Required plugin missing or version insufficient',
    isBlocking: true
  },
  INSTALL_NOT_IDEMPOTENT: {
    zh: '相同的安装请求已存在，请检查您的安装记录',
    en: 'Identical installation request already exists',
    isBlocking: true
  },
  BINDING_REQUIRED: {
    zh: '必须绑定至少一个设备才能使用此看板',
    en: 'At least one device must be bound to use this dashboard',
    isBlocking: true
  },
  COMPENSATION_REQUIRED: {
    zh: '之前的安装操作未完成，建议重试或回滚',
    en: 'Previous installation incomplete, recommend retry or rollback',
    isBlocking: false
  },
  MARKET_SESSION_EXPIRED: {
    zh: '资源中心登录已过期，请重新登录',
    en: 'Market session expired, please login again',
    isBlocking: true
  },
  UNAUTHORIZED: {
    zh: '未授权，请先登录资源中心',
    en: 'Unauthorized, please login to the resource center first',
    isBlocking: true
  },
  RATE_LIMITED: {
    zh: '请求过于频繁，请稍后再试',
    en: 'Too many requests, please try again later',
    isBlocking: false
  }
}

export function getErrorDisplayMessage(
  error: MarketApiError | null,
  locale: 'zh' | 'en' = 'zh'
): { title: string; description: string; isBlocking: boolean } {
  if (!error) {
    return { title: '', description: '', isBlocking: true }
  }

  const errorInfo = ERROR_CODE_MESSAGES[error.code]
  if (errorInfo) {
    return {
      title: error.code,
      description: errorInfo[locale],
      isBlocking: errorInfo.isBlocking
    }
  }

  if (error.httpStatus === 401) {
    return {
      title: 'UNAUTHORIZED',
      description: locale === 'zh' ? '未授权，请先登录资源中心' : 'Unauthorized, please login to the resource center first',
      isBlocking: true
    }
  }
  if (error.httpStatus === 404) {
    return {
      title: 'NOT_FOUND',
      description: locale === 'zh' ? '资源不存在' : 'Resource not found',
      isBlocking: true
    }
  }
  if (error.httpStatus === 429) {
    return {
      title: 'RATE_LIMITED',
      description: locale === 'zh' ? '请求过于频繁，请稍后再试' : 'Too many requests, please try again later',
      isBlocking: false
    }
  }

  return {
    title: error.code || 'ERROR',
    description: error.message,
    isBlocking: true
  }
}

export function isBlockingResult(result: PrecheckResult): boolean {
  return result.level === 'FAIL'
}

export function canPublish(precheckResults: PrecheckResult[]): boolean {
  return precheckResults.every(r => r.level !== 'FAIL')
}

export function categorizePrecheckResults(results: PrecheckResult[]): {
  errors: PrecheckResult[]
  warnings: PrecheckResult[]
  passes: PrecheckResult[]
} {
  return {
    errors: results.filter(r => r.level === 'FAIL'),
    warnings: results.filter(r => r.level === 'WARN'),
    passes: results.filter(r => r.level === 'PASS' || r.level === 'INFO')
  }
}
