/**
 * 多数据源架构类型定义
 * 支持组件声明多个数据源需求，实现复杂可视化场景
 */

export type DataSourceType = 'array' | 'object' | 'mixed' | 'any'
export type DataSourceStatus = 'pending' | 'configured' | 'connected' | 'error'

/**
 * 数据源需求声明
 * 组件声明自己需要的数据源类型和数量
 */
export interface DataSourceRequirement {
  /** 数据源唯一标识 */
  id: string
  /** 用户显示名称 */
  label: string
  /** 数据源类型 */
  type: DataSourceType
  /** 是否必需 */
  required: boolean
  /** 描述信息 */
  description: string
  /** 用途说明 */
  usage: string
  /** 图标 (可选) */
  icon?: string
  /** 默认配置 */
  defaultConfig?: any
}

/**
 * 数据源配置项
 * 单个数据源的完整配置信息
 */
export interface DataSourceConfig {
  /** 数据源ID */
  id: string
  /** 数据源类型 */
  type: DataSourceType
  /** 是否启用 */
  enabled: boolean
  /** 配置状态 */
  status: DataSourceStatus
  /** 原始数据 */
  data?: any
  /** 数据配置（如数组字段映射） */
  config?: {
    arrayConfig?: {
      xField: string
      yField: string
      labelField?: string
    }
    objectConfig?: {
      selectedFields: string[]
    }
    [key: string]: any
  }
  /** 最后更新时间 */
  lastUpdated?: number
  /** 错误信息 */
  error?: string
}

/**
 * 多数据源配置集合
 * 管理组件的所有数据源
 */
export interface MultiDataSourceConfig {
  /** 数据源配置映射 */
  dataSources: Record<string, DataSourceConfig>
  /** 数据源到组件属性的绑定 */
  bindings: Record<string, string>
  /** 配置元信息 */
  metadata: {
    /** 创建时间 */
    createdAt: number
    /** 最后更新时间 */
    updatedAt: number
    /** 配置版本 */
    version: string
  }
}

/**
 * 组件多数据源需求定义
 * 组件声明自己的数据源需求
 */
export interface ComponentDataRequirements {
  /** 数据源需求列表 */
  dataSources: DataSourceRequirement[]
  /** 最大数据源数量限制 */
  maxDataSources: number
  /** 最小数据源数量要求 */
  minDataSources: number
  /** 组件标识 */
  componentId: string
  /** 组件名称 */
  componentName: string
}

/**
 * 数据源管理器接口
 * 定义多数据源管理的核心方法
 */
export interface IMultiDataSourceManager {
  /** 初始化数据源配置 */
  initialize(requirements: ComponentDataRequirements): Promise<void>
  
  /** 添加数据源 */
  addDataSource(requirement: DataSourceRequirement): Promise<string>
  
  /** 移除数据源 */
  removeDataSource(id: string): Promise<void>
  
  /** 更新数据源配置 */
  updateDataSource(id: string, config: Partial<DataSourceConfig>): Promise<void>
  
  /** 获取数据源配置 */
  getDataSource(id: string): DataSourceConfig | undefined
  
  /** 获取所有数据源 */
  getAllDataSources(): Record<string, DataSourceConfig>
  
  /** 验证配置完整性 */
  validateConfiguration(): { isValid: boolean; errors: string[] }
  
  /** 获取绑定到组件属性的数据 */
  getBoundData(propertyName: string): any
  
  /** 设置数据源绑定 */
  setBinding(propertyName: string, dataSourceId: string): void
  
  /** 清理资源 */
  cleanup(): void
}

/**
 * 数据源更新事件
 */
export interface DataSourceUpdateEvent {
  /** 数据源ID */
  dataSourceId: string
  /** 更新类型 */
  type: 'data' | 'config' | 'status'
  /** 新值 */
  value: any
  /** 时间戳 */
  timestamp: number
}

/**
 * 数据源验证结果
 */
export interface DataSourceValidationResult {
  /** 是否有效 */
  isValid: boolean
  /** 错误信息列表 */
  errors: string[]
  /** 警告信息列表 */
  warnings: string[]
  /** 验证详情 */
  details: {
    dataSourceId: string
    fieldValidation?: {
      [fieldName: string]: {
        isValid: boolean
        error?: string
      }
    }
  }[]
}

/**
 * 常用数据源模板
 */
export const DATA_SOURCE_TEMPLATES = {
  TIME_SERIES: {
    id: 'timeSeries',
    label: '时间序列数据',
    type: 'array' as DataSourceType,
    required: true,
    description: '时间序列数据，用于绘制趋势图表',
    usage: '主要用于折线图、柱状图等时间相关的可视化',
    icon: 'chart-line'
  },
  STATISTICS: {
    id: 'statistics',
    label: '统计数据',
    type: 'object' as DataSourceType,
    required: false,
    description: '统计汇总数据，如总数、平均值等',
    usage: '用于显示汇总信息、指标卡片',
    icon: 'stats'
  },
  COMPARISON: {
    id: 'comparison',
    label: '对比数据',
    type: 'array' as DataSourceType,
    required: false,
    description: '用于对比分析的数据集',
    usage: '双轴图、对比图表',
    icon: 'compare'
  }
} as const