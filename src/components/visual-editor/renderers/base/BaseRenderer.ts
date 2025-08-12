/**
 * 基础渲染器类
 * 定义所有渲染器的统一接口和生命周期
 */

import type { Ref } from 'vue'

// 渲染器状态枚举
export enum RendererState {
  IDLE = 'idle', // 闲置状态
  INITIALIZING = 'initializing', // 初始化中
  READY = 'ready', // 就绪状态
  RENDERING = 'rendering', // 渲染中
  ERROR = 'error', // 错误状态
  DESTROYED = 'destroyed' // 已销毁
}

// 渲染器配置接口
export interface RendererConfig {
  readonly?: boolean
  theme?: 'light' | 'dark'
  [key: string]: any
}

// 渲染器事件接口
export interface RendererEvents {
  ready: []
  error: [Error]
  'node-select': [string]
  'node-update': [string, any]
  'canvas-click': [MouseEvent?]
  'state-change': [RendererState]
}

// 节点数据接口
export interface NodeData {
  id: string
  type: string
  x: number
  y: number
  width: number
  height: number
  properties: Record<string, any>
  renderer?: string[]
}

// 渲染器上下文接口
export interface RendererContext {
  nodes: Ref<NodeData[]>
  selectedIds: Ref<string[]>
  config: Ref<RendererConfig>
  container?: HTMLElement
}

// 基础渲染器抽象类
export abstract class BaseRenderer {
  protected state: RendererState = RendererState.IDLE
  protected context: RendererContext
  protected eventListeners: Map<keyof RendererEvents, Array<(...args: any[]) => void>> = new Map()
  protected config: RendererConfig

  constructor(context: RendererContext, config: RendererConfig = {}) {
    this.context = context
    this.config = { readonly: false, theme: 'light', ...config }
    this.initializeEventMap()
  }

  // 初始化事件映射
  private initializeEventMap() {
    const events: (keyof RendererEvents)[] = [
      'ready',
      'error',
      'node-select',
      'node-update',
      'canvas-click',
      'state-change'
    ]
    events.forEach(event => {
      this.eventListeners.set(event, [])
    })
  }

  // 获取当前状态
  getState(): RendererState {
    return this.state
  }

  // 设置状态
  protected setState(newState: RendererState) {
    if (this.state !== newState) {
      const oldState = this.state
      this.state = newState
      this.emit('state-change', newState)
      this.onStateChange(oldState, newState)
    }
  }

  // 状态变化钩子
  protected onStateChange(oldState: RendererState, newState: RendererState) {
    console.log(`[${this.constructor.name}] State changed: ${oldState} -> ${newState}`)
  }

  // 事件监听
  on<K extends keyof RendererEvents>(event: K, listener: (...args: RendererEvents[K]) => void): void {
    const listeners = this.eventListeners.get(event)
    if (listeners) {
      listeners.push(listener)
    }
  }

  // 移除事件监听
  off<K extends keyof RendererEvents>(event: K, listener: (...args: RendererEvents[K]) => void): void {
    const listeners = this.eventListeners.get(event)
    if (listeners) {
      const index = listeners.indexOf(listener)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }

  // 触发事件
  protected emit<K extends keyof RendererEvents>(event: K, ...args: RendererEvents[K]): void {
    const listeners = this.eventListeners.get(event)
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(...args)
        } catch (error) {
          console.error(`[${this.constructor.name}] Event listener error:`, error)
        }
      })
    }
  }

  // 生命周期方法 - 初始化
  async init(): Promise<void> {
    if (this.state !== RendererState.IDLE) {
      throw new Error(`Cannot initialize renderer in state: ${this.state}`)
    }

    try {
      this.setState(RendererState.INITIALIZING)
      await this.onInit()
      this.setState(RendererState.READY)
      this.emit('ready')
    } catch (error) {
      this.setState(RendererState.ERROR)
      this.emit('error', error as Error)
      throw error
    }
  }

  // 生命周期方法 - 渲染
  async render(): Promise<void> {
    if (this.state !== RendererState.READY) {
      console.warn(`[${this.constructor.name}] Render called in state: ${this.state}`)
      return
    }

    try {
      this.setState(RendererState.RENDERING)
      await this.onRender()
      this.setState(RendererState.READY)
    } catch (error) {
      this.setState(RendererState.ERROR)
      this.emit('error', error as Error)
      throw error
    }
  }

  // 生命周期方法 - 更新
  async update(changes: Partial<RendererConfig>): Promise<void> {
    try {
      this.config = { ...this.config, ...changes }
      await this.onUpdate(changes)
    } catch (error) {
      this.setState(RendererState.ERROR)
      this.emit('error', error as Error)
      throw error
    }
  }

  // 生命周期方法 - 销毁
  async destroy(): Promise<void> {
    try {
      await this.onDestroy()
      this.setState(RendererState.DESTROYED)
      this.eventListeners.clear()
    } catch (error) {
      console.error(`[${this.constructor.name}] Destroy error:`, error)
      throw error
    }
  }

  // 节点操作方法
  selectNode(nodeId: string): void {
    this.emit('node-select', nodeId)
    this.onNodeSelect(nodeId)
  }

  updateNode(nodeId: string, updates: Partial<NodeData>): void {
    this.emit('node-update', nodeId, updates)
    this.onNodeUpdate(nodeId, updates)
  }

  handleCanvasClick(event?: MouseEvent): void {
    this.emit('canvas-click', event)
    this.onCanvasClick(event)
  }

  // 获取配置
  getConfig(): RendererConfig {
    return { ...this.config }
  }

  // 抽象方法 - 子类必须实现
  protected abstract onInit(): Promise<void>
  protected abstract onRender(): Promise<void>
  protected abstract onUpdate(changes: Partial<RendererConfig>): Promise<void>
  protected abstract onDestroy(): Promise<void>

  // 可选的钩子方法 - 子类可以重写
  protected onNodeSelect(nodeId: string): void {
    // 默认实现，子类可以重写
  }

  protected onNodeUpdate(nodeId: string, updates: Partial<NodeData>): void {
    // 默认实现，子类可以重写
  }

  protected onCanvasClick(event?: MouseEvent): void {
    // 默认实现，子类可以重写
  }

  // 工具方法
  protected isReady(): boolean {
    return this.state === RendererState.READY
  }

  protected isDestroyed(): boolean {
    return this.state === RendererState.DESTROYED
  }

  protected validateState(expectedStates: RendererState[]): void {
    if (!expectedStates.includes(this.state)) {
      throw new Error(`Invalid state: expected ${expectedStates.join(' or ')}, got ${this.state}`)
    }
  }
}

// 渲染器工厂接口
export interface RendererFactory {
  create(context: RendererContext, config?: RendererConfig): BaseRenderer
  getType(): string
  isSupported(): boolean
}

// 抽象渲染器工厂类
export abstract class BaseRendererFactory implements RendererFactory {
  abstract create(context: RendererContext, config?: RendererConfig): BaseRenderer
  abstract getType(): string

  isSupported(): boolean {
    // 默认实现，子类可以重写以检查特定的支持条件
    return true
  }
}
