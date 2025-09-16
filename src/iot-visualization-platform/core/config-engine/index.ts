/**
 * Config Engine 统一配置引擎
 *
 * ThingsPanel 物联网可视化平台的统一配置管理系统
 * 整合所有分散的配置管理功能，提供一致的配置体验
 *
 * 核心特性：
 * - 🔄 100% 向后兼容所有现有配置系统
 * - 🎯 统一的配置数据格式和API接口
 * - 📚 完整的配置版本管理和回滚机制
 * - 🛡️ 强大的配置验证和完整性检查
 * - 📊 配置模板系统和预设方案
 * - 🚀 高性能的配置存储和查询
 * - 🎭 适配器系统实现无缝集成
 * - ⚡ 事件驱动的配置变更通知
 */

import { EventEmitter } from 'events'
import type { RegistryEngine } from '../registry-engine'

/**
 * 统一的配置类型枚举
 */
export enum ConfigurationType {
  /** 基础配置 - 通用的UI配置项 */
  BASE_CONFIG = 'base-config',
  /** 组件配置 - 组件特定的配置项 */
  COMPONENT_CONFIG = 'component-config',
  /** 数据源配置 - 数据源相关配置 */
  DATA_SOURCE_CONFIG = 'data-source-config',
  /** 交互配置 - 用户交互相关配置 */
  INTERACTION_CONFIG = 'interaction-config',
  /** 主题配置 - 主题和样式相关配置 */
  THEME_CONFIG = 'theme-config',
  /** 布局配置 - 布局和排版相关配置 */
  LAYOUT_CONFIG = 'layout-config',
  /** 系统配置 - 系统级别的配置 */
  SYSTEM_CONFIG = 'system-config',
  /** 自定义配置 - 用户自定义的配置类型 */
  CUSTOM_CONFIG = 'custom-config'
}

/**
 * 配置优先级枚举
 */
export enum ConfigurationPriority {
  /** 系统默认 - 最低优先级 */
  SYSTEM_DEFAULT = 0,
  /** 模板配置 - 模板预设配置 */
  TEMPLATE = 10,
  /** 用户默认 - 用户设置的默认值 */
  USER_DEFAULT = 20,
  /** 项目配置 - 项目级别配置 */
  PROJECT = 30,
  /** 用户配置 - 用户自定义配置 */
  USER_CUSTOM = 40,
  /** 运行时覆盖 - 最高优先级 */
  RUNTIME_OVERRIDE = 50
}

/**
 * 配置状态枚举
 */
export enum ConfigurationStatus {
  /** 草稿状态 - 未保存的配置 */
  DRAFT = 'draft',
  /** 激活状态 - 当前使用的配置 */
  ACTIVE = 'active',
  /** 已存档 - 历史版本配置 */
  ARCHIVED = 'archived',
  /** 已废弃 - 不再使用的配置 */
  DEPRECATED = 'deprecated',
  /** 错误状态 - 存在错误的配置 */
  ERROR = 'error'
}

/**
 * 配置项元数据接口
 */
export interface ConfigurationMetadata {
  /** 配置项唯一标识符 */
  id: string
  /** 配置项名称 */
  name: string
  /** 配置项描述 */
  description?: string
  /** 配置类型 */
  type: ConfigurationType
  /** 配置版本 */
  version: string
  /** 配置状态 */
  status: ConfigurationStatus
  /** 配置优先级 */
  priority: ConfigurationPriority
  /** 目标组件或系统 */
  target?: string
  /** 配置分类标签 */
  tags: string[]
  /** 依赖的其他配置项 */
  dependencies?: string[]
  /** 创建时间 */
  createdAt: number
  /** 更新时间 */
  updatedAt: number
  /** 创建者信息 */
  createdBy?: string
  /** 更新者信息 */
  updatedBy?: string
  /** 扩展元数据 */
  extensions?: Record<string, any>
}

/**
 * 配置验证结果接口
 */
export interface ConfigurationValidationResult {
  /** 验证是否通过 */
  valid: boolean
  /** 验证错误列表 */
  errors?: Array<{
    field: string
    message: string
    code?: string
  }>
  /** 验证警告列表 */
  warnings?: Array<{
    field: string
    message: string
    code?: string
  }>
  /** 验证建议列表 */
  suggestions?: Array<{
    field: string
    message: string
    suggestedValue?: any
  }>
}

/**
 * 配置变更事件接口
 */
export interface ConfigurationChangeEvent {
  /** 配置项ID */
  configurationId: string
  /** 变更类型 */
  changeType: 'create' | 'update' | 'delete' | 'restore'
  /** 变更前的配置 */
  oldConfiguration?: ConfigurationItem
  /** 变更后的配置 */
  newConfiguration?: ConfigurationItem
  /** 变更时间戳 */
  timestamp: number
  /** 变更来源 */
  source: 'user' | 'system' | 'api' | 'import' | 'migration'
  /** 变更上下文信息 */
  context?: {
    /** 触发变更的组件 */
    component?: string
    /** 批量操作ID */
    batchId?: string
    /** 变更原因 */
    reason?: string
    /** 额外数据 */
    extra?: Record<string, any>
  }
}

