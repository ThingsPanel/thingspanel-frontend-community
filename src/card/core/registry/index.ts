/**
 * 组件注册表实现
 * 提供组件的注册、查找和管理功能
 */

import type { IComponentRegistry, IComponentDefinition, RendererType } from '../types/component'
import type { IComponentMeta } from '../types/index'

/**
 * 组件注册表实现类
 */
export class ComponentRegistry implements IComponentRegistry {
  /** 组件定义存储 */
  private definitions = new Map<string, IComponentDefinition>()
  /** 类型索引 */
  private typeIndex = new Map<string, Set<string>>()
  /** 渲染器索引 */
  private rendererIndex = new Map<RendererType, Set<string>>()

  /**
   * 注册组件
   * @param definition 组件定义
   */
  register(definition: IComponentDefinition): void {
    const { meta } = definition

    // 验证组件定义
    this.validateDefinition(definition)

    // 存储组件定义
    this.definitions.set(meta.id, definition)

    // 更新类型索引
    if (!this.typeIndex.has(meta.type)) {
      this.typeIndex.set(meta.type, new Set())
    }
    this.typeIndex.get(meta.type)!.add(meta.id)

    // 更新渲染器索引
    meta.supportedRenderers.forEach(rendererType => {
      if (!this.rendererIndex.has(rendererType)) {
        this.rendererIndex.set(rendererType, new Set())
      }
      this.rendererIndex.get(rendererType)!.add(meta.id)
    })

    if (process.env.NODE_ENV === 'development') {
    }
  }

  /**
   * 注销组件
   * @param componentId 组件ID
   */
  unregister(componentId: string): void {
    const definition = this.definitions.get(componentId)
    if (!definition) {
      console.error(`[ComponentRegistry] 组件 ${componentId} 不存在，无法注销`)
      return
    }

    const { meta } = definition

    // 从主存储中移除
    this.definitions.delete(componentId)

    // 从类型索引中移除
    const typeSet = this.typeIndex.get(meta.type)
    if (typeSet) {
      typeSet.delete(componentId)
      if (typeSet.size === 0) {
        this.typeIndex.delete(meta.type)
      }
    }

    // 从渲染器索引中移除
    meta.supportedRenderers.forEach(rendererType => {
      const rendererSet = this.rendererIndex.get(rendererType)
      if (rendererSet) {
        rendererSet.delete(componentId)
        if (rendererSet.size === 0) {
          this.rendererIndex.delete(rendererType)
        }
      }
    })

    if (process.env.NODE_ENV === 'development') {
    }
  }

  /**
   * 获取组件定义
   * @param componentId 组件ID
   * @returns 组件定义或null
   */
  getDefinition(componentId: string): IComponentDefinition | null {
    return this.definitions.get(componentId) || null
  }

  /**
   * 获取所有组件定义
   * @returns 所有组件定义数组
   */
  getAllDefinitions(): IComponentDefinition[] {
    return Array.from(this.definitions.values())
  }

  /**
   * 按类型获取组件
   * @param type 组件类型
   * @returns 该类型的所有组件定义
   */
  getByType(type: string): IComponentDefinition[] {
    const componentIds = this.typeIndex.get(type)
    if (!componentIds) {
      return []
    }

    return Array.from(componentIds)
      .map(id => this.definitions.get(id)!)
      .filter(Boolean)
  }

  /**
   * 按渲染器获取组件
   * @param rendererType 渲染器类型
   * @returns 支持该渲染器的所有组件定义
   */
  getByRenderer(rendererType: RendererType): IComponentDefinition[] {
    const componentIds = this.rendererIndex.get(rendererType)
    if (!componentIds) {
      return []
    }

    return Array.from(componentIds)
      .map(id => this.definitions.get(id)!)
      .filter(Boolean)
  }

  /**
   * 检查组件是否存在
   * @param componentId 组件ID
   * @returns 是否存在
   */
  has(componentId: string): boolean {
    return this.definitions.has(componentId)
  }

  /**
   * 清空注册表
   */
  clear(): void {
    this.definitions.clear()
    this.typeIndex.clear()
    this.rendererIndex.clear()
    if (process.env.NODE_ENV === 'development') {
    }
  }

  /**
   * 获取注册表统计信息
   * @returns 统计信息
   */
  getStats() {
    return {
      totalComponents: this.definitions.size,
      typeCount: this.typeIndex.size,
      rendererCount: this.rendererIndex.size,
      types: Array.from(this.typeIndex.keys()),
      renderers: Array.from(this.rendererIndex.keys())
    }
  }

  /**
   * 搜索组件
   * @param query 搜索条件
   * @returns 匹配的组件定义
   */
  search(query: { name?: string; type?: string; renderer?: RendererType; keyword?: string }): IComponentDefinition[] {
    let results = this.getAllDefinitions()

    // 按名称过滤
    if (query.name) {
      results = results.filter(def => def.meta.name.toLowerCase().includes(query.name!.toLowerCase()))
    }

    // 按类型过滤
    if (query.type) {
      results = results.filter(def => def.meta.type === query.type)
    }

    // 按渲染器过滤
    if (query.renderer) {
      results = results.filter(def => def.meta.supportedRenderers.includes(query.renderer!))
    }

    // 按关键词过滤
    if (query.keyword) {
      const keyword = query.keyword.toLowerCase()
      results = results.filter(
        def =>
          def.meta.name.toLowerCase().includes(keyword) ||
          def.meta.description?.toLowerCase().includes(keyword) ||
          def.meta.type.toLowerCase().includes(keyword)
      )
    }

    return results
  }

  /**
   * 验证组件定义
   * @param definition 组件定义
   */
  private validateDefinition(definition: IComponentDefinition): void {
    const { meta, logic, views } = definition

    // 验证元数据
    if (!meta.id || !meta.name || !meta.type) {
      throw new Error('组件元数据不完整：缺少id、name或type')
    }

    // 验证ID唯一性
    if (this.definitions.has(meta.id)) {
      throw new Error(`组件ID ${meta.id} 已存在`)
    }

    // 验证逻辑Hook
    if (typeof logic !== 'function') {
      throw new Error('组件逻辑Hook必须是函数')
    }

    // 验证视图映射
    if (!views || Object.keys(views).length === 0) {
      throw new Error('组件必须至少提供一个视图实现')
    }

    // 验证支持的渲染器与视图映射一致
    meta.supportedRenderers.forEach(renderer => {
      if (!views[renderer]) {
        throw new Error(`组件声明支持渲染器 ${renderer}，但未提供对应的视图实现`)
      }
    })
  }
}

// 创建全局注册表实例
export const componentRegistry = new ComponentRegistry()

// 导出注册表类型
export type { IComponentRegistry }
