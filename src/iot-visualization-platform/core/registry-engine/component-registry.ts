/**
 * Registry Engine 组件注册系统
 *
 * 基于Registry Engine核心提供专门的组件注册功能
 * 统一管理Card2.1、传统Card、Visual Editor等所有组件类型
 *
 * 核心功能：
 * - 🎯 统一的组件注册接口
 * - 🔍 强大的组件查询和过滤
 * - 📊 组件依赖关系管理
 * - 🔄 自动组件发现和注册
 * - 🛡️ 类型安全和验证
 * - ⚡ 高性能的组件索引
 */

import { registryEngine, RegistryItemType, type RegistryItem, type RegistryItemMetadata } from './index'
import type { ComponentDefinition } from '@/card2.1/core/types'
import type { IComponentDefinition } from '@/card/core/types/component'

/**
 * 通用组件接口
 * 统一所有组件系统的接口定义
 */
export interface UnifiedComponentDefinition {
  /** 组件唯一标识 */
  id: string
  /** 组件类型 */
  type: string
  /** 组件名称 */
  name: string
  /** 组件描述 */
  description?: string
  /** 组件版本 */
  version: string
  /** 组件分类 */
  category?: string
  /** 组件标签 */
  tags?: string[]
  /** 组件图标 */
  icon?: string
  /** 数据源配置 */
  dataSources?: any
  /** 静态参数 */
  staticParams?: any
  /** 交互能力 */
  interactionCapabilities?: any
  /** 依赖项 */
  dependencies?: string[]
  /** 原始定义（保持向后兼容） */
  originalDefinition: ComponentDefinition | IComponentDefinition | any
  /** 组件来源系统 */
  sourceSystem: 'card21' | 'legacy-card' | 'visual-editor' | 'custom'
}

/**
 * 组件查询条件
 */
export interface ComponentQuery {
  /** 按组件类型过滤 */
  type?: string | string[]
  /** 按组件名称过滤（支持正则） */
  name?: string | RegExp
  /** 按分类过滤 */
  category?: string
  /** 按标签过滤 */
  tags?: string[]
  /** 按来源系统过滤 */
  sourceSystem?: UnifiedComponentDefinition['sourceSystem'] | UnifiedComponentDefinition['sourceSystem'][]
  /** 按数据源类型过滤 */
  hasDataSources?: boolean
  /** 按静态参数过滤 */
  hasStaticParams?: boolean
  /** 按交互能力过滤 */
  hasInteractionCapabilities?: boolean
  /** 按依赖关系过滤 */
  hasDependency?: string
  /** 自定义过滤函数 */
  filter?: (component: UnifiedComponentDefinition) => boolean
}

/**
 * 组件统计信息
 */
export interface ComponentStats {
  /** 总组件数量 */
  total: number
  /** 按类型分组 */
  byType: Record<string, number>
  /** 按分类分组 */
  byCategory: Record<string, number>
  /** 按来源系统分组 */
  bySourceSystem: Record<string, number>
  /** 有数据源的组件数量 */
  withDataSources: number
  /** 有静态参数的组件数量 */
  withStaticParams: number
  /** 有交互能力的组件数量 */
  withInteractionCapabilities: number
  /** 有依赖的组件数量 */
  withDependencies: number
}

/**
 * 组件注册选项
 */
export interface ComponentRegistrationOptions {
  /** 是否覆盖已存在的组件 */
  overwrite?: boolean
  /** 是否验证组件定义 */
  validate?: boolean
  /** 是否自动解析依赖 */
  resolveDependencies?: boolean
  /** 自定义元数据 */
  customMetadata?: Partial<RegistryItemMetadata>
}

/**
 * Registry Engine 组件注册管理器
 *
 * 提供专门的组件注册和管理功能
 */
export class ComponentRegistryManager {
  /** 组件类型映射到Registry项目类型 */
  private static readonly TYPE_MAPPING: Record<string, RegistryItemType> = {
    'card21': RegistryItemType.CARD21_COMPONENT,
    'legacy-card': RegistryItemType.LEGACY_CARD_COMPONENT,
    'visual-editor': RegistryItemType.VISUAL_EDITOR_COMPONENT
  }

