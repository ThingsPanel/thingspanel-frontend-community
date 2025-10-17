/**
 * 设备模板相关类型定义
 */

// ==================== 基础类型 ====================

/**
 * 数据类型枚举
 */
export type DataType = 'String' | 'Number' | 'Boolean' | 'Enum'

/**
 * 读写标识
 */
export type ReadWriteFlag = 'R' | 'RW'

/**
 * 参数类型
 */
export type ParamType = 'String' | 'Number' | 'Boolean' | 'Enum'

// ==================== 模板基本信息 ====================

/**
 * 设备模板基本信息
 */
export interface DeviceTemplate {
  id?: string
  name: string
  label: string // 标签（逗号分隔）
  path: string // 封面图片路径
  author: string
  version: string
  description: string
  web_chart_config?: string // Web图表配置（JSON字符串）
  app_chart_config?: string // APP图表配置（JSON字符串）
  created_at?: string
  updated_at?: string
}

/**
 * 模板表单数据（前端使用）
 */
export interface TemplateFormData {
  id?: string
  name: string
  templateTags: string[] // 前端标签数组
  label: string // 后端标签字符串
  path: string
  author: string
  version: string
  description: string
}

// ==================== 枚举配置 ====================

/**
 * 枚举项配置
 */
export interface EnumConfig {
  value_type: 'String' | 'Number' | 'Boolean'
  value: string | number | boolean
  description: string
}

/**
 * 命令参数枚举配置
 */
export interface CommandEnumConfig {
  value: string | number | boolean
  desc: string
}

// ==================== 遥测数据 ====================

/**
 * 遥测数据定义
 */
export interface TelemetryData {
  id?: string
  device_template_id: string
  data_name: string
  data_identifier: string
  data_type: DataType
  read_write_flag: ReadWriteFlag
  unit: string
  description: string
  additional_info: string // JSON字符串
}

/**
 * 遥测表单数据（前端使用）
 */
export interface TelemetryFormData {
  id?: string
  device_template_id: string
  data_name: string
  data_identifier: string
  data_type: DataType
  read_write_flag: 'R-只读' | 'RW-读/写'
  unit: string
  description: string
  additional_info: EnumConfig[] // 枚举配置数组
}

// ==================== 属性数据 ====================

/**
 * 属性数据定义（与遥测结构相同）
 */
export type AttributeData = TelemetryData
export type AttributeFormData = TelemetryFormData

// ==================== 事件数据 ====================

/**
 * 事件参数定义
 */
export interface EventParam {
  id?: number
  data_name: string
  data_identifier: string
  read_write_flag: DataType // 实际是数据类型
  description: string
}

/**
 * 事件数据定义
 */
export interface EventData {
  id?: string
  device_template_id: string
  data_name: string
  data_identifier: string
  description: string
  params: string // JSON字符串
  paramsOrigin?: string // 编辑时保存原始JSON
}

/**
 * 事件表单数据（前端使用）
 */
export interface EventFormData {
  id?: string
  device_template_id: string
  data_name: string
  data_identifier: string
  description: string
  params: EventParam[]
}

// ==================== 命令数据 ====================

/**
 * 命令参数定义
 */
export interface CommandParam {
  id?: number
  data_name: string
  data_identifier: string
  param_type: ParamType
  description: string
  data_type?: 'String' | 'Number' | 'Boolean' // 仅Enum类型需要
  enum_config?: CommandEnumConfig[]
}

/**
 * 命令数据定义
 */
export interface CommandData {
  id?: string
  device_template_id: string
  data_name: string
  data_identifier: string
  description: string
  params: string // JSON字符串
  paramsOrigin?: string
}

/**
 * 命令表单数据（前端使用）
 */
export interface CommandFormData {
  id?: string
  device_template_id: string
  data_name: string
  data_identifier: string
  description: string
  params: CommandParam[]
}

// ==================== 分页查询 ====================

/**
 * 分页查询参数
 */
export interface PageQuery {
  page: number
  page_size: number
  device_template_id: string
}

/**
 * 分页响应数据
 */
export interface PageResponse<T> {
  list: T[]
  total: number
}

// ==================== API响应 ====================

/**
 * 通用API响应
 */
export interface ApiResponse<T = any> {
  data: T
  error?: string
}
