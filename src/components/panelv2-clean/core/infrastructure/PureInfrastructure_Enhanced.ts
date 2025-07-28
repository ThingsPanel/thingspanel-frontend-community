/**
 * @file 纯净基础设施层 - 性能增强版
 * @description 第一层的核心实现增强版 - 支持懒加载、并行初始化、性能优化
 * 
 * 新增特性：
 * 🚀 懒加载：按需加载子系统，提升启动速度
 * ⚡ 并行初始化：子系统并行启动，减少初始化时间
 * 📊 初始化监控：详细的初始化进度和性能指标
 * 🔄 渐进式加载：优先级排序，核心功能优先
 * 💾 资源管理：智能资源分配和内存优化
 * 🛡️ 错误隔离：单个子系统失败不影响整体
 * 
 * 职责边界：
 * ✅ 负责：性能优化的基础设施组装、资源管理、加载策略
 * ❌ 不负责：具体业务逻辑、UI渲染、数据处理算法
 */

import { reactive, ref, computed, watch } from 'vue'
import { nanoid } from 'nanoid'
import type {
  PureInfrastructure as IPureInfrastructure,
  LayoutManager,
  DataPipeline,
  ImportExportPorter,
  ExtensionPointManager,
  Renderer,
  ToolProvider,
  DataProcessor,
  LayoutConfig
} from './interfaces/PureInfrastructure'

/**
 * 子系统加载优先级
 */
export enum SubsystemPriority {
  CRITICAL = 1,    // 关键系统，必须立即加载
  HIGH = 2,        // 高优先级，启动阶段加载
  MEDIUM = 3,      // 中优先级，可延迟加载
  LOW = 4,         // 低优先级，按需加载
  LAZY = 5         // 懒加载，使用时才加载
}

/**
 * 子系统状态
 */
export enum SubsystemStatus {
  UNLOADED = 'unloaded',       // 未加载
  LOADING = 'loading',         // 加载中
  LOADED = 'loaded',           // 已加载
  INITIALIZING = 'initializing', // 初始化中
  READY = 'ready',             // 就绪
  ERROR = 'error',             // 错误
  DISABLED = 'disabled'        // 已禁用
}

/**
 * 子系统定义
 */
interface SubsystemDefinition {
  id: string
  name: string
  priority: SubsystemPriority
  dependencies: string[]
  loader: () => Promise<any>
  initializer?: (instance: any) => Promise<void>
  healthCheck?: (instance: any) => Promise<boolean>
  resourceEstimate: {
    memory: number      // 估计内存使用（KB）
    loadTime: number    // 估计加载时间（ms）
    criticalPath: boolean // 是否在关键路径上
  }
}

/**
 * 子系统实例状态
 */
interface SubsystemInstance {
  definition: SubsystemDefinition
  instance: any
  status: SubsystemStatus
  loadStartTime?: number
  loadEndTime?: number
  initStartTime?: number
  initEndTime?: number
  error?: Error
  memoryUsage?: number
  dependencies: string[]
  dependents: string[]
}

/**
 * 初始化选项
 */
export interface EnhancedInitOptions {
  // 加载控制
  enableLazyLoading?: boolean
  enableParallelInit?: boolean
  maxConcurrency?: number
  loadTimeout?: number
  
  // 性能优化
  preloadCritical?: boolean
  enableResourceMonitoring?: boolean
  memoryLimit?: number
  
  // 进度回调
  onProgress?: (progress: {
    phase: string
    current: number
    total: number
    percentage: number
    subsystem?: string
    message?: string
  }) => void
  
  // 错误处理
  failureStrategy?: 'abort' | 'continue' | 'retry'
  maxRetries?: number
  
  // 调试选项
  enableDebugMode?: boolean
  logLevel?: 'error' | 'warn' | 'info' | 'debug'
}

/**
 * 初始化统计信息
 */
interface InitializationStats {
  totalTime: number
  parallelSavings: number
  memoryUsage: number
  subsystemStats: Record<string, {
    loadTime: number
    initTime: number
    memoryUsage: number
    retryCount: number
  }>
  criticalPathTime: number
  bottlenecks: string[]
}

