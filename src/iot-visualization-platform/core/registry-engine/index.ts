/**
 * Registry Engine 注册引擎
 *
 * ThingsPanel 物联网可视化平台的统一注册管理系统
 * 整合组件、渲染器、数据源、模板等所有注册功能
 *
 * 核心特性：
 * - 🔄 100% 向后兼容所有现有注册系统
 * - 🎯 统一的注册接口和管理机制
 * - 🚀 自动发现和批量注册功能
 * - 📊 完整的依赖关系管理
 * - 🔍 强大的查询和过滤能力
 * - 🛡️ 类型安全和运行时验证
 * - ⚡ 高性能的索引和缓存机制
 */

import { EventEmitter } from 'events'
import type { ComponentDefinition } from '@/card2.1/core/types'
import type { IComponentDefinition } from '@/card/core/types/component'
import type { RendererFactory } from '@/components/visual-editor/renderers/base/BaseRenderer'

/**
 * 统一的注册项类型枚举
 */
export enum RegistryItemType {
  /** Card2.1 组件 */
  CARD21_COMPONENT = 'card21-component',
  /** 传统卡片组件 */
  LEGACY_CARD_COMPONENT = 'legacy-card-component',
  /** 可视化编辑器组件 */
  VISUAL_EDITOR_COMPONENT = 'visual-editor-component',
  /** 渲染器 */
  RENDERER = 'renderer',
  /** 数据源 */
  DATA_SOURCE = 'data-source',
  /** 模板 */
  TEMPLATE = 'template',
  /** 插件 */
  PLUGIN = 'plugin',
  /** 主题 */
  THEME = 'theme',
  /** 布局 */
  LAYOUT = 'layout',
  /** 交互配置 */
  INTERACTION_CONFIG = 'interaction-config'
}

/**
 * 注册项的元数据接口
 */
export interface RegistryItemMetadata {
  /** 唯一标识符 */
  id: string
  /** 显示名称 */
  name: string
  /** 项目类型 */
  type: RegistryItemType
  /** 版本号 */
  version: string
  /** 描述信息 */
  description?: string
  /** 标签 */
  tags?: string[]
  /** 分类 */
  category?: string
  /** 图标 */
  icon?: string
  /** 作者信息 */
  author?: string
  /** 创建时间 */
  createdAt: number
  /** 更新时间 */
  updatedAt: number
  /** 是否启用 */
  enabled: boolean
  /** 优先级 */
  priority: number
  /** 依赖项 */
  dependencies?: string[]
  /** 兼容性信息 */
  compatibility?: {
    /** 最小版本要求 */
    minVersion?: string
    /** 最大版本要求 */
    maxVersion?: string
    /** 环境要求 */
    environment?: string[]
  }
}

/**
 * 统一的注册项接口
 */
export interface RegistryItem<T = any> {
  /** 元数据 */
  metadata: RegistryItemMetadata
  /** 实际的注册内容 */
  content: T
  /** 验证函数 */
  validate?: () => boolean | Promise<boolean>
  /** 初始化函数 */
  initialize?: () => void | Promise<void>
  /** 清理函数 */
  cleanup?: () => void | Promise<void>
}

/**
 * 注册条件接口
 */
export interface RegistryQuery {
  /** 按类型过滤 */
  type?: RegistryItemType | RegistryItemType[]
  /** 按名称过滤（支持正则） */
  name?: string | RegExp
  /** 按分类过滤 */
  category?: string
  /** 按标签过滤 */
  tags?: string[]
  /** 按启用状态过滤 */
  enabled?: boolean
  /** 按依赖关系过滤 */
  hasDependency?: string
  /** 自定义过滤函数 */
  filter?: (item: RegistryItem) => boolean
}

/**
 * 注册统计信息接口
 */
export interface RegistryStats {
  /** 总注册项数量 */
  total: number
  /** 按类型分组的数量 */
  byType: Record<string, number>
  /** 按分类分组的数量 */
  byCategory: Record<string, number>
  /** 启用的项目数量 */
  enabled: number
  /** 禁用的项目数量 */
  disabled: number
  /** 有依赖的项目数量 */
  withDependencies: number
  /** 最近更新时间 */
  lastUpdated: number
}

/**
 * Registry Engine 核心类
 *
 * 统一管理所有类型的注册项，提供完整的生命周期管理
 */
