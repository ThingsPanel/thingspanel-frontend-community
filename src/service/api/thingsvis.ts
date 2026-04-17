/**
 * ThingsVis API 封装
 * 用于集成 ThingsVis 可视化编辑器
 * 包含 SSO 认证功能
 */

import axios from 'axios'
import { getThingsVisToken, clearThingsVisToken } from '@/utils/thingsvis'
import { THINGSVIS_API_PROXY_PATH } from '@/utils/thingsvis/constants'

// ========== ThingsVis 专用 Axios 实例 ==========

const thingsVisRequest = axios.create({
  baseURL: THINGSVIS_API_PROXY_PATH,
  timeout: 30000
})

// 请求拦截器 - 添加 ThingsVis Bearer Token
thingsVisRequest.interceptors.request.use(
  async config => {
    // 获取或刷新 ThingsVis token
    const token = await getThingsVisToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  error => Promise.reject(error)
)

// 响应拦截器 - 处理 401 错误时自动刷新 token（仅重试一次，避免死循环）
thingsVisRequest.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config
    // 仅在首次 401 时重试，避免无限循环
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      // Clear cached token and retry with a fresh one
      clearThingsVisToken()
      const token = await getThingsVisToken()
      if (token) {
        originalRequest.headers.Authorization = `Bearer ${token}`
        return thingsVisRequest(originalRequest)
      }
    }
    return Promise.reject(error)
  }
)

// ========== TypeScript 类型定义 ==========

/** Project 项目 */
export interface ThingsVisProject {
  id: string
  name: string
  description: string | null
  thumbnail: string | null
  tenantId: string
  createdById: string
  createdAt: string
  updatedAt: string
  _count?: {
    dashboards: number
  }
}

export interface ProjectListItem {
  id: string
  name: string
  description: string | null
  thumbnail: string | null
  tenantId?: string
  createdAt: string
  updatedAt: string
  _count?: {
    dashboards: number
  }
}

export interface CreateProjectData {
  name: string
  description?: string
}

export interface UpdateProjectData {
  name?: string
  description?: string
  thumbnail?: string
}