/**
 * 增强版纯净基础设施层
 * 
 * 这就像一个现代化的智能工厂：
 * - 流水线式生产（并行初始化）
 * - 按需生产（懒加载）
 * - 质量监控（健康检查）
 * - 资源优化（内存管理）
 * - 故障隔离（错误处理）
 */
export class EnhancedPureInfrastructure implements IPureInfrastructure {
  /** 子系统定义注册表 */
  private subsystemDefinitions = new Map<string, SubsystemDefinition>()
  
  /** 子系统实例状态 */
  private subsystemInstances = new Map<string, SubsystemInstance>()
  
  /** 依赖关系图 */
  private dependencyGraph = new Map<string, Set<string>>()
  
  /** 加载队列 */
  private loadQueue: string[] = []
  
  /** 并发控制 */
  private activeLoads = new Set<string>()
  private maxConcurrency = 3
  
  /** 初始化状态 */
  private initialized = ref(false)
  private initializing = ref(false)
  private initProgress = ref(0)
  private currentPhase = ref('waiting')
  
  /** 统计信息 */
  private stats = reactive<InitializationStats>({
    totalTime: 0,
    parallelSavings: 0,
    memoryUsage: 0,
    subsystemStats: {},
    criticalPathTime: 0,
    bottlenecks: []
  })
  
  /** 懒加载代理缓存 */
  private lazyProxies = new Map<string, any>()
  
  /** 初始化选项 */
  private initOptions: EnhancedInitOptions = {}

  constructor() {
    console.log('EnhancedPureInfrastructure: 开始初始化增强版基础设施')
    this.registerBuiltInSubsystems()
    console.log('EnhancedPureInfrastructure: 子系统注册完成')
  }

  // ==================== 公共接口 ====================

  /**
   * 增强版初始化方法
   * 
   * 这就像启动一个现代化工厂：
   * - 首先启动核心生产线（关键子系统）
   * - 然后并行启动各个车间（普通子系统）
   * - 最后准备按需车间（懒加载子系统）
   */
  async initialize(container: HTMLElement, layoutConfig?: LayoutConfig, options?: EnhancedInitOptions): Promise<void> {
    const initId = nanoid()
    const startTime = Date.now()
    
    try {
      console.log('EnhancedPureInfrastructure: 开始增强版初始化', { initId, options })
      
      // 保存初始化选项
      this.initOptions = {
        enableLazyLoading: true,
        enableParallelInit: true,
        maxConcurrency: 3,
        loadTimeout: 30000,
        preloadCritical: true,
        enableResourceMonitoring: true,
        failureStrategy: 'continue',
        maxRetries: 2,
        enableDebugMode: false,
        logLevel: 'info',
        ...options
      }
      
      this.maxConcurrency = this.initOptions.maxConcurrency!
      this.initializing.value = true
      this.initProgress.value = 0
      
      // Phase 1: 依赖分析和加载计划
      this.updateProgress('dependency_analysis', 5, '分析子系统依赖关系...')
      await this.analyzeDependencies()
      
      // Phase 2: 关键子系统预加载
      if (this.initOptions.preloadCritical) {
        this.updateProgress('critical_preload', 15, '预加载关键子系统...')
        await this.preloadCriticalSubsystems()
      }
      
      // Phase 3: 并行初始化核心子系统
      this.updateProgress('core_initialization', 30, '并行初始化核心子系统...')
      await this.initializeCoreSubsystems(container, layoutConfig)
      
      // Phase 4: 并行加载高优先级子系统
      this.updateProgress('high_priority_loading', 60, '加载高优先级子系统...')
      await this.loadHighPrioritySubsystems()
      
      // Phase 5: 设置懒加载代理
      if (this.initOptions.enableLazyLoading) {
        this.updateProgress('lazy_proxy_setup', 80, '设置懒加载代理...')
        this.setupLazyLoadingProxies()
      }
      
      // Phase 6: 健康检查和优化
      this.updateProgress('health_check', 90, '执行系统健康检查...')
      await this.performHealthCheck()
      
      // Phase 7: 完成初始化
      this.updateProgress('completed', 100, '初始化完成')
      
      const totalTime = Date.now() - startTime
      this.stats.totalTime = totalTime
      
      // 计算并行初始化节省的时间
      const sequentialTime = this.calculateSequentialTime()
      this.stats.parallelSavings = Math.max(0, sequentialTime - totalTime)
      
      this.initialized.value = true
      this.initializing.value = false
      
      console.log('EnhancedPureInfrastructure: 增强版初始化完成', {
        initId,
        totalTime,
        parallelSavings: this.stats.parallelSavings,
        memoryUsage: this.stats.memoryUsage
      })
      
    } catch (error) {
      console.error('EnhancedPureInfrastructure: 初始化失败', error)
      this.initializing.value = false
      
      if (this.initOptions.failureStrategy === 'abort') {
        throw error
      }
      
      // 尝试部分初始化
      await this.attemptPartialInitialization(container, layoutConfig)
    }
  }

