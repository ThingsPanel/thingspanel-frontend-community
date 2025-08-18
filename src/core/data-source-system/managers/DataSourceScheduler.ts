/**
 * 数据源调度器
 * 负责管理多个数据源的定时器和调度任务
 * 支持复杂的调度策略和资源管理
 */

import type { DataItemExecutor } from '../executors'
import type { TriggerConfig, TriggerType, EXECUTOR_CONSTANTS } from '../executors/types'

/**
 * 调度任务状态
 */
export enum ScheduleState {
  IDLE = 'idle',
  RUNNING = 'running',
  PAUSED = 'paused',
  STOPPED = 'stopped',
  ERROR = 'error'
}

/**
 * 调度任务配置
 */
export interface ScheduleConfig {
  /** 任务ID */
  id: string
  /** 数据源ID */
  dataSourceId: string
  /** 任务名称 */
  name: string
  /** 触发器配置 */
  trigger: TriggerConfig
  /** 是否启用 */
  enabled: boolean
  /** 创建时间 */
  createdAt: string
  /** 最后执行时间 */
  lastExecutionTime?: number
  /** 下次执行时间 */
  nextExecutionTime?: number
}

/**
 * 调度任务运行时状态
 */
export interface ScheduleRuntimeState {
  /** 配置信息 */
  config: ScheduleConfig
  /** 运行状态 */
  state: ScheduleState
  /** 定时器ID */
  timerId?: number
  /** WebSocket连接 */
  websocket?: WebSocket
  /** 事件监听器 */
  eventListeners: Map<string, EventListener>
  /** 执行统计 */
  stats: {
    totalExecutions: number
    successfulExecutions: number
    failedExecutions: number
    averageExecutionTime: number
    lastExecutionDuration?: number
    lastError?: string
  }
  /** 执行历史（最近10次） */
  executionHistory: Array<{
    timestamp: number
    duration: number
    success: boolean
    error?: string
  }>
}

/**
 * 调度器事件类型
 */
export enum SchedulerEventType {
  SCHEDULE_CREATED = 'schedule-created',
  SCHEDULE_STARTED = 'schedule-started',
  SCHEDULE_STOPPED = 'schedule-stopped',
  SCHEDULE_EXECUTED = 'schedule-executed',
  SCHEDULE_FAILED = 'schedule-failed',
  SCHEDULE_ERROR = 'schedule-error'
}

/**
 * 调度器事件
 */
export interface SchedulerEvent {
  type: SchedulerEventType
  scheduleId: string
  dataSourceId: string
  timestamp: number
  data?: any
}

/**
 * 事件处理器
 */
export type SchedulerEventHandler = (event: SchedulerEvent) => void

/**
 * 数据源调度器
 * 管理多个数据源的调度任务，支持不同类型的触发器
 */
export class DataSourceScheduler {
  /** 调度任务状态映射 */
  private schedules = new Map<string, ScheduleRuntimeState>()

  /** 按数据源ID分组的调度任务 */
  private schedulesByDataSource = new Map<string, Set<string>>()

  /** 事件监听器 */
  private eventHandlers = new Map<SchedulerEventType, SchedulerEventHandler[]>()

  /** 是否已初始化 */
  private initialized = false

  /** 全局错误处理器 */
  private globalErrorHandler?: (error: Error, scheduleId: string) => void

  constructor(errorHandler?: (error: Error, scheduleId: string) => void) {
    this.globalErrorHandler = errorHandler
    console.log('⏰ [DataSourceScheduler] 调度器已创建')
  }

  // ========== 初始化和销毁 ==========

  /**
   * 初始化调度器
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      console.warn('⚠️ [DataSourceScheduler] 调度器已初始化')
      return
    }

    try {
      console.log('🔧 [DataSourceScheduler] 开始初始化调度器')

      // 可以在这里添加调度任务恢复逻辑

      this.initialized = true
      console.log('✅ [DataSourceScheduler] 调度器初始化完成')
    } catch (error) {
      console.error('❌ [DataSourceScheduler] 初始化失败:', error)
      throw error
    }
  }

  /**
   * 销毁调度器
   */
  dispose(): void {
    console.log('🗑️ [DataSourceScheduler] 开始销毁调度器')

    // 停止所有调度任务
    this.stopAllSchedules()

    // 清理所有资源
    this.schedules.forEach(schedule => {
      this.cleanupScheduleResources(schedule)
    })

    // 清理状态
    this.schedules.clear()
    this.schedulesByDataSource.clear()
    this.eventHandlers.clear()

    this.initialized = false
    console.log('✅ [DataSourceScheduler] 调度器已销毁')
  }

