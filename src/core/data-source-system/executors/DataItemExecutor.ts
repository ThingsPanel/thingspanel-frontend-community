/**
 * 数据项执行器抽象基类
 * 实现"数组思想" - 每个数据项作为独立的执行器
 * 支持完整的生命周期管理、事件系统、状态管理
 */

import type {
  DataItemType,
  ExecutorConfig,
  ExecutorState,
  ExecutorRuntimeState,
  ExecutionResult,
  ExecutorEvent,
  ExecutorEventType,
  ExecutorEventHandler,
  ExecutorLifecycle,
  LifecycleCallbacks,
  TriggerConfig,
  MaybePromise,
  ExecutorError,
  ExecutorErrorType
} from './types'

import { defaultScriptEngine } from '@/core/script-engine'

/**
 * 数据项执行器抽象基类
 * 这是整个执行器系统的核心，定义了执行器的基本行为和接口
 */
export abstract class DataItemExecutor {
  // ========== 抽象属性和方法 ==========

  /** 执行器类型 - 由子类实现 */
  abstract readonly type: DataItemType

  /** 执行具体的数据获取逻辑 - 由子类实现 */
  protected abstract executeInternal(): MaybePromise<any>

  /** 验证配置是否有效 - 由子类实现 */
  protected abstract validateConfig(config: ExecutorConfig): boolean

  // ========== 实例属性 ==========

  /** 执行器配置 */
  protected config: ExecutorConfig

  /** 运行时状态 */
  protected runtimeState: ExecutorRuntimeState

  /** 生命周期状态 */
  protected lifecycle: ExecutorLifecycle = ExecutorLifecycle.CREATED

  /** 事件监听器 */
  private eventHandlers = new Map<ExecutorEventType, ExecutorEventHandler[]>()

  /** 生命周期回调 */
  private lifecycleCallbacks?: LifecycleCallbacks

  /** 触发器配置 */
  private triggerConfig?: TriggerConfig

  /** 定时器ID */
  private timerId?: number

  /** WebSocket连接 */
  private websocket?: WebSocket

  /** 是否已销毁 */
  private disposed = false

  /** 执行历史记录 */
  private executionHistory: ExecutionResult[] = []

  // ========== 构造函数 ==========

  constructor(config: ExecutorConfig, callbacks?: LifecycleCallbacks) {
    this.config = { ...config }
    this.lifecycleCallbacks = callbacks

    // 初始化运行时状态
    this.runtimeState = {
      state: ExecutorState.IDLE,
      executionCount: 0,
      successCount: 0,
      errorCount: 0,
      isRunning: false
    }

    // 验证配置
    if (!this.validateConfig(config)) {
      throw new ExecutorError(
        ExecutorErrorType.CONFIG_ERROR,
        `Invalid configuration for executor ${config.id}`,
        config.id
      )
    }

    this.lifecycle = ExecutorLifecycle.CREATED
    this.lifecycleCallbacks?.onCreated?.()

    console.log(`🔧 [DataItemExecutor] 创建执行器: ${this.config.id} (${this.type})`)
  }

  // ========== 公共接口方法 ==========

  /**
   * 获取执行器ID
   */
  getId(): string {
    return this.config.id
  }

  /**
   * 获取执行器名称
   */
  getName(): string {
    return this.config.name
  }

  /**
   * 获取执行器类型
   */
  getType(): DataItemType {
    return this.type
  }

  /**
   * 获取当前配置
   */
  getConfig(): Readonly<ExecutorConfig> {
    return { ...this.config }
  }

  /**
   * 更新配置
   */
  updateConfig(newConfig: Partial<ExecutorConfig>): void {
    this.throwIfDisposed()

    const updatedConfig = { ...this.config, ...newConfig, updatedAt: new Date().toISOString() }

    if (!this.validateConfig(updatedConfig as ExecutorConfig)) {
      throw new ExecutorError(
        ExecutorErrorType.CONFIG_ERROR,
        `Invalid configuration update for executor ${this.config.id}`,
        this.config.id
      )
    }

    this.config = updatedConfig as ExecutorConfig
    this.emit(ExecutorEventType.CONFIG_UPDATED, { config: this.config })

    console.log(`🔧 [DataItemExecutor] 配置已更新: ${this.config.id}`)
  }

