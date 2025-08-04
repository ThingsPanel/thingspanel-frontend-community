/**
 * Card2.1 组件注册表
 * 简单的组件管理
 */

import type { IComponentDefinition, IComponentRegistry } from './types'

class ComponentRegistry implements IComponentRegistry {
  private components: Map<string, IComponentDefinition> = new Map()

  register(id: string, definition: IComponentDefinition) {
    if (this.components.has(id)) {
      console.warn(`组件 "${id}" 已被注册，将覆盖现有组件。`)
    }
    this.components.set(id, definition)
    console.log(`[Card2.1] 注册组件: ${id} (${definition.meta.title})`)
  }

  get(id: string): IComponentDefinition | undefined {
    return this.components.get(id)
  }

  getAll(): IComponentDefinition[] {
    return Array.from(this.components.values())
  }

  has(id: string): boolean {
    return this.components.has(id)
  }
}

// 创建全局单例
export const componentRegistry = new ComponentRegistry()