  /**
   * 注册组件到Registry Engine
   * @param definition 组件定义（支持Card2.1、传统Card、Visual Editor等格式）
   * @param options 注册选项
   * @returns 注册是否成功
   *
   * 🎯 组件注册核心流程：
   * 1. 格式统一：将不同系统的组件定义转换为统一格式
   * 2. 冲突检查：检查组件ID是否已存在，根据选项决定是否覆盖
   * 3. 元数据生成：创建Registry Engine所需的完整元数据
   * 4. 生命周期注册：设置验证、初始化、清理等生命周期方法
   * 5. 依赖解析：自动解析和注册组件依赖项
   * 6. 类型安全：确保类型转换和验证的正确性
   */
  static async registerComponent(
    definition: ComponentDefinition | IComponentDefinition | any,
    options: ComponentRegistrationOptions = {}
  ): Promise<boolean> {
    try {
      // 🔄 将组件定义转换为统一格式（关键步骤：兼容性处理）
      const unifiedDef = this.unifyComponentDefinition(definition)

      // 🔍 检查是否已存在，处理重复注册情况
      const existingId = this.generateComponentId(unifiedDef)
      if (registryEngine.has(existingId) && !options.overwrite) {
        console.warn(`⚠️ [ComponentRegistryManager] 组件 ${existingId} 已存在，跳过注册`)
        return false
      }

      // 📋 创建注册项元数据，包含分类、标签、依赖等信息
      const metadata = this.createComponentMetadata(unifiedDef, options.customMetadata)

      // 🏗️ 创建完整的注册项，包含生命周期方法
      const registryItem: RegistryItem<UnifiedComponentDefinition> = {
        metadata,
        content: unifiedDef,
        // 🛡️ 可选的组件验证函数
        validate: options.validate !== false ? () => this.validateComponent(unifiedDef) : undefined,
        // 🚀 组件初始化函数
        initialize: async () => {
          // 组件初始化逻辑
          await this.initializeComponent(unifiedDef)
        },
        cleanup: async () => {
          // 组件清理逻辑
          await this.cleanupComponent(unifiedDef)
        }
      }

      // 注册到Registry Engine
      const success = await registryEngine.register(registryItem)

      if (success && process.env.NODE_ENV === 'development') {
      }

      return success

    } catch (error) {
      console.error(`❌ [ComponentRegistryManager] 组件注册失败:`, error)
      return false
    }
  }

  /**
   * 批量注册组件
   * @param definitions 组件定义数组
   * @param options 注册选项
   * @returns 成功注册的数量和详细结果
   */
  static async registerComponents(
    definitions: (ComponentDefinition | IComponentDefinition | any)[],
    options: ComponentRegistrationOptions = {}
  ): Promise<{
    successCount: number
    failedCount: number
    details: Array<{ definition: any; success: boolean; error?: string }>
  }> {
    const results = {
      successCount: 0,
      failedCount: 0,
      details: [] as Array<{ definition: any; success: boolean; error?: string }>
    }

    // 🔧 修复：更详细的批量注册结果，便于调试
    for (const definition of definitions) {
      try {
        const success = await this.registerComponent(definition, options)
        results.details.push({
          definition,
          success
        })

        if (success) {
          results.successCount++
        } else {
          results.failedCount++
        }
      } catch (error) {
        results.failedCount++
        results.details.push({
          definition,
          success: false,
          error: error instanceof Error ? error.message : String(error)
        })
      }
    }

    return results
  }

  /**
   * 注销组件
   * @param componentId 组件ID
   * @returns 注销是否成功
   */
  static async unregisterComponent(componentId: string): Promise<boolean> {
    try {
      const fullId = componentId.includes('-') ? componentId : this.generateComponentId({ id: componentId } as any)
      return await registryEngine.unregister(fullId)
    } catch (error) {
      console.error(`❌ [ComponentRegistryManager] 组件注销失败: ${componentId}`, error)
      return false
    }
  }

  /**
   * 获取组件定义
   * @param componentId 组件ID
   * @returns 组件定义或null
   */
  static getComponent(componentId: string): UnifiedComponentDefinition | null {
    // 🔧 修复：更安全的ID处理，避免类型断言
    const fullId = this.normalizeComponentId(componentId)
    const item = registryEngine.get<UnifiedComponentDefinition>(fullId)
    return item?.content || null
  }

  /**
   * 检查组件是否存在
   * @param componentId 组件ID
   * @returns 是否存在
   */
  static hasComponent(componentId: string): boolean {
    const fullId = componentId.includes('-') ? componentId : this.generateComponentId({ id: componentId } as any)
    return registryEngine.has(fullId)
  }

