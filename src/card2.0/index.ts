/**
 * Card 2.0 主入口文件
 * 整合所有核心模块，提供统一的API接口
 */

// 核心类型导出
export * from './core/types/index'
export * from './core/types/renderer'
export * from './core/types/component'

// 核心实现导出
export { ComponentRegistry, ComponentFactory, componentRegistry } from './core/registry/index'
export { ComponentLoader, componentLoader } from './core/registry/loader'
export { DataTransform, DataAggregator, dataTransform, dataAggregator } from './core/data/transform'
export { RendererManager, ResourcePool, RenderContext, rendererManager } from './core/renderer/manager'
export { VueRenderer, vueRenderer } from './core/renderer/vue-renderer'

// 组件导出
// 图表组件
export { default as barChartDefinition } from './components/chart/bar/index'
export { default as curveChartDefinition } from './components/chart/curve/index'
export { default as gaugeDefinition } from './components/chart/gauge/index'
export { default as tableDefinition } from './components/chart/table/index'

// 控制组件
export { default as digitSetterDefinition } from './components/control/digit-setter/index'
export { default as dispatchDataDefinition } from './components/control/dispatch-data/index'
export { default as enumControlDefinition } from './components/control/enum-control/index'
export { default as switchDefinition } from './components/control/switch/index'

// 显示组件
export { default as digitIndicatorDefinition } from './components/display/digit-indicator/index'
export { default as stateDisplayDefinition } from './components/display/state-display/index'
export { default as textInfoDefinition } from './components/display/text-info/index'

// 媒体组件
export { default as videoPlayerDefinition } from './components/media/video-player/index'

// 主要API类
import { componentRegistry } from './core/registry/index'
import { componentLoader } from './core/registry/loader'
import { rendererManager } from './core/renderer/manager'
import { vueRenderer } from './core/renderer/vue-renderer'
import { dataTransform } from './core/data/transform'
import type { IComponentDefinition, IComponentInstance } from './core/types/component'
import type { RendererType } from './core/types/index'

/**
 * Card 2.0 主API类
 */
export class Card2API {
  private initialized = false

  /**
   * 初始化Card 2.0系统
   */
  async initialize(
    options: {
      /** 是否自动注册内置组件 */
      autoRegisterBuiltins?: boolean
      /** 是否启用开发模式 */
      devMode?: boolean
      /** 自定义渲染器配置 */
      rendererConfigs?: Record<string, any>
    } = {}
  ) {
    if (this.initialized) {
      console.warn('Card 2.0 已经初始化')
      return
    }

    try {
      const { autoRegisterBuiltins = true, devMode = false, rendererConfigs = {} } = options

      console.log('开始初始化 Card 2.0 系统...')

      // 1. 初始化渲染器
      await this.initializeRenderers(rendererConfigs)

      // 2. 注册内置组件
      if (autoRegisterBuiltins) {
        await this.registerBuiltinComponents()
      }

      // 3. 设置开发模式
      if (devMode) {
        this.enableDevMode()
      }

      this.initialized = true
      console.log('Card 2.0 系统初始化完成')

      // 输出系统信息
      this.printSystemInfo()
    } catch (error) {
      console.error('Card 2.0 初始化失败:', error)
      throw error
    }
  }

  /**
   * 初始化渲染器
   */
  private async initializeRenderers(configs: Record<string, any>) {
    // 注册Vue渲染器
    if (configs.vue) {
      vueRenderer.updateConfig(configs.vue)
    }
    await vueRenderer.initialize()
    rendererManager.registerRenderer('vue', vueRenderer)

    console.log('渲染器初始化完成')
  }

