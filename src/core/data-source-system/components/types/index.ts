/**
 * 数据源配置系统 - 类型定义
 */

// 数据源接口定义
export interface DataSource {
  key: string
  name?: string
  description?: string
  fieldMappings?: Record<string, any>
  fieldsToMap?: Array<{ key: string; targetProperty: string }>
}

// 组件 Props 接口
export interface DataSourceConfigFormProps {
  selectedWidgetId?: string
  dataSources: DataSource[]
  /** v-model绑定值：完整的数据源配置对象 */
  modelValue?: any
}

// 组件 Emits 接口
export interface DataSourceConfigFormEmits {
  /** v-model更新事件 */
  (e: 'update:modelValue', value: any): void
  /** 请求当前运行时数据 */
  (e: 'request-current-data', widgetId: string): void
}

// 原始数据项类型枚举
export type RawDataItemType = 'json' | 'http' | 'websocket'

// 原始数据项接口定义
export interface RawDataItem {
  id: string
  name: string
  type: RawDataItemType // 数据项类型
  data: any
  config?: {
    // 数据过滤和处理配置
    filterPath?: string // 数据过滤路径（JSONPath格式）
    processScript?: string // 数据处理脚本
    // 根据类型存储不同的配置
    jsonData?: string // json类型的数据
    httpConfig?: {
      // http类型的配置
      url: string
      method: string
      headers?: Record<string, string>
    }
    websocketConfig?: {
      // websocket类型的配置
      url: string
      protocols?: string[]
    }
    // 支持扩展字段
    [key: string]: any
  }
  createdAt: string
  isActive: boolean
}

// 数据源最终处理类型
export type FinalProcessingType =
  | 'merge-object' // 对象合并（多个对象合并成一个大对象）
  | 'concat-array' // 数组连接（多个数组连接起来）
  | 'custom-script' // 自定义脚本（完全自定义处理逻辑）
  | 'select-specific' // 选择特定数据项（预留，后续实现条件使用等）

// 数据源值接口定义 - 原始数据项完全独立，新增最终处理配置
export interface DataSourceValue {
  currentData: any // 最终数据（完全独立）
  rawDataList: RawDataItem[] // 原始数据列表（完全独立，不影响最终数据）
  // 最终处理配置
  finalProcessingType: FinalProcessingType // 最终处理类型
  finalProcessingScript?: string // 自定义脚本内容
  finalProcessingConfig?: any // 其他处理配置（预留）
  // 选择特定数据项配置
  selectedDataItemIndex?: number // 选中的数据项索引
}