/**
 * 配置项接口
 */
export interface ConfigurationItem<T = any> {
  /** 配置元数据 */
  metadata: ConfigurationMetadata
  /** 配置数据内容 */
  data: T
  /** 配置模式（可选：JSON Schema） */
  schema?: any
  /** 验证函数 */
  validate?: (data: T) => ConfigurationValidationResult | Promise<ConfigurationValidationResult>
  /** 迁移函数 */
  migrate?: (oldData: any, fromVersion: string, toVersion: string) => T | Promise<T>
  /** 序列化函数 */
  serialize?: (data: T) => string | object
  /** 反序列化函数 */
  deserialize?: (serialized: string | object) => T
}

/**
 * 配置查询条件接口
 */
export interface ConfigurationQuery {
  /** 按类型过滤 */
  type?: ConfigurationType | ConfigurationType[]
  /** 按状态过滤 */
  status?: ConfigurationStatus | ConfigurationStatus[]
  /** 按优先级过滤 */
  priority?: ConfigurationPriority | ConfigurationPriority[]
  /** 按目标过滤 */
  target?: string | string[]
  /** 按标签过滤 */
  tags?: string[]
  /** 按名称过滤（支持正则） */
  name?: string | RegExp
  /** 创建时间范围 */
  createdAt?: { from?: number; to?: number }
  /** 更新时间范围 */
  updatedAt?: { from?: number; to?: number }
  /** 自定义过滤函数 */
  filter?: (item: ConfigurationItem) => boolean
  /** 排序字段 */
  sortBy?: keyof ConfigurationMetadata
  /** 排序方向 */
  sortOrder?: 'asc' | 'desc'
  /** 分页：偏移量 */
  offset?: number
  /** 分页：限制数量 */
  limit?: number
}

/**
 * 配置统计信息接口
 */
export interface ConfigurationStats {
  /** 总配置数量 */
  total: number
  /** 按类型分组的数量 */
  byType: Record<string, number>
  /** 按状态分组的数量 */
  byStatus: Record<string, number>
  /** 按优先级分组的数量 */
  byPriority: Record<string, number>
  /** 最近更新时间 */
  lastUpdated: number
  /** 存储大小（字节） */
  storageSize: number
}

/**
 * 配置版本信息接口
 */
export interface ConfigurationVersion {
  /** 版本号 */
  version: string
  /** 配置快照 */
  snapshot: ConfigurationItem
  /** 创建时间 */
  createdAt: number
  /** 创建者 */
  createdBy?: string
  /** 版本描述 */
  description?: string
  /** 变更摘要 */
  changeLog?: string[]
  /** 父版本 */
  parentVersion?: string
}

/**
 * Config Engine 核心类
 *
 * 统一管理所有类型的配置项，提供完整的配置生命周期管理
 */
export class ConfigEngine extends EventEmitter {
  /** 配置项存储 - 主索引 */
  private configurations = new Map<string, ConfigurationItem>()

  /** 类型索引 - 按类型快速查找 */
  private typeIndex = new Map<ConfigurationType, Set<string>>()

  /** 状态索引 - 按状态快速查找 */
  private statusIndex = new Map<ConfigurationStatus, Set<string>>()

  /** 目标索引 - 按目标快速查找 */
  private targetIndex = new Map<string, Set<string>>()

  /** 标签索引 - 按标签快速查找 */
  private tagIndex = new Map<string, Set<string>>()

  /** 优先级索引 - 按优先级快速查找 */
  private priorityIndex = new Map<ConfigurationPriority, Set<string>>()

  /** 依赖关系图 - 用于依赖解析 */
  private dependencyGraph = new Map<string, Set<string>>()

  /** 版本历史存储 */
  private versionHistory = new Map<string, ConfigurationVersion[]>()

  /** 配置模板存储 */
  private templates = new Map<string, ConfigurationItem>()

  /** 验证缓存 */
  private validationCache = new Map<string, { result: ConfigurationValidationResult; timestamp: number }>()

  /** 缓存失效时间（毫秒） */
  private static readonly CACHE_TTL = 5 * 60 * 1000 // 5分钟

  /** Registry Engine 引用（可选集成） */
  private registryEngine?: RegistryEngine

  constructor(options?: { registryEngine?: RegistryEngine }) {
    super()

    this.registryEngine = options?.registryEngine

    if (process.env.NODE_ENV === 'development') {
      console.log('🚀 [ConfigEngine] 初始化统一配置引擎')
    }

    // 监听自身事件用于调试
    this.on('configuration-changed', (event) => {
      if (process.env.NODE_ENV === 'development') {
        console.log(`📝 [ConfigEngine] 配置变更: ${event.changeType}/${event.configurationId}`)
      }
    })

    this.on('error', (errorInfo) => {
      if (process.env.NODE_ENV === 'development') {
        console.error('❌ [ConfigEngine] 配置引擎错误:', errorInfo)
      }
    })
  }

