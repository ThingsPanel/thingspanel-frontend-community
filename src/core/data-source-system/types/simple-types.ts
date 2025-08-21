/**
 * 简化数据源系统类型定义
 * 基于学习现有系统后的简化设计
 */

// ========== 组件数据需求类型 ==========

/**
 * 组件数据需求声明 - 与Card2.1完全兼容
 * 支持Card2.1 ComponentDefinition中的 staticParams 和 dataSources
 */
export interface ComponentDataRequirement {
  /** 组件ID */
  componentId: string
  /** 组件名称 */
  componentName: string
  /** 静态参数需求声明 - 与Card2.1 StaticParamRequirement对应 */
  staticParams?: StaticParamRequirement[]
  /** 数据源需求声明 - 与Card2.1 DataSourceRequirement对应 */
  dataSources: DataSourceRequirement[]
}

/**
 * 静态参数需求定义 - 与Card2.1完全一致
 */
export interface StaticParamRequirement {
  /** 参数唯一标识 */
  key: string
  /** 参数名称 */
  name: string
  /** 参数类型 */
  type: 'string' | 'number' | 'boolean' | 'object' | 'array'
  /** 参数描述 */
  description: string
  /** 默认值 */
  defaultValue?: any
  /** 是否必填 */
  required?: boolean
  /** 参数验证规则 */
  validation?: {
    min?: number
    max?: number
    pattern?: string
    options?: Array<{ label: string; value: any }>
  }
  /** UI 渲染提示 */
  ui?: {
    component?: 'input' | 'select' | 'number' | 'switch' | 'textarea' | 'color' | 'slider'
    placeholder?: string
    label?: string
    group?: string
  }
}

/**
 * 数据源需求声明 - 与Card2.1完全兼容的版本
 */
export interface DataSourceRequirement {
  /** 数据源唯一标识 - 与Card2.1 key对应 */
  key: string
  /** 数据源名称 */
  name: string
  /** 数据源描述 */
  description: string
  /** 支持的数据源类型 - 与Card2.1对齐 */
  supportedTypes: Array<'static' | 'api' | 'websocket' | 'mqtt' | 'database'>
  /** 字段映射规则 - 与Card2.1 fieldMappings兼容 */
  fieldMappings: Record<
    string,
    {
      /** 目标字段名 */
      targetField: string
      /** 字段类型 */
      type: 'value' | 'object' | 'array'
      /** 是否必填 */
      required: boolean
      /** 默认值 */
      defaultValue?: any
      /** 数据转换函数 */
      transform?: string
    }
  >
  /** 是否必填 */
  required?: boolean

  // ==== 向下兼容字段 - 支持原有简化格式 ====
  /** 数据结构类型 - 向下兼容 */
  structureType?: 'object' | 'array'
  /** 字段需求 - 向下兼容 */
  fields?: FieldRequirement[]
  /** 数据源ID - 向下兼容 */
  id?: string
}

/**
 * 字段需求声明 - 与Card2.1兼容的扩展版本
 */
export interface FieldRequirement {
  /** 字段名 */
  name: string
  /** 字段类型 - 扩展支持Card2.1的类型系统 */
  type: 'string' | 'number' | 'boolean' | 'any' | 'object' | 'array'
  /** 值类型 - 用于进一步细分类型 */
  valueType?: 'number' | 'string' | 'boolean' | 'any'
  /** 是否必填 */
  required: boolean
  /** 字段描述 */
  description: string
  /** 示例值 */
  example?: any
  /** 默认值 - 与Card2.1 StaticParamRequirement兼容 */
  defaultValue?: any
  /** 嵌套结构定义 - 支持复杂对象和数组 */
  structure?: DataSourceRequirement
  /** 验证规则 - 与Card2.1兼容的验证配置 */
  validation?: {
    min?: number
    max?: number
    pattern?: string
    options?: Array<{ label: string; value: any }>
  }
  /** UI渲染提示 - 支持Card2.1的UI配置 */
  ui?: {
    component?: 'input' | 'select' | 'number' | 'switch' | 'textarea' | 'color' | 'slider'
    placeholder?: string
    label?: string
    group?: string
  }
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
 * 字段类型联合类型 - 扩展支持Card2.1兼容性
 */
export type FieldType = 'string' | 'number' | 'boolean' | 'any' | 'object' | 'array'

/**
 * 字段值类型联合类型 - 用于细分基础类型
 */
export type FieldValueType = 'string' | 'number' | 'boolean' | 'any'

/**
 * 触发器类型联合类型
 */
export type TriggerType = 'timer' | 'websocket' | 'event' | 'manual'

/**
 * 组件类型
 */
export type ComponentType = 'visual-editor' | 'card2.1' | 'standard'

/**
 * Card2.1组件需求声明格式 - 直接引用Card2.1的类型
 */
export interface Card2ComponentRequirement {
  /** 静态参数需求声明 */
  staticParams?: any[]
  /** 数据源需求声明 */
  dataSources?: any[]
}

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

// ========== Card2.1兼容类型转换工具 ==========

/**
 * Card2.1 StaticParamRequirement转换工具
 */
export interface Card2StaticParamCompatibility {
  /**
   * 将Card2.1 StaticParamRequirement转换为数据源系统StaticParamRequirement
   */
  fromCard2StaticParam(card2Param: any): StaticParamRequirement

  /**
   * 将数据源系统StaticParamRequirement转换为Card2.1格式
   */
  toCard2StaticParam(staticParam: StaticParamRequirement): any
}

/**
 * Card2.1 DataSourceRequirement转换工具
 */
export interface Card2DataSourceCompatibility {
  /**
   * 将Card2.1 DataSourceRequirement转换为数据源系统格式
   */
  fromCard2DataSource(card2DataSource: any): DataSourceRequirement

  /**
   * 将数据源系统格式转换为Card2.1 DataSourceRequirement
   */
  toCard2DataSource(dataSource: DataSourceRequirement): any
}

/**
 * 组件数据需求转换工具
 */
export interface ComponentRequirementCompatibility {
  /**
   * 从Card2.1 ComponentDefinition提取数据需求
   */
  extractFromCard2Component(componentDef: any): ComponentDataRequirement

  /**
   * 将ComponentDataRequirement转换为Card2.1兼容格式
   */
  adaptToCard2Component(requirement: ComponentDataRequirement): {
    staticParams?: any[]
    dataSources?: any[]
  }
}

/**
 * 字段类型映射表 - Card2.1与数据源系统之间的类型映射
 */
export const FIELD_TYPE_MAPPING = {
  // Card2.1 -> 数据源系统
  card2ToDataSource: {
    value: 'any' as FieldType,
    object: 'object' as FieldType,
    array: 'array' as FieldType,
    string: 'string' as FieldType,
    number: 'number' as FieldType,
    boolean: 'boolean' as FieldType
  },
  // 数据源系统 -> Card2.1
  dataSourceToCard2: {
    string: 'value',
    number: 'value',
    boolean: 'value',
    any: 'value',
    object: 'object',
    array: 'array'
  }
} as const
