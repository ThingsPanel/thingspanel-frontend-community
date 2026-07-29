import { request } from '../request'

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

export function analyzeDashboardBundle(dashboardId: string) {
  return request.post<AnalyzeDashboardBundleResponse>('/device/market/dashboard-bundles/analyze', {
    dashboardId
  })
}

export function publishDashboardBundle(payload: PublishDashboardBundleRequest) {
  return request.post<PublishDashboardBundleResponse>('/device/market/dashboard-bundles', payload)
}
