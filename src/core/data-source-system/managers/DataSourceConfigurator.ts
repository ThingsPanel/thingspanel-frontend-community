/**
 * 数据源配置管理器
 * 负责数据源的配置管理、执行器创建和生命周期管理
 * 实现"数组思想" - 每个数据源包含多个独立的数据项执行器
 */

import { reactive, computed, type Ref } from 'vue'
import { ExecutorFactory, ExecutorManager, type DataItemExecutor } from '../executors'
import type {
  DataItemType,
  ExecutorConfig,
  ExecutorEvent,
  ExecutorEventType,
  ExecutorState,
  ExecutionResult,
  LifecycleCallbacks
} from '../executors/types'

/**
 * 数据源配置接口
 */
export interface DataSourceConfig {
  /** 数据源ID */
  id: string
  /** 数据源名称 */
  name: string
  /** 数据源描述 */
  description?: string
  /** 是否启用 */
  enabled: boolean
  /** 数据项执行器配置列表 */
  items: ExecutorConfig[]
  /** 创建时间 */
  createdAt: string
  /** 更新时间 */
  updatedAt: string
  /** 元数据 */
  metadata?: Record<string, any>
}

/**
 * 数据源运行时状态
 */
export interface DataSourceRuntimeState {
  /** 数据源ID */
  id: string
  /** 运行状态 */
  state: 'idle' | 'running' | 'stopped' | 'error'
  /** 执行器管理器 */
  executorManager: ExecutorManager
  /** 最后执行时间 */
  lastExecutionTime?: number
  /** 最后错误信息 */
  lastError?: string
  /** 启动时间 */
  startTime?: number
  /** 停止时间 */
  stopTime?: number
}

/**
 * 数据源事件类型
 */
export enum DataSourceEventType {
  CONFIG_UPDATED = 'config-updated',
  STATE_CHANGED = 'state-changed',
  EXECUTOR_ADDED = 'executor-added',
  EXECUTOR_REMOVED = 'executor-removed',
  EXECUTOR_UPDATED = 'executor-updated',
  DATA_UPDATED = 'data-updated',
  ERROR_OCCURRED = 'error-occurred'
}

/**
 * 数据源事件
 */
export interface DataSourceEvent {
  type: DataSourceEventType
  dataSourceId: string
  timestamp: number
  data?: any
}

/**
 * 事件处理器
 */
export type DataSourceEventHandler = (event: DataSourceEvent) => void

/**
 * 数据源配置管理器
 * 负责管理多个数据源的配置和执行器
 */
export class DataSourceConfigurator {
  /** 数据源配置存储 */
  private configs = reactive(new Map<string, DataSourceConfig>())

  /** 数据源运行时状态 */
  private runtimeStates = reactive(new Map<string, DataSourceRuntimeState>())

  /** 事件监听器 */
  private eventHandlers = new Map<DataSourceEventType, DataSourceEventHandler[]>()

  /** 全局生命周期回调 */
  private globalCallbacks?: LifecycleCallbacks

  /** 是否已初始化 */
  private initialized = false

  constructor(callbacks?: LifecycleCallbacks) {
    this.globalCallbacks = callbacks
    console.log('🏗️ [DataSourceConfigurator] 配置管理器已创建')
  }

  // ========== 初始化和销毁 ==========

  /**
   * 初始化配置管理器
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      console.warn('⚠️ [DataSourceConfigurator] 配置管理器已初始化')
      return
    }

    try {
      console.log('🔧 [DataSourceConfigurator] 开始初始化配置管理器')

      // 这里可以添加配置恢复逻辑
      // await this.restoreConfigurations()

      this.initialized = true
      console.log('✅ [DataSourceConfigurator] 配置管理器初始化完成')
    } catch (error) {
      console.error('❌ [DataSourceConfigurator] 初始化失败:', error)
      throw error
    }
  }

  /**
   * 销毁配置管理器
   */
  dispose(): void {
    console.log('🗑️ [DataSourceConfigurator] 开始销毁配置管理器')

    // 停止所有数据源
    this.stopAllDataSources()

    // 清理所有运行时状态
    this.runtimeStates.forEach(state => {
      state.executorManager.dispose()
    })
    this.runtimeStates.clear()

    // 清理配置
    this.configs.clear()

    // 清理事件监听器
    this.eventHandlers.clear()

    this.initialized = false
    console.log('✅ [DataSourceConfigurator] 配置管理器已销毁')
  }

  // ========== 数据源配置管理 ==========

