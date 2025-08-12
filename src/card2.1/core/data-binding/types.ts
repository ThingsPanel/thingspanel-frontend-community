/**
 * 重新设计的数据绑定系统类型定义
 * 专注于解决组件数据需求声明和外部数据绑定的核心问题
 */

// ========== 组件数据需求声明 ==========

/**
 * 数据字段类型定义
 */
export type DataFieldType = 'value' | 'object' | 'array'
export type ValueDataType = 'number' | 'string' | 'boolean' | 'any'

/**
 * 数据字段需求定义
 */
export interface DataFieldRequirement {
  /** 数据字段类型 */
  type: DataFieldType

  /** 当type为'value'时的具体值类型 */
  valueType?: ValueDataType

  /** 当type为'object'或'array'时的嵌套结构 */
  structure?: ComponentDataRequirement

  /** 是否必填 */
  required: boolean

  /** 字段描述 */
  description: string

  /** 默认值 */
  defaultValue?: any

  /** 数据示例 */
  example?: any

  /** 验证规则 */
  validation?: DataValidationRule
}

/**
 * 数据验证规则
 */
export interface DataValidationRule {
  /** 最小值/最小长度 */
  min?: number
  /** 最大值/最大长度 */
  max?: number
  /** 正则表达式验证 */
  pattern?: string
  /** 枚举值限制 */
  enum?: any[]
  /** 自定义验证函数 */
  custom?: (value: any) => boolean | string
}

/**
 * 数据关系类型
 */
export type DataRelationType = 'independent' | 'calculated' | 'derived'

/**
 * 数据关系定义
 */
export interface DataRelationship {
  /** 关系类型 */
  type: DataRelationType

  /** 依赖的输入字段 */
  inputs: string[]

  /** 计算函数 */
  calculator?: (inputs: Record<string, any>) => any

  /** 关系描述 */
  description?: string

  /** 实时计算（输入变化时立即重算） */
  realtime?: boolean
}

/**
 * 组件数据需求完整定义
 */
export interface ComponentDataRequirement {
  /** 数据字段需求 */
  fields: Record<string, DataFieldRequirement>

  /** 数据关系定义 */
  relationships?: Record<string, DataRelationship>

  /** 需求版本（用于兼容性） */
  version?: string

  /** 需求描述 */
  description?: string
}

// ========== 数据源定义 ==========

/**
 * 数据源类型
 */
export type DataSourceType = 'static' | 'api' | 'websocket' | 'script' | 'database'

/**
 * 基础数据源接口
 */
export interface DataSource {
  /** 数据源唯一ID */
  id: string

  /** 数据源类型 */
  type: DataSourceType

  /** 数据源名称 */
  name: string

  /** 数据源描述 */
  description?: string

  /** 获取数据 */
  fetchData(): Promise<any>

  /** 验证数据源配置 */
  validateConfig(): boolean

  /** 获取数据源配置 */
  getConfig(): any

  /** 更新数据源配置 */
  updateConfig(config: any): void
}

// ========== 数据处理管道 ==========

/**
 * 数据处理器接口
 */
export interface DataProcessor {
  /** 处理器ID */
  id: string

  /** 处理器名称 */
  name: string

  /** 处理器类型 */
  type: 'script' | 'format' | 'filter' | 'transform' | 'validate'

  /** 处理数据 */
  process(input: any): Promise<any>

  /** 处理器配置 */
  config?: any

  /** 验证处理器配置 */
  validateConfig?(): boolean
}

/**
 * 数据映射规则
 */
export interface DataMappingRule {
  /** 源数据路径 */
  sourcePath: string

  /** 目标字段名 */
  targetField: string

  /** 映射类型 */
  type: 'direct' | 'calculated' | 'conditional'

  /** 转换函数（当type为'calculated'时） */
  transformer?: (value: any) => any

  /** 条件判断（当type为'conditional'时） */
  condition?: (value: any) => boolean

  /** 默认值 */
  defaultValue?: any
}

/**
 * 数据映射器
 */
export interface DataMapper {
  /** 映射规则 */
  rules: DataMappingRule[]

  /** 执行映射 */
  map(sourceData: any): Record<string, any>

