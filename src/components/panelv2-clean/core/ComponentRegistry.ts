/**
 * @file 组件注册中心
 * @description 管理所有可用组件的注册、查询和分类
 */

import { reactive, ref } from 'vue'
import type { ComponentDefinition } from '../types/core'

/**
 * 组件树节点接口
 */
export interface ComponentTreeNode {
  /** 节点ID */
  id: string
  /** 节点名称 */
  name: string
  /** 节点类型 */
  type: 'category' | 'component'
  /** 图标 */
  icon?: string
  /** 子节点 */
  children?: ComponentTreeNode[]
  /** 组件定义（仅叶子节点） */
  componentDef?: ComponentDefinition
}

/**
 * 组件注册中心类
 */
export class ComponentRegistry {
  /** 组件映射表 */
  private components = new Map<string, ComponentDefinition>()

  /** 分类映射表 */
  private categories = new Map<string, ComponentTreeNode>()

  /** 树形数据 */
  private treeData = ref<ComponentTreeNode[]>([])

  /** 统计信息 */
  private stats = reactive({
    totalComponents: 0,
    totalCategories: 0
  })

  constructor() {
    console.log('ComponentRegistry: 组件注册中心已初始化')
  }

  /**
   * 注册单个组件
   */
  register(component: ComponentDefinition): void {
    // 验证组件定义
    if (!component.type || !component.name) {
      throw new Error('组件定义不完整: 缺少type或name')
    }

    if (this.components.has(component.type)) {
      console.warn(`ComponentRegistry: 组件 "${component.type}" 已存在，将被覆盖`)
    }

    // 注册组件
    this.components.set(component.type, component)
    this.stats.totalComponents = this.components.size

    // 更新树形结构
    this.updateTreeStructure()

    console.log(`ComponentRegistry: 组件 "${component.type}" 注册成功`)
  }

  /**
   * 批量注册组件
   */
  batchRegister(components: ComponentDefinition[]): void {
    components.forEach(component => {
      try {
        this.register(component)
      } catch (error) {
        console.error(`ComponentRegistry: 注册组件 "${component.type}" 失败`, error)
      }
    })
  }

  /**
   * 获取单个组件
   */
  getComponent(type: string): ComponentDefinition | null {
    return this.components.get(type) || null
  }

  /**
   * 按分类获取组件
   */
  getComponentsByCategory(categoryId: string): ComponentDefinition[] {
    return Array.from(this.components.values()).filter(component => component.category === categoryId)
  }

  /**
   * 获取所有组件
   */
  getAllComponents(): ComponentDefinition[] {
    return Array.from(this.components.values())
  }

  /**
   * 获取树形数据
   */
  getTreeData(): ComponentTreeNode[] {
    return this.treeData.value
  }

  /**
   * 搜索组件
   */
  searchComponents(keyword: string): ComponentDefinition[] {
    if (!keyword.trim()) return this.getAllComponents()

    const lowercaseKeyword = keyword.toLowerCase()
    return Array.from(this.components.values()).filter(component => {
      return (
        component.name.toLowerCase().includes(lowercaseKeyword) ||
        component.type.toLowerCase().includes(lowercaseKeyword) ||
        component.meta.description?.toLowerCase().includes(lowercaseKeyword) ||
        component.meta.keywords?.some(kw => kw.toLowerCase().includes(lowercaseKeyword))
      )
    })
  }

  /**
   * 获取统计信息
   */
  getStats() {
    return {
      ...this.stats,
      categories: Array.from(this.categories.keys())
    }
  }

  /**
   * 清空所有组件
   */
  clear(): void {
    this.components.clear()
    this.categories.clear()
    this.treeData.value = []
    this.stats.totalComponents = 0
    this.stats.totalCategories = 0
    console.log('ComponentRegistry: 所有组件已清空')
  }

  // ==================== 私有方法 ====================

  /**
   * 更新树形结构
   */
  private updateTreeStructure(): void {
    const categoryMap = new Map<string, ComponentTreeNode>()

    // 收集所有分类
    this.components.forEach(component => {
      const categoryId = component.category
      if (!categoryMap.has(categoryId)) {
        categoryMap.set(categoryId, {
          id: categoryId,
          name: this.getCategoryDisplayName(categoryId),
          type: 'category',
          icon: this.getCategoryIcon(categoryId),
          children: []
        })
      }
    })

    // 为每个分类添加组件
    this.components.forEach(component => {
      const categoryNode = categoryMap.get(component.category)
      if (categoryNode) {
        const componentNode: ComponentTreeNode = {
          id: component.type,
          name: component.name,
          type: 'component',
          icon: component.meta.icon,
          componentDef: component
        }
        categoryNode.children!.push(componentNode)
      }
    })

    // 排序并更新
    const sortedCategories = Array.from(categoryMap.values()).sort((a, b) => {
      return this.getCategoryOrder(a.id) - this.getCategoryOrder(b.id)
    })

    // 对每个分类内的组件进行排序
    sortedCategories.forEach(category => {
      if (category.children) {
        category.children.sort((a, b) => a.name.localeCompare(b.name))
      }
    })

    this.treeData.value = sortedCategories
    this.categories = categoryMap
    this.stats.totalCategories = categoryMap.size
  }

  /**
   * 获取分类显示名称
   */
  private getCategoryDisplayName(categoryId: string): string {
    const displayNames: Record<string, string> = {
      basic: '基础组件',
      chart: '图表组件',
      form: '表单组件',
      layout: '布局组件',
      advanced: '高级组件',
      custom: '自定义组件'
    }
    return displayNames[categoryId] || categoryId
  }

  /**
   * 获取分类图标
   */
  private getCategoryIcon(categoryId: string): string {
    const categoryIcons: Record<string, string> = {
      basic: '🧩',
      chart: '📊',
      form: '📝',
      layout: '📐',
      advanced: '⚡',
      custom: '🎨'
    }
    return categoryIcons[categoryId] || '📦'
  }

  /**
   * 获取分类排序权重
   */
  private getCategoryOrder(categoryId: string): number {
    const orders: Record<string, number> = {
      basic: 1,
      chart: 2,
      form: 3,
      layout: 4,
      advanced: 5,
      custom: 6
    }
    return orders[categoryId] || 999
  }
}

/**
 * 创建组件注册中心实例
 */
export const createComponentRegistry = (): ComponentRegistry => {
  return new ComponentRegistry()
}

/**
 * 全局组件注册中心实例
 */
export const globalComponentRegistry = createComponentRegistry()
