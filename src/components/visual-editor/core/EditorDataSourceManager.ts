/**
 * 编辑器数据源管理器
 * 统一管理编辑器中所有组件的数据源配置、触发器调度和数据分发
 */

import { ref, reactive, computed, nextTick } from 'vue'
import { useMessage } from 'naive-ui'
import { simpleDataExecutor, simpleConfigGenerator, dataSourceSystem } from '@/core/data-source-system'
import type {
  SimpleDataSourceConfig,
  ExecutionResult,
  ComponentData,
  TriggerConfig,
  DataSourceDefinition
} from '@/core/data-source-system/types/simple-types'

// 数据源状态枚举
export enum DataSourceStatus {
  IDLE = 'idle', // 空闲
  RUNNING = 'running', // 运行中
  ERROR = 'error', // 错误
  STOPPED = 'stopped' // 已停止
}

// 组件数据源配置接口
export interface ComponentDataSourceConfig {
  componentId: string
  componentType: string
  enabled: boolean
  config: SimpleDataSourceConfig
  trigger: {
    type: 'timer' | 'manual' | 'event'
    interval?: number // 轮询间隔(ms)
    enabled: boolean
    lastExecute?: number // 最后执行时间
    nextExecute?: number // 下次执行时间
  }
  status: DataSourceStatus
  lastResult?: ExecutionResult
  error?: string
}

// 数据源执行统计
export interface DataSourceStats {
  totalComponents: number
  activeComponents: number
  totalExecutions: number
  successfulExecutions: number
  failedExecutions: number
  avgExecutionTime: number
}

// 调度器任务接口
interface SchedulerTask {
  id: string
  componentId: string
  interval: number
  enabled: boolean
  lastRun: number
  nextRun: number
  timerId?: number
}

/**
 * 编辑器数据源管理器类
 */
export class EditorDataSourceManager {
  private message = useMessage()

  // 组件数据源配置存储
  private componentConfigs = reactive<Map<string, ComponentDataSourceConfig>>(new Map())

  // 调度器任务映射
  private schedulerTasks = reactive<Map<string, SchedulerTask>>(new Map())

  // 数据存储 - 每个组件的最新数据
  private dataStore = reactive<Map<string, ComponentData>>(new Map())

  // 执行统计
  private stats = reactive<DataSourceStats>({
    totalComponents: 0,
    activeComponents: 0,
    totalExecutions: 0,
    successfulExecutions: 0,
    failedExecutions: 0,
    avgExecutionTime: 0
  })

  // 事件监听器
  private listeners = new Map<string, Set<Function>>()

  // 是否已初始化
  private initialized = ref(false)

  /**
   * 初始化管理器
   */
  async initialize(): Promise<void> {
    if (this.initialized.value) return

    console.log('🚀 [EditorDataSourceManager] 初始化管理器...')

    try {
      // 初始化数据源系统
      await this.initializeDataSourceSystem()

      // 设置全局错误处理
      this.setupErrorHandling()

      this.initialized.value = true
      console.log('✅ [EditorDataSourceManager] 管理器初始化完成')

      this.emit('initialized')
    } catch (error) {
      console.error('❌ [EditorDataSourceManager] 初始化失败:', error)
      throw error
    }
  }

  /**
   * 注册组件数据源配置
   */
  registerComponentDataSource(
    componentId: string,
    componentType: string,
    config: any,
    triggerConfig?: { type: 'timer' | 'manual' | 'event'; interval?: number }
  ): void {
    console.log(`📝 [EditorDataSourceManager] 注册组件数据源: ${componentId}`, {
      componentType,
      config,
      triggerConfig
    })

    try {
      // 生成标准化配置
      const standardConfig = this.generateStandardConfig(componentId, componentType, config)

      // 创建组件数据源配置
      const componentConfig: ComponentDataSourceConfig = {
        componentId,
        componentType,
        enabled: true,
        config: standardConfig,
        trigger: {
          type: triggerConfig?.type || 'timer',
          interval: triggerConfig?.interval || 30000, // 默认30秒
          enabled: true
        },
        status: DataSourceStatus.IDLE
      }

      // 存储配置
      this.componentConfigs.set(componentId, componentConfig)

      // 更新统计
      this.updateStats()

      console.log(`✅ [EditorDataSourceManager] 组件数据源注册成功: ${componentId}`)
      this.emit('component-registered', { componentId, config: componentConfig })
    } catch (error) {
      console.error(`❌ [EditorDataSourceManager] 注册组件数据源失败: ${componentId}`, error)
      this.message.error(`注册组件数据源失败: ${error.message}`)
    }
  }

