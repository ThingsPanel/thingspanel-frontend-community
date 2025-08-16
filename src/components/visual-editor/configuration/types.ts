/**
 * Visual Editor 配置系统类型定义
 * 定义标准化的配置数据结构和接口
 */

// 数据源相关的导入已移除

/**
 * 🔧 Base配置接口 - 泛型化，由NodeWrapper层具体定义
 * 配置器层只定义结构，不定义具体字段
 */
export interface BaseConfiguration extends Record<string, any> {
  // 🔧 保持泛型结构，具体字段由NodeWrapper层定义
}

/**
 * 🔧 数据源配置接口 - 泛型化，由独立数据源系统具体定义
 * 配置器层只定义结构，不定义具体字段
 */
export interface DataSourceConfiguration extends Record<string, any> {
  // 🔧 保持泛型结构，具体字段由数据源系统定义
}

/**
 * 🔧 交互配置接口 - 泛型化，由独立交互系统具体定义
 * 配置器层只定义结构，不定义具体字段
 */
export interface InteractionConfiguration extends Record<string, any> {
  // 🔧 保持泛型结构，具体字段由交互系统定义
}

export interface ComponentConfiguration {
  /** 组件特定的属性配置 */
  properties: Record<string, any>
  /** 组件样式配置 */
  styles?: Record<string, any>
  /** 组件行为配置 */
  behavior?: Record<string, any>
  /** 组件验证规则 */
  validation?: {
    required?: string[]
    rules?: Record<string, any>
  }
}

/**
 * 🔧 完整的组件配置接口 - 重构为分层自治架构
 * 配置器作为接口层，各层自主管理各自配置
 */
export interface WidgetConfiguration {
  /** 🔧 基础配置 - 由NodeWrapper层自主定义和管理 */
  base: BaseConfiguration

  /** 🔧 组件配置 - 由各Card2.1组件自主定义和管理 */
  component: ComponentConfiguration

  /** 🔧 数据源配置 - 由独立数据源系统自主定义和管理 */
  dataSource: DataSourceConfiguration

  /** 🔧 交互配置 - 由独立交互系统自主定义和管理 */
  interaction: InteractionConfiguration

  /** 🔧 配置元数据 - 配置器层统一管理 */
  metadata?: {
    /** 配置版本 */
    version: string
    /** 创建时间 */
    createdAt: number
    /** 更新时间 */
    updatedAt: number
    /** 创建者 */
    createdBy?: string
    /** 配置描述 */
    description?: string
  }
}

/**
 * 配置表单组件的通用接口
 */
export interface ConfigFormProps<T = any> {
  /** 当前配置值 */
  modelValue: T
  /** 组件实例引用 */
  widget?: any
  /** 是否只读 */
  readonly?: boolean
  /** 是否显示高级选项 */
  showAdvanced?: boolean
}

/**
 * 配置表单组件的事件接口
 */
export interface ConfigFormEmits<T = any> {
  (event: 'update:modelValue', value: T): void
  (event: 'validate', result: ValidationResult): void
  (event: 'change', value: T, oldValue: T): void
}

/**
 * 配置验证结果
 */
export interface ValidationResult {
  /** 是否验证通过 */
  valid: boolean
  /** 验证错误信息 */
  errors?: {
    field: string
    message: string
    code?: string
  }[]
  /** 验证警告信息 */
  warnings?: {
    field: string
    message: string
    code?: string
  }[]
}

/**
 * 配置管理器接口
 */
export interface IConfigurationManager {
  /** 获取组件配置 */
  getConfiguration(widgetId: string): WidgetConfiguration | null

  /** 设置组件配置 */
  setConfiguration(widgetId: string, config: WidgetConfiguration): void

  /** 更新配置的某个部分 */
  updateConfiguration<K extends keyof WidgetConfiguration>(
    widgetId: string,
    section: K,
    config: WidgetConfiguration[K]
  ): void

  /** 重置配置到默认值 */
  resetConfiguration(widgetId: string): void

  /** 验证配置 */
  validateConfiguration(config: WidgetConfiguration): ValidationResult

  /** 导出配置 */
  exportConfiguration(widgetId: string): string

  /** 导入配置 */
  importConfiguration(widgetId: string, configData: string): boolean

  /** 监听配置变化 */
  onConfigurationChange(widgetId: string, callback: (config: WidgetConfiguration) => void): () => void
}

/**
 * 配置表单注册信息
 */
export interface ConfigFormRegistration {
  /** 组件类型 */
  componentType: string
  /** 配置表单组件 */
  formComponent: any
  /** 配置表单标题 */
  title?: string
  /** 配置表单描述 */
  description?: string
  /** 是否支持高级选项 */
  supportsAdvanced?: boolean
}

/**
 * 配置预设
 */
export interface ConfigurationPreset {
  /** 预设名称 */
  name: string
  /** 预设描述 */
  description?: string
  /** 预设配置 */
  config: Partial<WidgetConfiguration>
  /** 适用的组件类型 */
  componentTypes?: string[]
  /** 预设分类 */
  category?: string
  /** 是否为系统预设 */
  isSystem?: boolean
}

/**
 * 默认配置生成器
 */
export type ConfigurationGenerator<T = any> = (context: T) => WidgetConfiguration

/**
 * 配置迁移器接口
 * 用于处理配置版本升级
 */
export interface ConfigurationMigrator {
  /** 源版本 */
  fromVersion: string
  /** 目标版本 */
  toVersion: string
  /** 迁移函数 */
  migrate: (oldConfig: any) => WidgetConfiguration
}
