/**
 * Visual Editor 数据源配置类型定义
 * 专门用于在编辑器中配置组件的数据源和映射
 */

// ========== 组件数据源需求声明 ==========

/**
 * 数据源结构类型
 */
export type DataSourceStructureType = 'object' | 'array'

/**
 * 字段类型定义
 */
export type FieldType = 'string' | 'number' | 'boolean' | 'date' | 'any'

/**
 * 组件字段需求声明
 */
export interface ComponentFieldRequirement {
  /** 字段名 */
  name: string
  /** 字段类型 */
  type: FieldType
  /** 字段描述 */
  description: string
  /** 是否必填 */
  required: boolean
  /** 示例值 */
  example?: any
}

/**
 * 组件数据源需求声明
 */
export interface ComponentDataSourceRequirement {
  /** 数据源ID */
  id: string
  /** 数据源名称 */
  name: string
  /** 数据源结构类型 */
  structureType: DataSourceStructureType
  /** 字段需求列表 */
  fields: ComponentFieldRequirement[]
  /** 是否必填 */
  required: boolean
  /** 描述 */
  description?: string
  /** 用途说明 */
  usage?: string
}

/**
 * 组件完整数据需求声明
 */
export interface ComponentDataSourceRequirements {
  /** 组件ID */
  componentId: string
  /** 组件名称 */
  componentName: string
  /** 数据源需求列表 */
  dataSources: ComponentDataSourceRequirement[]
  /** 最小数据源数量 */
  minDataSources: number
  /** 最大数据源数量 */
  maxDataSources: number
  /** 描述 */
  description?: string
}

// ========== 数据源配置 ==========

/**
 * JSON数据源配置
 */
export interface JsonDataSourceConfig {
  /** 数据源ID */
  id: string
  /** 数据源名称 */
  name: string
  /** JSON数据 */
  jsonData: string
  /** 是否启用 */
  enabled: boolean
  /** 字段映射规则 */
  fieldMappings?: FieldMappingRule[]
  /** 创建时间 */
  createdAt: Date
  /** 更新时间 */
  updatedAt: Date
}

/**
 * 字段映射规则
 */
export interface FieldMappingRule {
  /** 目标字段名（组件期望的字段） */
  targetField: string
  /** 源数据路径（JSON路径，如 abc[1].dd.fr） */
  sourcePath: string
  /** 默认值 */
  defaultValue?: any
  /** 数据转换函数代码 */
  transformer?: string
  /** 是否启用此映射 */
  enabled: boolean
}

/**
 * 数据源字段映射配置
 */
export interface DataSourceFieldMapping {
  /** 数据源ID */
  dataSourceId: string
  /** 映射规则列表 */
  mappingRules: FieldMappingRule[]
}

/**
 * 组件数据源配置
 */
export interface ComponentDataSourceConfig {
  /** 组件ID */
  componentId: string
  /** JSON数据源配置列表 */
  jsonDataSources: JsonDataSourceConfig[]
  /** 字段映射配置列表 */
  fieldMappings: DataSourceFieldMapping[]
  /** 是否启用数据绑定 */
  enabled: boolean
  /** 配置版本 */
  version: string
}

// ========== 运行时数据 ==========

/**
 * 解析后的JSON数据结构信息
 */
export interface ParsedJsonStructure {
  /** 数据类型 */
  type: 'object' | 'array' | 'primitive'
  /** 字段列表（仅object类型） */
  fields?: Array<{
    name: string
    type: FieldType
    path: string
    example: any
  }>
  /** 数组元素结构（仅array类型） */
  arrayElementStructure?: ParsedJsonStructure
  /** 原始数据 */
  rawData: any
  /** 错误信息 */
  errors?: string[]
}

/**
 * 映射预览结果
 */
export interface MappingPreviewResult {
  /** 目标字段名 */
  targetField: string
  /** 映射后的值 */
  mappedValue: any
  /** 源路径 */
  sourcePath: string
  /** 是否成功映射 */
  success: boolean
  /** 错误信息 */
  error?: string
}

/**
 * 数据源配置状态
 */
export interface DataSourceConfigState {
  /** 当前选中的数据源索引 */
  activeDataSourceIndex: number
  /** 是否显示JSON编辑器 */
  showJsonEditor: boolean
  /** 是否显示映射预览 */
  showMappingPreview: boolean
  /** 映射预览结果 */
  previewResults: MappingPreviewResult[]
  /** 是否有未保存的更改 */
  hasUnsavedChanges: boolean
}

// ========== 工具函数类型 ==========

/**
 * JSON解析器接口
 */
export interface JsonParser {
  /**
   * 解析JSON字符串并分析结构
   */
  parse(jsonString: string): ParsedJsonStructure

  /**
   * 从数据中提取字段信息
   */
  extractFields(data: any, prefix?: string): ComponentFieldRequirement[]

  /**
   * 验证JSON格式
   */
  validateJson(jsonString: string): { valid: boolean; error?: string }
}

/**
 * 路径映射器接口
 */
export interface PathMapper {
  /**
   * 根据路径从数据中提取值
   */
  extractValueByPath(data: any, path: string): any

  /**
   * 验证路径格式
   */
  validatePath(path: string): boolean

  /**
   * 预览映射结果
   */
  previewMapping(data: any, mappingRules: FieldMappingRule[]): MappingPreviewResult[]
}

// ========== 数据源管理器类型 ==========

/**
 * 数据源配置管理器接口
 */
export interface DataSourceConfigManager {
  /**
   * 保存组件数据源配置
   */
  saveConfig(componentId: string, config: ComponentDataSourceConfig): void

  /**
   * 加载组件数据源配置
   */
  loadConfig(componentId: string): ComponentDataSourceConfig | null

  /**
   * 删除组件数据源配置
   */
  deleteConfig(componentId: string): void

  /**
   * 获取所有已配置的组件
   */
  getAllConfiguredComponents(): string[]

  /**
   * 验证配置的有效性
   */
  validateConfig(config: ComponentDataSourceConfig): { valid: boolean; errors: string[] }
}

// ========== 常量定义 ==========

/**
 * 数据源配置常量
 */
export const DATA_SOURCE_CONFIG_CONSTANTS = {
  /** 最大数据源数量 */
  MAX_DATA_SOURCES: 9,
  /** 最小数据源数量 */
  MIN_DATA_SOURCES: 0,
  /** 默认JSON数据源名称前缀 */
  DEFAULT_JSON_SOURCE_NAME_PREFIX: '数据源',
  /** 配置版本 */
  CONFIG_VERSION: '1.0.0',
  /** 本地存储键名前缀 */
  STORAGE_KEY_PREFIX: 'visual_editor_data_source_config_'
} as const

/**
 * 支持的字段类型选项
 */
export const FIELD_TYPE_OPTIONS = [
  { label: '字符串', value: 'string' },
  { label: '数字', value: 'number' },
  { label: '布尔值', value: 'boolean' },
  { label: '日期', value: 'date' },
  { label: '任意类型', value: 'any' }
] as const

/**
 * 数据源结构类型选项
 */
export const STRUCTURE_TYPE_OPTIONS = [
  { label: '对象', value: 'object', description: '单一对象结构，如 {name: "...", value: 123}' },
  { label: '数组', value: 'array', description: '数组结构，如 [{name: "...", value: 123}, ...]' }
] as const