export interface ProjectListResponse {
  data: ProjectListItem[]
  meta: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

/** Dashboard 仪表板 */
export interface ThingsVisDashboard {
  id: string
  name: string
  thumbnail: string | null
  version: number
  canvasConfig: {
    mode: string
    width: number
    height: number
    background: string | Record<string, unknown> | null
  }
  nodes: unknown[]
  dataSources: unknown[]
  isPublished: boolean
  publishedAt: string | null
  shareToken: string | null
  projectId: string
  createdById: string
  createdAt: string
  updatedAt: string
}

export interface DashboardListItem {
  id: string
  name: string
  thumbnail: string | null
  version: number
  isPublished: boolean
  homeFlag: boolean
  projectId: string
  createdAt: string
  updatedAt: string
  project?: {
    id: string
    name: string
  }
  createdBy?: {
    id: string
    name: string
  }
}

export interface CreateDashboardData {
  name: string
  projectId: string
  canvasConfig?: {
    mode?: string
    width?: number
    height?: number
    background?: string | Record<string, unknown>
  }
}

export interface UpdateDashboardData {
  name?: string
  thumbnail?: string | null
  canvasConfig?: unknown
  nodes?: unknown[]
  dataSources?: unknown[]
  variables?: unknown[]
}

export interface DashboardListResponse {
  data: DashboardListItem[]
  meta: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// ========== 响应包装类型 ==========

interface ThingsVisResponse<T> {
  data: T | null
  error: { message: string; status: number } | null
}

async function wrapRequest<T>(request: Promise<{ data: T }>): Promise<ThingsVisResponse<T>> {
  try {
    const response = await request
    return { data: response.data, error: null }
  } catch (error: unknown) {
    const err = error as {
      response?: { status: number; data?: { error?: unknown; message?: unknown; details?: unknown } }
      message: string
    }
    const responseData = err.response?.data
    const detailText =
      typeof responseData?.error === 'string'
        ? responseData.error
        : typeof responseData?.message === 'string'
          ? responseData.message
          : err.message || 'Unknown error'

    return {
      data: null,
      error: {
        message: detailText,
        status: err.response?.status || 500
      }
    }
  }
}

// ========== Project API ==========

/**
 * 获取当前租户的项目列表
 */
export function getThingsVisProjects(params?: { page?: number; limit?: number }) {
  return wrapRequest<ProjectListResponse>(thingsVisRequest.get('/projects', { params }))
}

/**
 * 获取项目详情
 */
export function getThingsVisProject(id: string) {
  return wrapRequest<ThingsVisProject>(thingsVisRequest.get(`/projects/${id}`))
}

/**
 * 创建项目
 */
export function createThingsVisProject(data: CreateProjectData) {
  return wrapRequest<ThingsVisProject>(thingsVisRequest.post('/projects', data))
}

/**
 * 更新项目
 */
export function updateThingsVisProject(id: string, data: UpdateProjectData) {
  return wrapRequest<ThingsVisProject>(thingsVisRequest.put(`/projects/${id}`, data))
}

/**
 * 删除项目
 */
export function deleteThingsVisProject(id: string) {
  return wrapRequest<void>(thingsVisRequest.delete(`/projects/${id}`))
}

// ========== Dashboard API ==========

/**
 * 获取 Dashboard 列表
 * @param params.projectId - 项目ID,必填
 */
export function getThingsVisDashboards(params: { projectId: string; page?: number; limit?: number }) {
  return wrapRequest<DashboardListResponse>(thingsVisRequest.get('/dashboards', { params }))
}

/**
 * 获取 Dashboard 详情
 */
export function getThingsVisDashboard(id: string) {
  return wrapRequest<ThingsVisDashboard>(thingsVisRequest.get(`/dashboards/${id}`))
}

/**
 * 获取 Dashboard 缩略图
 */
export function getThingsVisDashboardThumbnail(id: string) {
  return wrapRequest<{ thumbnail: string | null }>(thingsVisRequest.get(`/dashboards/${id}/thumbnail`))
}

/**
 * 创建 Dashboard
 */
export function createThingsVisDashboard(data: CreateDashboardData) {
  return wrapRequest<ThingsVisDashboard>(thingsVisRequest.post('/dashboards', data))
}

/**
 * 更新 Dashboard
 */
export function updateThingsVisDashboard(id: string, data: UpdateDashboardData) {
  return wrapRequest<ThingsVisDashboard>(thingsVisRequest.put(`/dashboards/${id}`, data))
}

/**
 * 删除 Dashboard
 */
export function deleteThingsVisDashboard(id: string) {
  return wrapRequest<void>(thingsVisRequest.delete(`/dashboards/${id}`))
}

/**
 * 发布 Dashboard
 */
export function publishThingsVisDashboard(id: string) {
  return wrapRequest<ThingsVisDashboard>(thingsVisRequest.post(`/dashboards/${id}/publish`))
}

/**
 * 复制 Dashboard
 */
export function duplicateThingsVisDashboard(id: string) {
  return wrapRequest<ThingsVisDashboard>(thingsVisRequest.post(`/dashboards/${id}/duplicate`))
}

/**
 * 设为首页
 */
export function setHomeThingsVisDashboard(id: string) {
  return wrapRequest<{ id: string; homeFlag: boolean; message: string }>(
    thingsVisRequest.post(`/dashboards/${id}/set-homepage`)
  )
}

/**
 * 取消首页
 */
export function unsetHomeThingsVisDashboard(id: string) {
  return wrapRequest<{ id: string; homeFlag: boolean; message: string }>(
    thingsVisRequest.delete(`/dashboards/${id}/set-homepage`)
  )
}

/**
 * 获取设为首页的仪表盘
 */
export interface ThingsVisHomeDashboard {
  id: string
  name: string
  canvasConfig: any
  nodes: any[]
  dataSources: any[]
  isPublished: boolean
  shareToken?: string
  project?: { id: string; name: string }
}

export function getThingsVisHomeDashboard() {
  return wrapRequest<{ data: ThingsVisHomeDashboard | null }>(thingsVisRequest.get('/dashboards/home'))
}
