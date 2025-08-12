/**
 * 组件数据需求声明系统
 * 提供标准化的方式让组件声明自己的数据源需求
 */

// import type { 
//   ComponentDataRequirements, 
//   DataSourceRequirement,
//   DataSourceType 
// } from './multi-data-source-types' // 临时注释，文件不存在
// import { DATA_SOURCE_TEMPLATES } from './multi-data-source-types' // 临时注释，文件不存在

// 临时类型定义
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
}

export type DataSourceType = 'static' | 'device' | 'http' | 'websocket'

export const DATA_SOURCE_TEMPLATES = {}

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
    label: string
    type: DataSourceType
    required?: boolean
    description?: string
    usage?: string
    icon?: string
    defaultConfig?: any
  }): this {
    const requirement: DataSourceRequirement = {
      id: config.id,
      label: config.label,
      type: config.type,
      required: config.required ?? false,
      description: config.description ?? '',
      usage: config.usage ?? '',
      icon: config.icon,
      defaultConfig: config.defaultConfig
    }

    this.requirements.dataSources.push(requirement)
    return this
  }

  /**
   * 使用模板添加数据源需求
   */
  addTemplate(template: keyof typeof DATA_SOURCE_TEMPLATES, overrides?: Partial<DataSourceRequirement>): this {
    const templateConfig = DATA_SOURCE_TEMPLATES[template]
    return this.addDataSource({
      ...templateConfig,
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
export function createComponentDataRequirements(componentId: string, componentName: string): ComponentDataRequirementsBuilder {
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
    .addTemplate('TIME_SERIES', { required: true })
    .setLimits(1, 1)
    .build(),

  /**
   * 双轴对比图表
   */
  DUAL_AXIS_CHART: createComponentDataRequirements('dual-axis-chart', '双轴对比图表')
    .addDataSource({
      id: 'primary',
      label: '主要数据',
      type: 'array',
      required: true,
      description: '主轴数据，显示在左轴',
      usage: '主要的时间序列数据'
    })
    .addDataSource({
      id: 'secondary', 
      label: '次要数据',
      type: 'array',
      required: true,
      description: '次轴数据，显示在右轴',
      usage: '与主数据进行对比的时间序列数据'
    })
    .setLimits(2, 2)
    .build(),

  /**
   * 仪表板概览组件
   */
  DASHBOARD_OVERVIEW: createComponentDataRequirements('dashboard-overview', '仪表板概览')
    .addTemplate('TIME_SERIES', { 
      id: 'trend',
      label: '趋势数据',
      required: true,
      description: '用于显示趋势图表'
    })
    .addTemplate('STATISTICS', { 
      id: 'stats',
      label: '统计数据',
      required: true,
      description: '用于显示汇总指标'
    })
    .setLimits(2, 4)
    .build(),

  /**
   * 灵活的数据可视化组件
   */
  FLEXIBLE_CHART: createComponentDataRequirements('flexible-chart', '灵活图表')
    .addDataSource({
      id: 'primary',
      label: '主要数据源',
      type: 'any',
      required: true,
      description: '主要的数据源，支持任意格式',
      usage: '图表的主要数据'
    })
    .addDataSource({
      id: 'secondary',
      label: '辅助数据源',
      type: 'any', 
      required: false,
      description: '可选的辅助数据源',
      usage: '用于对比或补充的数据'
    })
    .setLimits(1, 3)
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
  return function<T extends { new(...args: any[]): {} }>(constructor: T) {
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
    const presetKey = Object.keys(COMPONENT_DATA_PRESETS).find(key => 
      COMPONENT_DATA_PRESETS[key as keyof typeof COMPONENT_DATA_PRESETS].componentId === componentId
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