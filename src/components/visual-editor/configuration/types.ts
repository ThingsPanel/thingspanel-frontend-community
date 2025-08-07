/**
 * Visual Editor 配置系统类型定义
 * 定义标准化的配置数据结构和接口
 */

export interface BaseConfiguration {
  /** 是否显示标题 */
  showTitle: boolean
  /** 组件标题 */
  title: string
  /** 组件透明度 */
  opacity?: number
  /** 是否可见 */
  visible?: boolean
  /** 自定义CSS类名 */
  customClassName?: string
  /** 边距配置 */
  margin?: {
    top?: number
    right?: number
    bottom?: number
    left?: number
  }
  /** 内边距配置 */
  padding?: {
    top?: number
    right?: number
    bottom?: number
    left?: number
  }
}

export interface DataSourceConfiguration {
  /** 数据源类型 */
  type: 'static' | 'api' | 'websocket' | 'script' | 'device' | null
  /** 数据源配置 */
  config: Record<string, any>
  /** 数据刷新间隔(秒) */
  refreshInterval?: number
  /** 是否启用数据缓存 */
  enableCache?: boolean
  /** 缓存时间(秒) */
  cacheTimeout?: number
  /** 错误重试次数 */
  retryAttempts?: number
  /** 数据映射配置 */
  dataMapping?: {
    [key: string]: string | ((data: any) => any)
  }
}

export interface InteractionConfiguration {
  /** 点击事件配置 */
  onClick?: InteractionConfig
  /** 悬停事件配置 */
  onHover?: InteractionConfig
  /** 双击事件配置 */
  onDoubleClick?: InteractionConfig
  /** 右键事件配置 */
  onRightClick?: InteractionConfig
}

export interface InteractionConfig {
  /** 交互类型 */
  type: 'none' | 'link' | 'internal_route' | 'modal' | 'drawer' | 'custom_script' | 'emit_event'
  /** 交互配置参数 */
  payload: {
    /** 链接地址 */
    url?: string
    /** 是否新标签页打开 */
    newTab?: boolean
    /** 内部路由 */
    route?: string
    /** 路由参数 */
    routeParams?: Record<string, any>
    /** 模态框配置 */
    modalConfig?: {
      title?: string
      width?: number
      height?: number
      content?: string
    }
    /** 抽屉配置 */
    drawerConfig?: {
      title?: string
      width?: number
      placement?: 'left' | 'right' | 'top' | 'bottom'
    }
    /** 自定义脚本 */
    script?: string
    /** 事件名称 */
    eventName?: string
    /** 事件参数 */
    eventData?: Record<string, any>
  }
  /** 是否启用 */
  enabled?: boolean
  /** 交互条件 */
  condition?: string | ((context: any) => boolean)
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
 * 完整的组件配置接口
 * 包含四个主要配置模块
 */
export interface WidgetConfiguration {
  /** 基础配置 - 由包装组件管理 */
  base: BaseConfiguration

  /** 组件自定义配置 - 由组件自己定义 */
  component: ComponentConfiguration

  /** 数据源配置 - 标准化结构 */
  dataSource: DataSourceConfiguration | null

  /** 交互配置 - 标准化结构 */
  interaction: InteractionConfiguration

  /** 配置元数据 */
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