  // ========== 调度任务管理 ==========

  /**
   * 创建调度任务
   */
  createSchedule(dataSourceId: string, executors: DataItemExecutor[], trigger: TriggerConfig, name?: string): string {
    const scheduleId = `schedule_${dataSourceId}_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`

    const config: ScheduleConfig = {
      id: scheduleId,
      dataSourceId,
      name: name || `${dataSourceId} Schedule`,
      trigger,
      enabled: trigger.enabled,
      createdAt: new Date().toISOString()
    }

    const runtimeState: ScheduleRuntimeState = {
      config,
      state: ScheduleState.IDLE,
      eventListeners: new Map(),
      stats: {
        totalExecutions: 0,
        successfulExecutions: 0,
        failedExecutions: 0,
        averageExecutionTime: 0
      },
      executionHistory: []
    }

    this.schedules.set(scheduleId, runtimeState)

    // 按数据源分组
    if (!this.schedulesByDataSource.has(dataSourceId)) {
      this.schedulesByDataSource.set(dataSourceId, new Set())
    }
    this.schedulesByDataSource.get(dataSourceId)!.add(scheduleId)

    console.log(`⏰ [DataSourceScheduler] 创建调度任务: ${scheduleId} (${trigger.type})`)
    this.emit(SchedulerEventType.SCHEDULE_CREATED, { scheduleId, dataSourceId, config })

    // 如果启用，立即启动
    if (config.enabled) {
      this.startSchedule(scheduleId, executors)
    }

    return scheduleId
  }

  /**
   * 启动调度任务
   */
  startSchedule(scheduleId: string, executors: DataItemExecutor[]): void {
    const schedule = this.schedules.get(scheduleId)
    if (!schedule) {
      throw new Error(`调度任务不存在: ${scheduleId}`)
    }

    if (schedule.state === ScheduleState.RUNNING) {
      console.warn(`⚠️ [DataSourceScheduler] 调度任务已在运行: ${scheduleId}`)
      return
    }

    try {
      console.log(`⏰ [DataSourceScheduler] 启动调度任务: ${scheduleId}`)

      schedule.state = ScheduleState.RUNNING
      this.setupTrigger(schedule, executors)

      this.emit(SchedulerEventType.SCHEDULE_STARTED, {
        scheduleId,
        dataSourceId: schedule.config.dataSourceId
      })
    } catch (error) {
      schedule.state = ScheduleState.ERROR
      schedule.stats.lastError = error instanceof Error ? error.message : String(error)

      console.error(`❌ [DataSourceScheduler] 启动调度任务失败: ${scheduleId}`, error)
      this.handleScheduleError(schedule, error as Error)
    }
  }

  /**
   * 停止调度任务
   */
  stopSchedule(scheduleId: string): void {
    const schedule = this.schedules.get(scheduleId)
    if (!schedule || schedule.state === ScheduleState.STOPPED) {
      return
    }

    console.log(`⏰ [DataSourceScheduler] 停止调度任务: ${scheduleId}`)

    schedule.state = ScheduleState.STOPPED
    this.cleanupScheduleResources(schedule)

    this.emit(SchedulerEventType.SCHEDULE_STOPPED, {
      scheduleId,
      dataSourceId: schedule.config.dataSourceId
    })
  }

  /**
   * 暂停调度任务
   */
  pauseSchedule(scheduleId: string): void {
    const schedule = this.schedules.get(scheduleId)
    if (!schedule || schedule.state !== ScheduleState.RUNNING) {
      return
    }

    console.log(`⏸️ [DataSourceScheduler] 暂停调度任务: ${scheduleId}`)

    schedule.state = ScheduleState.PAUSED
    this.cleanupScheduleResources(schedule)
  }

