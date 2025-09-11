/**
 * 优化的Card2.1系统初始化管理器
 * 避免重复工作，提供智能缓存和增量更新
 */

import type { ComponentDefinition } from '@/card2.1/core/types'
import type { ComponentTree, ComponentCategory } from '@/card2.1/core/auto-registry'
import { ComponentLoader } from '@/card2.1/core/component-loader'
import { AutoRegistry } from '@/card2.1/core/auto-registry'
import { componentRegistry } from '@/card2.1/core/component-registry'
import { componentDataRequirementsRegistry } from '@/components/visual-editor/core/component-data-requirements'

/**
 * 初始化状态接口
 */
interface InitializationState {
  /** 是否已初始化 */
  isInitialized: boolean
  /** 初始化时间戳 */
  initializationTimestamp: number
  /** 组件模块哈希值（用于检测变更） */
  moduleHash: string
  /** 用户权限（用于检测权限变更） */
  userAuthority: string
  /** 已注册的组件数量 */
  registeredCount: number
}

/**
 * 缓存的初始化结果
 */
interface CachedInitializationResult {
  /** 组件树结构 */
  componentTree: ComponentTree
  /** 组件统计信息 */
  componentStats: {
    total: number
    valid: number
    invalid: number
    categories: string[]
    subCategories: string[]
  }
  /** 已注册的组件列表 */
  registeredComponents: ComponentDefinition[]
  /** 权限过滤的组件列表 */
  filteredComponents: ComponentDefinition[]
  /** 缓存时间戳 */
  timestamp: number
}

/**
 * 初始化选项
 */
interface InitializationOptions {
  /** 是否强制重新初始化 */
  forceReload?: boolean
  /** 是否跳过权限检查 */
  skipPermissionCheck?: boolean
  /** 缓存有效期（毫秒），默认10分钟 */
  cacheTimeout?: number
}

/**
 * 优化的初始化管理器类
 */
export class OptimizedInitializationManager {
  private static instance: OptimizedInitializationManager | null = null

  /** 组件加载器实例 */
  private componentLoader: ComponentLoader

  /** 自动注册器实例 */
  private autoRegistry: AutoRegistry

  /** 当前初始化状态 */
  private state: InitializationState = {
    isInitialized: false,
    initializationTimestamp: 0,
    moduleHash: '',
    userAuthority: '',
    registeredCount: 0
  }

  /** 缓存的初始化结果 */
  private cachedResult: CachedInitializationResult | null = null

  /** 初始化锁，防止并发初始化 */
  private initializationPromise: Promise<void> | null = null

  /** 默认缓存超时时间（10分钟） */
  private readonly DEFAULT_CACHE_TIMEOUT = 10 * 60 * 1000

  private constructor() {
    this.componentLoader = new ComponentLoader()
    this.autoRegistry = new AutoRegistry(componentRegistry)
  }

  /**
   * 获取单例实例
   */
  public static getInstance(): OptimizedInitializationManager {
    if (!this.instance) {
      this.instance = new OptimizedInitializationManager()
    }
    return this.instance
  }

  /**
   * 优化的初始化方法
   * @param options 初始化选项
   */
  public async initialize(options: InitializationOptions = {}): Promise<void> {
    const { forceReload = false, skipPermissionCheck = false, cacheTimeout = this.DEFAULT_CACHE_TIMEOUT } = options

    // 检查是否需要重新初始化
    if (!forceReload && this.shouldSkipInitialization(cacheTimeout)) {
      if (process.env.NODE_ENV === 'development') {
      }
      return
    }

    // 防止并发初始化
    if (this.initializationPromise) {
      if (process.env.NODE_ENV === 'development') {
      }
      return this.initializationPromise
    }

    this.initializationPromise = this.performInitialization(skipPermissionCheck)

    try {
      await this.initializationPromise
    } finally {
      this.initializationPromise = null
    }
  }