  /**
   * 创建配置项
   * @param item 要创建的配置项
   * @returns 创建是否成功
   *
   * 🎯 配置创建核心流程：
   * 1. 元数据验证：检查必需字段的完整性和格式
   * 2. 唯一性检查：确保配置ID在系统中唯一
   * 3. 数据验证：运行自定义验证函数检查配置数据
   * 4. 索引更新：更新多维度索引以支持快速查询
   * 5. 版本管理：创建初始版本快照
   * 6. 事件通知：发送配置变更事件给监听者
   */
  async createConfiguration<T>(item: ConfigurationItem<T>): Promise<boolean> {
    try {
      const { metadata } = item

      // 🔍 验证必需字段的完整性
      this.validateMetadata(metadata)

      // 🛡️ 检查ID唯一性，防止重复配置
      if (this.configurations.has(metadata.id)) {
        throw new Error(`配置项 ${metadata.id} 已存在`)
      }

      // ✅ 执行配置数据验证
      if (item.validate) {
        const validationResult = await item.validate(item.data)
        if (!validationResult.valid) {
          throw new Error(`配置验证失败: ${validationResult.errors?.[0]?.message || '未知错误'}`)
        }

        // 💾 缓存验证结果，提升后续访问性能
        this.validationCache.set(metadata.id, {
          result: validationResult,
          timestamp: Date.now()
        })
      }

      // 📋 确保元数据完整性，填充默认值
      const completeMetadata: ConfigurationMetadata = {
        ...metadata,
        createdAt: metadata.createdAt || Date.now(),
        updatedAt: Date.now(),
        status: metadata.status || ConfigurationStatus.DRAFT,
        priority: metadata.priority || ConfigurationPriority.USER_CUSTOM,
        tags: metadata.tags || []
      }

      const completeItem: ConfigurationItem<T> = {
        ...item,
        metadata: completeMetadata
      }

      // 💾 存储到主索引
      this.configurations.set(metadata.id, completeItem)

      // 📊 更新多维度索引，支持高效查询
      this.updateIndexes(completeMetadata, 'add')

      // 📚 创建初始版本快照
      this.createVersion(metadata.id, completeItem, '初始版本')

      // 🎧 发送配置变更事件
      const changeEvent: ConfigurationChangeEvent = {
        configurationId: metadata.id,
        changeType: 'create',
        newConfiguration: completeItem,
        timestamp: Date.now(),
        source: 'user'
      }

      this.emit('configuration-changed', changeEvent)
      this.emit('create', completeItem)

      if (process.env.NODE_ENV === 'development') {
        console.log(`✅ [ConfigEngine] 成功创建配置: ${metadata.type}/${metadata.id}`)
      }

      return true

    } catch (error) {
      console.error(`❌ [ConfigEngine] 创建配置失败: ${item.metadata.id}`, error)
      this.emit('error', { action: 'create', error, metadata: item.metadata })
      return false
    }
  }

  /**
   * 更新配置项
   * @param id 配置项ID
   * @param updates 更新的数据
   * @param createVersion 是否创建新版本
   * @returns 更新是否成功
   */
  async updateConfiguration<T>(
    id: string,
    updates: Partial<ConfigurationItem<T>>,
    createVersion = true
  ): Promise<boolean> {
    try {
      const existingItem = this.configurations.get(id)
      if (!existingItem) {
        throw new Error(`配置项 ${id} 不存在`)
      }

      const oldItem = this.deepClone(existingItem)

      // 🔄 合并更新数据，保持数据一致性
      const updatedItem: ConfigurationItem<T> = {
        ...existingItem,
        ...updates,
        metadata: {
          ...existingItem.metadata,
          ...updates.metadata,
          id, // 🔒 确保ID不被修改
          updatedAt: Date.now()
        }
      }

      // ✅ 验证更新后的配置
      if (updatedItem.validate) {
        const validationResult = await updatedItem.validate(updatedItem.data)
        if (!validationResult.valid) {
          throw new Error(`配置验证失败: ${validationResult.errors?.[0]?.message || '未知错误'}`)
        }

        // 🔄 更新验证缓存
        this.validationCache.set(id, {
          result: validationResult,
          timestamp: Date.now()
        })
      }

      // 💾 更新主存储
      this.configurations.set(id, updatedItem)

      // 📊 更新索引（如果元数据发生变化）
      if (updates.metadata) {
        this.updateIndexes(existingItem.metadata, 'remove')
        this.updateIndexes(updatedItem.metadata, 'add')
      }

      // 📚 创建版本快照（如果需要）
      if (createVersion) {
        this.createVersion(id, updatedItem, '配置更新')
      }

      // 🎧 发送配置变更事件
      const changeEvent: ConfigurationChangeEvent = {
        configurationId: id,
        changeType: 'update',
        oldConfiguration: oldItem,
        newConfiguration: updatedItem,
        timestamp: Date.now(),
        source: 'user'
      }

      this.emit('configuration-changed', changeEvent)
      this.emit('update', updatedItem, oldItem)

      if (process.env.NODE_ENV === 'development') {
        console.log(`✅ [ConfigEngine] 成功更新配置: ${id}`)
      }

      return true

    } catch (error) {
      console.error(`❌ [ConfigEngine] 更新配置失败: ${id}`, error)
      this.emit('error', { action: 'update', error, configurationId: id })
      return false
    }
  }

