/**
 * 系统统一初始化管理器
 * 整合所有子系统的初始化流程，提供统一的启动和状态管理
 */

// 🔥 已删除：OptimizedConfigurationManager 过度设计的缓存层已移除
// 使用 ConfigurationIntegrationBridge 提供配置管理服务
import { optimizedInitializationManager } from '@/card2.1/core2/OptimizedInitializationManager'
import { typeCompatibilityChecker } from '@/core/data-architecture/TypeCompatibilityChecker'

/**
 * 子系统状态枚举
 */
export enum SubSystemStatus {
  PENDING = 'pending',
  INITIALIZING = 'initializing',
  INITIALIZED = 'initialized',
  FAILED = 'failed'
}

/**
 * 子系统初始化配置
 */
export interface SubSystemConfig {
  /** 子系统名称 */
  name: string
  /** 子系统显示名称 */
  displayName: string
  /** 初始化优先级（越小越先执行） */
  priority: number
  /** 初始化函数 */
  initialize: () => Promise<void>
  /** 是否必需（失败时是否阻止系统启动） */
  required: boolean
  /** 依赖的其他子系统 */
  dependencies: string[]
  /** 超时时间（毫秒） */
  timeout: number
  /** 健康检查函数 */
  healthCheck?: () => Promise<boolean>
  /** 重试次数 */
  retries?: number
}

/**
 * 子系统状态信息
 */
export interface SubSystemState {
  /** 子系统名称 */
  name: string
  /** 当前状态 */
  status: SubSystemStatus
  /** 初始化开始时间 */
  startTime?: number
  /** 初始化结束时间 */
  endTime?: number
  /** 初始化耗时（毫秒） */
  duration?: number
  /** 错误信息 */
  error?: string
  /** 重试次数 */
  retriesCount: number
  /** 健康检查状态 */
  healthStatus?: boolean
}

/**
 * 系统初始化状态
 */
export interface SystemInitializationState {
  /** 是否已初始化 */
  isInitialized: boolean
  /** 是否正在初始化 */
  isInitializing: boolean
  /** 系统启动时间 */
  startTime?: number
  /** 系统启动完成时间 */
  endTime?: number
  /** 总初始化时长 */
  totalDuration?: number
  /** 子系统状态映射 */
  subSystems: Map<string, SubSystemState>
  /** 初始化失败的子系统 */
  failedSubSystems: string[]
  /** 成功初始化的子系统数量 */
  successCount: number
  /** 总子系统数量 */
  totalCount: number
}

/**
 * 初始化选项
 */
export interface InitializationOptions {
  /** 是否强制重新初始化 */
  forceReload?: boolean
  /** 是否允许部分失败 */
  allowPartialFailure?: boolean
  /** 并发初始化数量限制 */
  concurrencyLimit?: number
  /** 全局超时时间（毫秒） */
  globalTimeout?: number
  /** 是否启用健康检查 */
  enableHealthCheck?: boolean
  /** 要跳过的子系统 */
  skipSubSystems?: string[]
}

/**
 * 统一系统初始化管理器
 */
export class SystemInitializer {
  private static instance: SystemInitializer | null = null

  /** 子系统配置注册表 */
  private subSystemConfigs = new Map<string, SubSystemConfig>()

  /** 系统初始化状态 */
  private state: SystemInitializationState = {
    isInitialized: false,
    isInitializing: false,
    subSystems: new Map(),
    failedSubSystems: [],
    successCount: 0,
    totalCount: 0
  }

  /** 初始化锁 */
  private initializationPromise: Promise<void> | null = null

  /** 事件监听器 */
  private eventListeners = new Map<string, Array<(...args: any[]) => void>>()

  private constructor() {
    this.registerBuiltInSubSystems()
  }

  public static getInstance(): SystemInitializer {
    if (!this.instance) {
      this.instance = new SystemInitializer()
    }
    return this.instance
  }