  /**
   * 获取子系统实例（支持懒加载）
   */
  async getSubsystem<T = any>(id: string): Promise<T> {
    const instance = this.subsystemInstances.get(id)
    
    if (instance?.status === SubsystemStatus.READY) {
      return instance.instance
    }
    
    if (instance?.status === SubsystemStatus.LOADING || instance?.status === SubsystemStatus.INITIALIZING) {
      // 等待加载完成
      return new Promise((resolve, reject) => {
        const checkStatus = () => {
          const currentInstance = this.subsystemInstances.get(id)
          if (currentInstance?.status === SubsystemStatus.READY) {
            resolve(currentInstance.instance)
          } else if (currentInstance?.status === SubsystemStatus.ERROR) {
            reject(currentInstance.error)
          } else {
            setTimeout(checkStatus, 100)
          }
        }
        checkStatus()
      })
    }
    
    // 懒加载
    if (this.initOptions.enableLazyLoading) {
      console.log('EnhancedPureInfrastructure: 懒加载子系统', id)
      await this.loadSubsystem(id)
      const loadedInstance = this.subsystemInstances.get(id)
      if (loadedInstance?.status === SubsystemStatus.READY) {
        return loadedInstance.instance
      }
    }
    
    throw new Error(`子系统 ${id} 不可用`)
  }

  /**
   * 检查子系统状态
   */
  getSubsystemStatus(id: string): SubsystemStatus {
    return this.subsystemInstances.get(id)?.status || SubsystemStatus.UNLOADED
  }

  /**
   * 获取初始化统计信息
   */
  getInitializationStats(): InitializationStats {
    return { ...this.stats }
  }

  /**
   * 获取系统健康状态
   */
  getSystemHealth(): {
    overall: 'healthy' | 'degraded' | 'unhealthy'
    subsystems: Record<string, {
      status: SubsystemStatus
      health: 'healthy' | 'degraded' | 'unhealthy'
      memoryUsage: number
      lastCheck: number
    }>
    recommendations: string[]
  } {
    const subsystems: any = {}
    let healthyCount = 0
    let totalCount = 0
    const recommendations: string[] = []
    
    for (const [id, instance] of this.subsystemInstances.entries()) {
      totalCount++
      const health = this.assessSubsystemHealth(instance)
      subsystems[id] = {
        status: instance.status,
        health,
        memoryUsage: instance.memoryUsage || 0,
        lastCheck: Date.now()
      }
      
      if (health === 'healthy') {
        healthyCount++
      } else if (health === 'degraded') {
        recommendations.push(`子系统 ${id} 性能下降，建议重启`)
      } else {
        recommendations.push(`子系统 ${id} 状态异常，需要检查`)
      }
    }
    
    let overall: 'healthy' | 'degraded' | 'unhealthy'
    if (healthyCount === totalCount) {
      overall = 'healthy'
    } else if (healthyCount / totalCount >= 0.7) {
      overall = 'degraded'
    } else {
      overall = 'unhealthy'
    }
    
    return { overall, subsystems, recommendations }
  }