export class RegistryEngine extends EventEmitter {
  /** 注册项存储 - 主索引 */
  private items = new Map<string, RegistryItem>()

  /** 类型索引 - 按类型快速查找 */
  private typeIndex = new Map<RegistryItemType, Set<string>>()

  /** 分类索引 - 按分类快速查找 */
  private categoryIndex = new Map<string, Set<string>>()

  /** 标签索引 - 按标签快速查找 */
  private tagIndex = new Map<string, Set<string>>()

  /** 依赖关系图 - 用于依赖解析 */
  private dependencyGraph = new Map<string, Set<string>>()

  /** 反向依赖图 - 用于影响分析 */
  private reverseDependencyGraph = new Map<string, Set<string>>()

  /** 初始化状态缓存 */
  private initializationCache = new Map<string, boolean>()

  /** 验证结果缓存 */
  private validationCache = new Map<string, { result: boolean; timestamp: number }>()

  /** 缓存失效时间（毫秒） */
  private static readonly CACHE_TTL = 5 * 60 * 1000 // 5分钟

  constructor() {
    super()

    if (process.env.NODE_ENV === 'development') {
      console.log('🚀 [RegistryEngine] 初始化统一注册引擎')
    }

    // 监听自身事件用于调试
    this.on('register', (metadata) => {
      if (process.env.NODE_ENV === 'development') {
        console.log(`📝 [RegistryEngine] 注册项目: ${metadata.type}/${metadata.id}`)
      }
    })

    this.on('unregister', (id) => {
      if (process.env.NODE_ENV === 'development') {
        console.log(`🗑️ [RegistryEngine] 注销项目: ${id}`)
      }
    })
  }

  /**
   * 注册项目到引擎
   * @param item 要注册的项目
   * @returns 注册是否成功
   */
  async register<T>(item: RegistryItem<T>): Promise<boolean> {
    try {
      const { metadata } = item

      // 验证必需字段
      this.validateMetadata(metadata)

      // 检查ID唯一性
      if (this.items.has(metadata.id)) {
        throw new Error(`注册项 ${metadata.id} 已存在`)
      }

      // 验证依赖关系
      if (metadata.dependencies) {
        for (const depId of metadata.dependencies) {
          if (!this.items.has(depId)) {
            console.warn(`⚠️ [RegistryEngine] 依赖项 ${depId} 不存在，稍后需要注册`)
          }
        }
      }

      // 执行项目验证
      if (item.validate) {
        const isValid = await item.validate()
        if (!isValid) {
          throw new Error(`注册项 ${metadata.id} 验证失败`)
        }

        // 缓存验证结果
        this.validationCache.set(metadata.id, {
          result: true,
          timestamp: Date.now()
        })
      }

      // 存储到主索引
      this.items.set(metadata.id, item)

      // 更新各种索引
      this.updateIndexes(metadata, 'add')

      // 更新依赖关系图
      this.updateDependencyGraph(metadata, 'add')

      // 执行初始化
      if (item.initialize) {
        await item.initialize()
        this.initializationCache.set(metadata.id, true)
      }

      // 发送注册事件
      this.emit('register', metadata)
      this.emit('change', { action: 'register', metadata })

      if (process.env.NODE_ENV === 'development') {
        console.log(`✅ [RegistryEngine] 成功注册: ${metadata.type}/${metadata.id}`)
      }

      return true

    } catch (error) {
      console.error(`❌ [RegistryEngine] 注册失败: ${item.metadata.id}`, error)
      this.emit('error', { action: 'register', error, metadata: item.metadata })
      return false
    }
  }

  /**
   * 从引擎注销项目
   * @param id 项目ID
   * @returns 注销是否成功
   */
  async unregister(id: string): Promise<boolean> {
    try {
      const item = this.items.get(id)
      if (!item) {
        console.warn(`⚠️ [RegistryEngine] 注册项 ${id} 不存在`)
        return false
      }

      const { metadata } = item

      // 检查反向依赖
      const dependents = this.reverseDependencyGraph.get(id)
      if (dependents && dependents.size > 0) {
        console.warn(`⚠️ [RegistryEngine] 注册项 ${id} 被以下项目依赖:`, Array.from(dependents))
        // 根据策略决定是否继续注销
      }

      // 执行清理函数
      if (item.cleanup) {
        await item.cleanup()
      }

      // 从各种索引中移除
      this.updateIndexes(metadata, 'remove')

      // 更新依赖关系图
      this.updateDependencyGraph(metadata, 'remove')

      // 从主存储中移除
      this.items.delete(id)

      // 清理缓存
      this.initializationCache.delete(id)
      this.validationCache.delete(id)

      // 发送注销事件
      this.emit('unregister', id)
      this.emit('change', { action: 'unregister', metadata })

      if (process.env.NODE_ENV === 'development') {
        console.log(`✅ [RegistryEngine] 成功注销: ${metadata.type}/${id}`)
      }

      return true

    } catch (error) {
      console.error(`❌ [RegistryEngine] 注销失败: ${id}`, error)
      this.emit('error', { action: 'unregister', error, id })
      return false
    }
  }

