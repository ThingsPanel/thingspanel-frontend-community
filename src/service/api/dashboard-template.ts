import { request } from '../request'
import { getThingsVisToken } from '@/utils/thingsvis'

export type LocalDashboardTemplateStatus = 'READY' | 'MISSING_DEVICE' | 'DISABLED'

export interface DashboardTemplateBinding {
  bindingKey: string
  displayName: string
  description?: string
  required: boolean
  localDeviceTemplateId: string
  localDeviceTemplateName: string
}

export interface LocalDashboardTemplate {
  id: string
  name: string
  description?: string
  version: string
  source: 'MARKET' | 'LOCAL'
  status: LocalDashboardTemplateStatus
  bundleKey?: string
  bundleVersion?: string
  dashboardResourceKey: string
  thumbnail?: string
  bindings: DashboardTemplateBinding[]
  compatibleDeviceCount: number
  instanceCount: number
  downloadedAt: string
  updatedAt: string
}

export interface CompatibleDevice {
  id: string
  name: string
  deviceNumber?: string
  deviceTemplateId: string
  deviceTemplateName: string
  online: boolean
}

export interface CompatibleDeviceBinding {
  bindingKey: string
  displayName: string
  required: boolean
  localDeviceTemplateId: string
  localDeviceTemplateName: string
  devices: CompatibleDevice[]
}

export interface DashboardTemplateInstance {
  dashboardId: string
  projectId?: string
  name: string
}

export interface DashboardTemplateApiError {
  code: string
  message: string
  details?: unknown
  httpStatus?: number
}

type ApiResult<T> = Promise<{ data: T | null; error: DashboardTemplateApiError | null }>

async function callApi<T>(fn: () => Promise<{ data: T | null; error: unknown | null }>): ApiResult<T> {
  try {
    const result = await fn()
    if (!result.error) return { data: result.data, error: null }

    const error = result.error as {
      code?: string | number
      message?: string
      data?: unknown
      status?: number
    }
    return {
      data: null,
      error: {
        code: String(error.code ?? 'REQUEST_FAILED'),
        message: error.message || '请求失败',
        details: error.data,
        httpStatus: error.status
      }
    }
  } catch (error) {
    return {
      data: null,
      error: {
        code: 'REQUEST_FAILED',
        message: error instanceof Error ? error.message : '请求失败'
      }
    }
  }
}

/**
 * 下载市场 Bundle 到本地模板库。该操作只安装模板资源，不创建看板实例，
 * 因此不接受真实设备绑定。
 */
export function downloadMarketDashboardTemplate(params: {
  bundleKey: string
  version: string
  marketToken: string
}): ApiResult<{ templateIds: string[]; downloaded: number; reused: number }> {
  return callApi(() =>
    request.post('/device/market/bundles/download', {
      bundleKey: params.bundleKey,
      version: params.version,
      marketToken: params.marketToken
    })
  )
}

export function getLocalDashboardTemplates(params: {
  page: number
  pageSize: number
  keyword?: string
  source?: LocalDashboardTemplate['source']
  status?: LocalDashboardTemplateStatus
}): ApiResult<{ list: LocalDashboardTemplate[]; total: number }> {
  return callApi(() =>
    request.get('/device/dashboard-templates', {
      params
    })
  )
}

export function getDashboardTemplateCompatibleDevices(
  templateId: string
): ApiResult<{ bindings: CompatibleDeviceBinding[] }> {
  return callApi(() => request.get(`/device/dashboard-templates/${encodeURIComponent(templateId)}/compatible-devices`))
}

export function createDashboardFromTemplate(
  templateId: string,
  params: {
    name: string
    deviceBindings: Array<{ bindingKey: string; localDeviceId: string }>
  }
): ApiResult<DashboardTemplateInstance> {
  return callApi(async () => {
    const token = await getThingsVisToken()
    if (!token) {
      throw new Error('ThingsVis 登录已失效，请刷新页面后重试')
    }
    return request.post(`/device/dashboard-templates/${encodeURIComponent(templateId)}/instances`, params, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
  })
}
