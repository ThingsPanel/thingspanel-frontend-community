// 第一层：纯净编辑器底座 - 生命周期管理器
// 职责：管理编辑器、面板、节点的生命周期，不涉及具体业务逻辑

/**
 * 生命周期钩子函数类型
 */
export type LifecycleHook = (context: any) => void | Promise<void>

/**
 * 生命周期管理器接口
 */
export interface LifecycleManager {
  // 编辑器生命周期
  phases: {
    'before-mount': LifecycleHook[]
    mounted: LifecycleHook[]
    'before-unmount': LifecycleHook[]
    unmounted: LifecycleHook[]
  }

  // 面板生命周期
  panelPhases: {
    'panel-created': LifecycleHook[]
    'panel-loaded': LifecycleHook[]
    'panel-saved': LifecycleHook[]
    'panel-destroyed': LifecycleHook[]
  }

  // 节点生命周期
  nodePhases: {
    'node-added': LifecycleHook[]
    'node-updated': LifecycleHook[]
    'node-removed': LifecycleHook[]
    'node-selected': LifecycleHook[]
  }

  // 注册钩子
  registerHook(phase: string, hook: LifecycleHook): void
  unregisterHook(phase: string, hook: LifecycleHook): void

  // 触发钩子
  trigger(phase: string, context: any): Promise<void>
}

/**
 * 生命周期上下文
 */
export interface LifecycleContext {
  // 基础信息
  phase: string
  timestamp: number

  // 编辑器实例引用
  editor?: any

  // 面板数据
  panel?: any

  // 节点数据
  node?: any
  nodeId?: string

  // 额外数据
  [key: string]: any
}

/**
 * 生命周期管理器实现
 */
export class PureLifecycleManager implements LifecycleManager {
  // 编辑器生命周期钩子
  public phases = {
    'before-mount': [] as LifecycleHook[],
    mounted: [] as LifecycleHook[],
    'before-unmount': [] as LifecycleHook[],
    unmounted: [] as LifecycleHook[]
  }

  // 面板生命周期钩子
  public panelPhases = {
    'panel-created': [] as LifecycleHook[],
    'panel-loaded': [] as LifecycleHook[],
    'panel-saved': [] as LifecycleHook[],
    'panel-destroyed': [] as LifecycleHook[]
  }

  // 节点生命周期钩子
  public nodePhases = {
    'node-added': [] as LifecycleHook[],
    'node-updated': [] as LifecycleHook[],
    'node-removed': [] as LifecycleHook[],
    'node-selected': [] as LifecycleHook[]
  }

  // 所有钩子的统一映射
  private allPhases: Record<string, LifecycleHook[]>

  // 执行统计
  private executionStats = {
    totalExecutions: 0,
    phaseExecutions: new Map<string, number>(),
    errorCount: 0,
    lastExecution: new Map<string, number>()
  }

  constructor() {
    // 创建统一的钩子映射
    this.allPhases = {
      ...this.phases,
      ...this.panelPhases,
      ...this.nodePhases
    }
  }

  /**
   * 注册生命周期钩子
   */
  public registerHook(phase: string, hook: LifecycleHook): void {
    if (!this.allPhases[phase]) {
      console.warn(`Unknown lifecycle phase: ${phase}`)
      return
    }

    // 避免重复注册
    if (!this.allPhases[phase].includes(hook)) {
      this.allPhases[phase].push(hook)
      console.debug(`Registered hook for phase: ${phase}`)
    }
  }

  /**
   * 取消注册生命周期钩子
   */
  public unregisterHook(phase: string, hook: LifecycleHook): void {
    if (!this.allPhases[phase]) {
      console.warn(`Unknown lifecycle phase: ${phase}`)
      return
    }

    const index = this.allPhases[phase].indexOf(hook)
    if (index !== -1) {
      this.allPhases[phase].splice(index, 1)
      console.debug(`Unregistered hook for phase: ${phase}`)
    }
  }