  /**
   * 启动组件数据源
   */
  async startComponentDataSource(componentId: string): Promise<boolean> {
    const config = this.componentConfigs.get(componentId)
    if (!config) {
      console.warn(`⚠️ [EditorDataSourceManager] 组件配置不存在: ${componentId}`)
      return false
    }

    console.log(`▶️ [EditorDataSourceManager] 启动组件数据源: ${componentId}`)

    try {
      // 更新状态
      config.status = DataSourceStatus.RUNNING
      config.trigger.enabled = true

      // 如果是定时器触发，启动调度器
      if (config.trigger.type === 'timer' && config.trigger.interval) {
        this.scheduleComponent(componentId, config.trigger.interval)
      }

      // 立即执行一次
      await this.executeComponentDataSource(componentId)

      console.log(`✅ [EditorDataSourceManager] 组件数据源启动成功: ${componentId}`)
      this.emit('component-started', { componentId })

      return true
    } catch (error) {
      console.error(`❌ [EditorDataSourceManager] 启动组件数据源失败: ${componentId}`, error)
      config.status = DataSourceStatus.ERROR
      config.error = error.message
      this.message.error(`启动数据源失败: ${error.message}`)
      return false
    }
  }

  /**
   * 停止组件数据源
   */
  stopComponentDataSource(componentId: string): boolean {
    const config = this.componentConfigs.get(componentId)
    if (!config) {
      console.warn(`⚠️ [EditorDataSourceManager] 组件配置不存在: ${componentId}`)
      return false
    }

    console.log(`⏹️ [EditorDataSourceManager] 停止组件数据源: ${componentId}`)

    try {
      // 更新状态
      config.status = DataSourceStatus.STOPPED
      config.trigger.enabled = false

      // 停止调度器
      this.unscheduleComponent(componentId)

      console.log(`✅ [EditorDataSourceManager] 组件数据源停止成功: ${componentId}`)
      this.emit('component-stopped', { componentId })

      return true
    } catch (error) {
      console.error(`❌ [EditorDataSourceManager] 停止组件数据源失败: ${componentId}`, error)
      this.message.error(`停止数据源失败: ${error.message}`)
      return false
    }
  }

  /**
   * 设置轮询间隔
   */
  setPollingInterval(componentId: string, interval: number): boolean {
    const config = this.componentConfigs.get(componentId)
    if (!config) {
      console.warn(`⚠️ [EditorDataSourceManager] 组件配置不存在: ${componentId}`)
      return false
    }

    console.log(`⏰ [EditorDataSourceManager] 设置轮询间隔: ${componentId} -> ${interval}ms`)

    try {
      // 更新配置
      config.trigger.interval = interval

      // 如果数据源正在运行，重新调度
      if (config.status === DataSourceStatus.RUNNING && config.trigger.type === 'timer') {
        this.unscheduleComponent(componentId)
        this.scheduleComponent(componentId, interval)
      }

      console.log(`✅ [EditorDataSourceManager] 轮询间隔设置成功: ${componentId}`)
      this.emit('interval-changed', { componentId, interval })

      return true
    } catch (error) {
      console.error(`❌ [EditorDataSourceManager] 设置轮询间隔失败: ${componentId}`, error)
      this.message.error(`设置轮询间隔失败: ${error.message}`)
      return false
    }
  }

  /**
   * 手动触发数据更新
   */
  async triggerDataUpdate(componentId: string): Promise<ExecutionResult | null> {
    console.log(`🔄 [EditorDataSourceManager] 手动触发数据更新: ${componentId}`)

    try {
      const result = await this.executeComponentDataSource(componentId)
      this.emit('data-updated', { componentId, result })
      return result
    } catch (error) {
      console.error(`❌ [EditorDataSourceManager] 手动触发失败: ${componentId}`, error)
      this.message.error(`手动触发失败: ${error.message}`)
      return null
    }
  }

  /**
   * 获取组件数据
   */
  getComponentData(componentId: string): ComponentData | null {
    return this.dataStore.get(componentId) || null
  }

  /**
   * 获取所有活跃的数据源状态
   */
  getActiveDataSources(): ComponentDataSourceConfig[] {
    return Array.from(this.componentConfigs.values()).filter(config => config.status === DataSourceStatus.RUNNING)
  }

  /**
   * 获取所有数据源状态
   */
  getAllDataSources(): ComponentDataSourceConfig[] {
    return Array.from(this.componentConfigs.values())
  }

  /**
   * 获取执行统计
   */
  getStats(): DataSourceStats {
    return { ...this.stats }
  }

