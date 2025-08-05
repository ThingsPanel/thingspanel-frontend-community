/**
 * 数据源测试组件类型定义
 */

// 组件数据需求声明接口
export interface ComponentDataSchema {
  [fieldName: string]: {
    type: 'string' | 'number' | 'boolean'
    required: boolean
    description: string
    defaultValue?: any
  }
}

// 数据源配置接口
export interface DataSourceConfig {
  id: string
  type: 'static'
  data: any
  fieldMappings: {
    [componentField: string]: string // 数据路径，如 'data.value' 或 'title'
  }
}

// 组件数据接口
export interface ComponentData {
  value: number
  title: string
  unit: string
}

// 数据绑定状态
export interface DataBindingStatus {
  [fieldName: string]: {
    isBound: boolean
    isValid: boolean
    currentValue: any
    error?: string
  }
}