  /**
   * 注册内置子系统
   */
  private registerBuiltInSubSystems(): void {
    // 1. 配置管理器
    this.registerSubSystem({
      name: 'configuration-manager',
      displayName: '配置管理器',
      priority: 1,
      required: true,
      dependencies: [],
      timeout: 5000,
      retries: 2,
      initialize: async () => {
        // 配置管理器通常不需要异步初始化，但可以在这里执行预热
        if (process.env.NODE_ENV === 'development') {
        }
      },
      healthCheck: async () => {
        // 🔥 已迁移：配置管理现在通过 ConfigurationIntegrationBridge 处理
        return true
      }
    })

    // 2. Card2.1 系统
    this.registerSubSystem({
      name: 'card2-system',
      displayName: 'Card2.1 组件系统',
      priority: 2,
      required: true,
      dependencies: ['configuration-manager'],
      timeout: 15000,
      retries: 3,
      initialize: async () => {
        if (process.env.NODE_ENV === 'development') {
        }
        await optimizedInitializationManager.initialize({ forceReload: false })
      },
      healthCheck: async () => {
        const stats = optimizedInitializationManager.getCacheStats()
        return stats.isInitialized && stats.componentCount > 0
      }
    })

    // 3. 类型兼容性检查器
    this.registerSubSystem({
      name: 'type-checker',
      displayName: '类型兼容性检查器',
      priority: 3,
      required: false,
      dependencies: ['configuration-manager'],
      timeout: 3000,
      retries: 1,
      initialize: async () => {
        if (process.env.NODE_ENV === 'development') {
        }
        // 预热类型映射表
        typeCompatibilityChecker.getTypeMappingStats()
      },
      healthCheck: async () => {
        const stats = typeCompatibilityChecker.getTypeMappingStats()
        return stats.totalMappings > 0
      }
    })

    // 4. 数据架构系统（可选）
    this.registerSubSystem({
      name: 'data-architecture',
      displayName: '数据架构系统',
      priority: 4,
      required: false,
      dependencies: ['configuration-manager', 'type-checker'],
      timeout: 8000,
      retries: 2,
      initialize: async () => {
        if (process.env.NODE_ENV === 'development') {
        }
        // 这里可以初始化其他数据架构相关的组件
        // 如果有其他异步初始化需求，可以在这里添加
      },
      healthCheck: async () => {
        // 简单的健康检查
        return true
      }
    })
  }

  /**
   * 注册子系统
   */
  public registerSubSystem(config: SubSystemConfig): void {
    this.subSystemConfigs.set(config.name, config)

    // 初始化子系统状态
    this.state.subSystems.set(config.name, {
      name: config.name,
      status: SubSystemStatus.PENDING,
      retriesCount: 0
    })

    this.state.totalCount = this.subSystemConfigs.size
    if (process.env.NODE_ENV === 'development') {
    }
  }

  /**
   * 统一初始化所有子系统
   */
  public async initialize(options: InitializationOptions = {}): Promise<void> {
    // 防止重复初始化
    if (this.state.isInitialized && !options.forceReload) {
      if (process.env.NODE_ENV === 'development') {
      }
      return
    }

    if (this.initializationPromise) {
      return this.initializationPromise
    }

    this.initializationPromise = this.performInitialization(options)

    try {
      await this.initializationPromise
    } finally {
      this.initializationPromise = null
    }
  }