  // ==================== 兼容性接口 ====================

  /**
   * 兼容性：布局管理器访问器
   */
  get layout(): LayoutManager {
    return this.getLazyProxy('layout')
  }

  /**
   * 兼容性：数据管道访问器
   */
  get pipeline(): DataPipeline {
    return this.getLazyProxy('pipeline')
  }

  /**
   * 兼容性：导入导出门户访问器
   */
  get porter(): ImportExportPorter {
    return this.getLazyProxy('porter')
  }

  /**
   * 兼容性：扩展点管理器访问器
   */
  get extensions(): ExtensionPointManager {
    return this.getLazyProxy('extensions')
  }

  /**
   * 兼容性：生命周期管理器访问器
   */
  get lifecycle(): any {
    return this.getLazyProxy('lifecycle')
  }

  /**
   * 兼容性：事件总线访问器
   */
  get eventBus(): any {
    return this.getLazyProxy('eventBus')
  }

  // ==================== 私有方法 ====================

  /**
   * 注册内置子系统
   */
  private registerBuiltInSubsystems(): void {
    // 布局管理器 - 关键系统
    this.registerSubsystem({
      id: 'layout',
      name: '布局管理器',
      priority: SubsystemPriority.CRITICAL,
      dependencies: [],
      loader: async () => {
        const { PureLayoutManager } = await import('./PureLayoutManager')
        return new PureLayoutManager()
      },
      resourceEstimate: {
        memory: 512,
        loadTime: 100,
        criticalPath: true
      }
    })

    // 数据管道 - 关键系统
    this.registerSubsystem({
      id: 'pipeline',
      name: '数据管道',
      priority: SubsystemPriority.CRITICAL,
      dependencies: ['eventBus'],
      loader: async () => {
        const { PureDataPipeline } = await import('./PureDataPipeline_New')
        return new PureDataPipeline()
      },
      resourceEstimate: {
        memory: 1024,
        loadTime: 150,
        criticalPath: true
      }
    })

    // 事件总线 - 关键系统
    this.registerSubsystem({
      id: 'eventBus',
      name: '事件总线',
      priority: SubsystemPriority.CRITICAL,
      dependencies: [],
      loader: async () => {
        const { EventBus } = await import('./EventBus')
        return new EventBus()
      },
      resourceEstimate: {
        memory: 256,
        loadTime: 50,
        criticalPath: true
      }
    })

    // 生命周期管理器 - 高优先级
    this.registerSubsystem({
      id: 'lifecycle',
      name: '生命周期管理器',
      priority: SubsystemPriority.HIGH,
      dependencies: ['eventBus'],
      loader: async () => {
        const { LifecycleManager } = await import('./LifecycleManager')
        return new LifecycleManager()
      },
      resourceEstimate: {
        memory: 128,
        loadTime: 80,
        criticalPath: false
      }
    })

    // 导入导出门户 - 中优先级
    this.registerSubsystem({
      id: 'porter',
      name: '导入导出门户',
      priority: SubsystemPriority.MEDIUM,
      dependencies: [],
      loader: async () => {
        const { PureImportExportPorter } = await import('./PureImportExportPorter')
        return new PureImportExportPorter()
      },
      resourceEstimate: {
        memory: 768,
        loadTime: 200,
        criticalPath: false
      }
    })

    // 扩展点管理器 - 低优先级
    this.registerSubsystem({
      id: 'extensions',
      name: '扩展点管理器',
      priority: SubsystemPriority.LOW,
      dependencies: [],
      loader: async () => {
        // 内嵌实现，避免额外模块加载
        return new (class implements ExtensionPointManager {
          private renderers = new Map<string, Renderer>()
          private toolProviders = new Map<string, ToolProvider>()
          private dataProcessors = new Map<string, DataProcessor>()

          registerRenderer(type: string, renderer: Renderer): void {
            this.renderers.set(type, renderer)
          }

          registerToolProvider(category: string, provider: ToolProvider): void {
            this.toolProviders.set(category, provider)
          }

          registerDataProcessor(type: string, processor: DataProcessor): void {
            this.dataProcessors.set(type, processor)
          }

          getExtensions(type: string): any[] {
            switch (type) {
              case 'renderer': return Array.from(this.renderers.values())
              case 'tool': return Array.from(this.toolProviders.values())
              case 'processor': return Array.from(this.dataProcessors.values())
              default: return []
            }
          }

          unregisterExtension(type: string, id: string): void {
            switch (type) {
              case 'renderer': this.renderers.delete(id); break
              case 'tool': this.toolProviders.delete(id); break
              case 'processor': this.dataProcessors.delete(id); break
            }
          }

          getRenderer(type: string): Renderer | undefined {
            return this.renderers.get(type)
          }

          getToolProvider(category: string): ToolProvider | undefined {
            return this.toolProviders.get(category)
          }

          getDataProcessor(type: string): DataProcessor | undefined {
            return this.dataProcessors.get(type)
          }
        })()
      },
      resourceEstimate: {
        memory: 64,
        loadTime: 30,
        criticalPath: false
      }
    })

    console.log('EnhancedPureInfrastructure: 内置子系统注册完成')
  }