  /**
   * 创建数据源
   */
  createDataSource(id: string, name: string, description?: string): DataSourceConfig {
    if (this.configs.has(id)) {
      throw new Error(`数据源ID已存在: ${id}`)
    }

    const config: DataSourceConfig = {
      id,
      name,
      description,
      enabled: true,
      items: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    this.configs.set(id, config)
    this.createRuntimeState(id)

    console.log(`📊 [DataSourceConfigurator] 创建数据源: ${id}`)
    this.emit(DataSourceEventType.CONFIG_UPDATED, { config })

    return config
  }

  /**
   * 更新数据源配置
   */
  updateDataSource(id: string, updates: Partial<DataSourceConfig>): void {
    const config = this.configs.get(id)
    if (!config) {
      throw new Error(`数据源不存在: ${id}`)
    }

    // 更新配置
    const updatedConfig = {
      ...config,
      ...updates,
      id, // 保持ID不变
      updatedAt: new Date().toISOString()
    }

    this.configs.set(id, updatedConfig)

    console.log(`📊 [DataSourceConfigurator] 更新数据源配置: ${id}`)
    this.emit(DataSourceEventType.CONFIG_UPDATED, { config: updatedConfig })
  }

  /**
   * 删除数据源
   */
  deleteDataSource(id: string): boolean {
    const config = this.configs.get(id)
    if (!config) {
      return false
    }

    // 停止并清理运行时状态
    this.stopDataSource(id)
    const runtimeState = this.runtimeStates.get(id)
    if (runtimeState) {
      runtimeState.executorManager.dispose()
      this.runtimeStates.delete(id)
    }

    // 删除配置
    this.configs.delete(id)

    console.log(`📊 [DataSourceConfigurator] 删除数据源: ${id}`)
    return true
  }

  /**
   * 获取数据源配置
   */
  getDataSource(id: string): DataSourceConfig | undefined {
    return this.configs.get(id)
  }

  /**
   * 获取所有数据源配置
   */
  getAllDataSources(): DataSourceConfig[] {
    return Array.from(this.configs.values())
  }

  // ========== 数据项执行器管理 ==========

  /**
   * 添加数据项执行器
   */
  addExecutor(dataSourceId: string, executorConfig: ExecutorConfig): void {
    const config = this.configs.get(dataSourceId)
    if (!config) {
      throw new Error(`数据源不存在: ${dataSourceId}`)
    }

    // 检查执行器ID是否重复
    if (config.items.some(item => item.id === executorConfig.id)) {
      throw new Error(`执行器ID已存在: ${executorConfig.id}`)
    }

    // 验证执行器配置
    if (!ExecutorFactory.validateConfig(executorConfig)) {
      throw new Error(`执行器配置无效: ${executorConfig.id}`)
    }

    // 添加到配置
    config.items.push(executorConfig)
    config.updatedAt = new Date().toISOString()

    // 如果数据源正在运行，立即创建并启动执行器
    const runtimeState = this.runtimeStates.get(dataSourceId)
    if (runtimeState && runtimeState.state === 'running') {
      this.createAndStartExecutor(runtimeState, executorConfig)
    }

    console.log(`⚡ [DataSourceConfigurator] 添加执行器: ${dataSourceId}/${executorConfig.id}`)
    this.emit(DataSourceEventType.EXECUTOR_ADDED, { dataSourceId, executorConfig })
  }

  /**
   * 更新数据项执行器
   */
  updateExecutor(dataSourceId: string, executorId: string, updates: Partial<ExecutorConfig>): void {
    const config = this.configs.get(dataSourceId)
    if (!config) {
      throw new Error(`数据源不存在: ${dataSourceId}`)
    }

    const executorIndex = config.items.findIndex(item => item.id === executorId)
    if (executorIndex === -1) {
      throw new Error(`执行器不存在: ${executorId}`)
    }

    // 更新配置
    const updatedConfig = {
      ...config.items[executorIndex],
      ...updates,
      id: executorId, // 保持ID不变
      updatedAt: new Date().toISOString()
    }

    // 验证更新后的配置
    if (!ExecutorFactory.validateConfig(updatedConfig as ExecutorConfig)) {
      throw new Error(`更新后的执行器配置无效: ${executorId}`)
    }

    config.items[executorIndex] = updatedConfig as ExecutorConfig
    config.updatedAt = new Date().toISOString()

    // 如果执行器正在运行，更新运行时配置
    const runtimeState = this.runtimeStates.get(dataSourceId)
    if (runtimeState) {
      const executor = runtimeState.executorManager.getExecutor(executorId)
      if (executor) {
        executor.updateConfig(updates)
      }
    }

    console.log(`⚡ [DataSourceConfigurator] 更新执行器: ${dataSourceId}/${executorId}`)
    this.emit(DataSourceEventType.EXECUTOR_UPDATED, { dataSourceId, executorId, updates })
  }

  /**
   * 删除数据项执行器
   */
  removeExecutor(dataSourceId: string, executorId: string): boolean {
    const config = this.configs.get(dataSourceId)
    if (!config) {
      throw new Error(`数据源不存在: ${dataSourceId}`)
    }

    const executorIndex = config.items.findIndex(item => item.id === executorId)
    if (executorIndex === -1) {
      return false
    }

    // 从配置中删除
    config.items.splice(executorIndex, 1)
    config.updatedAt = new Date().toISOString()

    // 从运行时状态中删除
    const runtimeState = this.runtimeStates.get(dataSourceId)
    if (runtimeState) {
      runtimeState.executorManager.removeExecutor(executorId)
    }

    console.log(`⚡ [DataSourceConfigurator] 删除执行器: ${dataSourceId}/${executorId}`)
    this.emit(DataSourceEventType.EXECUTOR_REMOVED, { dataSourceId, executorId })

    return true
  }

  /**
   * 获取数据项执行器配置
   */
  getExecutorConfig(dataSourceId: string, executorId: string): ExecutorConfig | undefined {
    const config = this.configs.get(dataSourceId)
    if (!config) {
      return undefined
    }

    return config.items.find(item => item.id === executorId)
  }

  /**
   * 获取数据项执行器实例
   */
  getExecutor(dataSourceId: string, executorId: string): DataItemExecutor | undefined {
    const runtimeState = this.runtimeStates.get(dataSourceId)
    if (!runtimeState) {
      return undefined
    }

    return runtimeState.executorManager.getExecutor(executorId)
  }

  // ========== 数据源生命周期管理 ==========

  /**
   * 启动数据源
   */
  async startDataSource(id: string): Promise<void> {
    const config = this.configs.get(id)
    if (!config) {
      throw new Error(`数据源不存在: ${id}`)
    }

    if (!config.enabled) {
      throw new Error(`数据源已禁用: ${id}`)
    }

    let runtimeState = this.runtimeStates.get(id)
    if (!runtimeState) {
      runtimeState = this.createRuntimeState(id)
    }

    if (runtimeState.state === 'running') {
      console.warn(`⚠️ [DataSourceConfigurator] 数据源已在运行: ${id}`)
      return
    }

    try {
      console.log(`🚀 [DataSourceConfigurator] 启动数据源: ${id}`)

      runtimeState.state = 'running'
      runtimeState.startTime = Date.now()

      // 创建并启动所有执行器
      await this.createAndStartAllExecutors(runtimeState, config.items)

      console.log(`✅ [DataSourceConfigurator] 数据源启动成功: ${id}`)
      this.emit(DataSourceEventType.STATE_CHANGED, { id, state: 'running' })
    } catch (error) {
      runtimeState.state = 'error'
      runtimeState.lastError = error instanceof Error ? error.message : String(error)

      console.error(`❌ [DataSourceConfigurator] 数据源启动失败: ${id}`, error)
      this.emit(DataSourceEventType.ERROR_OCCURRED, { id, error })
      throw error
    }
  }

  /**
   * 停止数据源
   */
  stopDataSource(id: string): void {
    const runtimeState = this.runtimeStates.get(id)
    if (!runtimeState || runtimeState.state === 'stopped') {
      return
    }

    console.log(`⏹️ [DataSourceConfigurator] 停止数据源: ${id}`)

    runtimeState.state = 'stopped'
    runtimeState.stopTime = Date.now()
    runtimeState.executorManager.stopAll()

    this.emit(DataSourceEventType.STATE_CHANGED, { id, state: 'stopped' })
  }

  /**
   * 启动所有数据源
   */
  async startAllDataSources(): Promise<void> {
    const enabledConfigs = this.getAllDataSources().filter(config => config.enabled)

    console.log(`🚀 [DataSourceConfigurator] 启动所有数据源 (${enabledConfigs.length}个)`)

    await Promise.allSettled(enabledConfigs.map(config => this.startDataSource(config.id)))
  }

  /**
   * 停止所有数据源
   */
  stopAllDataSources(): void {
    const runningStates = Array.from(this.runtimeStates.values()).filter(state => state.state === 'running')

    console.log(`⏹️ [DataSourceConfigurator] 停止所有数据源 (${runningStates.length}个)`)

    runningStates.forEach(state => {
      this.stopDataSource(state.id)
    })
  }

  // ========== 数据获取方法 ==========

  /**
   * 执行数据源
   */
  async executeDataSource(id: string): Promise<Record<string, any>> {
    const runtimeState = this.runtimeStates.get(id)
    if (!runtimeState) {
      throw new Error(`数据源运行时状态不存在: ${id}`)
    }

    const executors = runtimeState.executorManager.getAllExecutors()
    const results: Record<string, any> = {}

    await Promise.allSettled(
      executors.map(async executor => {
        try {
          const result = await executor.execute()
          results[executor.getId()] = result.processedData
        } catch (error) {
          console.error(`❌ [DataSourceConfigurator] 执行器执行失败: ${executor.getId()}`, error)
          results[executor.getId()] = null
        }
      })
    )

    runtimeState.lastExecutionTime = Date.now()
    this.emit(DataSourceEventType.DATA_UPDATED, { id, data: results })

    return results
  }

  /**
   * 获取数据源状态
   */
  getDataSourceState(id: string): DataSourceRuntimeState | undefined {
    return this.runtimeStates.get(id)
  }

  /**
   * 获取所有数据源状态
   */
  getAllDataSourceStates(): DataSourceRuntimeState[] {
    return Array.from(this.runtimeStates.values())
  }

  // ========== 事件系统 ==========

  /**
   * 监听事件
   */
  on(type: DataSourceEventType, handler: DataSourceEventHandler): void {
    if (!this.eventHandlers.has(type)) {
      this.eventHandlers.set(type, [])
    }
    this.eventHandlers.get(type)!.push(handler)
  }

  /**
   * 移除事件监听器
   */
  off(type: DataSourceEventType, handler: DataSourceEventHandler): void {
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
  private emit(type: DataSourceEventType, data?: any): void {
    const event: DataSourceEvent = {
      type,
      dataSourceId: data?.id || data?.dataSourceId || '',
      timestamp: Date.now(),
      data
    }

    const handlers = this.eventHandlers.get(type)
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(event)
        } catch (error) {
          console.error(`❌ [DataSourceConfigurator] 事件处理器错误:`, error)
        }
      })
    }
  }

  // ========== 私有方法 ==========

  /**
   * 创建运行时状态
   */
  private createRuntimeState(id: string): DataSourceRuntimeState {
    const runtimeState: DataSourceRuntimeState = {
      id,
      state: 'idle',
      executorManager: new ExecutorManager()
    }

    this.runtimeStates.set(id, runtimeState)
    return runtimeState
  }

  /**
   * 创建并启动执行器
   */
  private async createAndStartExecutor(
    runtimeState: DataSourceRuntimeState,
    executorConfig: ExecutorConfig
  ): Promise<void> {
    try {
      const executor = ExecutorFactory.createExecutor(executorConfig, this.globalCallbacks)

      // 监听执行器事件
      this.setupExecutorEventListeners(executor, runtimeState.id)

      runtimeState.executorManager.addExecutor(executor)
      await executor.start()
    } catch (error) {
      console.error(`❌ [DataSourceConfigurator] 创建执行器失败: ${executorConfig.id}`, error)
      throw error
    }
  }

  /**
   * 创建并启动所有执行器
   */
  private async createAndStartAllExecutors(
    runtimeState: DataSourceRuntimeState,
    executorConfigs: ExecutorConfig[]
  ): Promise<void> {
    await Promise.allSettled(executorConfigs.map(config => this.createAndStartExecutor(runtimeState, config)))
  }

  /**
   * 设置执行器事件监听器
   */
  private setupExecutorEventListeners(executor: DataItemExecutor, dataSourceId: string): void {
    executor.on(ExecutorEventType.DATA_UPDATED, (event: ExecutorEvent) => {
      this.emit(DataSourceEventType.DATA_UPDATED, {
        dataSourceId,
        executorId: event.executorId,
        data: event.data
      })
    })

    executor.on(ExecutorEventType.ERROR_OCCURRED, (event: ExecutorEvent) => {
      this.emit(DataSourceEventType.ERROR_OCCURRED, {
        dataSourceId,
        executorId: event.executorId,
        error: event.data
      })
    })
  }

  // ========== 计算属性 ==========

  /**
   * 获取配置统计信息
   */
  get stats() {
    return computed(() => {
      const configs = Array.from(this.configs.values())
      const states = Array.from(this.runtimeStates.values())

      return {
        totalDataSources: configs.length,
        enabledDataSources: configs.filter(c => c.enabled).length,
        runningDataSources: states.filter(s => s.state === 'running').length,
        totalExecutors: configs.reduce((sum, c) => sum + c.items.length, 0),
        executorsByType: this.getExecutorStatsByType(configs)
      }
    })
  }

  /**
   * 获取执行器类型统计
   */
  private getExecutorStatsByType(configs: DataSourceConfig[]): Record<DataItemType, number> {
    const stats: Record<DataItemType, number> = {
      json: 0,
      http: 0,
      websocket: 0
    }

    configs.forEach(config => {
      config.items.forEach(item => {
        if (item.type in stats) {
          stats[item.type]++
        }
      })
    })

    return stats
  }
}
