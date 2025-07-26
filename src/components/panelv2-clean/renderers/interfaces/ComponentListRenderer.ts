/**
 * @file ComponentListRenderer 接口定义
 * @description 组件列表渲染器接口 - 负责组件列表的UI渲染
 */

import type { ComponentDefinition } from '../../types/core'

/**
 * 组件分类Tab数据接口
 */
export interface ComponentCategoryTab {
  /** 分类ID */
  id: string
  /** 分类名称 */
  name: string
  /** 分类图标 */
  icon: string
  /** 分类下的组件列表 */
  components: ComponentDefinition[]
  /** 是否激活 */
  active?: boolean
  /** 排序权重 */
  order: number
}

/**
 * 组件列表渲染配置
 */
export interface ComponentListConfig {
  /** 默认激活的分类 */
  defaultActiveCategory?: string
  /** 显示搜索框 */
  showSearch?: boolean
  /** 显示统计信息 */
  showStats?: boolean
  /** 每行显示的组件数量 */
  itemsPerRow?: number
  /** 紧凑模式 */
  compact?: boolean
}

/**
 * 组件列表渲染器接口
 */
export interface ComponentListRenderer {
  /**
   * 初始化渲染器
   */
  init(config?: ComponentListConfig): void

  /**
   * 销毁渲染器
   */
  destroy(): void

  /**
   * 设置分类Tab数据
   */
  setCategoryTabs(tabs: ComponentCategoryTab[]): void

  /**
   * 获取当前分类Tab数据
   */
  getCategoryTabs(): ComponentCategoryTab[]

  /**
   * 切换到指定分类
   */
  switchToCategory(categoryId: string): void

  /**
   * 获取当前激活的分类
   */
  getActiveCategory(): string | null

  /**
   * 搜索组件
   */
  searchComponents(keyword: string): ComponentDefinition[]

  /**
   * 清除搜索
   */
  clearSearch(): void

  /**
   * 获取渲染统计信息
   */
  getStats(): {
    totalCategories: number
    totalComponents: number
    activeCategory: string | null
    isSearching: boolean
  }
}