  /**
   * 获取运行时状态
   */
  getState(): Readonly<ExecutorRuntimeState> {
    return { ...this.runtimeState }
  }

  /**
   * 获取生命周期状态
   */
  getLifecycle(): ExecutorLifecycle {
    return this.lifecycle
  }

  /**
   * 获取执行历史
   */
  getExecutionHistory(): Readonly<ExecutionResult[]> {
    return [...this.executionHistory]
  }

  /**
   * 获取最新执行结果
   */
  getLastResult(): ExecutionResult | undefined {
    return this.runtimeState.lastResult
  }

  // ========== 生命周期管理 ==========

  /**
   * 初始化执行器
   */
  async initialize(): Promise<void> {
    this.throwIfDisposed()

    if (this.lifecycle !== ExecutorLifecycle.CREATED) {
      console.warn(`⚠️ [DataItemExecutor] 执行器 ${this.config.id} 已初始化`)
      return
    }

    try {
      await this.performInitialization()
      this.lifecycle = ExecutorLifecycle.INITIALIZED
      this.lifecycleCallbacks?.onInitialized?.()

      console.log(`✅ [DataItemExecutor] 执行器初始化完成: ${this.config.id}`)
    } catch (error) {
      this.handleError(error as Error)
      throw error
    }
  }

  /**
   * 启动执行器
   */
  async start(trigger?: TriggerConfig): Promise<void> {
    this.throwIfDisposed()

    if (this.lifecycle === ExecutorLifecycle.RUNNING) {
      console.warn(`⚠️ [DataItemExecutor] 执行器 ${this.config.id} 已在运行`)
      return
    }

    if (this.lifecycle === ExecutorLifecycle.CREATED) {
      await this.initialize()
    }

    try {
      this.triggerConfig = trigger
      this.runtimeState.startTime = Date.now()
      this.runtimeState.isRunning = true

      this.lifecycle = ExecutorLifecycle.STARTED
      this.setState(ExecutorState.RUNNING)

      // 设置触发器
      if (trigger) {
        this.setupTrigger(trigger)
      }

      this.lifecycleCallbacks?.onStarted?.()
      this.emit(ExecutorEventType.EXECUTION_STARTED, { trigger })

      console.log(`🚀 [DataItemExecutor] 执行器已启动: ${this.config.id}`)
    } catch (error) {
      this.handleError(error as Error)
      throw error
    }
  }

  /**
   * 停止执行器
   */
  stop(): void {
    this.throwIfDisposed()

    if (!this.runtimeState.isRunning) {
      console.warn(`⚠️ [DataItemExecutor] 执行器 ${this.config.id} 未在运行`)
      return
    }

    this.clearTrigger()
    this.runtimeState.isRunning = false
    this.runtimeState.stopTime = Date.now()

    this.lifecycle = ExecutorLifecycle.STOPPED
    this.setState(ExecutorState.STOPPED)

    this.lifecycleCallbacks?.onStopped?.()

    console.log(`⏹️ [DataItemExecutor] 执行器已停止: ${this.config.id}`)
  }

  /**
   * 暂停执行器
   */
  pause(): void {
    this.throwIfDisposed()

    if (!this.runtimeState.isRunning) {
      console.warn(`⚠️ [DataItemExecutor] 执行器 ${this.config.id} 未在运行`)
      return
    }

    this.clearTrigger()
    this.lifecycle = ExecutorLifecycle.PAUSED

    console.log(`⏸️ [DataItemExecutor] 执行器已暂停: ${this.config.id}`)
  }

  /**
   * 恢复执行器
   */
  resume(): void {
    this.throwIfDisposed()

    if (this.lifecycle !== ExecutorLifecycle.PAUSED) {
      console.warn(`⚠️ [DataItemExecutor] 执行器 ${this.config.id} 未暂停`)
      return
    }

    if (this.triggerConfig) {
      this.setupTrigger(this.triggerConfig)
    }

    this.lifecycle = ExecutorLifecycle.RUNNING

    console.log(`▶️ [DataItemExecutor] 执行器已恢复: ${this.config.id}`)
  }