  /**
   * 批量启动数据源
   */
  async batchStart(componentIds: string[]): Promise<boolean[]> {
    console.log(`🚀 [EditorDataSourceManager] 批量启动数据源:`, componentIds)

    const results = await Promise.allSettled(componentIds.map(id => this.startComponentDataSource(id)))

    return results.map(result => (result.status === 'fulfilled' ? result.value : false))
  }

  /**
   * 批量停止数据源
   */
  batchStop(componentIds: string[]): boolean[] {
    console.log(`⏹️ [EditorDataSourceManager] 批量停止数据源:`, componentIds)

    return componentIds.map(id => this.stopComponentDataSource(id))
  }

  /**
   * 移除组件数据源
   */
  removeComponentDataSource(componentId: string): boolean {
    console.log(`🗑️ [EditorDataSourceManager] 移除组件数据源: ${componentId}`)

    try {
      // 停止数据源
      this.stopComponentDataSource(componentId)

      // 移除配置和数据
      this.componentConfigs.delete(componentId)
      this.dataStore.delete(componentId)

      // 更新统计
      this.updateStats()

      console.log(`✅ [EditorDataSourceManager] 组件数据源移除成功: ${componentId}`)
      this.emit('component-removed', { componentId })

      return true
    } catch (error) {
      console.error(`❌ [EditorDataSourceManager] 移除组件数据源失败: ${componentId}`, error)
      return false
    }
  }

  /**
   * 销毁管理器
   */
  destroy(): void {
    console.log('🔥 [EditorDataSourceManager] 销毁管理器...')

    // 停止所有数据源
    const allIds = Array.from(this.componentConfigs.keys())
    this.batchStop(allIds)

    // 清空所有数据
    this.componentConfigs.clear()
    this.schedulerTasks.clear()
    this.dataStore.clear()
    this.listeners.clear()

    this.initialized.value = false
    console.log('✅ [EditorDataSourceManager] 管理器已销毁')
  }

  // ============ 私有方法 ============

  /**
   * 初始化数据源系统
   */
  private async initializeDataSourceSystem(): Promise<void> {
    // 确保数据源系统已初始化
    if (!dataSourceSystem.configGenerator || !dataSourceSystem.dataExecutor) {
      throw new Error('数据源系统未正确初始化')
    }
  }

  /**
   * 设置错误处理
   */
  private setupErrorHandling(): void {
    // 全局错误处理
    window.addEventListener('unhandledrejection', event => {
      console.error('🚨 [EditorDataSourceManager] 未处理的Promise拒绝:', event.reason)
    })
  }

  /**
   * 生成标准化配置
   */
  private generateStandardConfig(componentId: string, componentType: string, userConfig: any): SimpleDataSourceConfig {
    try {
      // 使用数据源系统的配置生成器
      const standardConfig = simpleConfigGenerator.generateFromUserInput(componentId, componentType, userConfig)

      console.log(`📋 [EditorDataSourceManager] 生成标准配置: ${componentId}`, standardConfig)
      return standardConfig
    } catch (error) {
      console.error(`❌ [EditorDataSourceManager] 生成配置失败: ${componentId}`, error)
      throw new Error(`配置生成失败: ${error.message}`)
    }
  }

  /**
   * 执行组件数据源
   */
  private async executeComponentDataSource(componentId: string): Promise<ExecutionResult> {
    const config = this.componentConfigs.get(componentId)
    if (!config) {
      throw new Error(`组件配置不存在: ${componentId}`)
    }

    const startTime = Date.now()
    console.log(`⚡ [EditorDataSourceManager] 执行数据源: ${componentId}`)

    try {
      // 执行数据源
      const result = await simpleDataExecutor.execute(config.config)

      const executionTime = Date.now() - startTime
      console.log(`✅ [EditorDataSourceManager] 执行成功: ${componentId} (${executionTime}ms)`, result)

      // 更新组件状态
      config.lastResult = result
      config.status = result.success ? DataSourceStatus.RUNNING : DataSourceStatus.ERROR
      config.error = result.success ? undefined : result.error
      config.trigger.lastExecute = Date.now()

      // 存储数据
      if (result.success && result.data) {
        this.dataStore.set(componentId, result.data)
      }

      // 更新统计
      this.updateExecutionStats(result.success, executionTime)

      return result
    } catch (error) {
      const executionTime = Date.now() - startTime
      console.error(`❌ [EditorDataSourceManager] 执行失败: ${componentId}`, error)

      // 创建错误结果
      const errorResult: ExecutionResult = {
        success: false,
        error: error.message,
        executionTime,
        timestamp: Date.now()
      }

      // 更新组件状态
      config.lastResult = errorResult
      config.status = DataSourceStatus.ERROR
      config.error = error.message

      // 更新统计
      this.updateExecutionStats(false, executionTime)

      throw error
    }
  }