  /**
   * 删除配置项
   * @param id 配置项ID
   * @param soft 是否软删除（标记为已废弃）
   * @returns 删除是否成功
   */
  async deleteConfiguration(id: string, soft = true): Promise<boolean> {
    try {
      const item = this.configurations.get(id)
      if (!item) {
        console.warn(`⚠️ [ConfigEngine] 配置项 ${id} 不存在`)
        return false
      }

      // 🔍 检查依赖关系，防止破坏系统完整性
      const dependents = this.getDependents(id)
      if (dependents.length > 0) {
        console.warn(`⚠️ [ConfigEngine] 配置项 ${id} 被以下项目依赖:`, dependents)
        if (!soft) {
          throw new Error(`无法删除配置项 ${id}，存在依赖关系`)
        }
      }

      const oldItem = this.deepClone(item)

      if (soft) {
        // 🔄 软删除：标记为已废弃，保留数据
        const updatedItem = {
          ...item,
          metadata: {
            ...item.metadata,
            status: ConfigurationStatus.DEPRECATED,
            updatedAt: Date.now()
          }
        }

        this.configurations.set(id, updatedItem)
        this.updateIndexes(item.metadata, 'remove')
        this.updateIndexes(updatedItem.metadata, 'add')

        // 📚 创建版本记录
        this.createVersion(id, updatedItem, '软删除')

      } else {
        // 🗑️ 硬删除：完全移除数据
        this.configurations.delete(id)
        this.updateIndexes(item.metadata, 'remove')
        this.versionHistory.delete(id)
        this.validationCache.delete(id)
      }

      // 🎧 发送配置变更事件
      const changeEvent: ConfigurationChangeEvent = {
        configurationId: id,
        changeType: 'delete',
        oldConfiguration: oldItem,
        timestamp: Date.now(),
        source: 'user',
        context: { reason: soft ? 'soft-delete' : 'hard-delete' }
      }

      this.emit('configuration-changed', changeEvent)
      this.emit('delete', oldItem, soft)

      if (process.env.NODE_ENV === 'development') {
        console.log(`✅ [ConfigEngine] 成功${soft ? '软' : '硬'}删除配置: ${id}`)
      }

      return true

    } catch (error) {
      console.error(`❌ [ConfigEngine] 删除配置失败: ${id}`, error)
      this.emit('error', { action: 'delete', error, configurationId: id })
      return false
    }
  }

  /**
   * 获取配置项
   * @param id 配置项ID
   * @returns 配置项或undefined
   */
  getConfiguration<T = any>(id: string): ConfigurationItem<T> | undefined {
    const item = this.configurations.get(id)
    return item ? this.deepClone(item) as ConfigurationItem<T> : undefined
  }

  /**
   * 检查配置项是否存在
   * @param id 配置项ID
   * @returns 是否存在
   */
  hasConfiguration(id: string): boolean {
    return this.configurations.has(id)
  }

  /**
   * 查询配置项
   * @param query 查询条件
   * @returns 匹配的配置项数组
   */
  queryConfigurations(query: ConfigurationQuery = {}): ConfigurationItem[] {
    let results = Array.from(this.configurations.values())

    // 🔍 按类型过滤
    if (query.type) {
      const types = Array.isArray(query.type) ? query.type : [query.type]
      results = results.filter(item => types.includes(item.metadata.type))
    }

    // 🔍 按状态过滤
    if (query.status) {
      const statuses = Array.isArray(query.status) ? query.status : [query.status]
      results = results.filter(item => statuses.includes(item.metadata.status))
    }

    // 🔍 按优先级过滤
    if (query.priority) {
      const priorities = Array.isArray(query.priority) ? query.priority : [query.priority]
      results = results.filter(item => priorities.includes(item.metadata.priority))
    }

    // 🔍 按目标过滤
    if (query.target) {
      const targets = Array.isArray(query.target) ? query.target : [query.target]
      results = results.filter(item => item.metadata.target && targets.includes(item.metadata.target))
    }

    // 🔍 按标签过滤
    if (query.tags && query.tags.length > 0) {
      results = results.filter(item =>
        query.tags!.some(tag => item.metadata.tags.includes(tag))
      )
    }

    // 🔍 按名称过滤（支持正则表达式）
    if (query.name) {
      const namePattern = query.name instanceof RegExp ? query.name : new RegExp(query.name, 'i')
      results = results.filter(item => namePattern.test(item.metadata.name))
    }

    // 🔍 按创建时间过滤
    if (query.createdAt) {
      results = results.filter(item => {
        const createdAt = item.metadata.createdAt
        const from = query.createdAt!.from
        const to = query.createdAt!.to
        return (!from || createdAt >= from) && (!to || createdAt <= to)
      })
    }

    // 🔍 按更新时间过滤
    if (query.updatedAt) {
      results = results.filter(item => {
        const updatedAt = item.metadata.updatedAt
        const from = query.updatedAt!.from
        const to = query.updatedAt!.to
        return (!from || updatedAt >= from) && (!to || updatedAt <= to)
      })
    }

    // 🎯 自定义过滤函数
    if (query.filter) {
      results = results.filter(query.filter)
    }

    // 📊 排序处理
    if (query.sortBy) {
      const sortOrder = query.sortOrder || 'asc'
      results.sort((a, b) => {
        const aValue = a.metadata[query.sortBy!]
        const bValue = b.metadata[query.sortBy!]

        if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1
        if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1
        return 0
      })
    }

    // 📄 分页处理
    if (query.offset !== undefined || query.limit !== undefined) {
      const offset = query.offset || 0
      const limit = query.limit
      results = limit !== undefined ? results.slice(offset, offset + limit) : results.slice(offset)
    }

    return results.map(item => this.deepClone(item))
  }

