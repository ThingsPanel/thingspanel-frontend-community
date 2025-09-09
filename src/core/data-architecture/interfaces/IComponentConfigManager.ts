/**
 * 组件配置管理接口
 * 负责管理单个组件的四层配置：基础配置、组件属性、数据源配置、交互配置
 */

/**
 * 配置层类型
 */
export type ConfigLayer = 'base' | 'component' | 'dataSource' | 'interaction'

/**
 * 基础配置（位置、大小、样式等）
 */
export interface BaseConfig {
  position?: { x: number; y: number }
  size?: { width: number; height: number }
  zIndex?: number
  visible?: boolean
  locked?: boolean
  [key: string]: any
}

/**
 * 组件属性配置（组件特有的业务属性）
 */
export interface ComponentConfig {
  properties?: Record<string, any>
  styles?: Record<string, any>
  behavior?: Record<string, any>
  [key: string]: any
}

/**
 * 数据源配置（数据绑定相关）
 */
export interface DataSourceConfig {
  type?: 'static' | 'api' | 'websocket' | 'data-source-bindings'
  enabled?: boolean
  dataSourceBindings?: Record<string, any>
  config?: Record<string, any>
  metadata?: {
    componentType?: string
    updatedAt?: number
    source?: string
    [key: string]: any
  }
  [key: string]: any
}

/**
 * 交互配置（事件响应、动作等）
 */
export interface InteractionConfig {
  configs?: Array<{
    trigger: string
    action: string
    target?: string
    [key: string]: any
  }>
  enabled?: boolean
  metadata?: {
    updatedAt?: number
    [key: string]: any
  }
  [key: string]: any
}

/**
 * 组件完整配置
 */
export interface WidgetConfiguration {
  /** 基础配置层 */
  base: BaseConfig
  /** 组件配置层 */
  component: ComponentConfig
  /** 数据源配置层 */
  dataSource: DataSourceConfig
  /** 交互配置层 */
  interaction: InteractionConfig
  /** 配置元数据 */
  metadata: {
    version: string
    createdAt: number
    updatedAt: number
    description?: string
  }
}

/**
 * 配置变更事件
 */
export interface ConfigChangeEvent {
  widgetId: string
  layer: ConfigLayer
  oldConfig?: any
  newConfig: any
  timestamp: number
}

/**
 * 配置验证结果
 */
export interface ConfigValidationResult {
  valid: boolean
  errors?: Array<{
    layer: ConfigLayer
    field: string
    message: string
  }>
  warnings?: Array<{
    layer: ConfigLayer
    field: string
    message: string
  }>
}

/**
 * 组件配置管理器接口
 * 职责：
 * 1. 管理组件的四层配置数据存取
 * 2. 提供配置验证和默认值处理
 * 3. 发出配置变更事件，但不直接触发数据执行
 * 4. 支持配置的导入导出和版本管理
 */
export interface IComponentConfigManager {
  /**
   * 获取组件完整配置
   */
  getConfiguration(widgetId: string): WidgetConfiguration | null

  /**
   * 设置组件完整配置
   */
  setConfiguration(widgetId: string, config: WidgetConfiguration): void

  /**
   * 获取特定层的配置
   */
  getLayerConfig<T = any>(widgetId: string, layer: ConfigLayer): T | null

  /**
   * 更新特定层的配置
   */
  updateLayerConfig<T = any>(widgetId: string, layer: ConfigLayer, config: T): void

  /**
   * 删除组件配置
   */
  deleteConfiguration(widgetId: string): boolean

  // --- 配置验证和默认值 ---

  /**
   * 验证配置
   */
  validateConfiguration(config: WidgetConfiguration): ConfigValidationResult

  /**
   * 创建默认配置
   */
  createDefaultConfiguration(): WidgetConfiguration

  /**
   * 获取层级默认配置
   */
  getLayerDefaults<T = any>(layer: ConfigLayer): T

  // --- 批量操作 ---

  /**
   * 获取所有组件配置
   */
  getAllConfigurations(): Record<string, WidgetConfiguration>

  /**
   * 批量设置配置
   */
  setMultipleConfigurations(configs: Record<string, WidgetConfiguration>): void

  /**
   * 清空所有配置
   */
  clearAllConfigurations(): void

  // --- 事件监听 ---

  /**
   * 监听配置变更
   */
  onConfigChange(listener: (event: ConfigChangeEvent) => void): () => void

  /**
   * 监听特定组件配置变更
   */
  onWidgetConfigChange(widgetId: string, listener: (event: ConfigChangeEvent) => void): () => void

  /**
   * 监听特定层配置变更
   */
  onLayerConfigChange(layer: ConfigLayer, listener: (event: ConfigChangeEvent) => void): () => void

  // --- 导入导出 ---

  /**
   * 导出配置
   */
  exportConfiguration(widgetId?: string): any

  /**
   * 导入配置
   */
  importConfiguration(data: any, widgetId?: string): boolean

  /**
   * 清理资源
   */
  destroy(): void
}