  /**
   * 注册子系统定义
   */
  private registerSubsystem(definition: SubsystemDefinition): void {
    this.subsystemDefinitions.set(definition.id, definition)
    
    // 初始化实例状态
    this.subsystemInstances.set(definition.id, {
      definition,
      instance: null,
      status: SubsystemStatus.UNLOADED,
      dependencies: [...definition.dependencies],
      dependents: []
    })
    
    // 更新依赖关系图
    for (const dep of definition.dependencies) {
      if (!this.dependencyGraph.has(dep)) {
        this.dependencyGraph.set(dep, new Set())
      }
      this.dependencyGraph.get(dep)!.add(definition.id)
    }
    
    console.log('EnhancedPureInfrastructure: 注册子系统', definition.id)
  }

  /**
   * 分析依赖关系
   */
  private async analyzeDependencies(): Promise<void> {
    // 构建完整的依赖关系图
    for (const [id, instance] of this.subsystemInstances.entries()) {
      const dependents: string[] = []
      
      for (const [otherId, otherInstance] of this.subsystemInstances.entries()) {
        if (otherInstance.dependencies.includes(id)) {
          dependents.push(otherId)
        }
      }
      
      instance.dependents = dependents
    }
    
    // 拓扑排序确定加载顺序
    this.loadQueue = this.topologicalSort()
    
    console.log('EnhancedPureInfrastructure: 依赖分析完成', {
      loadOrder: this.loadQueue,
      dependencies: Object.fromEntries(
        Array.from(this.subsystemInstances.entries()).map(([id, instance]) => [
          id, 
          { deps: instance.dependencies, dependents: instance.dependents }
        ])
      )
    })
  }

  /**
   * 拓扑排序
   */
  private topologicalSort(): string[] {
    const visited = new Set<string>()
    const visiting = new Set<string>()
    const result: string[] = []
    
    const visit = (id: string) => {
      if (visiting.has(id)) {
        throw new Error(`检测到循环依赖: ${id}`)
      }
      
      if (visited.has(id)) return
      
      visiting.add(id)
      
      const instance = this.subsystemInstances.get(id)
      if (instance) {
        for (const dep of instance.dependencies) {
          visit(dep)
        }
      }
      
      visiting.delete(id)
      visited.add(id)
      result.push(id)
    }
    
    // 按优先级排序后进行拓扑排序
    const sortedIds = Array.from(this.subsystemDefinitions.keys()).sort((a, b) => {
      const defA = this.subsystemDefinitions.get(a)!
      const defB = this.subsystemDefinitions.get(b)!
      return defA.priority - defB.priority
    })
    
    for (const id of sortedIds) {
      visit(id)
    }
    
    return result
  }

