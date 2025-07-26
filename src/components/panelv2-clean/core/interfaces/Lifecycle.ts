/**
 * @file 生命周期管理器接口定义
 * @description 定义编辑器和组件的生命周期管理接口
 */

/**
 * 生命周期阶段枚举
 */
export enum LifecyclePhase {
  /** 编辑器挂载前 */
  BEFORE_MOUNT = 'before-mount',
  /** 编辑器已挂载 */
  MOUNTED = 'mounted',
  /** 编辑器卸载前 */
  BEFORE_UNMOUNT = 'before-unmount',
  /** 编辑器已卸载 */
  UNMOUNTED = 'unmounted',

  /** 面板创建 */
  PANEL_CREATED = 'panel-created',
  /** 面板加载 */
  PANEL_LOADED = 'panel-loaded',
  /** 面板保存 */
  PANEL_SAVED = 'panel-saved',
  /** 面板销毁 */
  PANEL_DESTROYED = 'panel-destroyed',

  /** 节点添加 */
  NODE_ADDED = 'node-added',
  /** 节点更新 */
  NODE_UPDATED = 'node-updated',
  /** 节点删除 */
  NODE_REMOVED = 'node-removed',
  /** 节点选中 */
  NODE_SELECTED = 'node-selected'
}

/**
 * 生命周期上下文接口
 */
export interface LifecycleContext {
  /** 上下文类型 */
  type: 'editor' | 'panel' | 'node'
  /** 目标ID */
  targetId?: string
  /** 附加数据 */
  data?: any
  /** 时间戳 */
  timestamp: number
  /** 来源 */
  source: string
}

/**
 * 生命周期钩子函数类型
 */
export type LifecycleHook = (context: LifecycleContext) => void | Promise<void>

/**
 * 生命周期钩子注册信息
 */
export interface LifecycleHookRegistration {
  /** 钩子ID */
  id: string
  /** 钩子函数 */
  hook: LifecycleHook
  /** 优先级（数值越小优先级越高） */
  priority: number
  /** 是否只执行一次 */
  once: boolean
  /** 注册时间 */
  registeredAt: number
  /** 注册者信息 */
  registrar: string
}

/**
 * 生命周期事件接口
 */
export interface LifecycleEvents {
  /** 钩子注册事件 */
  'hook-registered': {
    phase: LifecyclePhase
    registration: LifecycleHookRegistration
  }

  /** 钩子取消注册事件 */
  'hook-unregistered': {
    phase: LifecyclePhase
    hookId: string
  }

  /** 生命周期阶段开始事件 */
  'phase-start': {
    phase: LifecyclePhase
    context: LifecycleContext
  }

  /** 生命周期阶段结束事件 */
  'phase-end': {
    phase: LifecyclePhase
    context: LifecycleContext
    duration: number
  }

  /** 钩子执行错误事件 */
  'hook-error': {
    phase: LifecyclePhase
    hookId: string
    error: Error
    context: LifecycleContext
  }
}

/**
 * 生命周期管理器接口
 */
export interface ILifecycleManager {
  /**
   * 注册生命周期钩子
   * @param phase 生命周期阶段
   * @param hook 钩子函数
   * @param options 注册选项
   * @returns 钩子ID
   */
  registerHook(
    phase: LifecyclePhase,
    hook: LifecycleHook,
    options?: {
      priority?: number
      once?: boolean
      registrar?: string
    }
  ): string

  /**
   * 取消注册生命周期钩子
   * @param phase 生命周期阶段
   * @param hookId 钩子ID
   */
  unregisterHook(phase: LifecyclePhase, hookId: string): void

  /**
   * 取消注册某个注册者的所有钩子
   * @param registrar 注册者标识
   */
  unregisterAllHooks(registrar: string): void

  /**
   * 触发生命周期阶段
   * @param phase 生命周期阶段
   * @param context 生命周期上下文
   * @returns 触发结果
   */
  trigger(phase: LifecyclePhase, context: LifecycleContext): Promise<void>

  /**
   * 获取某个阶段的所有钩子
   * @param phase 生命周期阶段
   * @returns 钩子注册信息数组
   */
  getHooks(phase: LifecyclePhase): LifecycleHookRegistration[]

  /**
   * 检查某个阶段是否有钩子
   * @param phase 生命周期阶段
   * @returns 是否有钩子
   */
  hasHooks(phase: LifecyclePhase): boolean

  /**
   * 监听生命周期事件
   * @param event 事件名称
   * @param handler 事件处理器
   */
  on<K extends keyof LifecycleEvents>(event: K, handler: (payload: LifecycleEvents[K]) => void): void

  /**
   * 移除事件监听器
   * @param event 事件名称
   * @param handler 事件处理器
   */
  off<K extends keyof LifecycleEvents>(event: K, handler: (payload: LifecycleEvents[K]) => void): void

  /**
   * 获取生命周期执行统计
   * @returns 统计信息
   */
  getStats(): {
    totalPhases: number
    totalHooks: number
    phaseExecutions: Record<string, number>
    averageExecutionTime: Record<string, number>
    errors: number
  }

  /**
   * 清空所有钩子
   */
  clear(): void

  /**
   * 销毁生命周期管理器
   */
  destroy(): void
}

/**
 * 生命周期管理器创建选项
 */
export interface LifecycleManagerOptions {
  /** 是否启用统计 */
  enableStats?: boolean
  /** 是否启用错误处理 */
  enableErrorHandling?: boolean
  /** 最大并发执行的钩子数量 */
  maxConcurrentHooks?: number
  /** 钩子执行超时时间（毫秒） */
  hookTimeout?: number
}

/**
 * 内建生命周期阶段配置
 */
export const BUILTIN_PHASES = {
  /** 编辑器生命周期 */
  EDITOR: [
    LifecyclePhase.BEFORE_MOUNT,
    LifecyclePhase.MOUNTED,
    LifecyclePhase.BEFORE_UNMOUNT,
    LifecyclePhase.UNMOUNTED
  ],

  /** 面板生命周期 */
  PANEL: [
    LifecyclePhase.PANEL_CREATED,
    LifecyclePhase.PANEL_LOADED,
    LifecyclePhase.PANEL_SAVED,
    LifecyclePhase.PANEL_DESTROYED
  ],

  /** 节点生命周期 */
  NODE: [
    LifecyclePhase.NODE_ADDED,
    LifecyclePhase.NODE_UPDATED,
    LifecyclePhase.NODE_REMOVED,
    LifecyclePhase.NODE_SELECTED
  ]
} as const
