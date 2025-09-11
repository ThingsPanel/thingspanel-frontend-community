/**
 * Vue渲染器实现
 * 基于Vue 3的组件渲染器
 */

import { createApp, App, Component, ref, reactive, onMounted, onUnmounted, h } from 'vue'
import type { IRenderer, IRendererConfig, IRenderContext, IRendererEvent, IRendererHooks } from '../types/renderer'
import type { IComponentInstance } from '../types/component'
import type { IDataNode } from '../types/index'

/**
 * Vue渲染器配置
 */
interface VueRendererConfig extends IRendererConfig {
  /** 全局组件 */
  globalComponents?: Record<string, Component>
  /** 全局指令 */
  globalDirectives?: Record<string, any>
  /** 插件 */
  plugins?: Array<{ install: (_app: App) => void }>
  /** 开发模式 */
  devMode?: boolean
}

/**
 * Vue渲染器实现类
 */
export class VueRenderer implements IRenderer {
  /** 渲染器类型 */
  readonly type = 'vue'
  /** 渲染器配置 */
  private config: VueRendererConfig
  /** Vue应用实例缓存 */
  private apps = new Map<string, App>()
  /** 组件实例缓存 */
  private componentInstances = new Map<string, any>()
  /** 事件监听器 */
  private eventListeners = new Map<string, Set<(event: IRendererEvent) => void>>()
  /** 钩子函数 */
  private hooks: IRendererHooks = {}

  constructor(config: VueRendererConfig = {}) {
    this.config = {
      enableHMR: true,
      enableDevtools: true,
      enableErrorBoundary: true,
      ...config
    }

    if (process.env.NODE_ENV === 'development') {
    }
  }

  /**
   * 渲染组件实例
   * @param instance 组件实例
   * @param context 渲染上下文
   */
  async render(instance: IComponentInstance, context: IRenderContext): Promise<void> {
    try {
      // 调用渲染前钩子
      await this.hooks.beforeRender?.(instance, context)

      // 创建Vue应用
      const app = this.createVueApp(instance, context)

      // 挂载到容器
      const mountedApp = app.mount(context.container)

      // 缓存应用和组件实例
      this.apps.set(instance.id, app)
      this.componentInstances.set(instance.id, mountedApp)

      // 触发渲染完成事件
      this.emitEvent('rendered', {
        type: 'rendered',
        instanceId: instance.id,
        contextId: context.id,
        timestamp: Date.now()
      })

      // 调用渲染后钩子
      await this.hooks.afterRender?.(instance, context)

      if (process.env.NODE_ENV === 'development') {
      }
    } catch (error) {
      console.error(`[VueRenderer] 渲染失败:`, error)

      // 触发错误事件
      this.emitEvent('error', {
        type: 'error',
        instanceId: instance.id,
        contextId: context.id,
        error: error as Error,
        timestamp: Date.now()
      })

      throw error
    }
  }

  /**
   * 更新组件实例
   * @param instance 组件实例
   * @param data 更新数据
   * @param context 渲染上下文
   */
  async update(instance: IComponentInstance, data: any, context: IRenderContext): Promise<void> {
    try {
      // 调用更新前钩子
      await this.hooks.beforeUpdate?.(instance, data, context)

      const componentInstance = this.componentInstances.get(instance.id)
      if (!componentInstance) {
        throw new Error(`组件实例 ${instance.id} 不存在`)
      }

      // 更新组件数据
      if (componentInstance.updateData && typeof componentInstance.updateData === 'function') {
        await componentInstance.updateData(data)
      } else if (componentInstance.$refs?.component?.updateData) {
        await componentInstance.$refs.component.updateData(data)
      } else {
        // 直接更新响应式数据
        Object.assign(componentInstance.data || {}, data)
      }

      // 触发更新完成事件
      this.emitEvent('updated', {
        type: 'updated',
        instanceId: instance.id,
        contextId: context.id,
        data,
        timestamp: Date.now()
      })

      // 调用更新后钩子
      await this.hooks.afterUpdate?.(instance, data, context)

      if (process.env.NODE_ENV === 'development') {
      }
    } catch (error) {
      console.error(`[VueRenderer] 更新失败:`, error)
      throw error
    }
  }

  /**
   * 销毁组件实例
   * @param instance 组件实例
   * @param context 渲染上下文
   */
  async destroy(instance: IComponentInstance, context: IRenderContext): Promise<void> {
    try {
      // 调用销毁前钩子
      await this.hooks.beforeDestroy?.(instance, context)

      const app = this.apps.get(instance.id)
      if (app) {
        // 卸载Vue应用
        app.unmount()
        this.apps.delete(instance.id)
      }

      // 清理组件实例
      this.componentInstances.delete(instance.id)

      // 触发销毁完成事件
      this.emitEvent('destroyed', {
        type: 'destroyed',
        instanceId: instance.id,
        contextId: context.id,
        timestamp: Date.now()
      })

      // 调用销毁后钩子
      await this.hooks.afterDestroy?.(instance, context)

      if (process.env.NODE_ENV === 'development') {
      }
    } catch (error) {
      console.error(`[VueRenderer] 销毁失败:`, error)
      throw error
    }
  }

