/**
 * @file WidgetRegistry - 统一组件注册中心
 * @description 负责管理编辑器中所有可用组件的定义，并提供注册、查询等功能。
 */

import type { Component } from 'vue'

/**
 * 定义了单个组件的完整信息，用于在组件库中展示和在画布上创建。
 */
export interface WidgetDefinition {
  /**
   * 组件的唯一标识符，例如 'text', 'card2-chart-bar'。
   */
  type: string

  /**
   * 在组件库中显示的名称。
   */
  name: string

  /**
   * 组件的详细描述，可以用于 tooltip 或帮助文档。
   */
  description?: string

  /**
   * 组件在组件库中显示的图标。
   * 可以是一个 Vue 组件或一个 SVG 图标名称。
   */
  icon: Component | string

  /**
   * 组件所属的分类，用于在组件库中分组。
   * 例如: 'base', 'chart', 'control'。
   */
  category: string

  /**
   * 组件所属的子分类，用于在组件库中进行更细粒度的分组。
   * 例如: 'system', 'chart', 'control'。
   */
  subCategory?: string

  /**
   * 组件的版本号，遵循语义化版本规范。
   */
  version: string

  /**
   * 组件的默认属性，当组件被拖拽到画布上时使用。
   */
  defaultProperties: Record<string, any>

  /**
   * 组件在不同渲染器中的默认布局信息。
   */
  defaultLayout: {
    // 基于像素的画布渲染器
    canvas: {
      width: number
      height: number
    }
    // 基于网格的 Gridstack 渲染器
    gridstack: {
      w: number
      h: number
    }
  }

  /**
   * 组件的元数据，用于存储额外信息。
   */
  metadata?: Record<string, any>
}

/**
 * 用于组织和展示在组件库中的组件树节点。
 */
export interface WidgetTreeNode {
  name: string
  children: WidgetDefinition[]
}

/**
 * WidgetRegistry 类，采用单例模式。
 * 负责注册、管理和提供所有组件的定义。
 */
class WidgetRegistry {
  private static instance: WidgetRegistry
  private widgets = new Map<string, WidgetDefinition>()

  private constructor() {
    // 私有构造函数，防止外部实例化
  }

  public static getInstance(): WidgetRegistry {
    if (!WidgetRegistry.instance) {
      WidgetRegistry.instance = new WidgetRegistry()
    }
    return WidgetRegistry.instance
  }

  /**
   * 注册一个或多个组件。
   * @param newWidgets - 一个或多个 WidgetDefinition 对象。
   */
  public register(...newWidgets: WidgetDefinition[]): void {
    for (const widget of newWidgets) {
      if (this.widgets.has(widget.type)) {
        console.warn(`[WidgetRegistry] 组件 "${widget.type}" 已被注册，将进行覆盖。`)
      }
      this.widgets.set(widget.type, widget)
    }
  }

  /**
   * 根据类型获取一个组件的定义。
   * @param type - 组件的唯一标识符。
   * @returns 返回组件的定义，如果未找到则返回 undefined。
   */
  public getWidget(type: string): WidgetDefinition | undefined {
    return this.widgets.get(type)
  }

  /**
   * 获取所有已注册的组件。
   * @returns 返回所有组件定义的数组。
   */
  public getAllWidgets(): WidgetDefinition[] {
    return Array.from(this.widgets.values())
  }

  /**
   * 注销指定类型的组件。
   * @param type - 组件的唯一标识符。
   * @returns 如果组件存在并被成功注销则返回 true，否则返回 false。
   */
  public unregister(type: string): boolean {
    return this.widgets.delete(type)
  }

  /**
   * 清除所有已注册的组件。
   */
  public clear(): void {
    this.widgets.clear()
  }

  /**
   * 将所有组件按分类组织成树形结构。
   * 这是为了方便在组件库 UI 中展示。
   * @returns 返回一个按分类组织的组件树。
   */
  public getWidgetTree(): WidgetTreeNode[] {
    const categoryMap = new Map<string, WidgetDefinition[]>()
    const categoryNameMap: Record<string, string> = {
      base: '基础组件',
      card21: 'Card 2.1 组件',
      chart: '图表组件',
      control: '控制组件',
      display: '显示组件',
      media: '媒体组件',
      other: '其他组件'
    }

    for (const widget of this.widgets.values()) {
      const category = widget.category || 'other'
      if (!categoryMap.has(category)) {
        categoryMap.set(category, [])
      }
      categoryMap.get(category)!.push(widget)
    }

    const tree: WidgetTreeNode[] = []
    for (const [category, widgets] of categoryMap.entries()) {
      tree.push({
        name: categoryNameMap[category] || category.charAt(0).toUpperCase() + category.slice(1),
        children: widgets
      })
    }

    return tree
  }
}

// 导出 WidgetRegistry 的单例
export const widgetRegistry = WidgetRegistry.getInstance()
