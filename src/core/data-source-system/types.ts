/**
 * 数据源系统核心类型定义
 * 定义ModelValue、DataSource、DataSourceConfig等关键接口
 */

// 数据源配置接口
export interface DataSourceConfig {
  [key: string]: any // 动态配置项，支持字符串、数字、布尔值等
}

// 数据源定义接口
export interface DataSource {
  /** 数据源唯一标识 */
  key: string
  /** 数据源名称 */
  name: string
  /** 数据源描述 */
  description?: string
  /** 默认配置 */
  defaultConfig?: DataSourceConfig
  /** 示例配置 */
  example?: DataSourceConfig
  /** 字段映射配置 */
  fieldMappings?: Record<string, any>
  /** 需要映射的字段列表 */
  fieldsToMap?: Array<{ key: string; targetProperty: string }>
}

// ModelValue接口 - v-model绑定的核心数据结构
export interface ModelValue {
  /** 当前激活的数据源key */
  activeDataSourceKey?: string
  /** 数据源绑定配置 */
  dataSourceBindings?: Record<string, DataSourceConfig>
  /** 其他扩展字段 */
  [key: string]: any
}

// 数据源选项接口
export interface DataSourceOption {
  /** 显示标签 */
  label: string
  /** 选项值 */
  value: string
}

// 组件数据接口 - 执行器返回的数据格式
export interface ComponentData {
  [dataSourceId: string]: {
    /** 数据源类型 */
    type: string
    /** 实际数据 */
    data: any
    /** 最后更新时间 */
    lastUpdated?: number
    /** 元数据 */
    metadata?: any
  }
}

// 执行结果接口
export interface ExecutionResult {
  /** 执行是否成功 */
  success: boolean
  /** 组件数据 */
  data?: ComponentData
  /** 错误信息 */
  error?: string
  /** 执行耗时 */
  executionTime: number
  /** 时间戳 */
  timestamp: number
}

// 简化的数据源配置接口
export interface SimpleDataSourceConfig {
  /** 配置ID */
  id: string
  /** 组件ID */
  componentId: string
  /** 数据源定义列表 */
  dataSources: DataSourceDefinition[]
  /** 触发器配置 */
  triggers: TriggerConfig[]
  /** 是否启用 */
  enabled: boolean
}

// 数据源定义接口
export interface DataSourceDefinition {
  /** 数据源ID */
  id: string
  /** 数据源类型 */
  type: 'static' | 'api' | 'websocket' | 'script'
  /** 配置数据 */
  config: any
  /** 字段映射 */
  fieldMapping?: { [targetField: string]: string }
}

// 触发器配置接口
export interface TriggerConfig {
  /** 触发器类型 */
  type: 'timer' | 'websocket' | 'event' | 'manual'
  /** 触发器配置数据 */
  config: TriggerConfigData
}

// 触发器配置数据接口
export interface TriggerConfigData {
  /** 定时器间隔（毫秒） */
  interval?: number
  /** 是否立即执行 */
  immediate?: boolean
  /** WebSocket URL */
  url?: string
  /** WebSocket 协议 */
  protocols?: string[]
  /** 事件名称 */
  eventName?: string
  /** 事件目标 */
  target?: EventTarget
}
