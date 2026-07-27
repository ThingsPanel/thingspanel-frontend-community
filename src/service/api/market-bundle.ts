/**
 * Market Bundle API - 市场解决方案包发布与安装
 * 契约版本: v1
 */

import axios, { AxiosError } from 'axios'
import { useMarketAuth } from '~/src/views/device/config/composables/use-market-auth'

// ========== Types ==========

/** 资源来源 - 前端只需要传递本地资源ID，由后端负责导出和规范化 */
export interface BundleSource {
  deviceTemplateIds: string[]
  dashboardIds: string[]
}

/** Bundle 元数据 */
export interface BundleMetadata {
  name: string
  category: string
  description?: string
  tags?: string[]
  author?: string
  contact?: string
}

/** 预检项结果 */
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

/** Bundle 预览信息（后端返回，用于展示给用户确认） */
export interface BundlePreview {
  bundleKey: string
  version: string
  deviceTemplateCount: number
  dashboardCount: number
  contentSize: number
  containsSecrets: boolean
  compatibility: {
    minPlatformVersion?: string
    requiredPlugins?: Array<{ key: string; name: string; version?: string }>
  }
}

/** 发布草稿响应 */
export interface PublishDraftResponse {
  draftId: string
  status: 'READY_TO_PUBLISH' | 'HAS_ERRORS' | 'HAS_WARNINGS'
  bundlePreview: BundlePreview
  checks: PrecheckResult[]
  warnings: PrecheckResult[]
  errors: PrecheckResult[]
  idempotentKey?: string
}

/** 发布的 Bundle 状态 */
export interface PublishedBundle {
  bundleKey: string
  version: string
  contentHash: string
  status: 'PENDING_REVIEW' | 'PUBLISHED' | 'REJECTED' | 'UNPUBLISHED'
  publishedAt: string | null
  reviewedAt?: string | null
  reviewComment?: string
}

/** 安装请求 */
export interface InstallRequest {
  bundleKey: string
  version: string
  dashboardSelections?: Array<{
    dashboardKey: string
    deviceBindings: Array<{ bindingKey: string; deviceId: string }>
  }>
}

/** 安装结果 */
export interface InstallResult {
  installationId: string
  status:
    | 'DOWNLOADED'
    | 'VERIFIED'
    | 'MODELS_INSTALLED'
    | 'DASHBOARDS_CREATED'
    | 'WAITING_FOR_BINDINGS'
    | 'COMPLETED'
    | 'FAILED'
    | 'COMPENSATION_REQUIRED'
  resourceMap?: {
    deviceTemplates: Array<{ resourceKey: string; localId: string }>
    dashboards: Array<{ resourceKey: string; localId: string }>
  }
  bindingStatus?: 'BOUND' | 'UNBOUND' | 'PARTIAL'
  warnings?: string[]
  errors?: string[]
}

// ========== API Client ==========

const MARKET_API_BASE = '/device/market'

/** 创建专用的 axios 实例 */
const marketRequest = axios.create({
  baseURL: MARKET_API_BASE,
  timeout: 60000
})

/** 生成幂等键 */
function generateIdempotencyKey(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
}

// ========== API Functions ==========

/**
 * 创建发布草稿并获取预检报告
 * POST /device/market/bundles/publish-draft
 */
export async function createPublishDraft(params: {
  contractVersion: string
  bundleKind: string
  bundleKey: string
  version: string
  metadata: BundleMetadata
  source: BundleSource
}): Promise<{ data: PublishDraftResponse | null; error: MarketApiError | null }> {
  const idempotencyKey = generateIdempotencyKey()

  try {
    const response = await marketRequest.post<PublishDraftResponse>(
      '/bundles/publish-draft',
      {
        contractVersion: params.contractVersion,
        bundleKind: params.bundleKind,
        bundleKey: params.bundleKey,
        version: params.version,
        metadata: params.metadata,
        source: params.source
      },
      {
        headers: {
          'Idempotency-Key': idempotencyKey,
          'Content-Type': 'application/json'
        }
      }
    )
    return { data: response.data, error: null }
  } catch (err) {
    return handleApiError(err)
  }
}

/**
 * 确认发布 Bundle
 * POST /device/market/bundles/publish
 */
export async function confirmPublish(params: {
  draftId: string
  idempotentKey?: string
}): Promise<{ data: PublishedBundle | null; error: MarketApiError | null }> {
  const idempotencyKey = params.idempotentKey || generateIdempotencyKey()

  try {
    const response = await marketRequest.post<PublishedBundle>(
      '/bundles/publish',
      { draftId: params.draftId },
      {
        headers: {
          'Idempotency-Key': idempotencyKey
        }
      }
    )
    return { data: response.data, error: null }
  } catch (err) {
    return handleApiError(err)
  }
}

/**
 * 取消发布草稿
 * DELETE /device/market/bundles/drafts/:draftId
 */