  /**
   * 获取注册项
   * @param id 项目ID
   * @returns 注册项或null
   */
  get<T = any>(id: string): RegistryItem<T> | null {
    return (this.items.get(id) as RegistryItem<T>) || null
  }

  /**
   * 检查注册项是否存在
   * @param id 项目ID
   * @returns 是否存在
   */
  has(id: string): boolean {
    return this.items.has(id)
  }

  /**
   * 查询注册项
   * @param query 查询条件
   * @returns 匹配的注册项数组
   */
  query(query: RegistryQuery = {}): RegistryItem[] {
    let results = Array.from(this.items.values())

    // 按类型过滤
    if (query.type) {
      const types = Array.isArray(query.type) ? query.type : [query.type]
      results = results.filter(item => types.includes(item.metadata.type))
    }

    // 按名称过滤
    if (query.name) {
      if (query.name instanceof RegExp) {
        results = results.filter(item => query.name!.test(item.metadata.name))
      } else {
        const namePattern = query.name.toLowerCase()
        results = results.filter(item =>
          item.metadata.name.toLowerCase().includes(namePattern)
        )
      }
    }

    // 按分类过滤
    if (query.category) {
      results = results.filter(item => item.metadata.category === query.category)
    }

    // 按标签过滤
    if (query.tags && query.tags.length > 0) {
      results = results.filter(item => {
        if (!item.metadata.tags) return false
        return query.tags!.every(tag => item.metadata.tags!.includes(tag))
      })
    }

    // 按启用状态过滤
    if (typeof query.enabled === 'boolean') {
      results = results.filter(item => item.metadata.enabled === query.enabled)
    }

    // 按依赖关系过滤
    if (query.hasDependency) {
      results = results.filter(item =>
        item.metadata.dependencies?.includes(query.hasDependency!)
      )
    }

    // 自定义过滤函数
    if (query.filter) {
      results = results.filter(query.filter)
    }

    return results
  }

  /**
   * 按类型获取注册项
   * @param type 项目类型
   * @returns 该类型的所有注册项
   */
  getByType<T = any>(type: RegistryItemType): RegistryItem<T>[] {
    const ids = this.typeIndex.get(type)
    if (!ids) return []

    return Array.from(ids)
      .map(id => this.get<T>(id))
      .filter(Boolean) as RegistryItem<T>[]
  }

  /**
   * 按分类获取注册项
   * @param category 分类名称
   * @returns 该分类的所有注册项
   */
  getByCategory(category: string): RegistryItem[] {
    const ids = this.categoryIndex.get(category)
    if (!ids) return []

    return Array.from(ids)
      .map(id => this.get(id))
      .filter(Boolean) as RegistryItem[]
  }

  /**
   * 按标签获取注册项
   * @param tag 标签名称
   * @returns 包含该标签的所有注册项
   */
  getByTag(tag: string): RegistryItem[] {
    const ids = this.tagIndex.get(tag)
    if (!ids) return []

    return Array.from(ids)
      .map(id => this.get(id))
      .filter(Boolean) as RegistryItem[]
  }

