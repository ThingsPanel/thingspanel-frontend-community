/**
 * Vue 组件注册表
 * 维护卡片类型到 Vue 组件的映射
 */

import type { Component } from 'vue'

/**
 * Vue 组件注册表
 */
export class VueComponentRegistry {
  /** 组件映射表：卡片类型 -> Vue 组件 */
  private components: Map<string, Component> = new Map()

  /**
   * 注册 Vue 组件
   */
  register(type: string, component: Component): void {
    if (this.components.has(type)) {
      console.warn(`[VueComponentRegistry] 组件类型已存在，将被覆盖: ${type}`)
    }

    this.components.set(type, component)
  }

  /**
   * 批量注册组件
   */
  registerBatch(components: Record<string, Component>): void {
    Object.entries(components).forEach(([type, component]) => {
      this.register(type, component)
    })
  }

  /**
   * 获取组件
   */
  get(type: string): Component | undefined {
    return this.components.get(type)
  }

  /**
   * 获取所有组件类型
   */
  getAll(): string[] {
    return Array.from(this.components.keys())
  }

  /**
   * 检查组件是否存在
   */
  has(type: string): boolean {
    return this.components.has(type)
  }

  /**
   * 移除组件
   */
  remove(type: string): void {
    this.components.delete(type)
  }

  /**
   * 清空注册表
   */
  clear(): void {
    this.components.clear()
  }

  /**
   * 获取统计信息
   */
  getStats() {
    return {
      totalComponents: this.components.size,
      types: this.getAll()
    }
  }
}