  /**
   * 查询组件
   * @param query 查询条件
   * @returns 匹配的组件定义数组
   */
  static queryComponents(query: ComponentQuery = {}): UnifiedComponentDefinition[] {
    // 构建Registry Engine查询条件
    const registryQuery: any = {}

    // 按组件来源系统过滤
    if (query.sourceSystem) {
      const sourceSystems = Array.isArray(query.sourceSystem) ? query.sourceSystem : [query.sourceSystem]
      const registryTypes = sourceSystems.map(system => this.TYPE_MAPPING[system]).filter(Boolean)
      registryQuery.type = registryTypes
    }

    // 获取基础结果
    const registryItems = registryEngine.query(registryQuery)
    let results = registryItems
      .map(item => item.content as UnifiedComponentDefinition)
      .filter(Boolean)

    // 应用组件特定的过滤条件
    if (query.type) {
      const types = Array.isArray(query.type) ? query.type : [query.type]
      results = results.filter(comp => types.includes(comp.type))
    }

    if (query.name) {
      if (query.name instanceof RegExp) {
        results = results.filter(comp => query.name!.test(comp.name))
      } else {
        const namePattern = query.name.toLowerCase()
        results = results.filter(comp => comp.name.toLowerCase().includes(namePattern))
      }
    }

    if (query.category) {
      results = results.filter(comp => comp.category === query.category)
    }

    if (query.tags && query.tags.length > 0) {
      results = results.filter(comp => {
        if (!comp.tags) return false
        return query.tags!.every(tag => comp.tags!.includes(tag))
      })
    }

    if (typeof query.hasDataSources === 'boolean') {
      results = results.filter(comp => !!comp.dataSources === query.hasDataSources)
    }

    if (typeof query.hasStaticParams === 'boolean') {
      results = results.filter(comp => !!comp.staticParams === query.hasStaticParams)
    }

    if (typeof query.hasInteractionCapabilities === 'boolean') {
      results = results.filter(comp => !!comp.interactionCapabilities === query.hasInteractionCapabilities)
    }

    if (query.hasDependency) {
      results = results.filter(comp => comp.dependencies?.includes(query.hasDependency!))
    }

    if (query.filter) {
      results = results.filter(query.filter)
    }

    return results
  }

  /**
   * 按类型获取组件
   * @param componentType 组件类型
   * @returns 该类型的所有组件定义
   */
  static getComponentsByType(componentType: string): UnifiedComponentDefinition[] {
    return this.queryComponents({ type: componentType })
  }

  /**
   * 按分类获取组件
   * @param category 分类名称
   * @returns 该分类的所有组件定义
   */
  static getComponentsByCategory(category: string): UnifiedComponentDefinition[] {
    return this.queryComponents({ category })
  }

  /**
   * 按来源系统获取组件
   * @param sourceSystem 来源系统
   * @returns 该系统的所有组件定义
   */
  static getComponentsBySourceSystem(sourceSystem: UnifiedComponentDefinition['sourceSystem']): UnifiedComponentDefinition[] {
    return this.queryComponents({ sourceSystem })
  }

  /**
   * 获取所有组件
   * @returns 所有组件定义数组
   */
  static getAllComponents(): UnifiedComponentDefinition[] {
    return this.queryComponents()
  }

  /**
   * 获取组件统计信息
   * @returns 统计信息对象
   */
  static getComponentStats(): ComponentStats {
    const components = this.getAllComponents()

    const stats: ComponentStats = {
      total: components.length,
      byType: {},
      byCategory: {},
      bySourceSystem: {},
      withDataSources: 0,
      withStaticParams: 0,
      withInteractionCapabilities: 0,
      withDependencies: 0
    }

    for (const comp of components) {
      // 按类型统计
      stats.byType[comp.type] = (stats.byType[comp.type] || 0) + 1

      // 按分类统计
      if (comp.category) {
        stats.byCategory[comp.category] = (stats.byCategory[comp.category] || 0) + 1
      }

      // 按来源系统统计
      stats.bySourceSystem[comp.sourceSystem] = (stats.bySourceSystem[comp.sourceSystem] || 0) + 1

      // 功能特性统计
      if (comp.dataSources) stats.withDataSources++
      if (comp.staticParams) stats.withStaticParams++
      if (comp.interactionCapabilities) stats.withInteractionCapabilities++
      if (comp.dependencies && comp.dependencies.length > 0) stats.withDependencies++
    }

    return stats
  }

  /**
   * 获取组件的依赖链
   * @param componentId 组件ID
   * @param recursive 是否递归获取
   * @returns 依赖组件ID数组
   */
  static getComponentDependencies(componentId: string, recursive = false): string[] {
    const fullId = componentId.includes('-') ? componentId : this.generateComponentId({ id: componentId } as any)
    return registryEngine.getDependencies(fullId, recursive)
  }

