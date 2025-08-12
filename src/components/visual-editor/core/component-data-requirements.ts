/**
 * 组件数据需求声明系统
 * 提供标准化的方式让组件声明自己的数据源需求
 * 新版本支持详细的字段结构声明和数据源配置
 */

import type {
  ComponentDataSourceRequirements,
  ComponentDataSourceRequirement,
  ComponentFieldRequirement,
  DataSourceStructureType,
  FieldType
} from './data-source-config-types'

import { DATA_SOURCE_CONFIG_CONSTANTS } from './data-source-config-types'

// ========== 兼容性类型定义（保留旧版本支持）==========

export interface ComponentDataRequirements {
  componentId: string
  componentName: string
  dataSources: DataSourceRequirement[]
  maxDataSources?: number
  minDataSources?: number
}

export interface DataSourceRequirement {
  id: string
  name: string
  type: DataSourceType
  required: boolean
  description?: string
  usage?: string
  label?: string // 兼容性支持
  // 新增字段
  structureType?: DataSourceStructureType
  fields?: ComponentFieldRequirement[]
}

export type DataSourceType = 'static' | 'device' | 'http' | 'websocket' | 'json' | 'array' | 'object'

// ========== 数据源模板定义 ==========

export const DATA_SOURCE_TEMPLATES = {
  // JSON对象数据源模板
  JSON_OBJECT: {
    id: 'json_object',
    name: 'JSON对象数据源',
    type: 'object' as DataSourceStructureType,
    description: '静态JSON对象数据，适用于单一记录显示',
    usage: '用于显示单个对象的详细信息',
    fields: [
      { name: 'id', type: 'string' as FieldType, description: '唯一标识', required: true, example: 'device_001' },
      { name: 'name', type: 'string' as FieldType, description: '显示名称', required: true, example: '温度传感器' },
      { name: 'value', type: 'number' as FieldType, description: '数值', required: true, example: 25.6 }
    ]
  },

  // JSON数组数据源模板
  JSON_ARRAY: {
    id: 'json_array',
    name: 'JSON数组数据源',
    type: 'array' as DataSourceStructureType,
    description: '静态JSON数组数据，适用于列表和图表显示',
    usage: '用于显示数据列表或时间序列',
    fields: [
      {
        name: 'time',
        type: 'string' as FieldType,
        description: '时间戳',
        required: true,
        example: '2024-01-01T00:00:00'
      },
      { name: 'value', type: 'number' as FieldType, description: '数值', required: true, example: 123.45 },
      { name: 'status', type: 'string' as FieldType, description: '状态', required: false, example: 'online' }
    ]
  },

  // 统计数据模板
  STATISTICS: {
    id: 'statistics',
    name: '统计数据源',
    type: 'object' as DataSourceStructureType,
    description: '统计汇总数据，适用于仪表板概览',
    usage: '用于显示汇总指标和统计信息',
    fields: [
      { name: 'total', type: 'number' as FieldType, description: '总数', required: true, example: 1000 },
      { name: 'active', type: 'number' as FieldType, description: '活跃数', required: true, example: 850 },
      { name: 'rate', type: 'number' as FieldType, description: '比率', required: false, example: 85.5 }
    ]
  },

  // 时间序列数据模板
  TIME_SERIES: {
    id: 'time_series',
    name: '时间序列数据源',
    type: 'array' as DataSourceStructureType,
    description: '时间序列数据，适用于趋势图表',
    usage: '用于显示数据随时间的变化趋势',
    fields: [
      {
        name: 'timestamp',
        type: 'string' as FieldType,
        description: '时间戳',
        required: true,
        example: '2024-01-01T00:00:00Z'
      },
      { name: 'value', type: 'number' as FieldType, description: '数值', required: true, example: 25.6 },
      { name: 'label', type: 'string' as FieldType, description: '标签', required: false, example: '温度' }
    ]
  }
} as const

/**
 * 数据需求构建器
 * 提供链式API来构建组件数据需求
 */
export class ComponentDataRequirementsBuilder {
  private requirements: ComponentDataRequirements

  constructor(componentId: string, componentName: string) {
    this.requirements = {
      componentId,
      componentName,
      dataSources: [],
      maxDataSources: 5,
      minDataSources: 1
    }
  }

  /**
   * 添加数据源需求
   */
  addDataSource(config: {
    id: string
    name: string
    label?: string // 兼容性支持
    type: DataSourceType
    required?: boolean
    description?: string
    usage?: string
    icon?: string
    defaultConfig?: any
    // 新增字段支持
    structureType?: DataSourceStructureType
    fields?: ComponentFieldRequirement[]
  }): this {
    const requirement: DataSourceRequirement = {
      id: config.id,
      name: config.name,
      label: config.label || config.name, // 兼容性支持
      type: config.type,
      required: config.required ?? false,
      description: config.description ?? '',
      usage: config.usage ?? '',
      structureType: config.structureType,
      fields: config.fields || []
    }

    this.requirements.dataSources.push(requirement)
    return this
  }