export async function cancelDraft(draftId: string): Promise<{ data: null; error: MarketApiError | null }> {
  try {
    await marketRequest.delete(`/bundles/drafts/${draftId}`)
    return { data: null, error: null }
  } catch (err) {
    return handleApiError(err)
  }
}

/**
 * 获取已发布的 Bundle 版本列表
 * GET /device/market/bundles/:bundleKey/versions
 */
export async function getBundleVersions(
  bundleKey: string,
  params?: { page?: number; pageSize?: number }
): Promise<{ data: PublishedBundle[] | null; error: MarketApiError | null }> {
  try {
    const response = await marketRequest.get<{ data: PublishedBundle[] }>(`/bundles/${bundleKey}/versions`, {
      params
    })
    return { data: response.data.data, error: null }
  } catch (err) {
    return handleApiError(err)
  }
}

/**
 * 从市场安装 Bundle
 * POST /device/market/bundles/install
 */
export async function installBundle(params: {
  bundleKey: string
  version?: string
  dashboardSelections?: InstallRequest['dashboardSelections']
}): Promise<{ data: InstallResult | null; error: MarketApiError | null }> {
  const idempotencyKey = generateIdempotencyKey()

  try {
    const response = await marketRequest.post<InstallResult>(
      '/bundles/install',
      {
        bundleKey: params.bundleKey,
        version: params.version,
        dashboardSelections: params.dashboardSelections
      },
      {
        headers: {
          'Idempotency-Key': idempotencyKey
        }
      }
    )
    return { data: response.data, error: null }
  } catch (err) {
    return handleApiError(err)
  }
}

/**
 * 检查 Bundle 版本是否存在
 * HEAD /device/market/bundles/:bundleKey/versions/:version
 */
export async function checkBundleVersionExists(
  bundleKey: string,
  version: string
): Promise<{ exists: boolean; status?: string }> {
  try {
    await marketRequest.head(`/bundles/${bundleKey}/versions/${version}`)
    return { exists: true }
  } catch (err) {
    if ((err as AxiosError)?.response?.status === 404) {
      return { exists: false }
    }
    return { exists: false, status: 'unknown' }
  }
}

// ========== Error Handling ==========

/** 市场 API 错误类型 */
export interface MarketApiError {
  code: string
  message: string
  details?: Record<string, unknown>
  httpStatus: number
}

/** 错误码到用户可读消息的映射 */
const ERROR_CODE_MESSAGES: Record<string, { zh: string; en: string; isBlocking: boolean }> = {
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
    zh: '市场登录已过期，请重新登录',
    en: 'Market session expired, please login again',
    isBlocking: true
  },
  UNAUTHORIZED: {
    zh: '未授权，请先登录市场',
    en: 'Unauthorized, please login to market first',
    isBlocking: true
  },
  RATE_LIMITED: {
    zh: '请求过于频繁，请稍后再试',
    en: 'Too many requests, please try again later',
    isBlocking: false
  }
}

/** 解析 API 错误 */
function handleApiError(err: unknown): { data: null; error: MarketApiError | null } {
  const axiosError = err as AxiosError<{
    error?: string
    message?: string
    code?: string
    details?: Record<string, unknown>
  }>

  const response = axiosError.response
  const status = response?.status || 500

  let code = 'UNKNOWN_ERROR'
  let message = 'An unknown error occurred'
  let details: Record<string, unknown> | undefined

  if (status === 401) {
    // 市场会话过期
    const { clearToken } = useMarketAuth()
    clearToken()
    code = 'MARKET_SESSION_EXPIRED'
  } else if (response?.data) {
    const data = response.data
    code = data.code || `HTTP_${status}`
    message = data.message || data.error || `Request failed with status ${status}`
    details = data.details
  } else if (axiosError.message) {
    message = axiosError.message
  }

  return {
    data: null,
    error: {
      code,
      message,
      details,
      httpStatus: status
    }
  }
}

