/**
 * Renderer Auto Registry
 * 渲染器自动注册系统，通过约定自动发现和注册渲染器
 *
 * 约定：
 * 1. 每个渲染器目录必须包含 index.ts 文件
 * 2. index.ts 必须导出 RendererClass 和 RendererInfo
 * 3. 渲染器目录名即为渲染器ID
 */

import type { RendererConstructor, RendererInfo } from '../types/renderer'
import type { RendererFactory } from './RendererFactory'

/**
 * 渲染器模块接口
 * 每个渲染器的 index.ts 必须实现此接口
 */
export interface RendererModule {
  /** 渲染器类 */
  RendererClass: RendererConstructor
  /** 渲染器信息 */
  RendererInfo: RendererInfo
  /** 是否启用（可选，默认true） */
  enabled?: boolean
}

/**
 * 渲染器配置接口
 */
export interface RendererConfig {
  /** 渲染器ID */
  id: string
  /** 渲染器模块 */
  module: () => Promise<RendererModule>
  /** 是否启用 */
  enabled?: boolean
}

/**
 * 渲染器自动注册类
 */
export class RendererAutoRegistry {
  private rendererConfigs: RendererConfig[] = []
  private loadedModules = new Map<string, RendererModule>()
  private factory: RendererFactory | null = null

  /**
   * 设置渲染器工厂
   */
  setFactory(factory: RendererFactory): void {
    this.factory = factory
  }

  /**
   * 添加渲染器配置
   */
  addRenderer(config: RendererConfig): void {
    // 检查是否已存在
    const existingIndex = this.rendererConfigs.findIndex(r => r.id === config.id)
    if (existingIndex >= 0) {
      console.warn(`渲染器 ${config.id} 已存在，将被覆盖`)
      this.rendererConfigs[existingIndex] = config
    } else {
      this.rendererConfigs.push(config)
    }
  }

  /**
   * 批量添加渲染器配置
   */
  addRenderers(configs: RendererConfig[]): void {
    configs.forEach(config => this.addRenderer(config))
  }

  /**
   * 移除渲染器配置
   */
  removeRenderer(id: string): boolean {
    const index = this.rendererConfigs.findIndex(r => r.id === id)
    if (index >= 0) {
      this.rendererConfigs.splice(index, 1)
      this.loadedModules.delete(id)
      return true
    }
    return false
  }

  /**
   * 获取所有渲染器配置
   */
  getConfigs(): RendererConfig[] {
    return [...this.rendererConfigs]
  }

  /**
   * 获取启用的渲染器配置
   */
  getEnabledConfigs(): RendererConfig[] {
    return this.rendererConfigs.filter(config => config.enabled !== false)
  }

  /**
   * 异步加载渲染器模块
   */
  async loadRenderer(id: string): Promise<RendererModule | null> {
    // 检查是否已加载
    if (this.loadedModules.has(id)) {
      return this.loadedModules.get(id)!
    }

    const config = this.rendererConfigs.find(r => r.id === id)
    if (!config) {
      console.error(`渲染器配置 ${id} 不存在`)
      return null
    }

    try {
      console.log(`[RendererAutoRegistry] 正在加载渲染器: ${id}`)
      const module = await config.module()
      console.log(`[RendererAutoRegistry] 渲染器 ${id} 模块加载完成，开始验证...`)

      // 验证模块
      this.validateModule(module, id)
      console.log(`[RendererAutoRegistry] 渲染器 ${id} 模块验证通过`)

      // 缓存模块
      this.loadedModules.set(id, module)

      console.log(`[RendererAutoRegistry] 渲染器 ${id} 加载成功`)
      return module
    } catch (error) {
      console.error(`[RendererAutoRegistry] 加载渲染器 ${id} 失败:`, error)
      return null
    }
  }

  /**
   * 注册单个渲染器到工厂
   */
  async registerRenderer(id: string): Promise<boolean> {
    if (!this.factory) {
      console.error('渲染器工厂未设置')
      return false
    }

    const module = await this.loadRenderer(id)
    if (!module) {
      return false
    }

    try {
      this.factory.register(id, module.RendererClass)
      console.log(`渲染器 ${id} 注册成功`)
      return true
    } catch (error) {
      console.error(`注册渲染器 ${id} 失败:`, error)
      return false
    }
  }

  /**
   * 注册所有启用的渲染器
   */
  async registerAll(): Promise<{ success: string[]; failed: string[] }> {
    if (!this.factory) {
      throw new Error('渲染器工厂未设置')
    }

    const enabledConfigs = this.getEnabledConfigs()
    const success: string[] = []
    const failed: string[] = []

    console.log(`[RendererAutoRegistry] 开始注册 ${enabledConfigs.length} 个渲染器`)
    console.log(
      `[RendererAutoRegistry] 启用的渲染器配置:`,
      enabledConfigs.map(c => c.id)
    )

    // 并行加载所有渲染器
    const results = await Promise.allSettled(
      enabledConfigs.map(async config => {
        const result = await this.registerRenderer(config.id)
        return { id: config.id, success: result }
      })
    )

    // 处理结果
    results.forEach((result, index) => {
      const config = enabledConfigs[index]
      if (result.status === 'fulfilled' && result.value.success) {
        success.push(config.id)
      } else {
        failed.push(config.id)
        console.error(`渲染器 ${config.id} 注册失败`)
      }
    })

    console.log(`渲染器注册完成: 成功 ${success.length} 个，失败 ${failed.length} 个`)
    return { success, failed }
  }

  /**
   * 获取已加载的渲染器信息
   */
  getLoadedRendererInfos(): RendererInfo[] {
    const infos: RendererInfo[] = []
    this.loadedModules.forEach((module, id) => {
      infos.push({
        ...module.RendererInfo,
        id // 确保ID正确
      })
    })
    return infos
  }

  /**
   * 清除所有缓存
   */
  clear(): void {
    this.loadedModules.clear()
    this.rendererConfigs = []
  }

  /**
   * 验证渲染器模块
   */
  private validateModule(module: any, id: string): void {
    if (!module) {
      throw new Error(`渲染器模块 ${id} 为空`)
    }

    if (!module.RendererClass) {
      throw new Error(`渲染器模块 ${id} 缺少 RendererClass 导出`)
    }

    if (typeof module.RendererClass !== 'function') {
      throw new Error(`渲染器模块 ${id} 的 RendererClass 不是构造函数`)
    }

    if (!module.RendererInfo) {
      throw new Error(`渲染器模块 ${id} 缺少 RendererInfo 导出`)
    }

    if (!module.RendererInfo.id || !module.RendererInfo.name) {
      throw new Error(`渲染器模块 ${id} 的 RendererInfo 缺少必要字段`)
    }
  }
}

/**
 * 全局渲染器自动注册实例
 */
export const rendererAutoRegistry = new RendererAutoRegistry()

export default rendererAutoRegistry