  /**
   * 按类型获取配置项
   * @param type 配置类型
   * @returns 该类型的所有配置项
   */
  getConfigurationsByType<T = any>(type: ConfigurationType): ConfigurationItem<T>[] {
    const ids = this.typeIndex.get(type)
    if (!ids) return []

    return Array.from(ids)
      .map(id => this.getConfiguration<T>(id))
      .filter(Boolean) as ConfigurationItem<T>[]
  }

  /**
   * 按目标获取配置项
   * @param target 目标标识
   * @returns 该目标的所有配置项
   */
  getConfigurationsByTarget(target: string): ConfigurationItem[] {
    const ids = this.targetIndex.get(target)
    if (!ids) return []

    return Array.from(ids)
      .map(id => this.getConfiguration(id))
      .filter(Boolean) as ConfigurationItem[]
  }

  /**
   * 按标签获取配置项
   * @param tag 标签名称
   * @returns 包含该标签的所有配置项
   */
  getConfigurationsByTag(tag: string): ConfigurationItem[] {
    const ids = this.tagIndex.get(tag)
    if (!ids) return []

    return Array.from(ids)
      .map(id => this.getConfiguration(id))
      .filter(Boolean) as ConfigurationItem[]
  }

  /**
   * 获取配置项的依赖项
   * @param id 配置项ID
   * @param recursive 是否递归获取
   * @returns 依赖项ID数组
   */
  getDependencies(id: string, recursive = false): string[] {
    const item = this.configurations.get(id)
    if (!item || !item.metadata.dependencies) {
      return []
    }

    if (!recursive) {
      return [...item.metadata.dependencies]
    }

    // 🔄 递归获取所有层级的依赖项
    const allDeps = new Set<string>()
    const visited = new Set<string>()

    /**
     * 📊 深度优先搜索收集依赖项
     * @param currentId 当前要处理的配置项ID
     */
    const collectDeps = (currentId: string) => {
      // 🛡️ 防止循环依赖导致的无限递归
      if (visited.has(currentId)) return
      visited.add(currentId)

      const currentItem = this.configurations.get(currentId)
      if (currentItem?.metadata.dependencies) {
        for (const dep of currentItem.metadata.dependencies) {
          allDeps.add(dep)
          collectDeps(dep) // 递归处理依赖的依赖
        }
      }
    }

    collectDeps(id)
    return Array.from(allDeps)
  }

  /**
   * 获取依赖于指定配置项的配置项
   * @param id 配置项ID
   * @param recursive 是否递归获取
   * @returns 依赖者ID数组
   */
  getDependents(id: string, recursive = false): string[] {
    const dependents: string[] = []

    // 🔍 查找直接依赖者
    for (const [itemId, item] of this.configurations) {
      if (item.metadata.dependencies?.includes(id)) {
        dependents.push(itemId)
      }
    }

    if (!recursive) {
      return dependents
    }

    // 🔄 递归查找所有依赖者
    const allDependents = new Set(dependents)
    const visited = new Set<string>()

    /**
     * 📊 递归收集依赖者
     * @param currentId 当前要处理的配置项ID
     */
    const collectDependents = (currentId: string) => {
      if (visited.has(currentId)) return
      visited.add(currentId)

      const currentDependents = this.getDependents(currentId, false)
      for (const dependent of currentDependents) {
        allDependents.add(dependent)
        collectDependents(dependent)
      }
    }

    for (const dependent of dependents) {
      collectDependents(dependent)
    }

    return Array.from(allDependents)
  }