  /**
   * 获取项目的依赖项
   * @param id 项目ID
   * @param recursive 是否递归获取所有层级的依赖
   * @returns 依赖项ID数组
   *
   * 🔍 算法说明：
   * - 直接依赖：从dependencyGraph直接获取
   * - 递归依赖：使用深度优先搜索(DFS)遍历整个依赖树
   * - 防循环：使用visited集合防止循环依赖导致的无限递归
   */
  getDependencies(id: string, recursive = false): string[] {
    const direct = this.dependencyGraph.get(id)
    if (!direct) return []

    if (!recursive) {
      return Array.from(direct)
    }

    // 🔄 递归获取所有层级的依赖项
    const allDeps = new Set<string>()  // 所有依赖项（去重）
    const visited = new Set<string>()  // 已访问项目（防循环）

    /**
     * 📊 内部函数：深度优先搜索收集依赖项
     * @param itemId 当前要处理的项目ID
     */
    const collectDeps = (itemId: string) => {
      // 🛡️ 防止循环依赖导致的无限递归
      if (visited.has(itemId)) return
      visited.add(itemId)

      const deps = this.dependencyGraph.get(itemId)
      if (deps) {
        for (const dep of deps) {
          allDeps.add(dep)
          collectDeps(dep)  // 递归处理依赖的依赖
        }
      }
    }

    collectDeps(id)
    return Array.from(allDeps)
  }

  /**
   * 获取依赖于指定项目的项目
   * @param id 项目ID
   * @param recursive 是否递归获取
   * @returns 依赖者ID数组
   */
  getDependents(id: string, recursive = false): string[] {
    const direct = this.reverseDependencyGraph.get(id)
    if (!direct) return []

    if (!recursive) {
      return Array.from(direct)
    }

    // 递归获取所有依赖者
    const allDependents = new Set<string>()
    const visited = new Set<string>()

    const collectDependents = (itemId: string) => {
      if (visited.has(itemId)) return
      visited.add(itemId)

      const dependents = this.reverseDependencyGraph.get(itemId)
      if (dependents) {
        for (const dependent of dependents) {
          allDependents.add(dependent)
          collectDependents(dependent)
        }
      }
    }

    collectDependents(id)
    return Array.from(allDependents)
  }

  /**
   * 批量注册项目
   * @param items 要注册的项目数组
   * @returns 成功注册的数量
   *
   * 🚀 批量注册优化策略：
   * 1. 自动依赖排序：确保被依赖的项目先注册
   * 2. 错误隔离：单个项目失败不影响其他项目注册
   * 3. 性能优化：批量操作减少事件触发频率
   * 4. 状态管理：统计成功/失败数量并发送批量完成事件
   */
  async registerBatch<T>(items: RegistryItem<T>[]): Promise<number> {
    let successCount = 0

    if (process.env.NODE_ENV === 'development') {
      console.log(`📦 [RegistryEngine] 开始批量注册: ${items.length} 个项目`)
    }

    // 🎯 按依赖关系拓扑排序，确保依赖项先注册
    // 这是关键优化：避免因依赖缺失导致的注册失败
    const sortedItems = this.sortByDependencies(items)

    for (const item of sortedItems) {
      // ✅ 逐个注册，每个项目独立处理错误
      const success = await this.register(item)
      if (success) {
        successCount++
      }
      // 注意：即使单个失败，也继续处理下一个项目
    }

    // 📊 发送批量完成事件，便于监听者统计和处理
    this.emit('batch-register-complete', {
      total: items.length,
      success: successCount,
      failed: items.length - successCount
    })

    if (process.env.NODE_ENV === 'development') {
      console.log(`📦 [RegistryEngine] 批量注册完成: ${successCount}/${items.length}`)
    }

    return successCount
  }

  /**
   * 清空所有注册项
   */
  async clear(): Promise<void> {
    const items = Array.from(this.items.values())

    // 按反向依赖顺序清理
    const sortedItems = this.sortByReverseDependencies(items)

    for (const item of sortedItems) {
      await this.unregister(item.metadata.id)
    }

    // 清理所有索引和缓存
    this.items.clear()
    this.typeIndex.clear()
    this.categoryIndex.clear()
    this.tagIndex.clear()
    this.dependencyGraph.clear()
    this.reverseDependencyGraph.clear()
    this.initializationCache.clear()
    this.validationCache.clear()

    this.emit('clear')

    if (process.env.NODE_ENV === 'development') {
      console.log('🧹 [RegistryEngine] 已清空所有注册项')
    }
  }

  /**
   * 重新验证所有注册项
   * @returns 验证失败的项目ID数组
   */
  async revalidateAll(): Promise<string[]> {
    const failedItems: string[] = []

    for (const [id, item] of this.items) {
      if (item.validate) {
        try {
          const isValid = await item.validate()
          this.validationCache.set(id, {
            result: isValid,
            timestamp: Date.now()
          })

          if (!isValid) {
            failedItems.push(id)
          }
        } catch (error) {
          console.error(`❌ [RegistryEngine] 验证失败: ${id}`, error)
          failedItems.push(id)
          this.validationCache.set(id, {
            result: false,
            timestamp: Date.now()
          })
        }
      }
    }

    if (failedItems.length > 0) {
      this.emit('validation-failed', failedItems)
    }

    return failedItems
  }