  /**
   * 注册内置组件
   */
  private async registerBuiltinComponents() {
    const registeredComponents = []

    try {
      // 安全注册图表组件
      try {
        const { default: barChartDefinition } = await import('./components/chart/bar/index')
        componentRegistry.register(barChartDefinition)
        registeredComponents.push('bar-chart')
      } catch (error) {
        console.warn('柱状图组件注册失败:', error.message)
      }

      try {
        const { default: curveChartDefinition } = await import('./components/chart/curve/index')
        componentRegistry.register(curveChartDefinition)
        registeredComponents.push('curve-chart')
      } catch (error) {
        console.warn('曲线图组件注册失败:', error.message)
      }

      // 暂时跳过gauge组件，因为它使用旧的定义格式
      try {
        const { default: gaugeDefinition } = await import('./components/chart/gauge/index')
        // TODO: 修复gauge组件的meta结构
        console.warn('仪表盘组件暂时跳过注册，需要修复meta结构')
      } catch (error) {
        console.warn('仪表盘组件注册失败:', error.message)
      }

      try {
        const { default: tableDefinition } = await import('./components/chart/table/index')
        componentRegistry.register(tableDefinition)
        registeredComponents.push('table')
      } catch (error) {
        console.warn('表格组件注册失败:', error.message)
      }

      // 安全注册控制组件
      try {
        const { default: digitSetterDefinition } = await import('./components/control/digit-setter/index')
        componentRegistry.register(digitSetterDefinition)
        registeredComponents.push('digit-setter')
      } catch (error) {
        console.warn('数字设置器组件注册失败:', error.message)
      }

      try {
        const { default: dispatchDataDefinition } = await import('./components/control/dispatch-data/index')
        componentRegistry.register(dispatchDataDefinition)
        registeredComponents.push('dispatch-data')
      } catch (error) {
        console.warn('数据分发组件注册失败:', error.message)
      }

      try {
        const { default: enumControlDefinition } = await import('./components/control/enum-control/index')
        componentRegistry.register(enumControlDefinition)
        registeredComponents.push('enum-control')
      } catch (error) {
        console.warn('枚举控制组件注册失败:', error.message)
      }

      try {
        const { default: switchDefinition } = await import('./components/control/switch/index')
        componentRegistry.register(switchDefinition)
        registeredComponents.push('switch')
      } catch (error) {
        console.warn('开关组件注册失败:', error.message)
      }

      // 安全注册显示组件
      try {
        const { default: digitIndicatorDefinition } = await import('./components/display/digit-indicator/index')
        componentRegistry.register(digitIndicatorDefinition)
        registeredComponents.push('digit-indicator')
      } catch (error) {
        console.warn('数字指示器组件注册失败:', error.message)
      }

      try {
        const { default: stateDisplayDefinition } = await import('./components/display/state-display/index')
        componentRegistry.register(stateDisplayDefinition)
        registeredComponents.push('state-display')
      } catch (error) {
        console.warn('状态显示组件注册失败:', error.message)
      }

      try {
        const { default: textInfoDefinition } = await import('./components/display/text-info/index')
        componentRegistry.register(textInfoDefinition)
        registeredComponents.push('text-info')
      } catch (error) {
        console.warn('文本信息组件注册失败:', error.message)
      }

      // 安全注册媒体组件
      try {
        const { default: videoPlayerDefinition } = await import('./components/media/video-player/index')
        componentRegistry.register(videoPlayerDefinition)
        registeredComponents.push('video-player')
      } catch (error) {
        console.warn('视频播放器组件注册失败:', error.message)
      }

      console.log(`内置组件注册完成，成功注册了 ${registeredComponents.length} 个组件:`, registeredComponents)
    } catch (error) {
      console.error('内置组件注册过程中发生严重错误:', error)
      throw error
    }
  }

  /**
   * 启用开发模式
   */
  private enableDevMode() {
    // 添加全局调试方法
    if (typeof window !== 'undefined') {
      ;(window as any).Card2Debug = {
        registry: componentRegistry,
        loader: componentLoader,
        rendererManager,
        dataTransform,
        getStats: () => ({
          components: componentRegistry.getStats(),
          loader: componentLoader.getCacheStats(),
          renderer: rendererManager.getStats()
        })
      }
    }

    console.log('开发模式已启用，可通过 window.Card2Debug 访问调试API')
  }

  /**
   * 输出系统信息
   */
  private printSystemInfo() {
    const stats = {
      components: componentRegistry.getStats(),
      renderers: rendererManager.getRegisteredRenderers(),
      loader: componentLoader.getCacheStats()
    }

    console.log('Card 2.0 系统信息:', stats)
  }

  /**
   * 注册组件
   */
  registerComponent(definition: IComponentDefinition) {
    this.checkInitialized()
    componentRegistry.register(definition)
  }

  /**
   * 获取组件定义
   */
  getComponent(componentId: string) {
    this.checkInitialized()
    return componentRegistry.getDefinition(componentId)
  }

