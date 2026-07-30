import { request } from '../request'
import { getThingsVisToken } from '@/utils/thingsvis'

export interface DashboardBundleThingModelField {
  kind: 'telemetry' | 'attribute' | 'command' | 'event'
  identifier: string
  name: string
  dataType: string
  unit?: string
  description?: string
  accessMode?: string
}

export interface DashboardBundleDeviceReference {
  sourceDeviceId: string
  sourceDeviceName?: string
  deviceTemplateId: string
  suggestedBindingKey: string
  requiredFields: DashboardBundleThingModelField[]
}

export interface AnalyzeDashboardBundleResponse {
  dashboardId: string
  dashboardName: string
  deviceReferences: DashboardBundleDeviceReference[]
}

export interface DashboardBundleRole {
  sourceDeviceId: string
  bindingKey: string
  displayName: string
}

export interface PublishDashboardBundleRequest {
  dashboardId: string
  bundleKey: string
  version: string
  name: string
  category: string
  description?: string
  coverAssetKey?: string
  marketToken: string
  deviceRoles: DashboardBundleRole[]
}

export interface PublishDashboardBundleResponse {
  bundleKey: string
  version: string
  contentHash: string
  status: 'pending_review' | string
}

async function getThingsVisAuthorization() {
  const token = await getThingsVisToken()
  if (!token) {
    throw new Error('ThingsVis 登录已失效，请刷新页面后重试')
  }
  return `Bearer ${token}`
}

export async function analyzeDashboardBundle(dashboardId: string) {
  const authorization = await getThingsVisAuthorization()
  return request.post<AnalyzeDashboardBundleResponse>(
    '/device/market/dashboard-bundles/analyze',
    { dashboardId },
    { headers: { Authorization: authorization } }
  )
}

export async function publishDashboardBundle(payload: PublishDashboardBundleRequest) {
  const authorization = await getThingsVisAuthorization()
  return request.post<PublishDashboardBundleResponse>('/device/market/dashboard-bundles', payload, {
    headers: { Authorization: authorization }
  })
}