  /**
   * 调度组件
   */
  private scheduleComponent(componentId: string, interval: number): void {
    // 先停止现有调度
    this.unscheduleComponent(componentId)

    const task: SchedulerTask = {
      id: `${componentId}_${Date.now()}`,
      componentId,
      interval,
      enabled: true,
      lastRun: 0,
      nextRun: Date.now() + interval
    }

    // 设置定时器
    task.timerId = window.setInterval(async () => {
      if (!task.enabled) return

      try {
        task.lastRun = Date.now()
        task.nextRun = task.lastRun + interval

        await this.executeComponentDataSource(componentId)
      } catch (error) {
        console.error(`⏰ [EditorDataSourceManager] 定时执行失败: ${componentId}`, error)
      }
    }, interval)

    this.schedulerTasks.set(componentId, task)
    console.log(`⏰ [EditorDataSourceManager] 调度器启动: ${componentId} (${interval}ms)`)
  }

  /**
   * 取消调度组件
   */
  private unscheduleComponent(componentId: string): void {
    const task = this.schedulerTasks.get(componentId)
    if (task) {
      if (task.timerId) {
        clearInterval(task.timerId)
      }
      this.schedulerTasks.delete(componentId)
      console.log(`⏰ [EditorDataSourceManager] 调度器停止: ${componentId}`)
    }
  }

  /**
   * 更新统计信息
   */
  private updateStats(): void {
    const configs = Array.from(this.componentConfigs.values())

    this.stats.totalComponents = configs.length
    this.stats.activeComponents = configs.filter(c => c.status === DataSourceStatus.RUNNING).length
  }

  /**
   * 更新执行统计
   */
  private updateExecutionStats(success: boolean, executionTime: number): void {
    this.stats.totalExecutions++

    if (success) {
      this.stats.successfulExecutions++
    } else {
      this.stats.failedExecutions++
    }

    // 计算平均执行时间
    this.stats.avgExecutionTime =
      (this.stats.avgExecutionTime * (this.stats.totalExecutions - 1) + executionTime) / this.stats.totalExecutions
  }

  // ============ 事件系统 ============

  /**
   * 添加事件监听器
   */
  on(event: string, listener: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }
    this.listeners.get(event)!.add(listener)
  }

  /**
   * 移除事件监听器
   */
  off(event: string, listener: Function): void {
    const eventListeners = this.listeners.get(event)
    if (eventListeners) {
      eventListeners.delete(listener)
    }
  }

  /**
   * 触发事件
   */
  private emit(event: string, data?: any): void {
    const eventListeners = this.listeners.get(event)
    if (eventListeners) {
      eventListeners.forEach(listener => {
        try {
          listener(data)
        } catch (error) {
          console.error(`🚨 [EditorDataSourceManager] 事件监听器错误: ${event}`, error)
        }
      })
    }
  }
}

// ============ 单例实例 ============

/**
 * 全局编辑器数据源管理器单例
 */
export const editorDataSourceManager = new EditorDataSourceManager()

// ============ Vue Composable ============

/**
 * 编辑器数据源管理器 Composable
 */
export function useEditorDataSource() {
  return {
    manager: editorDataSourceManager,

    // 响应式状态
    isInitialized: computed(() => editorDataSourceManager.initialized),
    stats: computed(() => editorDataSourceManager.getStats()),
    activeDataSources: computed(() => editorDataSourceManager.getActiveDataSources()),
    allDataSources: computed(() => editorDataSourceManager.getAllDataSources()),

    // 便捷方法
    async initialize() {
      return await editorDataSourceManager.initialize()
    },

    registerComponent(id: string, type: string, config: any, trigger?: any) {
      return editorDataSourceManager.registerComponentDataSource(id, type, config, trigger)
    },

    startComponent(id: string) {
      return editorDataSourceManager.startComponentDataSource(id)
    },

    stopComponent(id: string) {
      return editorDataSourceManager.stopComponentDataSource(id)
    },

    getComponentData(id: string) {
      return editorDataSourceManager.getComponentData(id)
    },

    triggerUpdate(id: string) {
      return editorDataSourceManager.triggerDataUpdate(id)
    },

    setInterval(id: string, interval: number) {
      return editorDataSourceManager.setPollingInterval(id, interval)
    }
  }
}

export default EditorDataSourceManager