  /**
   * 销毁执行器
   */
  dispose(): void {
    if (this.disposed) return

    this.stop()
    this.clearTrigger()
    this.eventHandlers.clear()

    this.disposed = true
    this.lifecycle = ExecutorLifecycle.DISPOSED

    this.lifecycleCallbacks?.onDisposed?.()
    this.emit(ExecutorEventType.DISPOSED, {})

    console.log(`🗑️ [DataItemExecutor] 执行器已销毁: ${this.config.id}`)
  }

  // ========== 执行方法 ==========

  /**
   * 执行一次数据获取
   */
  async execute(): Promise<ExecutionResult> {
    this.throwIfDisposed()

    if (!this.config.enabled) {
      throw new ExecutorError(ExecutorErrorType.CONFIG_ERROR, `Executor ${this.config.id} is disabled`, this.config.id)
    }

    const startTime = Date.now()
    this.runtimeState.executionCount++

    this.setState(ExecutorState.RUNNING)
    this.emit(ExecutorEventType.EXECUTION_STARTED, { timestamp: startTime })

    try {
      console.log(`🔄 [DataItemExecutor] 开始执行: ${this.config.id}`)

      // 1. 执行数据获取逻辑
      const rawData = await this.executeInternal()

      // 2. 应用数据过滤
      let filteredData = rawData
      if (this.config.filterPath) {
        filteredData = this.applyDataFilter(rawData, this.config.filterPath)
      }

      // 3. 应用数据处理脚本
      let processedData = filteredData
      if (this.config.processScript) {
        processedData = await this.applyProcessScript(filteredData, this.config.processScript)
      }

      const duration = Date.now() - startTime
      const result: ExecutionResult = {
        success: true,
        rawData,
        processedData,
        duration,
        timestamp: Date.now(),
        metadata: {
          executorId: this.config.id,
          executorType: this.type,
          hasFilter: !!this.config.filterPath,
          hasScript: !!this.config.processScript
        }
      }

      this.handleExecutionSuccess(result)
      return result
    } catch (error) {
      const duration = Date.now() - startTime
      const result: ExecutionResult = {
        success: false,
        duration,
        timestamp: Date.now(),
        error: error instanceof Error ? error.message : String(error),
        metadata: {
          executorId: this.config.id,
          executorType: this.type
        }
      }

      this.handleExecutionError(error as Error, result)
      throw error
    }
  }

  // ========== 事件系统 ==========

  /**
   * 监听事件
   */
  on(type: ExecutorEventType, handler: ExecutorEventHandler): void {
    if (!this.eventHandlers.has(type)) {
      this.eventHandlers.set(type, [])
    }
    this.eventHandlers.get(type)!.push(handler)
  }

  /**
   * 移除事件监听器
   */
  off(type: ExecutorEventType, handler: ExecutorEventHandler): void {
    const handlers = this.eventHandlers.get(type)
    if (handlers) {
      const index = handlers.indexOf(handler)
      if (index !== -1) {
        handlers.splice(index, 1)
      }
    }
  }

