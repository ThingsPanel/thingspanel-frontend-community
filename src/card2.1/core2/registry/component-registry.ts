/**
 * Card2.1 组件注册表
 * 简化的组件注册和管理系统
 */

import type { ComponentDefinition, IComponentRegistry } from '../types'
import { propertyExposureManager } from '../property'

/**
 * 组件注册表类
 */
export class ComponentRegistry implements IComponentRegistry {
  private components = new Map<string, ComponentDefinition>()

  /**
   * 注册组件
   */
  register(definition: ComponentDefinition): void {
    if (!definition.type) {
      console.warn('❌ [ComponentRegistry] 组件注册失败：缺少 type 字段')
      return
    }

    if (this.components.has(definition.type)) {
      console.warn(`⚠️ [ComponentRegistry] 组件 ${definition.type} 已存在，将被覆盖`)
    }

    this.components.set(definition.type, definition)

    // 自动注册组件的属性白名单
    if (definition.propertyWhitelist) {
      propertyExposureManager.registerPropertyWhitelist(definition.type, definition.propertyWhitelist)
    }
  }

  /**
   * 获取组件定义
   */
  get(type: string): ComponentDefinition | undefined {
    return this.components.get(type)
  }

  /**
   * 获取所有组件
   */
  getAll(): ComponentDefinition[] {
    return Array.from(this.components.values())
  }

  /**
   * 检查组件是否存在
   */
  has(type: string): boolean {
    return this.components.has(type)
  }

  /**
   * 清空注册表
   */
  clear(): void {
    this.components.clear()
  }

  /**
   * 获取组件的数据源键列表
   */
  getDataSourceKeys(type: string): string[] {
    const definition = this.get(type)
    if (!definition?.dataSources) {
      return []
    }
    return definition.dataSources.map(ds => ds.key)
  }

  /**
   * 获取组件的静态参数键列表
   */
  getStaticParamKeys(type: string): string[] {
    const definition = this.get(type)
    if (!definition?.staticParams) {
      return []
    }
    return Object.keys(definition.staticParams)
  }

  /**
   * 获取注册统计信息
   */
  getStats() {
    const components = this.getAll()
    const multiDataSourceComponents = components.filter(
      comp => comp.dataSources && comp.dataSources.length > 1
    ).length

    return {
      totalComponents: components.length,
      componentTypes: components.map(c => c.type),
      multiDataSourceComponents,
      categories: Array.from(new Set(components.map(c => c.mainCategory).filter(Boolean)))
    }
  }

  /**
   * 获取组件树结构
   */
  getComponentTree() {
    const components = this.getAll()

    // 构建分类树
    const categories: any[] = []
    const categoryMap = new Map<string, any>()

    components.forEach(component => {
      const mainCategory = component.mainCategory || 'categories.chart'
      const subCategory = component.subCategory

      if (!categoryMap.has(mainCategory)) {
        const mainCat = { id: mainCategory, name: mainCategory, children: [] }
        categoryMap.set(mainCategory, mainCat)
        categories.push(mainCat)
      }

      if (subCategory) {
        const mainCat = categoryMap.get(mainCategory)!
        if (!mainCat.children.find((child: any) => child.id === subCategory)) {
          mainCat.children.push({ id: subCategory, name: subCategory })
        }
      }
    })

    return {
      categories,
      components,
      totalCount: components.length
    }
  }
}

/**
 * 全局组件注册表实例
 */
export const componentRegistry = new ComponentRegistry()

/**
 * 默认导出
 */
export default componentRegistry