  /**
   * 添加详细的数据源需求（新版本API）
   */
  addDetailedDataSource(config: {
    id: string
    name: string
    structureType: DataSourceStructureType
    fields: ComponentFieldRequirement[]
    required?: boolean
    description?: string
    usage?: string
  }): this {
    return this.addDataSource({
      ...config,
      type: config.structureType as DataSourceType,
      structureType: config.structureType,
      fields: config.fields
    })
  }

  /**
   * 使用模板添加数据源需求
   */
  addTemplate(template: keyof typeof DATA_SOURCE_TEMPLATES, overrides?: Partial<DataSourceRequirement>): this {
    const templateConfig = DATA_SOURCE_TEMPLATES[template]
    return this.addDataSource({
      id: templateConfig.id,
      name: templateConfig.name,
      type: templateConfig.type as DataSourceType,
      structureType: templateConfig.type,
      fields: templateConfig.fields,
      description: templateConfig.description,
      usage: templateConfig.usage,
      required: false,
      ...overrides
    })
  }

  /**
   * 设置数据源数量限制
   */
  setLimits(min: number, max: number): this {
    this.requirements.minDataSources = min
    this.requirements.maxDataSources = max
    return this
  }

  /**
   * 构建最终需求对象
   */
  build(): ComponentDataRequirements {
    return { ...this.requirements }
  }
}

/**
 * 创建数据需求构建器
 */
export function createComponentDataRequirements(
  componentId: string,
  componentName: string
): ComponentDataRequirementsBuilder {
  return new ComponentDataRequirementsBuilder(componentId, componentName)
}

/**
 * 常用组件数据需求预设
 */
export const COMPONENT_DATA_PRESETS = {
  /**
   * 单一时间序列图表
   */
  TIME_SERIES_CHART: createComponentDataRequirements('time-series-chart', '时间序列图表')
    .addTemplate('TIME_SERIES', { id: 'time_data', required: true })
    .setLimits(1, 1)
    .build(),

  /**
   * 双轴对比图表
   */
  DUAL_AXIS_CHART: createComponentDataRequirements('dual-axis-chart', '双轴对比图表')
    .addDetailedDataSource({
      id: 'primary',
      name: '主要数据',
      structureType: 'array',
      required: true,
      description: '主轴数据，显示在左轴',
      usage: '主要的时间序列数据',
      fields: [
        { name: 'time', type: 'string', description: '时间', required: true, example: '2024-01-01T00:00:00Z' },
        { name: 'value', type: 'number', description: '数值', required: true, example: 100.5 }
      ]
    })
    .addDetailedDataSource({
      id: 'secondary',
      name: '次要数据',
      structureType: 'array',
      required: true,
      description: '次轴数据，显示在右轴',
      usage: '与主数据进行对比的时间序列数据',
      fields: [
        { name: 'time', type: 'string', description: '时间', required: true, example: '2024-01-01T00:00:00Z' },
        { name: 'value', type: 'number', description: '数值', required: true, example: 50.2 }
      ]
    })
    .setLimits(2, 2)
    .build(),

  /**
   * 仪表板概览组件
   */
  DASHBOARD_OVERVIEW: createComponentDataRequirements('dashboard-overview', '仪表板概览')
    .addTemplate('TIME_SERIES', {
      id: 'trend',
      name: '趋势数据',
      required: true,
      description: '用于显示趋势图表'
    })
    .addTemplate('STATISTICS', {
      id: 'stats',
      name: '统计数据',
      required: true,
      description: '用于显示汇总指标'
    })
    .setLimits(2, 4)
    .build(),

  /**
   * 灵活的数据可视化组件
   */
  FLEXIBLE_CHART: createComponentDataRequirements('flexible-chart', '灵活图表')
    .addDetailedDataSource({
      id: 'primary',
      name: '主要数据源',
      structureType: 'array',
      required: true,
      description: '主要的数据源，支持数组格式',
      usage: '图表的主要数据',
      fields: [
        { name: 'label', type: 'string', description: '标签', required: true, example: '类别A' },
        { name: 'value', type: 'number', description: '数值', required: true, example: 123.45 }
      ]
    })
    .addDetailedDataSource({
      id: 'secondary',
      name: '辅助数据源',
      structureType: 'object',
      required: false,
      description: '可选的辅助数据源',
      usage: '用于对比或补充的数据',
      fields: [
        { name: 'total', type: 'number', description: '总计', required: true, example: 1000 },
        { name: 'average', type: 'number', description: '平均值', required: false, example: 85.5 }
      ]
    })
    .setLimits(1, 3)
    .build(),

  /**
   * JSON数据展示组件 - 新增预设
   */
  JSON_DATA_DISPLAY: createComponentDataRequirements('json-data-display', 'JSON数据展示')
    .addTemplate('JSON_OBJECT', {
      id: 'display_data',
      required: true,
      description: '要显示的JSON对象数据'
    })
    .setLimits(1, 1)
    .build(),

  /**
   * 数据列表组件 - 新增预设
   */
  DATA_LIST: createComponentDataRequirements('data-list', '数据列表')
    .addTemplate('JSON_ARRAY', {
      id: 'list_data',
      required: true,
      description: '列表显示的数组数据'
    })
    .setLimits(1, 2)
    .build(),

  /**
   * 多数据源汇总组件 - 新增预设
   */
  MULTI_SOURCE_SUMMARY: createComponentDataRequirements('multi-source-summary', '多数据源汇总')
    .addTemplate('STATISTICS', {
      id: 'summary_stats',
      required: true,
      description: '汇总统计数据'
    })
    .addTemplate('JSON_ARRAY', {
      id: 'detail_list',
      required: false,
      description: '详细数据列表'
    })
    .addTemplate('JSON_OBJECT', {
      id: 'config_data',
      required: false,
      description: '配置参数'
    })
    .setLimits(1, DATA_SOURCE_CONFIG_CONSTANTS.MAX_DATA_SOURCES)
    .build()
}

