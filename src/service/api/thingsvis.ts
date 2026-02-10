/**
 * ThingsVis API 封装
 * 用于集成 ThingsVis 可视化编辑器
 * 包含 SSO 认证功能
 */

import axios from 'axios'
import { localStg } from '@/utils/storage'

// ========== ThingsVis 专用 Axios 实例 ==========

const thingsVisRequest = axios.create({
  baseURL: '/thingsvis-api',
  timeout: 30000
})

// 请求拦截器 - 添加 ThingsVis Bearer Token
thingsVisRequest.interceptors.request.use(
  async (config) => {
    // 获取或刷新 ThingsVis token
    const token = await getThingsVisToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// 响应拦截器 - 处理 401 错误时自动刷新 token（仅重试一次，避免死循环）
thingsVisRequest.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    // 仅在首次 401 时重试，避免无限循环
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      // 清除 token 并重新获取
      localStg.remove('thingsVisToken')
      localStg.remove('thingsVisTokenExpiry')
      // 重试请求
      const token = await getThingsVisToken()
      if (token) {
        originalRequest.headers.Authorization = `Bearer ${token}`
        return thingsVisRequest(originalRequest)
      }
    }
    return Promise.reject(error)
  }
)

// ========== SSO Token 管理 ==========

interface SSOResponse {
  accessToken: string
  refreshToken: string
  expiresIn: number
  user: {
    id: string
    email: string
    name: string
    role: string
    tenantId: string
  }
}

/**
 * 获取 ThingsVis Token
 * 如果已有有效 token，直接返回
 * 否则通过 SSO 交换获取新 token
 */
async function getThingsVisToken(): Promise<string | null> {
  // 检查现有 token 是否有效
  const existingToken = localStg.get('thingsVisToken') as string | null
  const expiry = localStg.get('thingsVisTokenExpiry') as number | null

  if (existingToken && expiry && Date.now() < expiry) {
    return existingToken
  }

  // 需要重新获取 token
  try {
    const token = await exchangeSSOToken()
    return token
  } catch (error) {
    console.error('[ThingsVis] SSO token exchange failed:', error)
    return null
  }
}

/**
 * 通过 SSO 交换获取 ThingsVis Token
 */
async function exchangeSSOToken(): Promise<string | null> {
  // 获取 ThingsPanel 的用户信息和 token
  const tpToken = localStg.get('token') as string | null
  const userInfoStr = localStg.get('userInfo') as string | null

  if (!tpToken || !userInfoStr) {
    console.warn('[ThingsVis] No ThingsPanel token or user info found')
    return null
  }

  let userInfo
  try {
    userInfo = typeof userInfoStr === 'string' ? JSON.parse(userInfoStr) : userInfoStr
  } catch {
    console.error('[ThingsVis] Failed to parse user info')
    return null
  }

  // 调用 ThingsVis SSO 接口
  const response = await axios.post<SSOResponse>('/thingsvis-api/auth/sso', {
    platform: 'thingspanel',
    platformToken: tpToken,
    userInfo: {
      id: userInfo.userId || userInfo.id,
      email: userInfo.email || `user_${userInfo.userId}@thingspanel.local`,
      name: userInfo.userName || userInfo.name || '用户',
      tenantId: userInfo.tenant_id || userInfo.tenantId || 'default'
    }
  })

  if (response.data?.accessToken) {
    // 保存 token 和过期时间（提前 5 分钟过期）
    const expiryTime = Date.now() + (response.data.expiresIn - 300) * 1000
    localStg.set('thingsVisToken', response.data.accessToken)
    localStg.set('thingsVisTokenExpiry', expiryTime)

    console.log('[ThingsVis] SSO token exchange successful')
    return response.data.accessToken
  }

  return null
}

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
    background: string
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
    background?: string
  }
}

export interface UpdateDashboardData {
  name?: string
  thumbnail?: string | null
  canvasConfig?: unknown
  nodes?: unknown[]
  dataSources?: unknown[]
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
    const err = error as { response?: { status: number }; message: string }
    return {
      data: null,
      error: {
        message: err.message || 'Unknown error',
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
  return wrapRequest<ProjectListResponse>(
    thingsVisRequest.get('/projects', { params })
  )
}

/**
 * 获取项目详情
 */
export function getThingsVisProject(id: string) {
  return wrapRequest<ThingsVisProject>(
    thingsVisRequest.get(`/projects/${id}`)
  )
}

/**
 * 创建项目
 */
export function createThingsVisProject(data: CreateProjectData) {
  return wrapRequest<ThingsVisProject>(
    thingsVisRequest.post('/projects', data)
  )
}

/**
 * 更新项目
 */
export function updateThingsVisProject(id: string, data: UpdateProjectData) {
  return wrapRequest<ThingsVisProject>(
    thingsVisRequest.put(`/projects/${id}`, data)
  )
}

/**
 * 删除项目
 */
export function deleteThingsVisProject(id: string) {
  return wrapRequest<void>(
    thingsVisRequest.delete(`/projects/${id}`)
  )
}

// ========== Dashboard API ==========

/**
 * 获取 Dashboard 列表
 * @param params.projectId - 项目ID,必填
 */
export function getThingsVisDashboards(params: { projectId: string; page?: number; limit?: number }) {
  return wrapRequest<DashboardListResponse>(
    thingsVisRequest.get('/dashboards', { params })
  )
}

/**
 * 获取 Dashboard 详情
 */
export function getThingsVisDashboard(id: string) {
  return wrapRequest<ThingsVisDashboard>(
    thingsVisRequest.get(`/dashboards/${id}`)
  )
}

/**
 * 创建 Dashboard
 */
export function createThingsVisDashboard(data: CreateDashboardData) {
  return wrapRequest<ThingsVisDashboard>(
    thingsVisRequest.post('/dashboards', data)
  )
}

/**
 * 更新 Dashboard
 */
export function updateThingsVisDashboard(id: string, data: UpdateDashboardData) {
  return wrapRequest<ThingsVisDashboard>(
    thingsVisRequest.put(`/dashboards/${id}`, data)
  )
}

/**
 * 删除 Dashboard
 */
export function deleteThingsVisDashboard(id: string) {
  return wrapRequest<void>(
    thingsVisRequest.delete(`/dashboards/${id}`)
  )
}

/**
 * 发布 Dashboard
 */
export function publishThingsVisDashboard(id: string) {
  return wrapRequest<ThingsVisDashboard>(
    thingsVisRequest.post(`/dashboards/${id}/publish`)
  )
}

/**
 * 复制 Dashboard
 */
export function duplicateThingsVisDashboard(id: string) {
  return wrapRequest<ThingsVisDashboard>(
    thingsVisRequest.post(`/dashboards/${id}/duplicate`)
  )
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
  return wrapRequest<{ data: ThingsVisHomeDashboard | null }>(
    thingsVisRequest.get('/dashboards/home')
  )
}
