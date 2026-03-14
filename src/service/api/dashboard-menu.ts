import { request } from '../request'

export interface DashboardMenuConfig {
  dashboard_id: string
  menu_name: string
  sort: number
  enabled: boolean
  parent_code: string
}

export function fetchDashboardMenuConfig(dashboardId: string) {
  return request.get<DashboardMenuConfig | null>(`/dashboard-menu/${dashboardId}`)
}

export function saveDashboardMenuConfig(
  dashboardId: string,
  payload: {
    menu_name: string
    dashboard_name?: string
    sort?: number
    enabled?: boolean
  }
) {
  return request.put<DashboardMenuConfig | null>(`/dashboard-menu/${dashboardId}`, payload)
}

export function deleteDashboardMenuConfig(dashboardId: string) {
  return request.delete(`/dashboard-menu/${dashboardId}`)
}
