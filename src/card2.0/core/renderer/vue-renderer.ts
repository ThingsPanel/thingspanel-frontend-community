/**
 * Vue渲染器实现
 * 基于Vue 3的主要渲染引擎
 */

import { createApp, App, Component } from 'vue'
import type { IRenderer, IRendererConfig, IRenderContext, IRendererEvent, IRendererHooks } from '../types/renderer'

/**
 * Vue渲染器配置
 */
export interface IVueRendererConfig extends IRendererConfig {
  /** 全局组件 */
  globalComponents?: Record<string, Component>
  /** 全局指令 */
  globalDirectives?: Record<string, any>
  /** 全局插件 */
  globalPlugins?: Array<{ plugin: any; options?: any }>
  /** 全局属性 */
  globalProperties?: Record<string, any>
  /** 错误处理器 */
  errorHandler?: (_err: any, _instance: any, _info: string) => void
  /** 警告处理器 */
  warnHandler?: (_msg: string, _instance: any, _trace: string) => void
}

/**
 * Vue应用实例管理器
 */
class VueAppManager {
  private apps = new Map<string, App>()
  private mountedElements = new Map<string, HTMLElement>()

  createApp(contextId: string, component: Component, props: any = {}): App {
    const app = createApp(component, props)
    this.apps.set(contextId, app)
    return app
  }

  getApp(contextId: string): App | undefined {
    return this.apps.get(contextId)
  }

  mountApp(contextId: string, container: HTMLElement): void {
    const app = this.apps.get(contextId)
    if (app) {
      app.mount(container)
      this.mountedElements.set(contextId, container)
    }
  }

  unmountApp(contextId: string): void {
    const app = this.apps.get(contextId)
    const element = this.mountedElements.get(contextId)

    if (app && element) {
      app.unmount()
      this.apps.delete(contextId)
      this.mountedElements.delete(contextId)
    }
  }

  cleanup(): void {
    for (const contextId of this.apps.keys()) {
      this.unmountApp(contextId)
    }
  }

  getStats() {
    return {
      activeApps: this.apps.size,
      mountedElements: this.mountedElements.size
    }
  }
}

/**
 * Vue渲染器实现
 */
export class VueRenderer implements IRenderer {
  type = 'vue' as const
  config: IVueRendererConfig
  private appManager = new VueAppManager()
  private eventListeners = new Map<string, Array<(event: IRendererEvent) => void>>()
  private hooks: IRendererHooks = {}

  constructor(config: IVueRendererConfig = {}) {
    this.config = {
      enableDevtools: false,
      enablePerformanceTracking: false,
      ...config
    }
  }

  async initialize(): Promise<void> {
    try {
      // 执行初始化钩子
      if (this.hooks.beforeInitialize) {
        await this.hooks.beforeInitialize()
      }

      console.log('Vue渲染器初始化成功')

      // 执行初始化完成钩子
      if (this.hooks.afterInitialize) {
        await this.hooks.afterInitialize()
      }

      this.emit('initialized', { renderer: this })
    } catch (error) {
      console.error('Vue渲染器初始化失败:', error)
      this.emit('error', { error, context: 'initialize' })
      throw error
    }
  }

  async render(context: IRenderContext): Promise<void> {
    try {
      // 执行渲染前钩子
      if (this.hooks.beforeRender) {
        await this.hooks.beforeRender(context)
      }

      const { instance, container } = context
      const vueComponent = instance.definition.views.vue

      if (!vueComponent) {
        throw new Error(`组件 ${instance.definition.meta.id} 没有Vue视图实现`)
      }

      // 准备组件属性
      const props = {
        data: context.data,
        config: context.config,
        instance: context.instance,
        context: context
      }

      // 创建Vue应用
      const app = this.appManager.createApp(context.id, vueComponent, props)

      // 配置全局组件
      if (this.config.globalComponents) {
        Object.entries(this.config.globalComponents).forEach(([name, component]) => {
          app.component(name, component)
        })
      }

      // 配置全局指令
      if (this.config.globalDirectives) {
        Object.entries(this.config.globalDirectives).forEach(([name, directive]) => {
          app.directive(name, directive)
        })
      }

      // 配置全局插件
      if (this.config.globalPlugins) {
        this.config.globalPlugins.forEach(({ plugin, options }) => {
          app.use(plugin, options)
        })
      }

      // 配置全局属性
      if (this.config.globalProperties) {
        Object.entries(this.config.globalProperties).forEach(([key, value]) => {
          app.config.globalProperties[key] = value
        })
      }

      // 配置错误处理
      if (this.config.errorHandler) {
        app.config.errorHandler = this.config.errorHandler
      }

      if (this.config.warnHandler) {
        app.config.warnHandler = this.config.warnHandler
      }

      // 挂载应用
      this.appManager.mountApp(context.id, container)

      // 存储渲染信息到上下文
      context.setMetadata('vueApp', app)
      context.setMetadata('renderTime', Date.now())

      // 执行渲染后钩子
      if (this.hooks.afterRender) {
        await this.hooks.afterRender(context)
      }

      this.emit('rendered', { context, renderer: this })

      console.log(`组件 ${instance.definition.meta.id} 渲染成功`)
    } catch (error) {
      console.error('Vue渲染失败:', error)
      this.emit('error', { error, context: 'render', renderContext: context })
      throw error
    }
  }

