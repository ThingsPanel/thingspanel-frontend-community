/**
 * 渲染器接口定义
 * 定义渲染器的统一规范和生命周期
 */

import type { IDataNode, RendererType, IComponentInstance } from './index'

// 渲染器接口
export interface IRenderer {
  /** 渲染器类型 */
  type: RendererType
  /** 渲染器名称 */
  name: string
  /** 渲染器版本 */
  version: string
  /** 是否已初始化 */
  initialized: boolean
  /** 是否处于休眠状态 */
  sleeping: boolean

  /** 初始化渲染器 */
  init(container: HTMLElement): Promise<void>
  /** 渲染组件 */
  render(component: IComponentInstance): Promise<void>
  /** 更新组件 */
  update(component: IComponentInstance): Promise<void>
  /** 移除组件 */
  remove(componentId: string): Promise<void>
  /** 休眠渲染器 */
  sleep(): Promise<void>
  /** 唤醒渲染器 */
  wakeup(): Promise<void>
  /** 销毁渲染器 */
  destroy(): Promise<void>
  /** 获取渲染上下文 */
  getContext(): any
}

// 渲染器配置
export interface IRendererConfig {
  /** 渲染器类型 */
  type: RendererType
  /** 配置参数 */
  options?: Record<string, any>
  /** 性能配置 */
  performance?: {
    /** 是否启用硬件加速 */
    hardwareAcceleration?: boolean
    /** 最大FPS */
    maxFPS?: number
    /** 是否启用批量渲染 */
    batchRendering?: boolean
  }
}

// 渲染上下文
export interface IRenderContext {
  /** 渲染器类型 */
  rendererType: RendererType
  /** 容器元素 */
  container: HTMLElement
  /** Canvas元素 (如果适用) */
  canvas?: HTMLCanvasElement
  /** 渲染上下文 (2D/WebGL) */
  context?: CanvasRenderingContext2D | WebGLRenderingContext | WebGL2RenderingContext
  /** 视口信息 */
  viewport: {
    width: number
    height: number
    devicePixelRatio: number
  }
  /** 渲染状态 */
  state: {
    /** 是否正在渲染 */
    rendering: boolean
    /** 渲染帧数 */
    frameCount: number
    /** 最后渲染时间 */
    lastRenderTime: number
  }
}

// 渲染器事件
export interface IRendererEvent {
  /** 事件类型 */
  type: 'init' | 'render' | 'update' | 'sleep' | 'wakeup' | 'destroy' | 'error'
  /** 渲染器类型 */
  rendererType: RendererType
  /** 事件数据 */
  data?: any
  /** 错误信息 (如果是错误事件) */
  error?: Error
  /** 时间戳 */
  timestamp: number
}

// 渲染器管理器接口
export interface IRendererManager {
  /** 注册渲染器 */
  register(renderer: IRenderer): void
  /** 获取渲染器 */
  getRenderer(type: RendererType): IRenderer | null
  /** 切换渲染器 */
  switchRenderer(fromType: RendererType, toType: RendererType): Promise<void>
  /** 获取所有渲染器 */
  getAllRenderers(): IRenderer[]
  /** 销毁所有渲染器 */
  destroyAll(): Promise<void>
}

// 资源池接口 (用于渲染器资源管理)
export interface IResourcePool {
  /** 获取资源 */
  acquire<T>(key: string, factory: () => T): T
  /** 释放资源 */
  release(key: string): void
  /** 清理未使用的资源 */
  cleanup(): void
  /** 获取资源使用统计 */
  getStats(): {
    total: number
    active: number
    idle: number
  }
}

// 渲染器钩子函数
export interface IRendererHooks {
  /** 渲染前钩子 */
  beforeRender?: (context: IRenderContext) => void | Promise<void>
  /** 渲染后钩子 */
  afterRender?: (context: IRenderContext) => void | Promise<void>
  /** 错误处理钩子 */
  onError?: (error: Error, context: IRenderContext) => void
  /** 性能监控钩子 */
  onPerformance?: (metrics: { renderTime: number; fps: number; memoryUsage?: number }) => void
}