  /**
   * 恢复调度任务
   */
  resumeSchedule(scheduleId: string, executors: DataItemExecutor[]): void {
    const schedule = this.schedules.get(scheduleId)
    if (!schedule || schedule.state !== ScheduleState.PAUSED) {
      return
    }

    console.log(`▶️ [DataSourceScheduler] 恢复调度任务: ${scheduleId}`)

    schedule.state = ScheduleState.RUNNING
    this.setupTrigger(schedule, executors)
  }

  /**
   * 删除调度任务
   */
  deleteSchedule(scheduleId: string): boolean {
    const schedule = this.schedules.get(scheduleId)
    if (!schedule) {
      return false
    }

    // 停止并清理资源
    this.stopSchedule(scheduleId)

    // 从分组中移除
    const dataSourceId = schedule.config.dataSourceId
    const scheduleSet = this.schedulesByDataSource.get(dataSourceId)
    if (scheduleSet) {
      scheduleSet.delete(scheduleId)
      if (scheduleSet.size === 0) {
        this.schedulesByDataSource.delete(dataSourceId)
      }
    }

    // 删除调度任务
    this.schedules.delete(scheduleId)

    console.log(`⏰ [DataSourceScheduler] 删除调度任务: ${scheduleId}`)
    return true
  }

  // ========== 批量操作 ==========

  /**
   * 启动数据源的所有调度任务
   */
  startDataSourceSchedules(dataSourceId: string, executors: DataItemExecutor[]): void {
    const scheduleIds = this.schedulesByDataSource.get(dataSourceId)
    if (!scheduleIds) {
      return
    }

    console.log(`⏰ [DataSourceScheduler] 启动数据源所有调度任务: ${dataSourceId} (${scheduleIds.size}个)`)

    scheduleIds.forEach(scheduleId => {
      try {
        this.startSchedule(scheduleId, executors)
      } catch (error) {
        console.error(`❌ [DataSourceScheduler] 启动调度任务失败: ${scheduleId}`, error)
      }
    })
  }

  /**
   * 停止数据源的所有调度任务
   */
  stopDataSourceSchedules(dataSourceId: string): void {
    const scheduleIds = this.schedulesByDataSource.get(dataSourceId)
    if (!scheduleIds) {
      return
    }

    console.log(`⏰ [DataSourceScheduler] 停止数据源所有调度任务: ${dataSourceId} (${scheduleIds.size}个)`)

    scheduleIds.forEach(scheduleId => {
      this.stopSchedule(scheduleId)
    })
  }

  /**
   * 停止所有调度任务
   */
  stopAllSchedules(): void {
    const runningSchedules = Array.from(this.schedules.values()).filter(
      schedule => schedule.state === ScheduleState.RUNNING
    )

    console.log(`⏰ [DataSourceScheduler] 停止所有调度任务 (${runningSchedules.length}个)`)

    runningSchedules.forEach(schedule => {
      this.stopSchedule(schedule.config.id)
    })
  }

  // ========== 触发器设置 ==========

  /**
   * 设置触发器
   */
  private setupTrigger(schedule: ScheduleRuntimeState, executors: DataItemExecutor[]): void {
    const { trigger } = schedule.config

    switch (trigger.type) {
      case 'timer':
        this.setupTimerTrigger(schedule, executors)
        break
      case 'interval':
        this.setupIntervalTrigger(schedule, executors)
        break
      case 'websocket':
        this.setupWebSocketTrigger(schedule, executors)
        break
      case 'event':
        this.setupEventTrigger(schedule, executors)
        break
      default:
        throw new Error(`不支持的触发器类型: ${trigger.type}`)
    }
  }

  /**
   * 设置定时器触发器
   */
  private setupTimerTrigger(schedule: ScheduleRuntimeState, executors: DataItemExecutor[]): void {
    const { trigger } = schedule.config
    if (!trigger.timer) {
      throw new Error('定时器配置缺失')
    }

    const delay = trigger.timer.delay
    schedule.config.nextExecutionTime = Date.now() + delay

    schedule.timerId = window.setTimeout(async () => {
      await this.executeSchedule(schedule, executors)
    }, delay)

    console.log(`⏰ [DataSourceScheduler] 设置定时器触发器: ${schedule.config.id} (${delay}ms)`)
  }

