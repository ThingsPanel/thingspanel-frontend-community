/**
 * 简化的数据绑定类型定义
 * 替代原有的复杂data-binding/types.ts，提供简洁实用的数据绑定类型
 * 与核心类型系统保持一致
 */

// ============ 从核心类型系统重新导出 ============
export type {
  DataFieldType,
  DataValidationRule,
  DataSourceRequirement,
  StaticParamRequirement
} from '@/card2.1/types'

// ============ 简化的组件数据需求 ============

/**
 * 简化的数据字段需求定义
 * 去除了复杂的嵌套结构和高级特性
 */
export interface DataFieldRequirement {
  /** 字段名称 */
  name: string
  /** 字段标签 */
  label: string
  /** 数据字段类型 */
  type: DataFieldType
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
  /** 枚举选项（用于下拉选择等） */
  enum?: Array<{ label: string; value: any; description?: string }>
}

/**
 * 简化的组件数据需求定义
 * 去除了复杂的关系计算和高级特性，专注于核心数据需求声明
 */
export interface ComponentDataRequirement {
  /** 组件类型 */
  componentType: string
  /** 组件显示名称 */
  displayName: string
  /** 组件描述 */
  description: string
  /** 组件分类 */
  category?: string
  /** 需求版本（用于兼容性） */
  version?: string
  /** 数据字段需求列表 */
  dataFields: DataFieldRequirement[]
  /** 组件标签 */
  tags?: string[]
}

// ============ 响应式数据绑定（保持向后兼容） ============

/**
 * 响应式数据绑定接口
 * 简化的响应式数据管理
 */
export interface ReactiveDataBinding {
  /** 绑定ID */
  id: string
  /** 组件ID */
  componentId: string
  /** 数据源ID */
  dataSourceId: string
  /** 字段映射 */
  fieldMapping: Record<string, string>
  /** 是否启用 */
  enabled: boolean
  /** 更新模式 */
  updateMode?: 'auto' | 'manual' | 'interval'
  /** 更新间隔（毫秒） */
  updateInterval?: number
}

// ============ 数据源基础接口（简化版） ============

/**
 * 数据源类型
 */
export type DataSourceType = 'static' | 'api' | 'websocket' | 'script' | 'database'

/**
 * 基础数据源接口（简化版）
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
}

// ============ 向后兼容的别名 ============

/** @deprecated 使用 DataFieldType 替代 */
export type ValueDataType = 'number' | 'string' | 'boolean' | 'date' | 'any'

/** @deprecated 使用 DataValidationRule 替代 */
export interface DataValidationRuleCompat extends DataValidationRule {
  /** 自定义验证函数 */
  custom?: (value: any) => boolean | string
}