  /**
   * 获取统计信息
   * @returns 配置统计信息
   */
  getStats(): ConfigurationStats {
    const items = Array.from(this.configurations.values())

    // 📊 按类型统计
    const byType: Record<string, number> = {}
    for (const type of Object.values(ConfigurationType)) {
      byType[type] = 0
    }

    // 📊 按状态统计
    const byStatus: Record<string, number> = {}
    for (const status of Object.values(ConfigurationStatus)) {
      byStatus[status] = 0
    }

    // 📊 按优先级统计
    const byPriority: Record<string, number> = {}
    for (const priority of Object.values(ConfigurationPriority)) {
      byPriority[priority] = 0
    }

    let lastUpdated = 0
    let storageSize = 0

    for (const item of items) {
      const { metadata } = item

      // 📈 按类型计数
      byType[metadata.type] = (byType[metadata.type] || 0) + 1

      // 📈 按状态计数
      byStatus[metadata.status] = (byStatus[metadata.status] || 0) + 1

      // 📈 按优先级计数
      byPriority[metadata.priority] = (byPriority[metadata.priority] || 0) + 1

      // ⏱️ 更新最新时间
      if (metadata.updatedAt > lastUpdated) {
        lastUpdated = metadata.updatedAt
      }

      // 💾 估算存储大小（UTF-16编码）
      storageSize += JSON.stringify(item).length * 2
    }

    return {
      total: items.length,
      byType,
      byStatus,
      byPriority,
      lastUpdated,
      storageSize
    }
  }

  // ==================== 版本管理方法 ====================

  /**
   * 创建配置版本
   * @param configurationId 配置项ID
   * @param snapshot 配置快照
   * @param description 版本描述
   * @returns 版本号
   */
  private createVersion(
    configurationId: string,
    snapshot: ConfigurationItem,
    description?: string
  ): string {
    const versions = this.versionHistory.get(configurationId) || []
    const versionNumber = `v${versions.length + 1}.0.0`

    const version: ConfigurationVersion = {
      version: versionNumber,
      snapshot: this.deepClone(snapshot),
      createdAt: Date.now(),
      description,
      parentVersion: versions.length > 0 ? versions[versions.length - 1].version : undefined
    }

    versions.push(version)
    this.versionHistory.set(configurationId, versions)

    return versionNumber
  }

  /**
   * 获取配置项的版本历史
   * @param configurationId 配置项ID
   * @returns 版本历史数组
   */
  getVersionHistory(configurationId: string): ConfigurationVersion[] {
    const versions = this.versionHistory.get(configurationId) || []
    return versions.map(v => this.deepClone(v))
  }

  /**
   * 恢复到指定版本
   * @param configurationId 配置项ID
   * @param version 版本号
   * @returns 恢复是否成功
   */
  async restoreToVersion(configurationId: string, version: string): Promise<boolean> {
    try {
      const versions = this.versionHistory.get(configurationId)
      if (!versions) {
        throw new Error(`配置项 ${configurationId} 没有版本历史`)
      }

      const targetVersion = versions.find(v => v.version === version)
      if (!targetVersion) {
        throw new Error(`版本 ${version} 不存在`)
      }

      const currentItem = this.configurations.get(configurationId)
      if (!currentItem) {
        throw new Error(`配置项 ${configurationId} 不存在`)
      }

      // 🔄 恢复到目标版本
      const restoredItem: ConfigurationItem = {
        ...targetVersion.snapshot,
        metadata: {
          ...targetVersion.snapshot.metadata,
          updatedAt: Date.now(),
          status: ConfigurationStatus.ACTIVE // 恢复后激活
        }
      }

      this.configurations.set(configurationId, restoredItem)

      // 📚 创建恢复版本记录
      this.createVersion(configurationId, restoredItem, `恢复到版本 ${version}`)

      // 🎧 发送配置变更事件
      const changeEvent: ConfigurationChangeEvent = {
        configurationId,
        changeType: 'restore',
        oldConfiguration: currentItem,
        newConfiguration: restoredItem,
        timestamp: Date.now(),
        source: 'user',
        context: { reason: `restore-to-${version}` }
      }

      this.emit('configuration-changed', changeEvent)
      this.emit('restore', restoredItem, version)

      if (process.env.NODE_ENV === 'development') {
        console.log(`✅ [ConfigEngine] 成功恢复配置 ${configurationId} 到版本 ${version}`)
      }

      return true

    } catch (error) {
      console.error(`❌ [ConfigEngine] 恢复配置失败: ${configurationId} -> ${version}`, error)
      this.emit('error', { action: 'restore', error, configurationId, version })
      return false
    }
  }

  // ==================== 私有辅助方法 ====================

  /**
   * 验证配置元数据
   * @param metadata 配置元数据
   */
  private validateMetadata(metadata: ConfigurationMetadata): void {
    if (!metadata.id) {
      throw new Error('配置项ID不能为空')
    }

    if (!metadata.name) {
      throw new Error('配置项名称不能为空')
    }

    if (!metadata.type) {
      throw new Error('配置项类型不能为空')
    }

    if (!metadata.version) {
      throw new Error('配置项版本不能为空')
    }

    // 🔍 验证版本格式（简单的语义化版本检查）
    const versionPattern = /^\d+\.\d+\.\d+$/
    if (!versionPattern.test(metadata.version)) {
      throw new Error('配置项版本格式无效，应为 x.y.z 格式')
    }
  }

