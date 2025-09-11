/**
 * 组件动态加载器
 * 实现组件的懒加载和缓存管理
 */

import type { IComponentLoader, IComponentDefinition } from '../types/component'
import { componentRegistry } from './index'

/**
 * 加载状态类型
 */
type LoadingState = 'loading' | 'loaded' | 'error' | 'not-found'

/**
 * 组件加载器实现类
 */
export class ComponentLoader implements IComponentLoader {
  /** 加载状态缓存 */
  private loadingStates = new Map<string, LoadingState>()
  /** 加载Promise缓存 */
  private loadingPromises = new Map<string, Promise<IComponentDefinition>>()
  /** 错误信息缓存 */
  private errors = new Map<string, Error>()
  /** 组件路径映射 */
  private componentPaths = new Map<string, string>()

  constructor() {
    this.initializeComponentPaths()
  }

  /**
   * 动态加载组件
   * @param componentId 组件ID
   * @returns 组件定义Promise
   */
  async load(componentId: string): Promise<IComponentDefinition> {
    // 检查是否已经加载
    const existingDefinition = componentRegistry.getDefinition(componentId)
    if (existingDefinition) {
      this.loadingStates.set(componentId, 'loaded')
      return existingDefinition
    }

    // 检查是否正在加载
    const existingPromise = this.loadingPromises.get(componentId)
    if (existingPromise) {
      return existingPromise
    }

    // 开始加载
    this.loadingStates.set(componentId, 'loading')

    const loadPromise = this.performLoad(componentId)
    this.loadingPromises.set(componentId, loadPromise)

    try {
      const definition = await loadPromise
      this.loadingStates.set(componentId, 'loaded')
      this.loadingPromises.delete(componentId)
      this.errors.delete(componentId)

      // 注册到组件注册表
      componentRegistry.register(definition)

      if (process.env.NODE_ENV === 'development') {
        console.log(`[ComponentLoader] 组件 ${componentId} 加载成功`)
      }
      return definition
    } catch (error) {
      this.loadingStates.set(componentId, 'error')
      this.loadingPromises.delete(componentId)
      this.errors.set(componentId, error as Error)

      console.error(`[ComponentLoader] 组件 ${componentId} 加载失败:`, error)
      throw error
    }
  }