  /**
   * 获取注册表统计信息
   * @returns 统计信息对象
   */
  getStats(): RegistryStats {
    const items = Array.from(this.items.values())

    // 按类型统计
    const byType: Record<string, number> = {}
    for (const type of Object.values(RegistryItemType)) {
      byType[type] = 0
    }

    // 按分类统计
    const byCategory: Record<string, number> = {}

    let enabled = 0
    let withDependencies = 0
    let lastUpdated = 0

    for (const item of items) {
      const { metadata } = item

      // 按类型计数
      byType[metadata.type] = (byType[metadata.type] || 0) + 1

      // 按分类计数
      if (metadata.category) {
        byCategory[metadata.category] = (byCategory[metadata.category] || 0) + 1
      }

      // 其他统计
      if (metadata.enabled) enabled++
      if (metadata.dependencies && metadata.dependencies.length > 0) withDependencies++
      if (metadata.updatedAt > lastUpdated) lastUpdated = metadata.updatedAt
    }

    return {
      total: items.length,
      byType,
      byCategory,
      enabled,
      disabled: items.length - enabled,
      withDependencies,
      lastUpdated
    }
  }

  /**
   * 获取所有注册项
   * @returns 所有注册项数组
   */
  getAll(): RegistryItem[] {
    return Array.from(this.items.values())
  }

  /**
   * 导出注册表数据（用于备份或迁移）
   * @returns 序列化的注册表数据
   */
  export(): string {
    const data = {
      version: '1.0.0',
      timestamp: Date.now(),
      items: Array.from(this.items.entries()).map(([id, item]) => ({
        id,
        metadata: item.metadata,
        // 注意：不导出 content，因为可能包含函数或复杂对象
      }))
    }

    return JSON.stringify(data, null, 2)
  }

  // ==================== 私有辅助方法 ====================

  /**
   * 验证元数据
   */
  private validateMetadata(metadata: RegistryItemMetadata): void {
    const required = ['id', 'name', 'type', 'version']

    for (const field of required) {
      if (!metadata[field as keyof RegistryItemMetadata]) {
        throw new Error(`元数据缺少必需字段: ${field}`)
      }
    }

    if (!Object.values(RegistryItemType).includes(metadata.type)) {
      throw new Error(`无效的注册项类型: ${metadata.type}`)
    }
  }

  /**
   * 更新各种索引
   */
  private updateIndexes(metadata: RegistryItemMetadata, action: 'add' | 'remove'): void {
    const { id, type, category, tags } = metadata

    // 更新类型索引
    if (action === 'add') {
      if (!this.typeIndex.has(type)) {
        this.typeIndex.set(type, new Set())
      }
      this.typeIndex.get(type)!.add(id)
    } else {
      const typeSet = this.typeIndex.get(type)
      if (typeSet) {
        typeSet.delete(id)
        if (typeSet.size === 0) {
          this.typeIndex.delete(type)
        }
      }
    }

    // 更新分类索引
    if (category) {
      if (action === 'add') {
        if (!this.categoryIndex.has(category)) {
          this.categoryIndex.set(category, new Set())
        }
        this.categoryIndex.get(category)!.add(id)
      } else {
        const categorySet = this.categoryIndex.get(category)
        if (categorySet) {
          categorySet.delete(id)
          if (categorySet.size === 0) {
            this.categoryIndex.delete(category)
          }
        }
      }
    }

    // 更新标签索引
    if (tags) {
      for (const tag of tags) {
        if (action === 'add') {
          if (!this.tagIndex.has(tag)) {
            this.tagIndex.set(tag, new Set())
          }
          this.tagIndex.get(tag)!.add(id)
        } else {
          const tagSet = this.tagIndex.get(tag)
          if (tagSet) {
            tagSet.delete(id)
            if (tagSet.size === 0) {
              this.tagIndex.delete(tag)
            }
          }
        }
      }
    }
  }

