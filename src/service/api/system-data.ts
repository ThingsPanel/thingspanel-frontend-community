import { request } from '../request'
// Remove the incorrect import, as DeviceData is defined locally
// import type { DeviceData } from '@/views/device/utils/types';

// --- 添加接口定义 ---
// (如果这些类型已在全局定义，例如 src/types/api.d.ts，则应从那里导入)
export interface TelemetryItem {
  key: string
  label: string | null
  unit: string | null
  value: any
}

export interface DeviceData {
  device_id: string
  device_name: string
  is_online: number
  last_push_time: string
  telemetry_data: TelemetryItem[]
}

export interface ApiLatestTelemetryResponse {
  data: DeviceData[] | null
  error: string | object | null // 允许不同的错误类型
}

// Reintroduce the interface for the expected API response structure
interface ApiResponse<T> {
  code: number
  message: string
  data: T
}

// --- 接口定义结束 ---

// --- 定义 /board/tenant 返回的 data 类型 ---
interface TenantMonthData {
  mon: number
  num: number
}

interface TenantBoardData {
  user_total: number
  user_added_yesterday: number
  user_added_month: number
  user_list_month: TenantMonthData[]
}
// --- 类型定义结束 ---

/** 获取设备总数和激活数 */
export const totalNumber = async () => {
  const data = await request.get<Api.BaseApi.Data | null>('/board/device')
  return data
}

/** 获取租户设备总数 */
export const sumData = async (): Promise<any> => {
  return await request.get<any>('/board/tenant/device/info')
}

/** 获取租户消息总数 */
export const tenantNum = async (): Promise<any> => {
  return await request.get<any>('/telemetry/datas/msg/count')
}

/** 获取租户总数、昨日新增、本月新增以及月历史数据 */
export const tenant = async () => {
  const data = await request.get<Api.BaseApi.Data | null>('/board/tenant')
  return data
}

/** 获取租户看板数据 /board/tenant */

/** 新增设备功能模板信息 */
export const addTemplat = async (params: any): Promise<any> => {
  const data = await request.post('/device/template', params)
  return data
}
/** 更新模型详情数据 */
export const putTemplat = async (params: any) => {
  const data = await request.put<any>(`/device/template`, params)
  return data
}

/** 获取物模型详情数据 */
export const getTemplat = async (id: any) => {
  const data = await request.get<any>(`/device/template/detail/${id}`)
  return data
}

/** 获取遥测数据 */
export const telemetryApi = async (params: any) => {
  const data = await request.get<Api.BaseApi.Data | null>('/device/model/telemetry', { params })
  return data
}
/** 获取遥测数据 */
export const telemetryLatestApi = async (id: any) => {
  const data = await request.get<Api.BaseApi.Data | null>(`/telemetry/datas/current/${id}`)
  return data
}

/** 获取最新的遥测数据 - Simplified Implementation */
export const getLatestTelemetryData = async () => {
  // 1. 调用 request.get，获取包装后的响应
  const data = await request.get<any>(`/device/telemetry/latest`) // 使用 any 避免复杂的包装类型

  // 3. 检查提取的 data 是否为数组或 null，然后返回
  return data
}

/** 获取属性数据 */
export const attributesApi = async (params: any) => {
  const data = await request.get<Api.BaseApi.Data | null>('/device/model/attributes', { params })
  return data
}

/** 获取事件数据 */
export const eventsApi = async (params: any) => {
  const data = await request.get<Api.BaseApi.Data | null>('/device/model/events', { params })
  return data
}

/** 获取命令数据 */
export const commandsApi = async (params: any) => {
  const data = await request.get<Api.BaseApi.Data | null>('/device/model/commands', { params })
  return data
}

/** 新增遥测数据 */
export const addTelemetry = async (params: any): Promise<any> => {
  const data = await request.post('/device/model/telemetry', params)
  return data
}

/** 删除遥测数据 */
export const delTelemetry = async (id: string) => {
  const data = await request.delete<Api.BaseApi.Data>(`/device/model/telemetry/${id}`)
  return data
}

/** 删除属性数据 */
export const delAttributes = async (id: string) => {
  const data = await request.delete<Api.BaseApi.Data>(`/device/model/attributes/${id}`)
  return data
}

