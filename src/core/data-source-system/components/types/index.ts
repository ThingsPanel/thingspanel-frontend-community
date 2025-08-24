/**
 * 数据源配置系统 - 统一类型定义入口
 * 整合所有子模块的类型定义
 */

// 从各个模块导出类型（注意：先导出再重新定义，避免循环依赖）
export * from '../data-source-config-form/types/http-config'
export * from '../data-source-config-form/types/websocket-config'
export * from '../data-source-config-form/types/raw-data'
export * from '../data-source-config-form/types/final-processing'
export * from '../data-source-config-form/types/modal-types'
export * from '../data-source-config-form/types/event-types'
export * from '../data-source-config-form/types/validator-types'
export * from '../data-source-config-form/types/form-interfaces'

// 重新定义核心类型（向后兼容）
export type { RawDataItem, RawDataItemType } from '../data-source-config-form/types/raw-data'
export type { FinalProcessingType, FinalProcessingConfig } from '../data-source-config-form/types/final-processing'
export type { HttpDataSourceConfig, HttpMethod } from '../data-source-config-form/types/http-config'
export type { WebSocketDataSourceConfig } from '../data-source-config-form/types/websocket-config'

// 数据源接口定义（增强版）
export interface DataSource {
  /** 数据源唯一标识 */
  key: string
  /** 数据源名称 */
  name?: string
  /** 数据源描述 */
  description?: string
  /** 数据源类型 */
  type: 'http' | 'websocket' | 'static' | 'computed'
  /** 示例数据 */
  example?: any
  /** 字段映射配置 */
  fieldMappings?: Record<string, any>
  /** 需要映射的字段列表 */
  fieldsToMap?: Array<{ key: string; targetProperty: string }>
  /** 数据源元数据 */
  metadata?: {
    /** 创建时间 */
    createdAt: string
    /** 更新时间 */
    updatedAt: string
    /** 创建者 */
    createdBy?: string
    /** 版本号 */
    version: string
    /** 标签 */
    tags?: string[]
  }
}

// 组件 Props 接口（增强版）
export interface DataSourceConfigFormProps {
  /** 选中的组件ID */
  selectedWidgetId?: string
  /** 数据源定义列表 */
  dataSources: Record<string, DataSource>
  /** 组件ID */
  componentId: string
  /** 组件类型 */
  componentType: string
  /** v-model绑定值：完整的数据源配置对象 */
  modelValue?: any
  /** 是否只读模式 */
  readonly?: boolean
  /** 调试模式 */
  debugMode?: boolean
}

// 组件 Emits 接口（增强版）
export interface DataSourceConfigFormEmits {
  /** v-model更新事件 */
  'update:modelValue': (value: any) => void
  /** 数据变更通知 */
  dataChange: (dataSourceKey: string, data: any) => void
  /** 配置同步事件 */
  configSync: (config: any) => void
  /** 请求当前运行时数据 */
  'request-current-data': (widgetId: string) => void
  /** 错误事件 */
  error: (error: { code: string; message: string; details?: any }) => void
}

// 数据源值接口定义（增强版）
export interface DataSourceValue {
  /** 最终数据（处理后的结果） */
  currentData: any
  /** 最后更新时间 */
  lastUpdateTime: number
  /** 原始数据项列表 */
  rawDataList: RawDataItem[]
  /** 最终处理配置 */
  finalProcessingType: FinalProcessingType
  /** 最终处理的具体配置 */
  finalProcessingConfig: FinalProcessingConfig
  /** 自定义脚本内容（向后兼容） */
  finalProcessingScript?: string
  /** 选中的数据项索引（特定选择模式） */
  selectedDataItemIndex?: number
  /** 数据源状态 */
  status: {
    /** 处理状态 */
    processing: boolean
    /** 错误信息 */
    error?: string
    /** 最后成功时间 */
    lastSuccessTime?: number
  }
}

// 组件完整状态接口
export interface DataSourceConfigFormState {
  /** 所有数据源的状态映射 */
  dataValues: Record<string, DataSourceValue>
  /** 当前激活的数据源键 */
  activeDataSourceKey: string
  /** 所有弹窗状态 */
  modals: AllModalStates
  /** 表单验证状态 */
  validation: FormValidationState
  /** 组件配置 */
  config: {
    /** 是否显示调试信息 */
    showDebugInfo: boolean
    /** 是否启用实时预览 */
    enableRealTimePreview: boolean
    /** 自动保存间隔（秒） */
    autoSaveInterval: number
  }
}
