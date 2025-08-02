/**
 * 组件加载器实现
 * 提供组件的动态加载、预加载、缓存管理等功能
 */

import type { IComponentDefinition, IComponentLoader } from '../types/component'
import { componentRegistry } from './index'

/**
 * 组件加载状态
 */
type LoadingState = 'loading' | 'loaded' | 'error' | 'not-found'

/**
 * 组件加载器实现
 */
export class ComponentLoader implements IComponentLoader {
  private loadingStates = new Map<string, LoadingState>()
  private loadingPromises = new Map<string, Promise<IComponentDefinition>>()
  private cache = new Map<string, IComponentDefinition>()
  private componentPaths = new Map<string, string>()

  constructor() {
    this.initializeComponentPaths()
  }

  /**
   * 初始化组件路径映射
   */
  private initializeComponentPaths() {
    // 内置组件路径
    const builtinComponents = [
      'text-display',
      'number-display',
      'status-indicator',
      'progress-bar',
      'gauge-chart',
      'switch-control',
      'button-control',
      'slider-control',
      'input-control'
    ]

    builtinComponents.forEach(id => {
      this.componentPaths.set(id, `../components/builtin/${id}/index.ts`)
    })

    // 图表组件路径
    const chartComponents = [
      'bar-chart',
      'line-chart',
      'pie-chart',
      'scatter-chart',
      'area-chart',
      'radar-chart',
      'heatmap-chart',
      'treemap-chart',
      'sankey-chart',
      'funnel-chart'
    ]

    chartComponents.forEach(id => {
      this.componentPaths.set(id, `../components/chart/${id}/index.ts`)
    })

    // 设备组件路径
    const deviceComponents = ['device-status', 'device-control', 'device-monitor', 'device-alarm']

    deviceComponents.forEach(id => {
      this.componentPaths.set(id, `../components/device/${id}/index.ts`)
    })

    // 插件组件路径（动态加载）
    // 插件组件将通过API获取路径信息
  }

  async load(componentId: string): Promise<IComponentDefinition> {
    // 检查缓存
    if (this.cache.has(componentId)) {
      this.loadingStates.set(componentId, 'loaded')
      return this.cache.get(componentId)!
    }

    // 检查是否正在加载
    if (this.loadingPromises.has(componentId)) {
      return this.loadingPromises.get(componentId)!
    }

    // 开始加载
    this.loadingStates.set(componentId, 'loading')

    const loadPromise = this.doLoad(componentId)
    this.loadingPromises.set(componentId, loadPromise)

    try {
      const definition = await loadPromise
      this.cache.set(componentId, definition)
      this.loadingStates.set(componentId, 'loaded')

      // 注册到组件注册表
      componentRegistry.register(definition)

      return definition
    } catch (error) {
      this.loadingStates.set(componentId, 'error')
      console.error(`组件 ${componentId} 加载失败:`, error)
      throw error
    } finally {
      this.loadingPromises.delete(componentId)
    }
  }

  private async doLoad(componentId: string): Promise<IComponentDefinition> {
    const componentPath = this.componentPaths.get(componentId)

    if (!componentPath) {
      // 尝试从API获取插件组件信息
      const pluginInfo = await this.loadPluginComponent(componentId)
      if (pluginInfo) {
        return pluginInfo
      }

      this.loadingStates.set(componentId, 'not-found')
      throw new Error(`组件 ${componentId} 未找到`)
    }

    try {
      // 动态导入组件模块
      const module = await import(componentPath)

      // 获取默认导出或命名导出
      const definition = module.default || module[componentId] || module.definition

      if (!definition) {
        throw new Error(`组件模块 ${componentPath} 没有有效的导出`)
      }

      // 验证组件定义
      const validationResult = componentRegistry.validateDefinition(definition)
      if (validationResult !== true) {
        throw new Error(`组件定义验证失败: ${validationResult}`)
      }

      return definition
    } catch (error) {
      console.error(`加载组件模块 ${componentPath} 失败:`, error)
      throw error
    }
  }

  private async loadPluginComponent(componentId: string): Promise<IComponentDefinition | null> {
    try {
      // 这里应该调用API获取插件组件信息
      // 暂时返回null，表示未找到
      console.warn(`插件组件 ${componentId} 加载功能尚未实现`)
      return null
    } catch (error) {
      console.error(`加载插件组件 ${componentId} 失败:`, error)
      return null
    }
  }

  async preload(componentIds: string[]): Promise<void> {
    const loadPromises = componentIds.map(id =>
      this.load(id).catch(error => {
        console.warn(`预加载组件 ${id} 失败:`, error)
        return null
      })
    )

    await Promise.all(loadPromises)
    console.log(`预加载完成，成功加载 ${componentIds.length} 个组件`)
  }

  unload(componentId: string): void {
    // 从缓存中移除
    this.cache.delete(componentId)

    // 重置加载状态
    this.loadingStates.delete(componentId)

    // 取消正在进行的加载
    this.loadingPromises.delete(componentId)

    // 从注册表中注销
    componentRegistry.unregister(componentId)

    console.log(`组件 ${componentId} 已卸载`)
  }

  getLoadingState(componentId: string): LoadingState {
    return this.loadingStates.get(componentId) || 'not-found'
  }

  clearCache(): void {
    this.cache.clear()
    this.loadingStates.clear()
    this.loadingPromises.clear()
    console.log('组件缓存已清理')
  }

  /**
   * 获取缓存统计信息
   */
  getCacheStats() {
    return {
      cached: this.cache.size,
      loading: Array.from(this.loadingStates.values()).filter(state => state === 'loading').length,
      loaded: Array.from(this.loadingStates.values()).filter(state => state === 'loaded').length,
      error: Array.from(this.loadingStates.values()).filter(state => state === 'error').length,
      notFound: Array.from(this.loadingStates.values()).filter(state => state === 'not-found').length
    }
  }

  /**
   * 添加组件路径映射
   */
  addComponentPath(componentId: string, path: string): void {
    this.componentPaths.set(componentId, path)
  }

  /**
   * 移除组件路径映射
   */
  removeComponentPath(componentId: string): void {
    this.componentPaths.delete(componentId)
  }

  /**
   * 获取所有组件路径
   */
  getAllComponentPaths(): Record<string, string> {
    return Object.fromEntries(this.componentPaths)
  }

  /**
   * 批量加载组件
   */
  async loadBatch(componentIds: string[]): Promise<{
    success: IComponentDefinition[]
    failed: { id: string; error: Error }[]
  }> {
    const results = await Promise.allSettled(componentIds.map(async id => ({ id, definition: await this.load(id) })))

    const success: IComponentDefinition[] = []
    const failed: { id: string; error: Error }[] = []

    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        success.push(result.value.definition)
      } else {
        failed.push({
          id: componentIds[index],
          error: result.reason
        })
      }
    })

    return { success, failed }
  }
}

// 导出单例实例
export const componentLoader = new ComponentLoader()
