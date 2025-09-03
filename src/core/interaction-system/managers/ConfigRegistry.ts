/**
 * 配置组件注册表
 * 用于管理 Card 2.1 组件的自定义配置面板
 */

import type { IConfigComponent } from '@/card2.1/core'

interface ConfigComponentRegistration {
  componentId: string
  configComponent: IConfigComponent
}

class ConfigRegistry {
  private registry = new Map<string, IConfigComponent>()

  /**
   * 注册配置组件
   */
  register(componentId: string, configComponent: IConfigComponent) {
    this.registry.set(componentId, configComponent)
  }

  /**
   * 获取配置组件
   */
  get(componentId: string): IConfigComponent | undefined {
    return this.registry.get(componentId)
  }

  /**
   * 检查是否有自定义配置组件
   */
  has(componentId: string): boolean {
    return this.registry.has(componentId)
  }

  /**
   * 获取所有注册的配置组件
   */
  getAll(): ConfigComponentRegistration[] {
    return Array.from(this.registry.entries()).map(([componentId, configComponent]) => ({
      componentId,
      configComponent
    }))
  }

  /**
   * 清除所有注册
   */
  clear() {
    this.registry.clear()
  }

  /**
   * 移除指定组件的配置
   */
  unregister(componentId: string) {
    return this.registry.delete(componentId)
  }
}

// 导出单例
export const configRegistry = new ConfigRegistry()

export default configRegistry