  /**
   * 设置间隔触发器
   */
  private setupIntervalTrigger(schedule: ScheduleRuntimeState, executors: DataItemExecutor[]): void {
    const { trigger } = schedule.config
    if (!trigger.interval) {
      throw new Error('间隔配置缺失')
    }

    const interval = trigger.interval.interval

    // 立即执行
    if (trigger.interval.immediate) {
      this.executeSchedule(schedule, executors)
    }

    schedule.timerId = window.setInterval(async () => {
      await this.executeSchedule(schedule, executors)
    }, interval)

    console.log(`⏰ [DataSourceScheduler] 设置间隔触发器: ${schedule.config.id} (${interval}ms)`)
  }

  /**
   * 设置WebSocket触发器
   */
  private setupWebSocketTrigger(schedule: ScheduleRuntimeState, executors: DataItemExecutor[]): void {
    const { trigger } = schedule.config
    if (!trigger.websocket) {
      throw new Error('WebSocket配置缺失')
    }

    // 这里可以设置WebSocket消息监听
    // 当收到特定消息时触发执行
    console.log(`⏰ [DataSourceScheduler] 设置WebSocket触发器: ${schedule.config.id}`)
  }

  /**
   * 设置事件触发器
   */
  private setupEventTrigger(schedule: ScheduleRuntimeState, executors: DataItemExecutor[]): void {
    const { trigger } = schedule.config
    if (!trigger.event) {
      throw new Error('事件配置缺失')
    }

    const { eventName, eventTarget } = trigger.event
    const target = eventTarget || window

    const listener = async (event: Event) => {
      await this.executeSchedule(schedule, executors)
    }

    target.addEventListener(eventName, listener)
    schedule.eventListeners.set(eventName, listener)

    console.log(`⏰ [DataSourceScheduler] 设置事件触发器: ${schedule.config.id} (${eventName})`)
  }

  // ========== 执行逻辑 ==========

  /**
   * 执行调度任务
   */
  private async executeSchedule(schedule: ScheduleRuntimeState, executors: DataItemExecutor[]): Promise<void> {
    const startTime = Date.now()
    const { config } = schedule

    try {
      console.log(`⏰ [DataSourceScheduler] 执行调度任务: ${config.id}`)

      schedule.stats.totalExecutions++
      config.lastExecutionTime = startTime

      // 并行执行所有执行器
      const results = await Promise.allSettled(executors.map(executor => executor.execute()))

      const duration = Date.now() - startTime

      // 统计成功和失败
      const successCount = results.filter(r => r.status === 'fulfilled').length
      const failureCount = results.filter(r => r.status === 'rejected').length

      if (failureCount === 0) {
        schedule.stats.successfulExecutions++
      } else {
        schedule.stats.failedExecutions++
      }

      // 更新执行时间统计
      this.updateExecutionTimeStats(schedule, duration)

      // 记录执行历史
      this.addExecutionHistory(schedule, duration, failureCount === 0)

      console.log(
        `✅ [DataSourceScheduler] 调度任务执行完成: ${config.id} (${duration}ms, 成功:${successCount}, 失败:${failureCount})`
      )

      this.emit(SchedulerEventType.SCHEDULE_EXECUTED, {
        scheduleId: config.id,
        dataSourceId: config.dataSourceId,
        duration,
        successCount,
        failureCount
      })
    } catch (error) {
      const duration = Date.now() - startTime
      schedule.stats.failedExecutions++
      schedule.stats.lastError = error instanceof Error ? error.message : String(error)

      this.addExecutionHistory(schedule, duration, false, error instanceof Error ? error.message : String(error))

      console.error(`❌ [DataSourceScheduler] 调度任务执行失败: ${config.id}`, error)
      this.handleScheduleError(schedule, error as Error)
    }
  }

  // ========== 资源管理 ==========

  /**
   * 清理调度任务资源
   */
  private cleanupScheduleResources(schedule: ScheduleRuntimeState): void {
    // 清理定时器
    if (schedule.timerId) {
      window.clearTimeout(schedule.timerId)
      window.clearInterval(schedule.timerId)
      schedule.timerId = undefined
    }

    // 清理WebSocket
    if (schedule.websocket) {
      schedule.websocket.close()
      schedule.websocket = undefined
    }

    // 清理事件监听器
    schedule.eventListeners.forEach((listener, eventName) => {
      window.removeEventListener(eventName, listener)
    })
    schedule.eventListeners.clear()
  }