/** 删除事件数据 */
export const delEvents = async (id: string) => {
  const data = await request.delete<Api.BaseApi.Data>(`/device/model/events/${id}`)
  return data
}

/** 删除命令数据 */
export const delCommands = async (id: string) => {
  const data = await request.delete<Api.BaseApi.Data>(`/device/model/commands/${id}`)
  return data
}

/** 编辑遥测数据 */
export const putTelemetry = async (params: any): Promise<any> => {
  const data = await request.put('/device/model/telemetry', params)
  return data
}

/** 新增属性数据 */
export const addAttributes = async (params: any): Promise<any> => {
  const data = await request.post('/device/model/attributes', params)
  return data
}

/** 编辑属性数据 */
export const putAttributes = async (params: any): Promise<any> => {
  const data = await request.put('/device/model/attributes', params)
  return data
}

/** 新增事件数据 */
export const addEvents = async (params: any): Promise<any> => {
  const data = await request.post('/device/model/events', params)
  return data
}

/** 编辑事件数据 */
export const putEvents = async (params: any): Promise<any> => {
  const data = await request.put('/device/model/events', params)
  return data
}

/** 新增命令数据 */
export const addCommands = async (params: any): Promise<any> => {
  const data = await request.post('/device/model/commands', params)
  return data
}

/** 编辑命令数据 */
export const putCommands = async (params: any): Promise<any> => {
  const data = await request.put('/device/model/commands', params)
  return data
}

/** 编辑命令数据 */
export const deviceCustomCommandsList = async (params: any): Promise<any> => {
  const data = await request.get('/device/model/custom/commands', { params })
  return data
}

/** 删除自定义命令 */
export const deviceCustomCommandsDel = async (paramsId: any): Promise<any> => {
  const data = await request.delete(`/device/model/custom/commands/${paramsId}`)
  return data
}

/** 新建自定义命令 */
export const deviceCustomCommandsAdd = async (params: any): Promise<any> => {
  const data = await request.post('/device/model/custom/commands', params)
  return data
}

/** 编辑自定义命令 */
export const deviceCustomCommandsPut = async (params: any): Promise<any> => {
  const data = await request.put('/device/model/custom/commands', params)
  return data
}

/** 自定义控制列表 */
export const deviceCustomControlList = async (params: any): Promise<any> => {
  const data = await request.get('/device/model/custom/control', { params })
  return data
}

/** 删除自定义控制 */
export const deviceCustomControlDel = async (paramsId: any): Promise<any> => {
  const data = await request.delete(`/device/model/custom/control/${paramsId}`)
  return data
}

/** 新建自定义控制 */
export const deviceCustomControlAdd = async (params: any): Promise<any> => {
  const data = await request.post('/device/model/custom/control', params)
  return data
}

/** 编辑自定义命令 */
export const deviceCustomControlPut = async (params: any): Promise<any> => {
  const data = await request.put('/device/model/custom/control', params)
  return data
}

/** 获取设备在线趋势 */
export const getOnlineDeviceTrend = async () => {
  const data = await request.get<Api.BaseApi.Data | null>('/board/trend')
  return data
}

/** 获取告警数量 */
export const getAlarmCount = async () => {
  const data = await request.get<Api.BaseApi.Data | null>('/alarm/device/counts')
  return data
}

/** 获取当前系统指标 */
export const getSystemMetricsCurrent = async (params?: any): Promise<any> => {
  // Assuming the endpoint returns a generic structure or the exact structure is unknown
  const data = await request.get<any>('/system/metrics/current', { params })
  return data
}

/** 获取当前系统指标 */
export const getSysVersion = async (params?: any): Promise<any> => {
  // Assuming the endpoint returns a generic structure or the exact structure is unknown
  const data = await request.get<any>('/sys_version', {
    params
  })
  return data
}

/** 获取系统指标历史数据 */
export const getSystemMetricsHistory = async (params?: any): Promise<any> => {
  if (process.env.NODE_ENV === 'development') {
    console.log('Fetching system metrics history with params:', params)
  }
  try {
    const data = await request.get<any>('/system/metrics/history', { params })
    if (process.env.NODE_ENV === 'development') {
      console.log('Raw response from /system/metrics/history:', data)
    } // Log raw response
    return data
  } catch (error) {
    console.error('Error fetching system metrics history:', error)
    throw error // Re-throw the error after logging
  }
}