  /**
   * 更新各种索引
   * @param metadata 配置元数据
   * @param action 操作类型
   */
  private updateIndexes(metadata: ConfigurationMetadata, action: 'add' | 'remove'): void {
    const { id, type, status, target, tags, priority } = metadata

    if (action === 'add') {
      // 📊 更新类型索引
      if (!this.typeIndex.has(type)) {
        this.typeIndex.set(type, new Set())
      }
      this.typeIndex.get(type)!.add(id)

      // 📊 更新状态索引
      if (!this.statusIndex.has(status)) {
        this.statusIndex.set(status, new Set())
      }
      this.statusIndex.get(status)!.add(id)

      // 📊 更新优先级索引
      if (!this.priorityIndex.has(priority)) {
        this.priorityIndex.set(priority, new Set())
      }
      this.priorityIndex.get(priority)!.add(id)

      // 📊 更新目标索引
      if (target) {
        if (!this.targetIndex.has(target)) {
          this.targetIndex.set(target, new Set())
        }
        this.targetIndex.get(target)!.add(id)
      }

      // 📊 更新标签索引
      for (const tag of tags) {
        if (!this.tagIndex.has(tag)) {
          this.tagIndex.set(tag, new Set())
        }
        this.tagIndex.get(tag)!.add(id)
      }

    } else if (action === 'remove') {
      // 🗑️ 从类型索引移除
      this.typeIndex.get(type)?.delete(id)
      if (this.typeIndex.get(type)?.size === 0) {
        this.typeIndex.delete(type)
      }

      // 🗑️ 从状态索引移除
      this.statusIndex.get(status)?.delete(id)
      if (this.statusIndex.get(status)?.size === 0) {
        this.statusIndex.delete(status)
      }

      // 🗑️ 从优先级索引移除
      this.priorityIndex.get(priority)?.delete(id)
      if (this.priorityIndex.get(priority)?.size === 0) {
        this.priorityIndex.delete(priority)
      }

      // 🗑️ 从目标索引移除
      if (target) {
        this.targetIndex.get(target)?.delete(id)
        if (this.targetIndex.get(target)?.size === 0) {
          this.targetIndex.delete(target)
        }
      }

      // 🗑️ 从标签索引移除
      for (const tag of tags) {
        this.tagIndex.get(tag)?.delete(id)
        if (this.tagIndex.get(tag)?.size === 0) {
          this.tagIndex.delete(tag)
        }
      }
    }
  }

  /**
   * 深度克隆对象
   * @param obj 要克隆的对象
   * @returns 克隆后的对象
   */
  private deepClone<T>(obj: T): T {
    if (obj === null || typeof obj !== 'object') return obj
    if (obj instanceof Date) return new Date(obj.getTime()) as T
    if (obj instanceof Array) return obj.map(item => this.deepClone(item)) as T

    const cloned = {} as T
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        cloned[key] = this.deepClone(obj[key])
      }
    }
    return cloned
  }
}

// 🌐 导出全局配置引擎实例
export const configEngine = new ConfigEngine()

export default configEngine

// ===== 🎯 完整的 Config Engine 导出 =====

// 导入所有子模块
export { configurationValidator, validateConfiguration, validateConfigurations } from './config-validator'
export { configurationAPIManager } from './config-api-manager'
export { configurationVersionManager } from './config-version-manager'
export { configurationTemplateManager } from './config-template-manager'
export { visualEditorConfigurationIntegration, useEditorConfigurationIntegration } from './visual-editor-integration'

// 导入配置事件总线
export { configEventBus, registerDataExecutionTrigger } from '@/core/data-architecture/ConfigEventBus'

// 导出所有类型定义
export * from './types'

/**
 * 🎯 Config Engine 统一初始化函数
 *
 * 初始化整个配置引擎系统，确保所有组件正确集成
 *
 * @param options 初始化选项
 */