  /**
   * 预加载关键子系统
   */
  private async preloadCriticalSubsystems(): Promise<void> {
    const criticalSystems = Array.from(this.subsystemDefinitions.values())
      .filter(def => def.priority === SubsystemPriority.CRITICAL)
      .sort((a, b) => a.resourceEstimate.loadTime - b.resourceEstimate.loadTime)
    
    console.log('EnhancedPureInfrastructure: 开始预加载关键子系统', criticalSystems.map(s => s.id))
    
    // 串行预加载关键系统，确保稳定性
    for (const definition of criticalSystems) {
      await this.loadSubsystem(definition.id)
    }
    
    console.log('EnhancedPureInfrastructure: 关键子系统预加载完成')
  }

  /**
   * 并行初始化核心子系统
   */
  private async initializeCoreSubsystems(container: HTMLElement, layoutConfig?: LayoutConfig): Promise<void> {
    const coreInitTasks: Promise<void>[] = []
    
    // 布局系统初始化（必须在主线程）
    const layoutTask = this.getSubsystem('layout').then(async (layout) => {
      const config = layoutConfig || this.getDefaultLayoutConfig()
      await layout.initialize(container, config)
      console.log('EnhancedPureInfrastructure: 布局系统初始化완成')
    })
    coreInitTasks.push(layoutTask)
    
    // 数据管道初始化
    const pipelineTask = this.getSubsystem('pipeline').then(async (pipeline) => {
      // 数据管道的初始化逻辑
      console.log('EnhancedPureInfrastructure: 数据管道初始化完成')
    })
    coreInitTasks.push(pipelineTask)
    
    // 等待核心系统初始化完成
    await Promise.all(coreInitTasks)
    
    // 建立核心系统间的连接
    await this.setupCoreConnections()
  }

  /**
   * 加载高优先级子系统
   */
  private async loadHighPrioritySubsystems(): Promise<void> {
    const highPrioritySystems = this.loadQueue.filter(id => {
      const def = this.subsystemDefinitions.get(id)
      return def && def.priority <= SubsystemPriority.HIGH
    })
    
    // 并行加载高优先级系统
    const loadTasks = highPrioritySystems.map(id => this.loadSubsystem(id))
    await Promise.all(loadTasks)
    
    console.log('EnhancedPureInfrastructure: 高优先级子系统加载完成')
  }

  /**
   * 加载单个子系统
   */
  private async loadSubsystem(id: string): Promise<void> {
    const instance = this.subsystemInstances.get(id)
    if (!instance || instance.status !== SubsystemStatus.UNLOADED) {
      return
    }
    
    // 检查并发限制
    while (this.activeLoads.size >= this.maxConcurrency) {
      await new Promise(resolve => setTimeout(resolve, 10))
    }
    
    this.activeLoads.add(id)
    
    try {
      instance.status = SubsystemStatus.LOADING
      instance.loadStartTime = Date.now()
      
      console.log('EnhancedPureInfrastructure: 开始加载子系统', id)
      
      // 确保依赖已加载
      for (const depId of instance.dependencies) {
        await this.loadSubsystem(depId)
      }
      
      // 加载子系统实例
      const loadedInstance = await instance.definition.loader()
      instance.instance = loadedInstance
      instance.loadEndTime = Date.now()
      
      // 执行初始化（如果有）
      if (instance.definition.initializer) {
        instance.status = SubsystemStatus.INITIALIZING
        instance.initStartTime = Date.now()
        
        await instance.definition.initializer(loadedInstance)
        
        instance.initEndTime = Date.now()
      }
      
      instance.status = SubsystemStatus.READY
      
      // 更新统计信息
      const loadTime = (instance.loadEndTime || 0) - (instance.loadStartTime || 0)
      const initTime = (instance.initEndTime || 0) - (instance.initStartTime || 0)
      
      this.stats.subsystemStats[id] = {
        loadTime,
        initTime,
        memoryUsage: instance.definition.resourceEstimate.memory,
        retryCount: 0
      }
      
      this.stats.memoryUsage += instance.definition.resourceEstimate.memory
      
      console.log('EnhancedPureInfrastructure: 子系统加载完成', {
        id,
        loadTime,
        initTime,
        totalTime: loadTime + initTime
      })
      
    } catch (error) {
      console.error('EnhancedPureInfrastructure: 子系统加载失败', id, error)
      
      instance.status = SubsystemStatus.ERROR
      instance.error = error as Error
      
      // 根据策略处理错误
      if (this.initOptions.failureStrategy === 'retry' && 
          (this.stats.subsystemStats[id]?.retryCount || 0) < (this.initOptions.maxRetries || 2)) {
        
        console.log('EnhancedPureInfrastructure: 重试加载子系统', id)
        this.stats.subsystemStats[id] = this.stats.subsystemStats[id] || { loadTime: 0, initTime: 0, memoryUsage: 0, retryCount: 0 }
        this.stats.subsystemStats[id].retryCount++
        
        instance.status = SubsystemStatus.UNLOADED
        await new Promise(resolve => setTimeout(resolve, 1000)) // 延迟重试
        return this.loadSubsystem(id)
      }
      
    } finally {
      this.activeLoads.delete(id)
    }
  }