  /**
   * 触发事件
   */
  protected emit(type: ExecutorEventType, data?: any): void {
    const event: ExecutorEvent = {
      type,
      executorId: this.config.id,
      timestamp: Date.now(),
      data
    }

    const handlers = this.eventHandlers.get(type)
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(event)
        } catch (error) {
          console.error(`❌ [DataItemExecutor] 事件处理器错误:`, error)
        }
      })
    }
  }

  // ========== 受保护的方法 ==========

  /**
   * 设置执行器状态
   */
  protected setState(state: ExecutorState): void {
    if (this.runtimeState.state !== state) {
      const oldState = this.runtimeState.state
      this.runtimeState.state = state
      this.runtimeState.lastExecutionTime = Date.now()

      this.emit(ExecutorEventType.STATE_CHANGED, { oldState, newState: state })
    }
  }

  /**
   * 处理执行成功
   */
  protected handleExecutionSuccess(result: ExecutionResult): void {
    this.runtimeState.successCount++
    this.runtimeState.lastResult = result
    this.setState(ExecutorState.SUCCESS)

    this.addToExecutionHistory(result)
    this.emit(ExecutorEventType.EXECUTION_COMPLETED, result)
    this.emit(ExecutorEventType.DATA_UPDATED, result.processedData)

    console.log(`✅ [DataItemExecutor] 执行成功: ${this.config.id} (${result.duration}ms)`)
  }

  /**
   * 处理执行错误
   */
  protected handleExecutionError(error: Error, result: ExecutionResult): void {
    this.runtimeState.errorCount++
    this.runtimeState.lastError = error.message
    this.runtimeState.lastResult = result
    this.setState(ExecutorState.ERROR)

    this.addToExecutionHistory(result)
    this.emit(ExecutorEventType.EXECUTION_FAILED, { error, result })
    this.emit(ExecutorEventType.ERROR_OCCURRED, error)

    this.lifecycleCallbacks?.onError?.(error)

    console.error(`❌ [DataItemExecutor] 执行失败: ${this.config.id}`, error)
  }

  /**
   * 处理一般错误
   */
  protected handleError(error: Error): void {
    this.runtimeState.lastError = error.message
    this.emit(ExecutorEventType.ERROR_OCCURRED, error)
    this.lifecycleCallbacks?.onError?.(error)
  }

  // ========== 私有方法 ==========

  /**
   * 检查是否已销毁
   */
  private throwIfDisposed(): void {
    if (this.disposed) {
      throw new ExecutorError(
        ExecutorErrorType.UNKNOWN_ERROR,
        `Executor ${this.config.id} has been disposed`,
        this.config.id
      )
    }
  }

  /**
   * 执行初始化逻辑
   */
  protected async performInitialization(): Promise<void> {
    // 默认实现，子类可以重写
  }

  /**
   * 设置触发器
   */
  private setupTrigger(trigger: TriggerConfig): void {
    this.clearTrigger()

    switch (trigger.type) {
      case 'timer':
        if (trigger.timer) {
          this.timerId = window.setTimeout(() => {
            this.execute().catch(error => this.handleError(error))
          }, trigger.timer.delay)
        }
        break

      case 'interval':
        if (trigger.interval) {
          if (trigger.interval.immediate) {
            this.execute().catch(error => this.handleError(error))
          }
          this.timerId = window.setInterval(() => {
            this.execute().catch(error => this.handleError(error))
          }, trigger.interval.interval)
        }
        break

      case 'websocket':
        // WebSocket触发器逻辑
        break

      case 'event':
        // 事件触发器逻辑
        break
    }
  }

  /**
   * 清理触发器
   */
  private clearTrigger(): void {
    if (this.timerId) {
      window.clearTimeout(this.timerId)
      window.clearInterval(this.timerId)
      this.timerId = undefined
    }

    if (this.websocket) {
      this.websocket.close()
      this.websocket = undefined
    }
  }

  /**
   * 应用数据过滤
   */
  private applyDataFilter(data: any, filterPath: string): any {
    try {
      // 简单的JSONPath实现
      let current = data
      let cleanPath = filterPath.replace(/^\$\.?/, '').trim()

      if (!cleanPath) return data

      const parts = cleanPath.split(/\.|\[|\]/).filter(part => part !== '')

      for (const part of parts) {
        if (current === null || current === undefined) return null

        if (/^\d+$/.test(part)) {
          const index = parseInt(part)
          if (Array.isArray(current) && index >= 0 && index < current.length) {
            current = current[index]
          } else {
            return null
          }
        } else {
          if (typeof current === 'object' && current !== null && part in current) {
            current = current[part]
          } else {
            return null
          }
        }
      }

      return current
    } catch (error) {
      console.warn(`⚠️ [DataItemExecutor] 数据过滤失败: ${this.config.id}`, error)
      return data
    }
  }

  /**
   * 应用处理脚本
   */
  private async applyProcessScript(data: any, script: string): Promise<any> {
    try {
      const dataCopy = JSON.parse(JSON.stringify(data))
      const result = await defaultScriptEngine.execute(script, { data: dataCopy })

      if (result.success) {
        return result.data
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      console.error(`❌ [DataItemExecutor] 脚本执行失败: ${this.config.id}`, error)
      throw error
    }
  }

  /**
   * 添加到执行历史
   */
  private addToExecutionHistory(result: ExecutionResult): void {
    this.executionHistory.unshift(result)

    // 限制历史记录数量
    if (this.executionHistory.length > 100) {
      this.executionHistory = this.executionHistory.slice(0, 100)
    }
  }
}
