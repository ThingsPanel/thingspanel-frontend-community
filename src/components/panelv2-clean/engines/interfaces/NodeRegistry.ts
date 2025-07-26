/**
 * @file NodeRegistry 接口定义
 * @description 节点注册引擎接口 - 管理组件树形结构和注册系统
 */

import type { ComponentDefinition } from '../../types/core'

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
 * 分类定义接口
 */
export interface CategoryDefinition {
  id: string
  name: string
  description?: string
  icon?: string
  color?: string
  parentId?: string
  order: number

  // 显示配置
  display: {
    collapsible: boolean
    defaultExpanded: boolean
    showCount: boolean
    customIcon?: any // Vue Component
  }

  // 权限控制
  permissions?: {
    view?: string[]
    create?: string[]
    edit?: string[]
  }

  // 元数据
  meta: {
    createdAt: number
    updatedAt: number
    version: string
  }
}

/**
 * 搜索查询接口
 */
export interface SearchQuery {
  keyword: string
  categories?: string[]
  tags?: string[]
  author?: string
  version?: string

  // 搜索选项
  options: {
    fuzzy: boolean
    caseSensitive: boolean
    searchInDescription: boolean
    searchInKeywords: boolean
    maxResults: number
  }
}

/**
 * 搜索索引接口
 */
export interface SearchIndex {
  // 关键词索引
  keywords: Map<string, Set<string>> // keyword -> component types
  // 分类索引
  categories: Map<string, Set<string>> // category -> component types
  // 标签索引
  tags: Map<string, Set<string>> // tag -> component types
  // 作者索引
  authors: Map<string, Set<string>> // author -> component types
}

/**
 * 验证结果接口
 */
export interface ValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
}

/**
 * 树形生成选项
 */
export interface TreeOptions {
  expandedCategories?: Set<string>
  showEmptyCategories?: boolean
  sortBy?: 'name' | 'order' | 'createTime'
  filterPredicate?: (node: ComponentTreeNode) => boolean
}

/**
 * 组件列表项接口（扁平列表用）
 */
export interface ComponentListItem {
  component: ComponentDefinition
  category: CategoryDefinition
  path: string[] // 分类路径
}

/**
 * 节点注册引擎接口
 */
export interface NodeRegistryEngine {
  // 组件注册表
  readonly registry: {
    // 所有注册的组件定义
    components: Map<string, ComponentDefinition>
    // 分类映射
    categories: Map<string, CategoryDefinition>
    // 搜索索引
    searchIndex: SearchIndex
  }

  // 组件管理
  manager: {
    // 注册组件
    register(component: ComponentDefinition): Promise<void>
    unregister(type: string): Promise<void>
    batchRegister(components: ComponentDefinition[]): Promise<void>

    // 查询组件
    getComponent(type: string): ComponentDefinition | null
    getComponentsByCategory(categoryId: string): ComponentDefinition[]
    getAllComponents(): ComponentDefinition[]

    // 组件验证
    validate(component: ComponentDefinition): ValidationResult
    validateAll(): ValidationResult[]
  }

  // 分类管理
  categoryManager: {
    // 创建分类
    createCategory(category: CategoryDefinition): void
    updateCategory(id: string, update: Partial<CategoryDefinition>): void
    deleteCategory(id: string): void

    // 分类查询
    getCategory(id: string): CategoryDefinition | null
    getRootCategories(): CategoryDefinition[]
    getCategoryTree(): ComponentTreeNode[]

    // 分类关联
    assignComponentToCategory(componentType: string, categoryId: string): void
    removeComponentFromCategory(componentType: string, categoryId: string): void
  }

  // 搜索功能
  search: {
    // 搜索组件
    searchComponents(query: SearchQuery): ComponentDefinition[]
    // 关键词索引
    buildSearchIndex(): void
    updateSearchIndex(component: ComponentDefinition): void
    // 搜索建议
    getSuggestions(partialQuery: string): string[]
  }

  // 树形结构生成
  tree: {
    // 生成完整树形结构（用于左侧面板显示）
    generateTree(options?: TreeOptions): ComponentTreeNode[]
    // 生成扁平列表（用于搜索结果）
    generateFlatList(options?: any): ComponentListItem[]
    // 过滤树形结构
    filterTree(tree: ComponentTreeNode[], predicate: (node: any) => boolean): ComponentTreeNode[]
  }

  // 统计信息
  getStats(): {
    totalComponents: number
    totalCategories: number
    categories: string[]
  }

  // 清理操作
  clear(): void
}