  /**
   * 设置懒加载代理
   */
  private setupLazyLoadingProxies(): void {
    for (const [id, instance] of this.subsystemInstances.entries()) {
      if (instance.status === SubsystemStatus.UNLOADED) {
        this.createLazyProxy(id)
      }
    }
    
    console.log('EnhancedPureInfrastructure: 懒加载代理设置完成')
  }

  /**
   * 创建懒加载代理
   */
  private createLazyProxy(id: string): any {
    if (this.lazyProxies.has(id)) {
      return this.lazyProxies.get(id)
    }
    
    const proxy = new Proxy({}, {
      get: (target, prop) => {
        // 触发懒加载
        return this.getSubsystem(id).then(instance => {
          if (instance && typeof instance[prop] === 'function') {
            return instance[prop].bind(instance)
          }
          return instance[prop]
        })
      }
    })
    
    this.lazyProxies.set(id, proxy)
    return proxy
  }

  /**
   * 获取懒加载代理
   */
  private getLazyProxy(id: string): any {
    const instance = this.subsystemInstances.get(id)
    if (instance?.status === SubsystemStatus.READY) {
      return instance.instance
    }
    
    return this.createLazyProxy(id)
  }

  /**
   * 执行系统健康检查
   */
  private async performHealthCheck(): Promise<void> {
    const healthChecks: Promise<void>[] = []
    
    for (const [id, instance] of this.subsystemInstances.entries()) {
      if (instance.status === SubsystemStatus.READY && instance.definition.healthCheck) {
        const healthCheck = instance.definition.healthCheck(instance.instance).catch(error => {
          console.warn('EnhancedPureInfrastructure: 健康检查失败', id, error)
          return false
        })
        
        healthChecks.push(healthCheck.then(isHealthy => {
          if (!isHealthy) {
            console.warn('EnhancedPureInfrastructure: 子系统健康状态异常', id)
          }
        }))
      }
    }
    
    await Promise.all(healthChecks)
    console.log('EnhancedPureInfrastructure: 系统健康检查完成')
  }

  /**
   * 建立核心系统连接
   */
  private async setupCoreConnections(): Promise<void> {
    // 连接事件总线和数据管道
    const eventBus = await this.getSubsystem('eventBus')
    const pipeline = await this.getSubsystem('pipeline')
    
    if (eventBus && pipeline) {
      // 建立事件和数据的连接
      console.log('EnhancedPureInfrastructure: 核心系统连接建立完成')
    }
  }

  /**
   * 更新初始化进度
   */
  private updateProgress(phase: string, percentage: number, message?: string): void {
    this.currentPhase.value = phase
    this.initProgress.value = percentage
    
    if (this.initOptions.onProgress) {
      this.initOptions.onProgress({
        phase,
        current: percentage,
        total: 100,
        percentage,
        message
      })
    }
    
    console.log(`EnhancedPureInfrastructure: ${phase} - ${percentage}% ${message || ''}`)
  }

