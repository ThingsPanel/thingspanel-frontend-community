/**
 * @file 生命周期管理器实现
 * @description 编辑器和组件的生命周期管理实现
 */

import { reactive } from 'vue'
import { nanoid } from 'nanoid'
import type {
  ILifecycleManager,
  LifecyclePhase,
  LifecycleContext,
  LifecycleHook,
  LifecycleHookRegistration,
  LifecycleEvents,
  LifecycleManagerOptions
} from './interfaces/Lifecycle'
import { EventBus, createEventBus } from './EventBus'

/**
 * 生命周期管理器实现类
 */
export class LifecycleManager implements ILifecycleManager {
  /** 内部事件总线 */
  private eventBus: EventBus

  /** 生命周期钩子映射表 */
  private hooks = new Map<LifecyclePhase, LifecycleHookRegistration[]>()

  /** 钩子ID计数器 */
  private hookIdCounter = 0

  /** 是否启用统计 */
  private enableStats: boolean

  /** 是否启用错误处理 */
  private enableErrorHandling: boolean

  /** 最大并发执行的钩子数量 */
  private maxConcurrentHooks: number

  /** 钩子执行超时时间 */
  private hookTimeout: number

  /** 统计信息 */
  private stats = reactive({
    totalPhases: 0,
    totalHooks: 0,
    phaseExecutions: {} as Record<string, number>,
    averageExecutionTime: {} as Record<string, number>,
    errors: 0
  })

  constructor(options: LifecycleManagerOptions = {}) {
    this.eventBus = createEventBus({
      debugMode: process.env.NODE_ENV === 'development',
      maxListeners: 150
    })

    this.enableStats = options.enableStats !== false
    this.enableErrorHandling = options.enableErrorHandling !== false
    this.maxConcurrentHooks = options.maxConcurrentHooks || 10
    this.hookTimeout = options.hookTimeout || 5000

    console.log('LifecycleManager: 生命周期管理器已初始化', {
      enableStats: this.enableStats,
      enableErrorHandling: this.enableErrorHandling,
      maxConcurrentHooks: this.maxConcurrentHooks,
      hookTimeout: this.hookTimeout
    })
  }

  /**
   * 注册生命周期钩子
   */
  registerHook(
    phase: LifecyclePhase,
    hook: LifecycleHook,
    options: {
      priority?: number
      once?: boolean
      registrar?: string
    } = {}
  ): string {
    const registration: LifecycleHookRegistration = {
      id: `hook_${++this.hookIdCounter}`,
      hook,
      priority: options.priority || 0,
      once: options.once || false,
      registeredAt: Date.now(),
      registrar: options.registrar || 'unknown'
    }

    // 初始化阶段钩子数组
    if (!this.hooks.has(phase)) {
      this.hooks.set(phase, [])
      this.stats.totalPhases++
      this.stats.phaseExecutions[phase] = 0
      this.stats.averageExecutionTime[phase] = 0
    }

    const phaseHooks = this.hooks.get(phase)!
    phaseHooks.push(registration)

    // 按优先级排序（数值越小优先级越高）
    phaseHooks.sort((a, b) => a.priority - b.priority)

    this.stats.totalHooks++

    // 发射钩子注册事件
    this.eventBus.emit('hook-registered', {
      phase,
      registration
    })

    console.log(`LifecycleManager: 注册钩子 "${registration.id}" 到阶段 "${phase}"`, {
      priority: registration.priority,
      once: registration.once,
      registrar: registration.registrar
    })

    return registration.id
  }

  /**
   * 取消注册生命周期钩子
   */
  unregisterHook(phase: LifecyclePhase, hookId: string): void {
    const phaseHooks = this.hooks.get(phase)
    if (!phaseHooks) return

    const index = phaseHooks.findIndex(reg => reg.id === hookId)
    if (index === -1) return

    const removedHook = phaseHooks.splice(index, 1)[0]
    this.stats.totalHooks--

    // 如果没有钩子了，清理阶段
    if (phaseHooks.length === 0) {
      this.hooks.delete(phase)
      this.stats.totalPhases--
      delete this.stats.phaseExecutions[phase]
      delete this.stats.averageExecutionTime[phase]
    }

    // 发射钩子取消注册事件
    this.eventBus.emit('hook-unregistered', {
      phase,
      hookId
    })

    console.log(`LifecycleManager: 取消注册钩子 "${hookId}" 从阶段 "${phase}"`)
  }

  /**
   * 取消注册某个注册者的所有钩子
   */
  unregisterAllHooks(registrar: string): void {
    let removedCount = 0

    for (const [phase, phaseHooks] of this.hooks.entries()) {
      const initialLength = phaseHooks.length

      // 移除匹配的钩子
      for (let i = phaseHooks.length - 1; i >= 0; i--) {
        if (phaseHooks[i].registrar === registrar) {
          const removedHook = phaseHooks.splice(i, 1)[0]
          this.eventBus.emit('hook-unregistered', {
            phase,
            hookId: removedHook.id
          })
        }
      }

      const removed = initialLength - phaseHooks.length
      removedCount += removed

      // 如果没有钩子了，清理阶段
      if (phaseHooks.length === 0) {
        this.hooks.delete(phase)
        this.stats.totalPhases--
        delete this.stats.phaseExecutions[phase]
        delete this.stats.averageExecutionTime[phase]
      }
    }

    this.stats.totalHooks -= removedCount

    console.log(`LifecycleManager: 取消注册者 "${registrar}" 的所有钩子`, {
      removedCount
    })
  }