  /**
   * 检查是否应该跳过初始化
   */
  private shouldSkipInitialization(cacheTimeout: number): boolean {
    // 检查基本初始化状态
    if (!this.state.isInitialized || !this.cachedResult) {
      return false
    }

    // 检查缓存是否过期
    const now = Date.now()
    const cacheAge = now - this.cachedResult.timestamp
    if (cacheAge > cacheTimeout) {
      if (process.env.NODE_ENV === 'development') {
      }
      return false
    }

    // 检查用户权限是否发生变化
    const currentAuthority = this.getCurrentUserAuthority()
    if (this.state.userAuthority !== currentAuthority) {
      if (process.env.NODE_ENV === 'development') {
      }
      return false
    }

    // 检查组件注册数量是否发生变化（简单的变更检测）
    const currentRegisteredCount = componentRegistry.getAll().length
    if (this.state.registeredCount !== currentRegisteredCount) {
      if (process.env.NODE_ENV === 'development') {
      }
      return false
    }

    return true
  }

  /**
   * 执行实际的初始化流程
   */
  private async performInitialization(skipPermissionCheck: boolean): Promise<void> {
    const startTime = Date.now()
    if (process.env.NODE_ENV === 'development') {
    }

    try {
      // 1. 加载组件模块（智能缓存）
      const componentModules = await this.loadComponentsWithCaching()

      // 2. 获取组件统计信息
      const componentStats = this.componentLoader.getComponentStats(componentModules)
      if (process.env.NODE_ENV === 'development') {
      }

      // 3. 自动注册组件（包含权限过滤）
      const registeredComponents = await this.autoRegistry.autoRegister(componentModules)
      if (process.env.NODE_ENV === 'development') {
      }

      // 4. 注册预设的数据需求
      componentDataRequirementsRegistry.registerPresets()

      // 5. 获取组件树形结构
      const componentTree = this.autoRegistry.getComponentTree()

      // 6. 更新状态和缓存
      const currentAuthority = this.getCurrentUserAuthority()
      this.state = {
        isInitialized: true,
        initializationTimestamp: Date.now(),
        moduleHash: this.generateModuleHash(componentModules),
        userAuthority: currentAuthority,
        registeredCount: registeredComponents.length
      }

      this.cachedResult = {
        componentTree,
        componentStats,
        registeredComponents,
        filteredComponents: componentRegistry.getAll(),
        timestamp: Date.now()
      }

      const duration = Date.now() - startTime
      if (process.env.NODE_ENV === 'development') {
      }
    } catch (error) {
      console.error('❌ [OptimizedInitialization] 初始化失败:', error)
      throw error
    }
  }

  /**
   * 智能缓存的组件加载
   */
  private async loadComponentsWithCaching(): Promise<Record<string, any>> {
    // 这里可以添加模块级别的缓存逻辑
    // 暂时使用原有的加载方法
    return await this.componentLoader.loadComponents()
  }

  /**
   * 生成模块哈希值（简化版本）
   */
  private generateModuleHash(modules: Record<string, any>): string {
    const moduleKeys = Object.keys(modules).sort()
    const hashString = moduleKeys.join('|') + moduleKeys.length
    return btoa(hashString).substring(0, 16)
  }

  /**
   * 获取当前用户权限
   */
  private getCurrentUserAuthority(): string {
    try {
      const userInfo = localStorage.getItem('userInfo')
      if (userInfo) {
        const parsed = JSON.parse(userInfo)
        return parsed.authority || '不限'
      }
    } catch {
      // 解析失败，返回默认权限
    }
    return '不限'
  }

  /**
   * 获取组件树（从缓存或重新生成）
   */
  public getComponentTree(): ComponentTree {
    if (this.cachedResult && this.state.isInitialized) {
      return this.cachedResult.componentTree
    }

    // 返回空的组件树
    return {
      categories: [],
      components: [],
      totalCount: 0
    }
  }

  /**
   * 按分类获取组件（优化版本）
   */
  public getComponentsByCategory(mainCategory?: string, subCategory?: string): ComponentDefinition[] {
    if (!this.state.isInitialized || !this.cachedResult) {
      return []
    }

    const components = this.cachedResult.filteredComponents

    if (!mainCategory) {
      return components
    }

    let filtered = components.filter(comp => comp.mainCategory === mainCategory)

    if (subCategory) {
      filtered = filtered.filter(comp => comp.subCategory === subCategory)
    }

    return filtered
  }