  /**
   * 添加事件监听器
   * @param eventType 事件类型
   * @param listener 监听器函数
   */
  addEventListener(eventType: string, listener: (event: IRendererEvent) => void): void {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, new Set())
    }
    this.eventListeners.get(eventType)!.add(listener)
  }

  /**
   * 移除事件监听器
   * @param eventType 事件类型
   * @param listener 监听器函数
   */
  removeEventListener(eventType: string, listener: (event: IRendererEvent) => void): void {
    const listeners = this.eventListeners.get(eventType)
    if (listeners) {
      listeners.delete(listener)
    }
  }

  /**
   * 设置钩子函数
   * @param hooks 钩子函数对象
   */
  setHooks(hooks: Partial<IRendererHooks>): void {
    this.hooks = { ...this.hooks, ...hooks }
  }

  /**
   * 获取渲染器配置
   * @returns 配置对象
   */
  getConfig(): VueRendererConfig {
    return { ...this.config }
  }

  /**
   * 更新渲染器配置
   * @param config 新配置
   */
  updateConfig(config: Partial<VueRendererConfig>): void {
    this.config = { ...this.config, ...config }
    if (process.env.NODE_ENV === 'development') {
    }
  }

  /**
   * 销毁渲染器
   */
  cleanup(): void {
    // 销毁所有Vue应用
    this.apps.forEach((app, instanceId) => {
      try {
        app.unmount()
      } catch (error) {
        console.error(`[VueRenderer] 销毁应用 ${instanceId} 失败:`, error)
      }
    })

    // 清理缓存
    this.apps.clear()
    this.componentInstances.clear()
    this.eventListeners.clear()

    if (process.env.NODE_ENV === 'development') {
    }
  }

  /**
   * 创建Vue应用
   * @param instance 组件实例
   * @param context 渲染上下文
   * @returns Vue应用实例
   */
  private createVueApp(instance: IComponentInstance, context: IRenderContext): App {
    // 创建根组件
    const RootComponent = this.createRootComponent(instance)

    // 创建Vue应用
    const app = createApp(RootComponent)

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

    // 安装插件
    if (this.config.plugins) {
      this.config.plugins.forEach(plugin => {
        app.use(plugin)
      })
    }

    // 配置错误处理
    if (this.config.enableErrorBoundary) {
      app.config.errorHandler = (error, _vm, info) => {
        console.error('[VueRenderer] Vue错误:', error, info)
        this.emitEvent('error', {
          type: 'error',
          instanceId: instance.id,
          contextId: context.id,
          error: error as Error,
          timestamp: Date.now()
        })
      }
    }

    // 开发模式配置
    if (this.config.devMode) {
      app.config.devtools = this.config.enableDevtools
    }

    return app
  }

  /**
   * 创建根组件
   * @param instance 组件实例
   * @returns Vue组件
   */
  private createRootComponent(instance: IComponentInstance): Component {
    const { definition, config, data } = instance

    return {
      name: `Card_${definition.meta.id}`,
      setup() {
        // 创建响应式数据
        const cardData = ref(data)
        const cardConfig = reactive(config)
        const isLoading = ref(false)
        const error = ref<Error | null>(null)

        // 数据更新方法
        const updateData = async (newData: IDataNode | IDataNode[]) => {
          try {
            isLoading.value = true
            error.value = null

            // 调用组件逻辑的数据处理方法
            if (definition.logic.processData) {
              const processedData = await definition.logic.processData(newData, cardConfig)
              cardData.value = processedData
            } else {
              cardData.value = newData
            }
          } catch (err) {
            error.value = err as Error
            console.error('[VueRenderer] 数据更新失败:', err)
          } finally {
            isLoading.value = false
          }
        }

        // 配置更新方法
        const updateConfig = (newConfig: any) => {
          Object.assign(cardConfig, newConfig)
        }

        // 生命周期钩子
        onMounted(async () => {
          try {
            await definition.logic.onMounted?.({
              data: cardData.value,
              config: cardConfig,
              updateData,
              updateConfig
            })
          } catch (err) {
            console.error('[VueRenderer] 组件挂载失败:', err)
          }
        })

        onUnmounted(async () => {
          try {
            await definition.logic.onUnmounted?.({
              data: cardData.value,
              config: cardConfig,
              updateData,
              updateConfig
            })
          } catch (err) {
            console.error('[VueRenderer] 组件卸载失败:', err)
          }
        })

        // 暴露方法给外部调用
        return {
          cardData,
          cardConfig,
          isLoading,
          error,
          updateData,
          updateConfig
        }
      },
      render() {
        // 获取对应的Vue视图组件
        const VueView = definition.views.vue
        if (!VueView) {
          throw new Error(`组件 ${definition.meta.id} 没有Vue视图实现`)
        }

        // 渲染Vue组件
        return h(VueView, {
          data: this.cardData,
          config: this.cardConfig,
          loading: this.isLoading,
          error: this.error,
          onUpdateData: this.updateData,
          onUpdateConfig: this.updateConfig
        })
      }
    }
  }

  /**
   * 触发事件
   * @param eventType 事件类型
   * @param event 事件对象
   */
  private emitEvent(eventType: string, event: IRendererEvent): void {
    const listeners = this.eventListeners.get(eventType)
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(event)
        } catch (error) {
          console.error(`[VueRenderer] 事件监听器执行失败:`, error)
        }
      })
    }
  }
}

// 创建默认Vue渲染器实例
export const vueRenderer = new VueRenderer()

// 导出类型
export type { VueRendererConfig }