  /**
   * 触发生命周期阶段
   */
  async trigger(phase: LifecyclePhase, context: LifecycleContext): Promise<void> {
    const phaseHooks = this.hooks.get(phase)
    if (!phaseHooks || phaseHooks.length === 0) {
      console.log(`LifecycleManager: 阶段 "${phase}" 没有注册钩子`)
      return
    }

    const startTime = Date.now()

    // 发射阶段开始事件
    this.eventBus.emit('phase-start', { phase, context })

    console.log(`LifecycleManager: 触发生命周期阶段 "${phase}"`, {
      hookCount: phaseHooks.length,
      context
    })

    try {
      // 执行钩子
      await this.executeHooks(phase, phaseHooks, context)

      // 统计执行时间
      if (this.enableStats) {
        const duration = Date.now() - startTime
        this.updateExecutionStats(phase, duration)
      }

      // 发射阶段结束事件
      this.eventBus.emit('phase-end', {
        phase,
        context,
        duration: Date.now() - startTime
      })
    } catch (error) {
      console.error(`LifecycleManager: 阶段 "${phase}" 执行失败`, error)

      if (this.enableStats) {
        this.stats.errors++
      }

      throw error
    }
  }

  /**
   * 获取某个阶段的所有钩子
   */
  getHooks(phase: LifecyclePhase): LifecycleHookRegistration[] {
    const hooks = this.hooks.get(phase)
    return hooks ? [...hooks] : []
  }

  /**
   * 检查某个阶段是否有钩子
   */
  hasHooks(phase: LifecyclePhase): boolean {
    const hooks = this.hooks.get(phase)
    return hooks ? hooks.length > 0 : false
  }

  /**
   * 监听生命周期事件
   */
  on<K extends keyof LifecycleEvents>(event: K, handler: (payload: LifecycleEvents[K]) => void): void {
    this.eventBus.on(event, handler)
  }

  /**
   * 移除事件监听器
   */
  off<K extends keyof LifecycleEvents>(event: K, handler: (payload: LifecycleEvents[K]) => void): void {
    this.eventBus.off(event, handler)
  }

  /**
   * 获取生命周期执行统计
   */
  getStats(): {
    totalPhases: number
    totalHooks: number
    phaseExecutions: Record<string, number>
    averageExecutionTime: Record<string, number>
    errors: number
  } {
    return { ...this.stats }
  }

  /**
   * 清空所有钩子
   */
  clear(): void {
    this.hooks.clear()
    this.stats.totalPhases = 0
    this.stats.totalHooks = 0
    this.stats.phaseExecutions = {}
    this.stats.averageExecutionTime = {}
    this.stats.errors = 0

    console.log('LifecycleManager: 所有钩子已清空')
  }

  /**
   * 销毁生命周期管理器
   */
  destroy(): void {
    this.eventBus.clear()
    this.clear()
    console.log('LifecycleManager: 生命周期管理器已销毁')
  }

  // ==================== 私有方法 ====================

  /**
   * 执行钩子列表
   */
  private async executeHooks(
    phase: LifecyclePhase,
    hooks: LifecycleHookRegistration[],
    context: LifecycleContext
  ): Promise<void> {
    const onceHooks: string[] = []

    // 分批执行钩子，控制并发数量
    for (let i = 0; i < hooks.length; i += this.maxConcurrentHooks) {
      const batch = hooks.slice(i, i + this.maxConcurrentHooks)

      const promises = batch.map(async hookReg => {
        try {
          // 创建带超时的Promise
          const timeoutPromise = new Promise<void>((_, reject) => {
            setTimeout(() => {
              reject(new Error(`钩子 "${hookReg.id}" 执行超时`))
            }, this.hookTimeout)
          })

          const hookPromise = Promise.resolve(hookReg.hook(context))

          // 等待钩子执行或超时
          await Promise.race([hookPromise, timeoutPromise])

          // 记录一次性钩子
          if (hookReg.once) {
            onceHooks.push(hookReg.id)
          }
        } catch (error) {
          if (this.enableErrorHandling) {
            console.error(`LifecycleManager: 钩子 "${hookReg.id}" 执行失败`, error)

            // 发射钩子错误事件
            this.eventBus.emit('hook-error', {
              phase,
              hookId: hookReg.id,
              error: error as Error,
              context
            })

            if (this.enableStats) {
              this.stats.errors++
            }
          } else {
            throw error
          }
        }
      })

      // 等待当前批次完成
      await Promise.all(promises)
    }

    // 移除一次性钩子
    for (const hookId of onceHooks) {
      this.unregisterHook(phase, hookId)
    }
  }

  /**
   * 更新执行统计信息
   */
  private updateExecutionStats(phase: LifecyclePhase, duration: number): void {
    this.stats.phaseExecutions[phase] = (this.stats.phaseExecutions[phase] || 0) + 1

    const currentAverage = this.stats.averageExecutionTime[phase] || 0
    const executionCount = this.stats.phaseExecutions[phase]

    // 计算新的平均执行时间
    this.stats.averageExecutionTime[phase] = (currentAverage * (executionCount - 1) + duration) / executionCount
  }
}

/**
 * 创建生命周期管理器实例
 */
export const createLifecycleManager = (options?: LifecycleManagerOptions): LifecycleManager => {
  return new LifecycleManager(options)
}

/**
 * 默认全局生命周期管理器实例
 */
export const globalLifecycleManager = createLifecycleManager({
  enableStats: true,
  enableErrorHandling: true,
  maxConcurrentHooks: 10,
  hookTimeout: 5000
})