  /**
   * 执行初始化流程
   */
  private async performInitialization(options: InitializationOptions): Promise<void> {
    const {
      allowPartialFailure = true,
      concurrencyLimit = 3,
      globalTimeout = 60000,
      enableHealthCheck = true,
      skipSubSystems = []
    } = options

    this.state.isInitializing = true
    this.state.startTime = Date.now()
    this.state.failedSubSystems = []
    this.state.successCount = 0

    if (process.env.NODE_ENV === 'development') {
    }
    this.emit('initialization-started', this.getInitializationState())

    try {
      // 获取初始化顺序
      const initializationOrder = this.resolveInitializationOrder(skipSubSystems)
      if (process.env.NODE_ENV === 'development') {
      }

      // 全局超时控制
      const initPromise = this.executeInitializationSequence(initializationOrder, concurrencyLimit, enableHealthCheck)
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('系统初始化超时')), globalTimeout)
      })

      await Promise.race([initPromise, timeoutPromise])

      // 检查初始化结果
      const hasRequiredFailures = this.state.failedSubSystems.some(name => {
        const config = this.subSystemConfigs.get(name)
        return config?.required
      })

      if (hasRequiredFailures && !allowPartialFailure) {
        throw new Error(`必需子系统初始化失败: ${this.state.failedSubSystems.join(', ')}`)
      }

      this.state.isInitialized = true
      this.state.endTime = Date.now()
      this.state.totalDuration = this.state.endTime - this.state.startTime!

      if (process.env.NODE_ENV === 'development') {
      }

      if (this.state.failedSubSystems.length > 0) {
        console.error(`⚠️ [SystemInitializer] 失败子系统: ${this.state.failedSubSystems.join(', ')}`)
      }

      this.emit('initialization-completed', this.getInitializationState())
    } catch (error) {
      console.error('❌ [SystemInitializer] 系统初始化失败:', error)
      this.emit('initialization-failed', { error: error.message, state: this.getInitializationState() })
      throw error
    } finally {
      this.state.isInitializing = false
    }
  }

  /**
   * 解析初始化顺序（拓扑排序）
   */
  private resolveInitializationOrder(skipSubSystems: string[]): SubSystemConfig[] {
    const configs = Array.from(this.subSystemConfigs.values()).filter(config => !skipSubSystems.includes(config.name))

    // 简化的拓扑排序：按优先级和依赖关系排序
    const sorted: SubSystemConfig[] = []
    const visited = new Set<string>()
    const visiting = new Set<string>()

    const visit = (config: SubSystemConfig) => {
      if (visiting.has(config.name)) {
        throw new Error(`检测到循环依赖: ${config.name}`)
      }

      if (visited.has(config.name)) {
        return
      }

      visiting.add(config.name)

      // 先处理依赖
      for (const depName of config.dependencies) {
        const depConfig = this.subSystemConfigs.get(depName)
        if (depConfig && !skipSubSystems.includes(depName)) {
          visit(depConfig)
        }
      }

      visiting.delete(config.name)
      visited.add(config.name)
      sorted.push(config)
    }

    // 按优先级排序后进行拓扑排序
    const prioritySorted = configs.sort((a, b) => a.priority - b.priority)
    for (const config of prioritySorted) {
      if (!visited.has(config.name)) {
        visit(config)
      }
    }

    return sorted
  }

  /**
   * 执行初始化序列
   */
  private async executeInitializationSequence(
    configs: SubSystemConfig[],
    concurrencyLimit: number,
    enableHealthCheck: boolean
  ): Promise<void> {
    // 简化版本：串行执行（可以后续优化为基于依赖的并行执行）
    for (const config of configs) {
      await this.initializeSubSystem(config, enableHealthCheck)
    }
  }

  /**
   * 初始化单个子系统
   */
  private async initializeSubSystem(config: SubSystemConfig, enableHealthCheck: boolean): Promise<void> {
    const state = this.state.subSystems.get(config.name)!
    const maxRetries = config.retries || 0

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        state.status = SubSystemStatus.INITIALIZING
        state.startTime = Date.now()
        state.retriesCount = attempt

        if (process.env.NODE_ENV === 'development') {
        }
        this.emit('subsystem-initializing', { name: config.name, attempt: attempt + 1 })

        // 执行初始化
        const initPromise = config.initialize()
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('初始化超时')), config.timeout)
        })

        await Promise.race([initPromise, timeoutPromise])

        // 健康检查
        if (enableHealthCheck && config.healthCheck) {
          const isHealthy = await config.healthCheck()
          state.healthStatus = isHealthy

          if (!isHealthy) {
            throw new Error('健康检查失败')
          }
        }

        // 初始化成功
        state.status = SubSystemStatus.INITIALIZED
        state.endTime = Date.now()
        state.duration = state.endTime - state.startTime!
        this.state.successCount++

        if (process.env.NODE_ENV === 'development') {
        }
        this.emit('subsystem-initialized', { name: config.name, duration: state.duration })

        return // 成功，退出重试循环
      } catch (error) {
        console.error(`❌ [SystemInitializer] 子系统初始化失败: ${config.displayName}, 错误:`, error.message)

        if (attempt === maxRetries) {
          // 所有重试都失败了
          state.status = SubSystemStatus.FAILED
          state.error = error.message
          state.endTime = Date.now()
          state.duration = state.endTime - state.startTime!
          this.state.failedSubSystems.push(config.name)

          this.emit('subsystem-failed', { name: config.name, error: error.message, attempt: attempt + 1 })

          if (config.required) {
            throw new Error(`必需子系统初始化失败: ${config.displayName}`)
          }
          return
        }

        // 等待一段时间后重试
        await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)))
      }
    }
  }

  /**
   * 获取初始化状态
   */
  public getInitializationState(): SystemInitializationState {
    return {
      ...this.state,
      subSystems: new Map(this.state.subSystems) // 创建副本
    }
  }

  /**
   * 获取子系统状态
   */
  public getSubSystemState(name: string): SubSystemState | undefined {
    return this.state.subSystems.get(name)
  }

  /**
   * 检查系统是否已初始化
   */
  public isInitialized(): boolean {
    return this.state.isInitialized
  }

  /**
   * 检查是否正在初始化
   */
  public isInitializing(): boolean {
    return this.state.isInitializing
  }

  /**
   * 执行系统健康检查
   */
  public async performHealthCheck(): Promise<{ healthy: boolean; details: Record<string, boolean> }> {
    const details: Record<string, boolean> = {}
    let allHealthy = true

    for (const [name, config] of this.subSystemConfigs) {
      if (config.healthCheck) {
        try {
          const isHealthy = await config.healthCheck()
          details[name] = isHealthy
          if (!isHealthy) allHealthy = false
        } catch {
          details[name] = false
          allHealthy = false
        }
      } else {
        const state = this.state.subSystems.get(name)
        details[name] = state?.status === SubSystemStatus.INITIALIZED
        if (state?.status !== SubSystemStatus.INITIALIZED) allHealthy = false
      }
    }

    return { healthy: allHealthy, details }
  }

  /**
   * 重新初始化失败的子系统
   */
  public async reinitializeFailedSystems(): Promise<void> {
    const failedSystems = [...this.state.failedSubSystems]

    if (failedSystems.length === 0) {
      if (process.env.NODE_ENV === 'development') {
      }
      return
    }

    for (const systemName of failedSystems) {
      const config = this.subSystemConfigs.get(systemName)
      if (config) {
        await this.initializeSubSystem(config, true)
      }
    }
  }

  /**
   * 事件监听器
   */
  public on(event: string, listener: (...args: any[]) => void): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, [])
    }
    this.eventListeners.get(event)!.push(listener)
  }

  /**
   * 发射事件
   */
  private emit(event: string, ...args: any[]): void {
    const listeners = this.eventListeners.get(event)
    if (listeners) {
      listeners.forEach(listener => listener(...args))
    }
  }

  /**
   * 获取初始化统计
   */
  public getInitializationStats() {
    const subSystemStats = Array.from(this.state.subSystems.values()).reduce(
      (acc, state) => {
        acc[state.status] = (acc[state.status] || 0) + 1
        return acc
      },
      {} as Record<string, number>
    )

    return {
      totalSystems: this.state.totalCount,
      successCount: this.state.successCount,
      failedCount: this.state.failedSubSystems.length,
      isInitialized: this.state.isInitialized,
      isInitializing: this.state.isInitializing,
      totalDuration: this.state.totalDuration,
      subSystemStats
    }
  }
}

/**
 * 导出单例实例
 */
export const systemInitializer = SystemInitializer.getInstance()

/**
 * 便捷的初始化方法
 */
export async function initializeSystem(options?: InitializationOptions): Promise<void> {
  await systemInitializer.initialize(options)
}

/**
 * 检查系统状态
 */
export function getSystemInitializationState(): SystemInitializationState {
  return systemInitializer.getInitializationState()
}

/**
 * 执行系统健康检查
 */
export async function performSystemHealthCheck() {
  return await systemInitializer.performHealthCheck()
}

// 开发环境调试接口
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  ;(window as any).__SYSTEM_INITIALIZER__ = {
    initializer: systemInitializer,
    initialize: initializeSystem,
    getState: getSystemInitializationState,
    healthCheck: performSystemHealthCheck,
    getStats: () => systemInitializer.getInitializationStats(),
    reinitializeFailed: () => systemInitializer.reinitializeFailedSystems()
  }
}
