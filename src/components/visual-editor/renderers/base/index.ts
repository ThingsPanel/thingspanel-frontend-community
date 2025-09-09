/**
 * 渲染器基础模块入口文件
 * 导出所有基础渲染器相关的类型和工具
 */

// 基础渲染器类和接口
export {
  BaseRenderer,
  BaseRendererFactory,
  RendererState,
  type RendererConfig,
  type RendererEvents,
  type NodeData,
  type RendererContext,
  type RendererFactory
} from './BaseRenderer'

// Vue 组件基础渲染器
export { default as BaseRendererComponent } from './BaseRendererComponent.vue'

// 渲染器管理器
export {
  RendererManager,
  rendererManager,
  registerRenderer,
  createRenderer,
  getRendererOptions
} from './RendererManager'

// 工具类型
export interface RendererOption {
  value: string
  label: string
  description?: string
  icon?: string
  supported?: boolean
}

export interface RendererSwitchContext {
  fromType: string
  toType: string
  preserveState?: boolean
  config?: RendererConfig
}

// 渲染器生命周期钩子类型
export interface RendererLifecycleHooks {
  onBeforeInit?: () => Promise<void> | void
  onAfterInit?: () => Promise<void> | void
  onBeforeRender?: () => Promise<void> | void
  onAfterRender?: () => Promise<void> | void
  onBeforeDestroy?: () => Promise<void> | void
  onAfterDestroy?: () => Promise<void> | void
}

// 渲染器性能监控接口
export interface RendererPerformanceMetrics {
  initTime: number
  renderTime: number
  memoryUsage: number
  nodeCount: number
  lastUpdateTime: number
}

// 渲染器错误类型
export class RendererError extends Error {
  constructor(
    message: string,
    public rendererType: string,
    public cause?: Error
  ) {
    super(message)
    this.name = 'RendererError'
  }
}

// 渲染器初始化错误
export class RendererInitError extends RendererError {
  constructor(rendererType: string, cause?: Error) {
    super(`Failed to initialize renderer: ${rendererType}`, rendererType, cause)
    this.name = 'RendererInitError'
  }
}

// 渲染器渲染错误
export class RendererRenderError extends RendererError {
  constructor(rendererType: string, cause?: Error) {
    super(`Failed to render with renderer: ${rendererType}`, rendererType, cause)
    this.name = 'RendererRenderError'
  }
}

// 工具函数

/**
 * 创建渲染器上下文
 */
export function createRendererContext(
  nodes: any,
  selectedIds: any,
  config: any,
  container?: HTMLElement
): RendererContext {
  return {
    nodes,
    selectedIds,
    config,
    container
  }
}

/**
 * 验证渲染器配置
 */
export function validateRendererConfig(config: RendererConfig): boolean {
  // 基础验证逻辑
  if (typeof config !== 'object' || config === null) {
    return false
  }

  // 检查必要字段
  if (config.readonly !== undefined && typeof config.readonly !== 'boolean') {
    return false
  }

  if (config.theme !== undefined && !['light', 'dark'].includes(config.theme)) {
    return false
  }

  return true
}

/**
 * 合并渲染器配置
 */
export function mergeRendererConfig(
  baseConfig: RendererConfig,
  overrideConfig: Partial<RendererConfig>
): RendererConfig {
  return {
    ...baseConfig,
    ...overrideConfig
  }
}

/**
 * 检查渲染器兼容性
 */
export function checkRendererCompatibility(type: string): boolean {
  // 检查浏览器特性支持
  switch (type) {
    case 'canvas':
      return !!document.createElement('canvas').getContext
    case 'webgl':
      try {
        const canvas = document.createElement('canvas')
        return !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
      } catch {
        return false
      }
    case 'svg':
      return !!document.createElementNS
    default:
      return true
  }
}

/**
 * 创建渲染器性能监控器
 */
export function createPerformanceMonitor(): {
  startTiming: (operation: string) => void
  endTiming: (operation: string) => number
  getMetrics: () => Record<string, number>
  reset: () => void
} {
  const timings: Record<string, number> = {}
  const startTimes: Record<string, number> = {}

  return {
    startTiming(operation: string) {
      startTimes[operation] = performance.now()
    },

    endTiming(operation: string) {
      const startTime = startTimes[operation]
      if (startTime) {
        const duration = performance.now() - startTime
        timings[operation] = duration
        delete startTimes[operation]
        return duration
      }
      return 0
    },

    getMetrics() {
      return { ...timings }
    },

    reset() {
      Object.keys(timings).forEach(key => delete timings[key])
      Object.keys(startTimes).forEach(key => delete startTimes[key])
    }
  }
}