  /**
   * 获取所有分类（从缓存）
   */
  public getCategories(): ComponentCategory[] {
    if (this.cachedResult && this.state.isInitialized) {
      return this.cachedResult.componentTree.categories
    }
    return []
  }

  /**
   * 重新应用权限过滤（优化版本）
   */
  public async reapplyPermissionFilter(): Promise<void> {
    const currentAuthority = this.getCurrentUserAuthority()

    // 如果权限没有变化，跳过重新过滤
    if (this.state.userAuthority === currentAuthority) {
      if (process.env.NODE_ENV === 'development') {
      }
      return
    }

    if (process.env.NODE_ENV === 'development') {
    }

    // 重新初始化以应用新的权限过滤
    await this.initialize({ forceReload: true })
  }

  /**
   * 获取初始化状态
   */
  public getInitializationState(): InitializationState {
    return { ...this.state }
  }

  /**
   * 获取缓存统计信息
   */
  public getCacheStats() {
    return {
      isInitialized: this.state.isInitialized,
      cacheAge: this.cachedResult ? Date.now() - this.cachedResult.timestamp : 0,
      componentCount: this.cachedResult?.registeredComponents.length || 0,
      userAuthority: this.state.userAuthority,
      moduleHash: this.state.moduleHash,
      initializationTimestamp: this.state.initializationTimestamp
    }
  }

  /**
   * 清除缓存（强制重新初始化）
   */
  public clearCache(): void {
    if (process.env.NODE_ENV === 'development') {
    }
    this.state.isInitialized = false
    this.cachedResult = null
    this.initializationPromise = null
  }

  /**
   * 预热缓存（在应用启动时调用）
   */
  public async warmupCache(): Promise<void> {
    if (process.env.NODE_ENV === 'development') {
    }
    await this.initialize({ forceReload: false })
  }

  /**
   * 检查是否需要更新（用于热更新场景）
   */
  public async checkForUpdates(): Promise<boolean> {
    if (!this.state.isInitialized) {
      return true
    }

    try {
      // 重新加载模块检查变更
      const currentModules = await this.componentLoader.loadComponents()
      const currentHash = this.generateModuleHash(currentModules)

      const hasChanges = currentHash !== this.state.moduleHash
      if (hasChanges && process.env.NODE_ENV === 'development') {
      }

      return hasChanges
    } catch {
      return false
    }
  }

  /**
   * 增量更新（仅更新变更的部分）
   */
  public async incrementalUpdate(): Promise<void> {
    const hasChanges = await this.checkForUpdates()

    if (hasChanges) {
      if (process.env.NODE_ENV === 'development') {
      }
      await this.initialize({ forceReload: true })
    } else if (process.env.NODE_ENV === 'development') {
    }
  }
}

/**
 * 导出单例实例
 */
export const optimizedInitializationManager = OptimizedInitializationManager.getInstance()

/**
 * 便捷的初始化方法（向后兼容）
 */
export async function initializeCard2SystemOptimized(options?: InitializationOptions): Promise<void> {
  await optimizedInitializationManager.initialize(options)
}

/**
 * 获取优化后的组件树
 */
export function getOptimizedComponentTree(): ComponentTree {
  return optimizedInitializationManager.getComponentTree()
}

/**
 * 获取优化后的分类组件
 */
export function getOptimizedComponentsByCategory(mainCategory?: string, subCategory?: string): ComponentDefinition[] {
  return optimizedInitializationManager.getComponentsByCategory(mainCategory, subCategory)
}

/**
 * 获取优化后的分类列表
 */
export function getOptimizedCategories(): ComponentCategory[] {
  return optimizedInitializationManager.getCategories()
}

// 开发环境调试接口
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  ;(window as any).__CARD2_OPTIMIZED_INIT__ = {
    manager: optimizedInitializationManager,
    getCacheStats: () => optimizedInitializationManager.getCacheStats(),
    clearCache: () => optimizedInitializationManager.clearCache(),
    warmupCache: () => optimizedInitializationManager.warmupCache(),
    checkForUpdates: () => optimizedInitializationManager.checkForUpdates(),
    incrementalUpdate: () => optimizedInitializationManager.incrementalUpdate()
  }
}