/**
 * 获取错误的用户可读信息
 */
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

  // 尝试从 HTTP 状态码推断
  if (error.httpStatus === 401) {
    return {
      title: 'UNAUTHORIZED',
      description: locale === 'zh' ? '未授权，请先登录市场' : 'Unauthorized, please login to market first',
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

/**
 * 判断预检结果是否为阻断错误
 */
export function isBlockingResult(result: PrecheckResult): boolean {
  return result.level === 'FAIL'
}

/**
 * 判断是否可以继续发布
 */
export function canPublish(precheckResults: PrecheckResult[]): boolean {
  return precheckResults.every(r => r.level !== 'FAIL')
}

/**
 * 分类预检结果
 */
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

// ========== Browse & Install APIs ==========

/** 市场 Bundle 列表项 */
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

/** Bundle 详情 */
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

/**
 * 浏览市场 Bundle 列表
 * GET /api/market/bundles
 */
export async function browseMarketBundles(params?: {
  keyword?: string
  category?: string
  sort_by?: 'latest' | 'hottest' | 'rating'
  page?: number
  page_size?: number
}): Promise<{ data: { list: MarketBundleListItem[]; total: number } | null; error: MarketApiError | null }> {
  try {
    const response = await marketRequest.get<{ data: { list: MarketBundleListItem[]; total: number } }>('/bundles', {
      params
    })
    return { data: response.data.data, error: null }
  } catch (err) {
    return handleApiError(err)
  }
}

/**
 * 获取 Bundle 详情
 * GET /api/market/bundles/:bundleKey
 */
export async function getMarketBundleDetail(
  bundleKey: string,
  params?: { version?: string }
): Promise<{ data: MarketBundleDetail | null; error: MarketApiError | null }> {
  try {
    const response = await marketRequest.get<MarketBundleDetail>(`/bundles/${bundleKey}`, { params })
    return { data: response.data, error: null }
  } catch (err) {
    return handleApiError(err)
  }
}

/** 已安装的 Bundle 记录 */
export interface InstalledBundle {
  installationId: string
  bundleKey: string
  bundleName: string
  version: string
  installedAt: string
  status:
    | 'DOWNLOADED'
    | 'VERIFIED'
    | 'MODELS_INSTALLED'
    | 'DASHBOARDS_CREATED'
    | 'WAITING_FOR_BINDINGS'
    | 'COMPLETED'
    | 'FAILED'
    | 'COMPENSATION_REQUIRED'
  bindingStatus: 'BOUND' | 'UNBOUND' | 'PARTIAL'
  deviceTemplates: Array<{
    resourceKey: string
    localId: string
    name: string
  }>
  dashboards: Array<{
    resourceKey: string
    localId: string
    name: string
  }>
  bindings: Array<{
    bindingKey: string
    displayName: string
    dashboardKey: string
    deviceId: string | null
    deviceName: string | null
    required: boolean
  }>
}

/**
 * 获取已安装的 Bundle 列表
 * GET /device/market/bundles/installations
 */
export async function getInstalledBundles(params?: {
  page?: number
  page_size?: number
}): Promise<{ data: { list: InstalledBundle[]; total: number } | null; error: MarketApiError | null }> {
  try {
    const response = await marketRequest.get<{ data: { list: InstalledBundle[]; total: number } }>(
      '/bundles/installations',
      { params }
    )
    return { data: response.data.data, error: null }
  } catch (err) {
    return handleApiError(err)
  }
}

/**
 * 获取单个安装详情
 * GET /device/market/bundles/installations/:installationId
 */
export async function getInstallationDetail(
  installationId: string
): Promise<{ data: InstalledBundle | null; error: MarketApiError | null }> {
  try {
    const response = await marketRequest.get<InstalledBundle>(`/bundles/installations/${installationId}`)
    return { data: response.data, error: null }
  } catch (err) {
    return handleApiError(err)
  }
}

/**
 * 更新安装的设备绑定
 * POST /device/market/bundles/installations/:installationId/bindings
 */
export async function updateInstallationBindings(
  installationId: string,
  bindings: Array<{ bindingKey: string; deviceId: string | null }>
): Promise<{ data: InstalledBundle | null; error: MarketApiError | null }> {
  const idempotencyKey = generateIdempotencyKey()

  try {
    const response = await marketRequest.post<InstalledBundle>(
      `/bundles/installations/${installationId}/bindings`,
      { bindings },
      {
        headers: {
          'Idempotency-Key': idempotencyKey
        }
      }
    )
    return { data: response.data, error: null }
  } catch (err) {
    return handleApiError(err)
  }
}

/**
 * 轮询安装状态
 * GET /device/market/bundles/installations/:installationId/status
 */
export async function pollInstallationStatus(
  installationId: string
): Promise<{ data: { status: InstallResult['status']; progress?: number } | null; error: MarketApiError | null }> {
  try {
    const response = await marketRequest.get<{ status: InstallResult['status']; progress?: number }>(
      `/bundles/installations/${installationId}/status`
    )
    return { data: response.data, error: null }
  } catch (err) {
    return handleApiError(err)
  }
}

/**
 * 卸载已安装的 Bundle
 * DELETE /device/market/bundles/installations/:installationId
 */
export async function uninstallBundle(installationId: string): Promise<{ data: null; error: MarketApiError | null }> {
  try {
    await marketRequest.delete(`/bundles/installations/${installationId}`)
    return { data: null, error: null }
  } catch (err) {
    return handleApiError(err)
  }
}

/**
 * 获取安装前的预检信息（查看 Bundle 详情时）
 * GET /api/market/bundles/:bundleKey/precheck
 */
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
  try {
    const response = await marketRequest.get<{
      warnings: string[]
      requiredPlugins: Array<{ key: string; name: string; installed: boolean }>
      bindingPreview: DashboardBindingSpec[]
    }>(`/bundles/${bundleKey}/precheck`, { params })
    return { data: response.data, error: null }
  } catch (err) {
    return handleApiError(err)
  }
}