  /**
   * 触发生命周期钩子
   */
  public async trigger(phase: string, context: any = {}): Promise<void> {
    if (!this.allPhases[phase]) {
      console.warn(`Unknown lifecycle phase: ${phase}`)
      return
    }

    const hooks = this.allPhases[phase]
    if (hooks.length === 0) {
      return
    }

    // 构建完整的上下文
    const fullContext: LifecycleContext = {
      phase,
      timestamp: Date.now(),
      ...context
    }

    // 更新统计信息
    this.executionStats.totalExecutions++
    this.executionStats.phaseExecutions.set(phase, (this.executionStats.phaseExecutions.get(phase) || 0) + 1)
    this.executionStats.lastExecution.set(phase, Date.now())

    console.debug(`Triggering lifecycle phase: ${phase} with ${hooks.length} hooks`)

    // 并行执行所有钩子
    const results = await Promise.allSettled(
      hooks.map(async (hook, index) => {
        try {
          const startTime = performance.now()
          await hook(fullContext)
          const endTime = performance.now()
          console.debug(`Hook ${index} for ${phase} completed in ${endTime - startTime}ms`)
        } catch (error) {
          this.executionStats.errorCount++
          console.error(`Error in lifecycle hook for phase ${phase}:`, error)
          throw error
        }
      })
    )

    // 检查是否有钩子执行失败
    const failures = results.filter(result => result.status === 'rejected')
    if (failures.length > 0) {
      console.error(`${failures.length} hooks failed in phase ${phase}`)
      // 可以选择是否抛出错误，或者只记录日志
      // throw new Error(`Lifecycle phase ${phase} had ${failures.length} failures`)
    }
  }

  /**
   * 批量注册钩子
   */
  public registerHooks(hooks: Record<string, LifecycleHook[]>): void {
    Object.entries(hooks).forEach(([phase, phaseHooks]) => {
      phaseHooks.forEach(hook => {
        this.registerHook(phase, hook)
      })
    })
  }

  /**
   * 清理指定阶段的所有钩子
   */
  public clearPhase(phase: string): void {
    if (this.allPhases[phase]) {
      this.allPhases[phase].length = 0
      console.debug(`Cleared all hooks for phase: ${phase}`)
    }
  }

  /**
   * 清理所有钩子
   */
  public clearAll(): void {
    Object.keys(this.allPhases).forEach(phase => {
      this.allPhases[phase].length = 0
    })
    console.debug('Cleared all lifecycle hooks')
  }

  /**
   * 获取指定阶段的钩子数量
   */
  public getHookCount(phase: string): number {
    return this.allPhases[phase]?.length || 0
  }

  /**
   * 检查是否有钩子注册到指定阶段
   */
  public hasHooks(phase: string): boolean {
    return this.getHookCount(phase) > 0
  }

  /**
   * 获取所有已注册的阶段
   */
  public getRegisteredPhases(): string[] {
    return Object.entries(this.allPhases)
      .filter(([_, hooks]) => hooks.length > 0)
      .map(([phase]) => phase)
  }

  /**
   * 获取执行统计信息
   */
  public getExecutionStats() {
    return {
      ...this.executionStats,
      phaseExecutions: Object.fromEntries(this.executionStats.phaseExecutions),
      lastExecution: Object.fromEntries(this.executionStats.lastExecution)
    }
  }

  /**
   * 重置统计信息
   */
  public resetStats(): void {
    this.executionStats = {
      totalExecutions: 0,
      phaseExecutions: new Map(),
      errorCount: 0,
      lastExecution: new Map()
    }
  }

  /**
   * 创建阶段特定的触发器
   */
  public createPhaseTrigger(phase: string) {
    return (context?: any) => this.trigger(phase, context)
  }

  /**
   * 等待特定阶段执行完成
   */
  public async waitForPhase(phase: string, context?: any): Promise<void> {
    await this.trigger(phase, context)
  }

  /**
   * 获取调试信息
   */
  public getDebugInfo() {
    return {
      phases: Object.keys(this.allPhases),
      hookCounts: Object.fromEntries(Object.entries(this.allPhases).map(([phase, hooks]) => [phase, hooks.length])),
      executionStats: this.getExecutionStats(),
      registeredPhases: this.getRegisteredPhases()
    }
  }
}

/**
 * 创建生命周期管理器实例
 */
export function createLifecycleManager(): PureLifecycleManager {
  return new PureLifecycleManager()
}

/**
 * 预定义的生命周期阶段常量
 */
export const LIFECYCLE_PHASES = {
  // 编辑器生命周期
  EDITOR: {
    BEFORE_MOUNT: 'before-mount',
    MOUNTED: 'mounted',
    BEFORE_UNMOUNT: 'before-unmount',
    UNMOUNTED: 'unmounted'
  },

  // 面板生命周期
  PANEL: {
    CREATED: 'panel-created',
    LOADED: 'panel-loaded',
    SAVED: 'panel-saved',
    DESTROYED: 'panel-destroyed'
  },

  // 节点生命周期
  NODE: {
    ADDED: 'node-added',
    UPDATED: 'node-updated',
    REMOVED: 'node-removed',
    SELECTED: 'node-selected'
  }
} as const