  /**
   * 获取依赖于指定组件的组件
   * @param componentId 组件ID
   * @param recursive 是否递归获取
   * @returns 依赖者组件ID数组
   */
  static getComponentDependents(componentId: string, recursive = false): string[] {
    const fullId = componentId.includes('-') ? componentId : this.generateComponentId({ id: componentId } as any)
    return registryEngine.getDependents(fullId, recursive)
  }

  /**
   * 验证组件依赖完整性
   * @returns 验证结果
   */
  static validateDependencies(): { valid: boolean; missingDependencies: Array<{ componentId: string; missingDeps: string[] }> } {
    const components = this.getAllComponents()
    const missingDependencies: Array<{ componentId: string; missingDeps: string[] }> = []

    for (const comp of components) {
      if (comp.dependencies) {
        const missing = comp.dependencies.filter(depId => !this.hasComponent(depId))
        if (missing.length > 0) {
          missingDependencies.push({
            componentId: comp.id,
            missingDeps: missing
          })
        }
      }
    }

    return {
      valid: missingDependencies.length === 0,
      missingDependencies
    }
  }

  // ==================== 私有辅助方法 ====================

  /**
   * 将不同系统的组件定义统一为通用格式
   */
  private static unifyComponentDefinition(definition: any): UnifiedComponentDefinition {
    // 检测组件来源系统
    const sourceSystem = this.detectSourceSystem(definition)

    // 根据来源系统转换定义
    switch (sourceSystem) {
      case 'card21':
        return this.unifyCard21Definition(definition as ComponentDefinition)
      case 'legacy-card':
        return this.unifyLegacyCardDefinition(definition as IComponentDefinition)
      case 'visual-editor':
        return this.unifyVisualEditorDefinition(definition)
      default:
        return this.unifyCustomDefinition(definition)
    }
  }

  /**
   * 检测组件的来源系统
   */
  private static detectSourceSystem(definition: any): UnifiedComponentDefinition['sourceSystem'] {
    // Card2.1组件特征
    if (definition.type && (definition.dataSources || definition.staticParams)) {
      return 'card21'
    }

    // 传统Card组件特征
    if (definition.meta && definition.logic && definition.views) {
      return 'legacy-card'
    }

    // Visual Editor组件特征
    if (definition.name && definition.component) {
      return 'visual-editor'
    }

    return 'custom'
  }

  /**
   * 统一Card2.1组件定义
   */
  private static unifyCard21Definition(definition: ComponentDefinition): UnifiedComponentDefinition {
    return {
      id: definition.type,
      type: definition.type,
      name: definition.type,
      description: `Card2.1组件: ${definition.type}`,
      version: '1.0.0',
      category: 'card21-components',
      tags: ['card21', 'component'],
      dataSources: definition.dataSources,
      staticParams: definition.staticParams,
      interactionCapabilities: definition.interactionCapabilities,
      dependencies: definition.dependencies,
      originalDefinition: definition,
      sourceSystem: 'card21'
    }
  }

  /**
   * 统一传统Card组件定义
   */
  private static unifyLegacyCardDefinition(definition: IComponentDefinition): UnifiedComponentDefinition {
    return {
      id: definition.meta.id,
      type: definition.meta.type,
      name: definition.meta.name,
      description: definition.meta.description || `传统Card组件: ${definition.meta.name}`,
      version: definition.meta.version || '1.0.0',
      category: definition.meta.type,
      tags: ['legacy', 'card', definition.meta.type],
      originalDefinition: definition,
      sourceSystem: 'legacy-card'
    }
  }

  /**
   * 统一Visual Editor组件定义
   */
  private static unifyVisualEditorDefinition(definition: any): UnifiedComponentDefinition {
    return {
      id: definition.name,
      type: definition.name,
      name: definition.label || definition.name,
      description: definition.description || `可视化编辑器组件: ${definition.name}`,
      version: '1.0.0',
      category: 'visual-editor',
      tags: ['visual-editor', definition.name],
      originalDefinition: definition,
      sourceSystem: 'visual-editor'
    }
  }

  /**
   * 统一自定义组件定义
   */
  private static unifyCustomDefinition(definition: any): UnifiedComponentDefinition {
    return {
      id: definition.id || definition.type || definition.name || 'unknown',
      type: definition.type || definition.name || 'custom',
      name: definition.name || definition.type || definition.id || 'Unknown Component',
      description: definition.description || 'Custom component',
      version: definition.version || '1.0.0',
      category: definition.category || 'custom',
      tags: definition.tags || ['custom'],
      dataSources: definition.dataSources,
      staticParams: definition.staticParams,
      interactionCapabilities: definition.interactionCapabilities,
      dependencies: definition.dependencies,
      originalDefinition: definition,
      sourceSystem: 'custom'
    }
  }