  /**
   * 处理调度错误
   */
  private handleScheduleError(schedule: ScheduleRuntimeState, error: Error): void {
    this.emit(SchedulerEventType.SCHEDULE_ERROR, {
      scheduleId: schedule.config.id,
      dataSourceId: schedule.config.dataSourceId,
      error: error.message
    })

    if (this.globalErrorHandler) {
      this.globalErrorHandler(error, schedule.config.id)
    }
  }

  /**
   * 更新执行时间统计
   */
  private updateExecutionTimeStats(schedule: ScheduleRuntimeState, duration: number): void {
    schedule.stats.lastExecutionDuration = duration

    // 计算平均执行时间
    const { totalExecutions, averageExecutionTime } = schedule.stats
    schedule.stats.averageExecutionTime = (averageExecutionTime * (totalExecutions - 1) + duration) / totalExecutions
  }

  /**
   * 添加执行历史
   */
  private addExecutionHistory(
    schedule: ScheduleRuntimeState,
    duration: number,
    success: boolean,
    error?: string
  ): void {
    schedule.executionHistory.unshift({
      timestamp: Date.now(),
      duration,
      success,
      error
    })

    // 保留最近10次记录
    if (schedule.executionHistory.length > 10) {
      schedule.executionHistory = schedule.executionHistory.slice(0, 10)
    }
  }

  // ========== 查询方法 ==========

  /**
   * 获取调度任务
   */
  getSchedule(scheduleId: string): ScheduleRuntimeState | undefined {
    return this.schedules.get(scheduleId)
  }

  /**
   * 获取数据源的所有调度任务
   */
  getDataSourceSchedules(dataSourceId: string): ScheduleRuntimeState[] {
    const scheduleIds = this.schedulesByDataSource.get(dataSourceId)
    if (!scheduleIds) {
      return []
    }

    return Array.from(scheduleIds)
      .map(id => this.schedules.get(id))
      .filter(Boolean) as ScheduleRuntimeState[]
  }

  /**
   * 获取所有调度任务
   */
  getAllSchedules(): ScheduleRuntimeState[] {
    return Array.from(this.schedules.values())
  }

  /**
   * 获取调度器统计信息
   */
  getStats(): {
    totalSchedules: number
    runningSchedules: number
    pausedSchedules: number
    stoppedSchedules: number
    errorSchedules: number
    byTriggerType: Record<TriggerType, number>
  } {
    const schedules = this.getAllSchedules()

    const stats = {
      totalSchedules: schedules.length,
      runningSchedules: 0,
      pausedSchedules: 0,
      stoppedSchedules: 0,
      errorSchedules: 0,
      byTriggerType: {
        timer: 0,
        interval: 0,
        websocket: 0,
        event: 0,
        manual: 0
      } as Record<TriggerType, number>
    }

    schedules.forEach(schedule => {
      // 状态统计
      switch (schedule.state) {
        case ScheduleState.RUNNING:
          stats.runningSchedules++
          break
        case ScheduleState.PAUSED:
          stats.pausedSchedules++
          break
        case ScheduleState.STOPPED:
          stats.stoppedSchedules++
          break
        case ScheduleState.ERROR:
          stats.errorSchedules++
          break
      }

      // 触发器类型统计
      const triggerType = schedule.config.trigger.type
      if (triggerType in stats.byTriggerType) {
        stats.byTriggerType[triggerType]++
      }
    })

    return stats
  }

  // ========== 事件系统 ==========

  /**
   * 监听事件
   */
  on(type: SchedulerEventType, handler: SchedulerEventHandler): void {
    if (!this.eventHandlers.has(type)) {
      this.eventHandlers.set(type, [])
    }
    this.eventHandlers.get(type)!.push(handler)
  }

  /**
   * 移除事件监听器
   */
  off(type: SchedulerEventType, handler: SchedulerEventHandler): void {
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
  private emit(type: SchedulerEventType, data?: any): void {
    const event: SchedulerEvent = {
      type,
      scheduleId: data?.scheduleId || '',
      dataSourceId: data?.dataSourceId || '',
      timestamp: Date.now(),
      data
    }

    const handlers = this.eventHandlers.get(type)
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(event)
        } catch (error) {
          console.error(`❌ [DataSourceScheduler] 事件处理器错误:`, error)
        }
      })
    }
  }
}
