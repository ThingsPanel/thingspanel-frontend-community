/**
 * @file 卡片组件注册表
 */
import type { IComponentDefinition } from './types'

class ComponentRegistry {
  private components: Map<string, IComponentDefinition> = new Map()

  /**
   * 注册一个新组件
   * @param definition 组件定义
   */
  public register(definition: IComponentDefinition) {
    if (this.components.has(definition.id)) {
      console.warn(`组件 "${definition.id}" 已被注册，将覆盖现有组件。`)
    }
    this.components.set(definition.id, definition)
  }

  /**
   * 获取一个组件的定义
   * @param id 组件 ID
   * @returns 组件定义或 undefined
   */
  public get(id: string): IComponentDefinition | undefined {
    return this.components.get(id)
  }

  /**
   * 获取所有已注册的组件
   * @returns 所有组件定义的数组
   */
  public getAll(): IComponentDefinition[] {
    return Array.from(this.components.values())
  }

  /**
   * 按分类获取组件
   * @param category 分类名称
   * @returns 该分类下的所有组件
   */
  public getByCategory(category: string): IComponentDefinition[] {
    return this.getAll().filter(comp => comp.meta.category === category)
  }
}

// 创建一个全局唯一的注册表实例
export const componentRegistry = new ComponentRegistry()