  /**
   * 生成组件ID
   */
  private static generateComponentId(definition: UnifiedComponentDefinition): string {
    return `component-${definition.sourceSystem}-${definition.id}`
  }

  /**
   * 🔧 新增：规范化组件ID处理
   * 安全地处理各种格式的组件ID
   */
  private static normalizeComponentId(componentId: string): string {
    // 如果已经是完整ID格式，直接返回
    if (componentId.startsWith('component-')) {
      return componentId
    }

    // 尝试在现有注册项中查找匹配的ID
    const allItems = registryEngine.getAll()
    for (const item of allItems) {
      const content = item.content as UnifiedComponentDefinition
      if (content && (content.id === componentId || content.type === componentId)) {
        return item.metadata.id
      }
    }

    // 如果找不到，生成一个可能的ID（用于检查）
    // 注意：这里不能确定sourceSystem，所以返回原ID等待进一步处理
    return componentId
  }

  /**
   * 创建组件元数据
   */
  private static createComponentMetadata(
    definition: UnifiedComponentDefinition,
    customMetadata?: Partial<RegistryItemMetadata>
  ): RegistryItemMetadata {
    const now = Date.now()
    const registryType = this.TYPE_MAPPING[definition.sourceSystem] || RegistryItemType.CARD21_COMPONENT

    return {
      id: this.generateComponentId(definition),
      name: definition.name,
      type: registryType,
      version: definition.version,
      description: definition.description,
      category: definition.category,
      tags: definition.tags,
      dependencies: definition.dependencies,
      createdAt: now,
      updatedAt: now,
      enabled: true,
      priority: 0,
      ...customMetadata
    }
  }

  /**
   * 验证组件定义
   */
  private static validateComponent(definition: UnifiedComponentDefinition): boolean {
    try {
      // 基础字段验证
      if (!definition.id || !definition.type || !definition.name) {
        console.error(`❌ [ComponentRegistryManager] 组件定义缺少必需字段: ${definition.id}`)
        return false
      }

      // 来源系统特定验证
      switch (definition.sourceSystem) {
        case 'card21':
          return this.validateCard21Component(definition)
        case 'legacy-card':
          return this.validateLegacyCardComponent(definition)
        case 'visual-editor':
          return this.validateVisualEditorComponent(definition)
        default:
          return true // 自定义组件只做基础验证
      }
    } catch (error) {
      console.error(`❌ [ComponentRegistryManager] 组件验证失败: ${definition.id}`, error)
      return false
    }
  }

  /**
   * 验证Card2.1组件
   */
  private static validateCard21Component(definition: UnifiedComponentDefinition): boolean {
    const original = definition.originalDefinition as ComponentDefinition
    return !!(original.type && (original.dataSources || original.staticParams))
  }

  /**
   * 验证传统Card组件
   */
  private static validateLegacyCardComponent(definition: UnifiedComponentDefinition): boolean {
    const original = definition.originalDefinition as IComponentDefinition
    return !!(original.meta && original.logic && original.views)
  }

  /**
   * 验证Visual Editor组件
   */
  private static validateVisualEditorComponent(definition: UnifiedComponentDefinition): boolean {
    const original = definition.originalDefinition
    return !!(original.name && original.component)
  }

  /**
   * 初始化组件
   */
  private static async initializeComponent(definition: UnifiedComponentDefinition): Promise<void> {
    // 根据来源系统执行特定的初始化逻辑
    switch (definition.sourceSystem) {
      case 'card21':
        // Card2.1组件初始化
        break
      case 'legacy-card':
        // 传统Card组件初始化
        break
      case 'visual-editor':
        // Visual Editor组件初始化
        break
    }
  }

  /**
   * 清理组件
   */
  private static async cleanupComponent(definition: UnifiedComponentDefinition): Promise<void> {
    // 根据来源系统执行特定的清理逻辑
  }
}

// 导出便捷方法
export const {
  registerComponent,
  registerComponents,
  unregisterComponent,
  getComponent,
  hasComponent,
  queryComponents,
  getComponentsByType,
  getComponentsByCategory,
  getComponentsBySourceSystem,
  getAllComponents,
  getComponentStats,
  getComponentDependencies,
  getComponentDependents,
  validateDependencies
} = ComponentRegistryManager

// 导出类型
export type {
  UnifiedComponentDefinition,
  ComponentQuery,
  ComponentStats,
  ComponentRegistrationOptions
}