  async update(context: IRenderContext): Promise<void> {
    try {
      // 执行更新前钩子
      if (this.hooks.beforeUpdate) {
        await this.hooks.beforeUpdate(context)
      }

      const app = context.getMetadata('vueApp') as App
      if (!app) {
        throw new Error('Vue应用实例不存在，无法更新')
      }

      // Vue的响应式系统会自动处理数据更新
      // 这里主要是触发钩子和事件

      context.setMetadata('lastUpdateTime', Date.now())

      // 执行更新后钩子
      if (this.hooks.afterUpdate) {
        await this.hooks.afterUpdate(context)
      }

      this.emit('updated', { context, renderer: this })

      console.log(`组件 ${context.instance.definition.meta.id} 更新成功`)
    } catch (error) {
      console.error('Vue更新失败:', error)
      this.emit('error', { error, context: 'update', renderContext: context })
      throw error
    }
  }

  async destroy(context?: IRenderContext): Promise<void> {
    try {
      if (context) {
        // 销毁特定上下文
        if (this.hooks.beforeDestroy) {
          await this.hooks.beforeDestroy(context)
        }

        this.appManager.unmountApp(context.id)

        if (this.hooks.afterDestroy) {
          await this.hooks.afterDestroy(context)
        }

        this.emit('destroyed', { context, renderer: this })

        console.log(`组件 ${context.instance.definition.meta.id} 销毁成功`)
      } else {
        // 销毁整个渲染器
        this.appManager.cleanup()
        this.eventListeners.clear()

        this.emit('destroyed', { renderer: this })

        console.log('Vue渲染器销毁成功')
      }
    } catch (error) {
      console.error('Vue销毁失败:', error)
      this.emit('error', { error, context: 'destroy', renderContext: context })
      throw error
    }
  }

  on(event: string, listener: (event: IRendererEvent) => void): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, [])
    }
    this.eventListeners.get(event)!.push(listener)
  }

  off(event: string, listener: (event: IRendererEvent) => void): void {
    const listeners = this.eventListeners.get(event)
    if (listeners) {
      const index = listeners.indexOf(listener)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }

  emit(event: string, data: any): void {
    const listeners = this.eventListeners.get(event)
    if (listeners) {
      const eventData: IRendererEvent = {
        type: event,
        timestamp: Date.now(),
        data
      }

      listeners.forEach(listener => {
        try {
          listener(eventData)
        } catch (error) {
          console.error(`事件监听器执行失败:`, error)
        }
      })
    }
  }

  setHooks(hooks: IRendererHooks): void {
    this.hooks = { ...this.hooks, ...hooks }
  }

  getHooks(): IRendererHooks {
    return { ...this.hooks }
  }

  /**
   * 更新渲染器配置
   */
  updateConfig(newConfig: Partial<IVueRendererConfig>): void {
    this.config = { ...this.config, ...newConfig }
    console.log('Vue渲染器配置已更新')
  }

  /**
   * 获取渲染器统计信息
   */
  getStats() {
    return {
      type: this.type,
      config: this.config,
      eventListeners: Object.fromEntries(
        Array.from(this.eventListeners.entries()).map(([event, listeners]) => [event, listeners.length])
      ),
      appManager: this.appManager.getStats()
    }
  }

  /**
   * 检查组件是否支持Vue渲染
   */
  canRender(component: any): boolean {
    return !!(component.views && component.views.vue)
  }

  /**
   * 获取组件的Vue视图
   */
  getComponentView(component: any): Component | undefined {
    return component.views?.vue
  }
}

// 导出默认Vue渲染器实例
export const vueRenderer = new VueRenderer()