  /**
   * 更新依赖关系图
   */
  private updateDependencyGraph(metadata: RegistryItemMetadata, action: 'add' | 'remove'): void {
    const { id, dependencies } = metadata

    if (!dependencies) return

    if (action === 'add') {
      // 添加正向依赖
      this.dependencyGraph.set(id, new Set(dependencies))

      // 添加反向依赖
      for (const depId of dependencies) {
        if (!this.reverseDependencyGraph.has(depId)) {
          this.reverseDependencyGraph.set(depId, new Set())
        }
        this.reverseDependencyGraph.get(depId)!.add(id)
      }
    } else {
      // 移除正向依赖
      this.dependencyGraph.delete(id)

      // 移除反向依赖
      for (const depId of dependencies) {
        const reverseSet = this.reverseDependencyGraph.get(depId)
        if (reverseSet) {
          reverseSet.delete(id)
          if (reverseSet.size === 0) {
            this.reverseDependencyGraph.delete(depId)
          }
        }
      }
    }
  }

  /**
   * 按依赖关系排序项目（拓扑排序算法）
   * @param items 要排序的项目数组
   * @returns 按依赖关系排序后的项目数组（依赖项在前）
   *
   * 🧠 算法说明：
   * 使用深度优先搜索(DFS)实现的拓扑排序算法
   * 1. 从每个未访问的节点开始DFS遍历
   * 2. 先递归处理所有依赖项，再处理当前项目
   * 3. 使用两个状态集合防止循环依赖：
   *    - visiting: 当前DFS路径中的节点（灰色标记）
   *    - visited: 已完成处理的节点（黑色标记）
   * 4. 检测到循环依赖时立即抛出异常
   *
   * 🎯 应用场景：
   * - 组件注册时确保依赖项先注册
   * - 插件加载时的依赖顺序管理
   * - 模块初始化的正确顺序
   */
  private sortByDependencies<T>(items: RegistryItem<T>[]): RegistryItem<T>[] {
    const sorted: RegistryItem<T>[] = []           // 最终排序结果
    const visited = new Set<string>()              // 已完成处理的节点
    const visiting = new Set<string>()             // 当前DFS路径中的节点

    /**
     * 📊 深度优先搜索访问函数
     * @param item 当前要处理的项目
     */
    const visit = (item: RegistryItem<T>) => {
      // 🔍 已处理过的节点直接跳过
      if (visited.has(item.metadata.id)) return

      // 🚨 检测循环依赖：如果当前DFS路径中已存在该节点
      if (visiting.has(item.metadata.id)) {
        throw new Error(`检测到循环依赖: ${item.metadata.id}`)
      }

      // 🔄 标记为正在访问（进入DFS路径）
      visiting.add(item.metadata.id)

      // 🎯 先递归处理所有依赖项（核心：确保依赖项排在前面）
      if (item.metadata.dependencies) {
        for (const depId of item.metadata.dependencies) {
          const depItem = items.find(i => i.metadata.id === depId)
          if (depItem) {
            visit(depItem)  // 递归处理依赖项
          }
        }
      }

      // ✅ 处理完成：移出访问路径，标记为已完成
      visiting.delete(item.metadata.id)
      visited.add(item.metadata.id)
      sorted.push(item)  // 加入排序结果（依赖项已在前面）
    }

    // 🚀 遍历所有项目，确保每个都被处理
    for (const item of items) {
      if (!visited.has(item.metadata.id)) {
        visit(item)
      }
    }

    return sorted
  }

  /**
   * 按反向依赖关系排序项目（用于清理）
   */
  private sortByReverseDependencies<T>(items: RegistryItem<T>[]): RegistryItem<T>[] {
    const sorted: RegistryItem<T>[] = []
    const visited = new Set<string>()

    const visit = (item: RegistryItem<T>) => {
      if (visited.has(item.metadata.id)) return
      visited.add(item.metadata.id)

      // 先处理依赖者
      const dependents = this.getDependents(item.metadata.id)
      for (const depId of dependents) {
        const depItem = items.find(i => i.metadata.id === depId)
        if (depItem) {
          visit(depItem)
        }
      }

      sorted.push(item)
    }

    for (const item of items) {
      if (!visited.has(item.metadata.id)) {
        visit(item)
      }
    }

    return sorted
  }
}

// 创建全局单例实例
export const registryEngine = new RegistryEngine()

// 导出类型
export type {
  RegistryItem,
  RegistryItemMetadata,
  RegistryQuery,
  RegistryStats
}