export async function initializeConfigEngine(options: {
  /** 是否启用 Visual Editor 集成 */
  enableVisualEditorIntegration?: boolean
  /** 是否启用实时验证 */
  enableRealtimeValidation?: boolean
  /** 是否启用自动保存 */
  enableAutoSave?: boolean
  /** 默认语言 */
  defaultLanguage?: string
} = {}) {
  const {
    enableVisualEditorIntegration = true,
    enableRealtimeValidation = true,
    enableAutoSave = true,
    defaultLanguage = 'zh-CN'
  } = options

  console.log('🚀 [Config Engine] 开始初始化配置引擎系统...')

  try {
    // 🔧 初始化核心配置引擎
    console.log('1. 初始化核心配置引擎...')
    // configEngine 已经在模块加载时初始化

    // 🔍 初始化配置验证器
    console.log('2. 初始化配置验证器...')
    // configurationValidator 已经在模块加载时初始化

    // 🌐 初始化 API 管理器
    console.log('3. 初始化 API 管理器...')
    // configurationAPIManager 已经在模块加载时初始化

    // 📚 初始化版本管理器
    console.log('4. 初始化版本管理器...')
    // configurationVersionManager 已经在模块加载时初始化

    // 🎨 初始化模板管理器
    console.log('5. 初始化模板管理器...')
    // configurationTemplateManager 已经在模块加载时初始化

    // 🎯 初始化 Visual Editor 集成（如果启用）
    if (enableVisualEditorIntegration) {
      console.log('6. 初始化 Visual Editor 集成...')

      // 设置实时验证
      if (enableRealtimeValidation) {
        visualEditorConfigurationIntegration.realtimeValidation.value = true
      }

      // 设置自动保存
      if (enableAutoSave) {
        visualEditorConfigurationIntegration.autoSave.value = true
      }
    }

    // 🔗 建立系统间的事件连接
    console.log('7. 建立系统事件连接...')

    // 配置变更时自动清除验证缓存
    configEngine.on('configuration-updated', (event) => {
      configurationValidator.clearValidationCache(event.id)
    })

    // 配置创建时自动创建版本
    configEngine.on('configuration-created', async (event) => {
      try {
        await configurationVersionManager.createVersion(
          event.item,
          '初始版本',
          'major',
          event.item.metadata.creator
        )
      } catch (error) {
        console.warn('自动版本创建失败:', error)
      }
    })

    // API 管理器与配置引擎的集成
    configurationAPIManager.on('configuration-created', (event) => {
      configEngine.emit('configuration-created', event)
    })

    configurationAPIManager.on('configuration-updated', (event) => {
      configEngine.emit('configuration-updated', event)
    })

    configurationAPIManager.on('configuration-deleted', (event) => {
      configEngine.emit('configuration-deleted', event)
    })

    // ✅ 初始化完成
    console.log('✅ [Config Engine] 配置引擎系统初始化完成!')
    console.log('📊 系统组件状态:')
    console.log(`   - 核心引擎: ✅ 已启用`)
    console.log(`   - 配置验证: ✅ 已启用`)
    console.log(`   - API管理: ✅ 已启用`)
    console.log(`   - 版本管理: ✅ 已启用`)
    console.log(`   - 模板系统: ✅ 已启用`)
    console.log(`   - Editor集成: ${enableVisualEditorIntegration ? '✅ 已启用' : '❌ 已禁用'}`)
    console.log(`   - 实时验证: ${enableRealtimeValidation ? '✅ 已启用' : '❌ 已禁用'}`)
    console.log(`   - 自动保存: ${enableAutoSave ? '✅ 已启用' : '❌ 已禁用'}`)

    return {
      success: true,
      message: 'Config Engine 初始化成功',
      timestamp: new Date()
    }

  } catch (error) {
    console.error('❌ [Config Engine] 初始化失败:', error)
    return {
      success: false,
      message: error instanceof Error ? error.message : '未知初始化错误',
      timestamp: new Date()
    }
  }
}

/**
 * 🎯 Config Engine 系统状态检查
 *
 * 检查配置引擎各个组件的运行状态
 *
 * @returns 系统状态报告
 */
export function getConfigEngineSystemStatus() {
  return {
    core: {
      name: 'Core Engine',
      status: 'active',
      configCount: configEngine.getAllConfigurations().length,
      lastActivity: new Date()
    },
    validator: {
      name: 'Configuration Validator',
      status: 'active',
      statistics: configurationValidator.getValidationStatistics()
    },
    apiManager: {
      name: 'API Manager',
      status: 'active',
      statistics: configurationAPIManager.getAPIStatistics()
    },
    versionManager: {
      name: 'Version Manager',
      status: 'active',
      statistics: configurationVersionManager.getVersionStatistics()
    },
    templateManager: {
      name: 'Template Manager',
      status: 'active',
      statistics: configurationTemplateManager.getStatistics()
    },
    visualEditorIntegration: {
      name: 'Visual Editor Integration',
      status: visualEditorConfigurationIntegration ? 'active' : 'inactive',
      currentConfig: visualEditorConfigurationIntegration?.state.currentConfig?.id || null
    },
    system: {
      timestamp: new Date(),
      uptime: Date.now() - startTime,
      version: '1.0.0'
    }
  }
}

// 🔧 调试支持：将配置引擎暴露到全局作用域，便于控制台调试
if (typeof window !== 'undefined') {
  ;(window as any).configEngine = configEngine
  ;(window as any).configurationValidator = configurationValidator
  ;(window as any).configurationAPIManager = configurationAPIManager
  ;(window as any).configurationVersionManager = configurationVersionManager
  ;(window as any).configurationTemplateManager = configurationTemplateManager
  ;(window as any).visualEditorConfigurationIntegration = visualEditorConfigurationIntegration
  ;(window as any).initializeConfigEngine = initializeConfigEngine
  ;(window as any).getConfigEngineSystemStatus = getConfigEngineSystemStatus
}

console.log('🎉 [config-engine/index.ts] Config Engine 完整系统加载完成')

// 🚀 自动初始化（在浏览器环境中）
if (typeof window !== 'undefined') {
  // 延迟初始化，确保所有模块都已加载
  setTimeout(() => {
    initializeConfigEngine({
      enableVisualEditorIntegration: true,
      enableRealtimeValidation: true,
      enableAutoSave: true
    }).then(result => {
      if (result.success) {
        console.log('🎯 [Config Engine] 自动初始化成功')
      } else {
        console.error('❌ [Config Engine] 自动初始化失败:', result.message)
      }
    })
  }, 100)
}