  /**
   * 预加载组件
   * @param componentIds 组件ID数组
   */
  async preload(componentIds: string[]): Promise<void> {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[ComponentLoader] 开始预加载 ${componentIds.length} 个组件`)
    }

    const loadPromises = componentIds.map(async componentId => {
      try {
        await this.load(componentId)
      } catch (error) {
        console.warn(`[ComponentLoader] 预加载组件 ${componentId} 失败:`, error)
      }
    })

    await Promise.allSettled(loadPromises)
    if (process.env.NODE_ENV === 'development') {
      console.log('[ComponentLoader] 预加载完成')
    }
  }

  /**
   * 卸载组件
   * @param componentId 组件ID
   */
  unload(componentId: string): void {
    // 从注册表中注销
    componentRegistry.unregister(componentId)

    // 清理加载状态
    this.loadingStates.delete(componentId)
    this.loadingPromises.delete(componentId)
    this.errors.delete(componentId)

    if (process.env.NODE_ENV === 'development') {
      console.log(`[ComponentLoader] 组件 ${componentId} 已卸载`)
    }
  }

  /**
   * 获取加载状态
   * @param componentId 组件ID
   * @returns 加载状态
   */
  getLoadingState(componentId: string): LoadingState {
    return this.loadingStates.get(componentId) || 'not-found'
  }

  /**
   * 清理缓存
   */
  clearCache(): void {
    this.loadingStates.clear()
    this.loadingPromises.clear()
    this.errors.clear()
    if (process.env.NODE_ENV === 'development') {
      console.log('[ComponentLoader] 缓存已清理')
    }
  }

  /**
   * 获取错误信息
   * @param componentId 组件ID
   * @returns 错误信息或null
   */
  getError(componentId: string): Error | null {
    return this.errors.get(componentId) || null
  }

  /**
   * 获取加载统计信息
   * @returns 统计信息
   */
  getStats() {
    const states = Array.from(this.loadingStates.values())
    return {
      total: this.loadingStates.size,
      loading: states.filter(s => s === 'loading').length,
      loaded: states.filter(s => s === 'loaded').length,
      error: states.filter(s => s === 'error').length,
      notFound: states.filter(s => s === 'not-found').length
    }
  }

  /**
   * 执行实际的加载操作
   * @param componentId 组件ID
   * @returns 组件定义Promise
   */
  private async performLoad(componentId: string): Promise<IComponentDefinition> {
    const componentPath = this.componentPaths.get(componentId)

    if (!componentPath) {
      throw new Error(`未找到组件 ${componentId} 的路径配置`)
    }

    try {
      // 动态导入组件模块
      const module = await import(componentPath)
      const definition = module.default || module

      // 验证组件定义
      this.validateLoadedDefinition(definition, componentId)

      return definition
    } catch (error) {
      if (error instanceof Error && error.message.includes('Cannot resolve module')) {
        this.loadingStates.set(componentId, 'not-found')
        throw new Error(`组件文件不存在: ${componentPath}`)
      }
      throw error
    }
  }

  /**
   * 验证加载的组件定义
   * @param definition 组件定义
   * @param componentId 组件ID
   */
  private validateLoadedDefinition(definition: any, componentId: string): void {
    if (!definition) {
      throw new Error(`组件 ${componentId} 导出为空`)
    }

    if (!definition.meta || !definition.logic || !definition.views) {
      throw new Error(`组件 ${componentId} 定义不完整，缺少必要的 meta、logic 或 views 属性`)
    }

    if (definition.meta.id !== componentId) {
      throw new Error(`组件 ${componentId} 的 meta.id 与文件名不匹配`)
    }
  }

  /**
   * 初始化组件路径映射
   */
  private initializeComponentPaths(): void {
    // Chart组件路径映射
    const chartComponents = [
      'chart-bar',
      'chart-curve',
      'chart-table',
      'chart-digit',
      'chart-switch',
      'chart-text-info',
      'chart-video-player',
      'chart-instrument-panel',
      'chart-state',
      'chart-enum-control',
      'chart-digit-setter',
      'chart-dispatch',
      'chart-demo'
    ]

    chartComponents.forEach(componentId => {
      const componentName = componentId.replace('chart-', '')
      this.componentPaths.set(componentId, `@/card/components/chart/${componentName}/index.ts`)
    })

    // Builtin组件路径映射
    const builtinComponents = [
      'access-num',
      'alarm-count',
      'alarm-info',
      'cpu-usage',
      'memory-usage',
      'disk-usage',
      'online-trend',
      'tenant-count',
      'system-metrics-history',
      'version-info',
      'news-info',
      'recently-visited',
      'reported-data',
      'tenant-chart',
      'operation-guide',
      'app-download',
      'online-status',
      'offline-status'
    ]

    builtinComponents.forEach(componentId => {
      const componentName = componentId.replace(/-/g, '-')
      this.componentPaths.set(componentId, `@/card/components/builtin/${componentName}/index.ts`)
    })

    if (process.env.NODE_ENV === 'development') {
      console.log(`[ComponentLoader] 初始化了 ${this.componentPaths.size} 个组件路径映射`)
    }
  }

  /**
   * 注册自定义组件路径
   * @param componentId 组件ID
   * @param path 组件路径
   */
  registerComponentPath(componentId: string, path: string): void {
    this.componentPaths.set(componentId, path)
    if (process.env.NODE_ENV === 'development') {
      console.log(`[ComponentLoader] 注册自定义组件路径: ${componentId} -> ${path}`)
    }
  }

  /**
   * 批量注册组件路径
   * @param pathMap 路径映射
   */
  registerComponentPaths(pathMap: Record<string, string>): void {
    Object.entries(pathMap).forEach(([componentId, path]) => {
      this.componentPaths.set(componentId, path)
    })
    if (process.env.NODE_ENV === 'development') {
      console.log(`[ComponentLoader] 批量注册了 ${Object.keys(pathMap).length} 个组件路径`)
    }
  }
}

// 创建全局加载器实例
export const componentLoader = new ComponentLoader()

// 导出加载器类型
export type { IComponentLoader }
