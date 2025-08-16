/**
 * 简化数据源系统类型定义
 * 基于学习现有系统后的简化设计
 */

// ========== 组件数据需求类型 ==========

/**
 * 组件数据需求声明 - 简化版
 * 学习自 visual-editor 的组件需求声明机制
 */
export interface ComponentDataRequirement {
  /** 组件ID */
  componentId: string
  /** 组件名称 */
  componentName: string
  /** 数据源需求列表 */
  dataSources: DataSourceRequirement[]
}

/**
 * 数据源需求声明
 */
export interface DataSourceRequirement {
  /** 数据源ID */
  id: string
  /** 数据源名称 */
  name: string
  /** 数据结构类型 */
  structureType: 'object' | 'array'
  /** 字段需求 */
  fields: FieldRequirement[]
  /** 是否必填 */
  required: boolean
  /** 描述 */
  description?: string
}

/**
 * 字段需求声明
 */
export interface FieldRequirement {
  /** 字段名 */
  name: string
  /** 字段类型 */
  type: 'string' | 'number' | 'boolean' | 'any'
  /** 是否必填 */
  required: boolean
  /** 字段描述 */
  description: string
  /** 示例值 */
  example?: any
}

// ========== 数据源配置类型 ==========

/**
 * 简化的数据源配置 - 输出给外部系统使用
 * 这是配置器生成的标准配置格式
 */
export interface SimpleDataSourceConfig {
  /** 配置ID */
  id: string
  /** 组件ID */
  componentId: string
  /** 数据源定义列表 */
  dataSources: DataSourceDefinition[]
  /** 触发器配置 - 复用Card2.1的优秀设计 */
  triggers: TriggerConfig[]
  /** 是否启用 */
  enabled: boolean
}

/**
 * 数据源定义
 */
export interface DataSourceDefinition {
  /** 数据源ID */
  id: string
  /** 数据源类型 */
  type: 'static' | 'api' | 'websocket' | 'script'
  /** 数据源配置 */
  config: any
  /** 字段映射 - 学习自visual-editor的映射机制 */
  fieldMapping?: { [targetField: string]: string }
}

/**
 * 触发器配置 - 复用Card2.1的触发器系统
 */
export interface TriggerConfig {
  /** 触发器类型 */
  type: 'timer' | 'websocket' | 'event' | 'manual'
  /** 触发器配置 */
  config: TriggerConfigData
}

/**
 * 触发器配置数据
 */
export interface TriggerConfigData {
  // 定时器配置
  interval?: number
  immediate?: boolean

  // WebSocket配置
  url?: string
  protocols?: string[]

  // 事件配置
  eventName?: string
  target?: EventTarget
}

// ========== 组件数据类型 ==========

/**
 * 组件最终接收的数据格式
 * 这是执行器输出给组件的标准格式
 */
export interface ComponentData {
  [dataSourceId: string]: {
    /** 数据源类型 */
    type: string
    /** 解析后的数据 */
    data: any
    /** 最后更新时间 */
    lastUpdated?: number
    /** 元数据 */
    metadata?: any
  }
}

/**
 * 标准组件Props - 新组件使用的接口
 */
export interface StandardComponentProps {
  /** 数据源配置 */
  dataSourceConfig?: ComponentData
}

// ========== 用户输入类型 ==========

/**
 * 用户数据源输入
 * 用户在配置界面中输入的数据
 */
export interface UserDataSourceInput {
  /** 数据源ID */
  dataSourceId: string
  /** 数据源类型 */
  type: 'static' | 'api' | 'websocket' | 'script'
  /** 用户输入的配置 */
  config: DataSourceUserConfig
}

/**
 * 数据源用户配置
 */
export type DataSourceUserConfig =
  | StaticDataSourceConfig
  | ApiDataSourceConfig
  | WebSocketDataSourceConfig
  | ScriptDataSourceConfig

/**
 * 静态数据源配置
 */
export interface StaticDataSourceConfig {
  /** 静态数据 - JSON字符串或对象 */
  data: any
}

/**
 * API数据源配置
 */
export interface ApiDataSourceConfig {
  /** API地址 */
  url: string
  /** HTTP方法 */
  method: 'GET' | 'POST' | 'PUT' | 'DELETE'
  /** 请求头 */
  headers?: Record<string, string>
  /** 请求体 */
  body?: any
  /** 超时时间 */
  timeout?: number
}

/**
 * WebSocket数据源配置
 */
export interface WebSocketDataSourceConfig {
  /** WebSocket地址 */
  url: string
  /** 协议 */
  protocols?: string[]
  /** 重连间隔 */
  reconnectInterval?: number
}

/**
 * 脚本数据源配置
 */
export interface ScriptDataSourceConfig {
  /** JavaScript脚本代码 */
  script: string
  /** 脚本上下文 */
  context?: Record<string, any>
}

// ========== 执行结果类型 ==========

/**
 * 数据执行结果
 */
export interface ExecutionResult {
  /** 是否成功 */
  success: boolean
  /** 数据内容 */
  data?: ComponentData
  /** 错误信息 */
  error?: string
  /** 执行时间（毫秒） */
  executionTime: number
  /** 时间戳 */
  timestamp: number
}

/**
 * 字段映射预览结果
 */
export interface MappingPreviewResult {
  /** 目标字段 */
  targetField: string
  /** 源路径 */
  sourcePath: string
  /** 映射后的值 */
  mappedValue: any
  /** 是否成功 */
  success: boolean
  /** 错误信息 */
  error?: string
}

// ========== 验证结果类型 ==========

/**
 * 配置验证结果
 */
export interface ValidationResult {
  /** 是否有效 */
  valid: boolean
  /** 错误信息 */
  errors: string[]
  /** 警告信息 */
  warnings: string[]
}

// ========== 兼容性类型 ==========

/**
 * Visual Editor 兼容格式
 */
export interface VisualEditorCompatibleProps {
  widgetConfiguration?: {
    dataSource: {
      config: {
        dataSourceBindings: {
          [dataSourceId: string]: {
            rawData: string
          }
        }
      }
    }
  }
}

/**
 * Card2.1 兼容格式
 */
export interface Card21CompatibleProps {
  rawDataSources?: {
    dataSourceBindings: {
      [dataSourceId: string]: {
        rawData: string
      }
    }
  }
}

// ========== 工具类型 ==========

/**
 * 数据源类型联合类型
 */
export type DataSourceType = 'static' | 'api' | 'websocket' | 'script'

/**
 * 字段类型联合类型
 */
export type FieldType = 'string' | 'number' | 'boolean' | 'any'

/**
 * 触发器类型联合类型
 */
export type TriggerType = 'timer' | 'websocket' | 'event' | 'manual'

/**
 * 组件类型
 */
export type ComponentType = 'visual-editor' | 'card2.1' | 'standard'

// ========== 常量定义 ==========

/**
 * 系统常量
 */
export const SIMPLE_DATA_SOURCE_CONSTANTS = {
  /** 最大数据源数量 */
  MAX_DATA_SOURCES: 5,

  /** 默认触发器间隔 */
  DEFAULT_TRIGGER_INTERVAL: 30000,

  /** 默认超时时间 */
  DEFAULT_TIMEOUT: 10000,

  /** 配置版本 */
  CONFIG_VERSION: '2.0.0'
} as const
