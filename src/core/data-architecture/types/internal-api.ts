/**
 * 内部API接口类型定义
 * 用于HTTP配置表单的内部地址选择和模板功能
 */

/**
 * HTTP方法类型
 */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'

/**
 * 参数类型
 */
export interface ApiParameter {
  name: string // 参数名称
  type: 'string' | 'number' | 'boolean' | 'object' // 参数类型
  required: boolean // 是否必填
  description?: string // 参数描述
  example?: any // 示例值
}

/**
 * 内部API接口项
 */
export interface InternalApiItem {
  label: string // 接口名称描述
  value: string // URL路径（作为选择器的value）
  url: string // 完整URL路径
  method: HttpMethod // HTTP请求方法
  description?: string // 简单描述
  commonParams?: ApiParameter[] // 常用参数列表
  hasPathParams: boolean // 是否包含路径参数占位符
  pathParamNames?: string[] // 路径参数名称列表 (如 ['id', 'deviceId'])
  module: string // 所属模块
  functionName?: string // 原始函数名
}

/**
 * API模块分组
 */
export interface ApiModule {
  type: 'group'
  label: string
  key: string
  children: InternalApiItem[]
}

/**
 * 内部API数据结构（用于下拉选择器）
 */
export type InternalAddressOptions = ApiModule[]

/**
 * 路径参数提取工具函数
 */
export function extractPathParams(url: string): string[] {
  const matches = url.match(/\{([^}]+)\}/g)
  if (!matches) return []

  return matches.map(match => match.slice(1, -1)) // 去掉 { }
}

/**
 * 检测URL是否包含路径参数
 */
export function hasPathParameters(url: string): boolean {
  return /\{[^}]+\}/.test(url)
}

/**
 * 根据URL和HTTP方法生成接口描述
 */
export function generateApiDescription(url: string, method: HttpMethod, functionName?: string): string {
  const pathSegments = url.split('/').filter(segment => segment.length > 0)
  const lastSegment = pathSegments[pathSegments.length - 1]

  // 如果有函数名和注释，优先使用
  if (functionName) {
    const descriptions: Record<string, string> = {
      get: '获取',
      post: '创建',
      put: '更新',
      delete: '删除'
    }

    const action = descriptions[method.toLowerCase()] || method
    return `${action}${lastSegment.replace(/\{[^}]+\}/g, '')}`
  }

  return `${method} ${url}`
}

/**
 * API函数名到中文描述的映射
 */
export const API_DESCRIPTION_MAP: Record<string, string> = {
  // 设备管理
  getDeviceGroup: '获取设备分组',
  deviceGroupTree: '获取设备分组树',
  deviceGroup: '设备分组操作',
  deviceGroupDetail: '获取设备分组详情',
  deviceList: '获取设备列表',
  deviceDetail: '获取设备详情',
  deviceDelete: '删除设备',
  deviceAdd: '添加设备',
  deviceUpdate: '更新设备',
  telemetryDataCurrent: '获取设备当前遥测数据',
  telemetryDataHistoryList: '获取设备历史遥测数据',

  // 面板管理
  getBoardList: '获取面板列表',
  getBoard: '获取面板详情',
  PostBoard: '创建面板',
  PutBoard: '更新面板',
  DelBoard: '删除面板',
  deviceListForPanel: '获取面板设备列表',
  deviceMetricsList: '获取设备指标列表',

  // 系统管理
  fetchGetRoleList: '获取角色列表',
  fetchGetAllRoles: '获取所有角色',
  fetchGetUserList: '获取用户列表',
  fetchGetMenuList: '获取菜单列表',

  // 系统数据
  totalNumber: '获取设备总数统计',
  sumData: '获取租户设备统计',
  tenantNum: '获取租户消息统计',
  tenant: '获取租户统计数据',
  telemetryApi: '获取遥测数据',
  telemetryLatestApi: '获取最新遥测数据'
}