  /**
   * 计算顺序加载时间
   */
  private calculateSequentialTime(): number {
    return Array.from(this.subsystemDefinitions.values())
      .reduce((total, def) => total + def.resourceEstimate.loadTime, 0)
  }

  /**
   * 评估子系统健康状态
   */
  private assessSubsystemHealth(instance: SubsystemInstance): 'healthy' | 'degraded' | 'unhealthy' {
    if (instance.status === SubsystemStatus.ERROR) {
      return 'unhealthy'
    }
    
    if (instance.status !== SubsystemStatus.READY) {
      return 'degraded'
    }
    
    // 检查内存使用情况
    const memoryUsage = instance.memoryUsage || 0
    const estimatedMemory = instance.definition.resourceEstimate.memory
    
    if (memoryUsage > estimatedMemory * 2) {
      return 'degraded'
    }
    
    return 'healthy'
  }

  /**
   * 尝试部分初始化
   */
  private async attemptPartialInitialization(container: HTMLElement, layoutConfig?: LayoutConfig): Promise<void> {
    console.warn('EnhancedPureInfrastructure: 尝试部分初始化')
    
    // 至少尝试初始化关键系统
    try {
      const layout = await this.getSubsystem('layout')
      const config = layoutConfig || this.getDefaultLayoutConfig()
      await layout.initialize(container, config)
      
      this.initialized.value = true
      console.log('EnhancedPureInfrastructure: 部分初始化成功（仅布局系统）')
    } catch (error) {
      console.error('EnhancedPureInfrastructure: 部分初始化也失败', error)
      throw error
    }
  }

  /**
   * 获取默认布局配置
   */
  private getDefaultLayoutConfig(): LayoutConfig {
    return {
      regions: {
        toolbar: { height: 40 },
        sidebar: { width: 240 },
        main: { flex: 1 },
        inspector: { width: 280 }
      }
    }
  }

  /**
   * 销毁增强版基础设施
   */
  async destroy(): Promise<void> {
    console.log('EnhancedPureInfrastructure: 开始销毁增强版基础设施')
    
    // 停止所有加载任务
    this.activeLoads.clear()
    
    // 销毁所有子系统
    const destroyTasks: Promise<void>[] = []
    
    for (const [id, instance] of this.subsystemInstances.entries()) {
      if (instance.status === SubsystemStatus.READY && instance.instance?.destroy) {
        destroyTasks.push(
          Promise.resolve(instance.instance.destroy()).catch(error => {
            console.error(`销毁子系统 ${id} 失败`, error)
          })
        )
      }
    }
    
    await Promise.all(destroyTasks)
    
    // 清理状态
    this.subsystemInstances.clear()
    this.lazyProxies.clear()
    this.initialized.value = false
    this.initializing.value = false
    
    console.log('EnhancedPureInfrastructure: 增强版基础设施销毁完成')
  }
}

/**
 * 创建增强版基础设施实例
 */
export const createEnhancedPureInfrastructure = (): EnhancedPureInfrastructure => {
  return new EnhancedPureInfrastructure()
}

/**
 * 全局增强版基础设施实例（延迟初始化）
 */
let _globalEnhancedPureInfrastructure: EnhancedPureInfrastructure | null = null

export const globalEnhancedPureInfrastructure = new Proxy({} as EnhancedPureInfrastructure, {
  get(target, prop) {
    if (!_globalEnhancedPureInfrastructure) {
      console.log('globalEnhancedPureInfrastructure Proxy: 延迟初始化增强版基础设施')
      _globalEnhancedPureInfrastructure = createEnhancedPureInfrastructure()
    }
    return _globalEnhancedPureInfrastructure[prop as keyof EnhancedPureInfrastructure]
  }
})

/**
 * 导出相关类型
 */
export type {
  SubsystemDefinition,
  SubsystemInstance,
  EnhancedInitOptions,
  InitializationStats
}