/**
 * 组件数据需求注册表
 */
export class ComponentDataRequirementsRegistry {
  private static instance: ComponentDataRequirementsRegistry
  private requirements = new Map<string, ComponentDataRequirements>()

  private constructor() {}

  static getInstance(): ComponentDataRequirementsRegistry {
    if (!this.instance) {
      this.instance = new ComponentDataRequirementsRegistry()
    }
    return this.instance
  }

  /**
   * 注册组件数据需求
   */
  register(componentId: string, requirements: ComponentDataRequirements): void {
    this.requirements.set(componentId, requirements)
    console.log(`📋 [ComponentDataRequirements] 注册组件数据需求: ${componentId}`)
  }

  /**
   * 获取组件数据需求
   */
  get(componentId: string): ComponentDataRequirements | undefined {
    return this.requirements.get(componentId)
  }

  /**
   * 检查组件是否已注册
   */
  has(componentId: string): boolean {
    return this.requirements.has(componentId)
  }

  /**
   * 获取所有已注册的组件
   */
  getAllComponentIds(): string[] {
    return Array.from(this.requirements.keys())
  }

  /**
   * 批量注册预设
   */
  registerPresets(): void {
    Object.entries(COMPONENT_DATA_PRESETS).forEach(([key, preset]) => {
      this.register(preset.componentId, preset)
    })
  }

  /**
   * 清空注册表
   */
  clear(): void {
    this.requirements.clear()
  }
}

/**
 * 全局实例
 */
export const componentDataRequirementsRegistry = ComponentDataRequirementsRegistry.getInstance()

/**
 * 注册组件数据需求的装饰器工厂
 */
export function registerComponentDataRequirements(requirements: ComponentDataRequirements) {
  return function <T extends { new (...args: any[]): {} }>(constructor: T) {
    componentDataRequirementsRegistry.register(requirements.componentId, requirements)
    return constructor
  }
}

/**
 * 获取组件数据需求
 */
export function getComponentDataRequirements(componentId: string): ComponentDataRequirements | undefined {
  // 首先从注册表查找
  let requirements = componentDataRequirementsRegistry.get(componentId)

  // 如果没找到，尝试从预设中查找
  if (!requirements) {
    const presetKey = Object.keys(COMPONENT_DATA_PRESETS).find(
      key => COMPONENT_DATA_PRESETS[key as keyof typeof COMPONENT_DATA_PRESETS].componentId === componentId
    )

    if (presetKey) {
      requirements = COMPONENT_DATA_PRESETS[presetKey as keyof typeof COMPONENT_DATA_PRESETS]
    }
  }

  return requirements
}

/**
 * 验证数据需求的合法性
 */
export function validateDataRequirements(requirements: ComponentDataRequirements): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []

  // 检查基本字段
  if (!requirements.componentId) {
    errors.push('componentId 不能为空')
  }

  if (!requirements.componentName) {
    errors.push('componentName 不能为空')
  }

  // 检查数据源需求
  if (!requirements.dataSources || requirements.dataSources.length === 0) {
    errors.push('至少需要声明一个数据源需求')
  }

  // 检查数量限制
  if (requirements.minDataSources < 0) {
    errors.push('minDataSources 不能小于 0')
  }

  if (requirements.maxDataSources < requirements.minDataSources) {
    errors.push('maxDataSources 不能小于 minDataSources')
  }

  if (requirements.dataSources) {
    // 检查数据源ID重复
    const ids = requirements.dataSources.map(ds => ds.id)
    const uniqueIds = new Set(ids)
    if (ids.length !== uniqueIds.size) {
      errors.push('数据源ID不能重复')
    }

    // 检查必需数据源数量
    const requiredCount = requirements.dataSources.filter(ds => ds.required).length
    if (requiredCount > requirements.maxDataSources) {
      errors.push('必需数据源数量不能超过最大数量限制')
    }

    // 检查各个数据源需求
    requirements.dataSources.forEach((ds, index) => {
      if (!ds.id) {
        errors.push(`数据源 ${index + 1} 缺少 id`)
      }
      if (!ds.label) {
        errors.push(`数据源 ${ds.id || index + 1} 缺少 label`)
      }
      if (!ds.type) {
        errors.push(`数据源 ${ds.id || index + 1} 缺少 type`)
      }
    })
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}