  /**
   * 创建组件实例
   */
  createInstance(componentId: string, config: any, data?: any): IComponentInstance {
    this.checkInitialized()
    return componentRegistry.createInstance(componentId, config, data)
  }

  /**
   * 渲染组件
   */
  async renderComponent(
    componentId: string,
    container: HTMLElement,
    config: any,
    data?: any,
    rendererType: RendererType = 'vue'
  ) {
    this.checkInitialized()

    // 创建组件实例
    const instance = this.createInstance(componentId, config, data)

    // 渲染组件
    const context = await rendererManager.render(rendererType, container, instance)

    return {
      instance,
      context,
      update: (newData?: any, newConfig?: any) => {
        return rendererManager.update(context.id, newData, newConfig)
      },
      destroy: () => {
        return rendererManager.destroy(context.id)
      }
    }
  }

  /**
   * 搜索组件
   */
  searchComponents(query: string) {
    this.checkInitialized()
    return componentRegistry.search(query)
  }

  /**
   * 按分类获取组件
   */
  getComponentsByCategory(category: string) {
    this.checkInitialized()
    return componentRegistry.getByCategory(category)
  }

  /**
   * 动态加载组件
   */
  async loadComponent(componentId: string) {
    this.checkInitialized()
    return componentLoader.load(componentId)
  }

  /**
   * 预加载组件
   */
  async preloadComponents(componentIds: string[]) {
    this.checkInitialized()
    return componentLoader.preload(componentIds)
  }

  /**
   * 转换数据
   */
  transformData(rawData: any, sourceType: string = 'generic') {
    switch (sourceType) {
      case 'device':
        return dataTransform.transformDeviceData(rawData)
      case 'system':
        return dataTransform.transformSystemData(rawData)
      case 'api':
        return dataTransform.transformApiData(rawData)
      case 'mock':
        return dataTransform.transformMockData(rawData)
      default:
        return dataTransform.transformGenericData(rawData, sourceType)
    }
  }

  /**
   * 获取系统统计信息
   */
  getSystemStats() {
    this.checkInitialized()
    return {
      components: componentRegistry.getStats(),
      loader: componentLoader.getCacheStats(),
      renderer: rendererManager.getStats(),
      initialized: this.initialized
    }
  }

  /**
   * 清理系统资源
   */
  cleanup() {
    if (!this.initialized) {
      return
    }

    rendererManager.cleanup()
    componentLoader.clearCache()

    // 清理全局调试对象
    if (typeof window !== 'undefined' && (window as any).Card2Debug) {
      delete (window as any).Card2Debug
    }

    this.initialized = false
    console.log('Card 2.0 系统已清理')
  }

  /**
   * 检查是否已初始化
   */
  private checkInitialized() {
    if (!this.initialized) {
      throw new Error('Card 2.0 系统尚未初始化，请先调用 initialize() 方法')
    }
  }

  /**
   * 获取初始化状态
   */
  isInitialized() {
    return this.initialized
  }
}

// 创建默认实例
export const card2 = new Card2API()

// 默认导出
export default card2

/**
 * 快速初始化函数
 */
export async function initializeCard2(options?: Parameters<Card2API['initialize']>[0]) {
  await card2.initialize(options)
  return card2
}

/**
 * 快速渲染函数
 */
export async function renderCard(
  componentId: string,
  container: HTMLElement,
  config: any,
  data?: any,
  rendererType: RendererType = 'vue'
) {
  if (!card2.isInitialized()) {
    await card2.initialize()
  }

  return card2.renderComponent(componentId, container, config, data, rendererType)
}

/**
 * 类型守卫函数
 */
export function isComponentDefinition(obj: any): obj is IComponentDefinition {
  return (
    obj &&
    typeof obj === 'object' &&
    obj.meta &&
    typeof obj.meta.id === 'string' &&
    typeof obj.meta.name === 'string' &&
    obj.logic &&
    obj.views &&
    obj.config
  )
}

export function isComponentInstance(obj: any): obj is IComponentInstance {
  return (
    obj &&
    typeof obj === 'object' &&
    typeof obj.id === 'string' &&
    obj.definition &&
    isComponentDefinition(obj.definition)
  )
}
