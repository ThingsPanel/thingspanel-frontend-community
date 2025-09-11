/**
 * Card2.1 组件注册表
 * 简单的组件管理
 */

import type { ComponentDefinition, IComponentRegistry } from '@/card2.1/core/types'

class ComponentRegistry implements IComponentRegistry {
  private components: Map<string, ComponentDefinition> = new Map()

  register(id: string, definition: ComponentDefinition) {
    this.components.set(id, definition)
  }

  get(id: string): ComponentDefinition | undefined {
    return this.components.get(id)
  }

  getAll(): ComponentDefinition[] {
    const components = Array.from(this.components.values())
    // 🔥 性能优化：仅在开发环境输出详细日志
    return components
  }

  has(id: string): boolean {
    return this.components.has(id)
  }
}

// 创建全局单例
export const componentRegistry = new ComponentRegistry()