  /** 验证映射规则 */
  validateRules(): boolean

  /** 预览映射结果 */
  preview(sourceData: any): Record<string, any>
}

/**
 * 完整的数据转换管道
 */
export interface DataTransformPipeline {
  /** 管道ID */
  id: string

  /** 数据源 */
  source: DataSource

  /** 处理器链 */
  processors: DataProcessor[]

  /** 数据映射器 */
  mapper: DataMapper

  /** 数据验证器 */
  validator?: DataValidator

  /** 执行完整的转换流程 */
  execute(): Promise<Record<string, any>>

  /** 验证管道配置 */
  validate(): boolean
}

// ========== 数据验证 ==========

/**
 * 数据验证结果
 */
export interface DataValidationResult {
  /** 是否验证通过 */
  valid: boolean

  /** 错误信息 */
  errors: string[]

  /** 警告信息 */
  warnings: string[]

  /** 验证详情 */
  details: Record<string, any>
}

/**
 * 数据验证器
 */
export interface DataValidator {
  /** 验证数据是否符合组件需求 */
  validate(data: any, requirement: ComponentDataRequirement): DataValidationResult

  /** 验证单个字段 */
  validateField(value: any, fieldRequirement: DataFieldRequirement): DataValidationResult
}

// ========== 响应式更新机制 ==========

/**
 * 更新触发器类型
 */
export type UpdateTriggerType = 'timer' | 'websocket' | 'mqtt' | 'event' | 'manual'

/**
 * 更新触发器
 */
export interface UpdateTrigger {
  /** 触发器类型 */
  type: UpdateTriggerType

  /** 触发器配置 */
  config: any

  /** 启动触发器 */
  start(callback: () => void): void

  /** 停止触发器 */
  stop(): void

  /** 触发器状态 */
  isActive(): boolean
}

/**
 * 响应式数据绑定
 */
export interface ReactiveDataBinding {
  /** 绑定ID */
  id: string

  /** 组件ID */
  componentId: string

  /** 数据转换管道 */
  pipeline: DataTransformPipeline

  /** 更新触发器 */
  triggers: UpdateTrigger[]

  /** 数据变化回调 */
  onDataChange: (newData: any, oldData?: any) => void

  /** 错误处理回调 */
  onError?: (error: Error) => void

  /** 启动数据绑定 */
  start(): void

  /** 停止数据绑定 */
  stop(): void

  /** 手动触发数据更新 */
  refresh(): Promise<void>

  /** 获取当前数据 */
  getCurrentData(): any

  /** 绑定状态 */
  isActive(): boolean
}

// ========== 数据绑定管理器 ==========

/**
 * 数据绑定管理器
 */
export interface DataBindingManager {
  /** 创建数据绑定 */
  createBinding(config: DataBindingConfig): ReactiveDataBinding

  /** 获取绑定 */
  getBinding(id: string): ReactiveDataBinding | null

  /** 移除绑定 */
  removeBinding(id: string): void

  /** 获取组件的所有绑定 */
  getComponentBindings(componentId: string): ReactiveDataBinding[]

  /** 获取所有活跃的绑定 */
  getActiveBindings(): ReactiveDataBinding[]

  /** 清理所有绑定 */
  cleanup(): void
}

/**
 * 数据绑定配置
 */
export interface DataBindingConfig {
  /** 绑定ID */
  id: string

  /** 组件ID */
  componentId: string

  /** 组件数据需求 */
  requirement: ComponentDataRequirement

  /** 数据转换管道配置 */
  pipelineConfig: {
    source: DataSourceConfig
    processors?: DataProcessorConfig[]
    mappingRules: DataMappingRule[]
  }

  /** 更新触发器配置 */
  triggerConfigs: UpdateTriggerConfig[]

  /** 是否自动启动 */
  autoStart?: boolean
}

/**
 * 数据源配置
 */
export interface DataSourceConfig {
  type: DataSourceType
  config: any
}

/**
 * 数据处理器配置
 */
export interface DataProcessorConfig {
  type: string
  config: any
}

/**
 * 更新触发器配置
 */
export interface UpdateTriggerConfig {
  type: UpdateTriggerType
  config: any
}
