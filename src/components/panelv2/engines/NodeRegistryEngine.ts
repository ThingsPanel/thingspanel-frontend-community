// 第二层：专业引擎层 - 节点注册引擎
// 职责：组件树形管理，搜索索引，验证系统

import { ref, reactive, computed, type Component } from 'vue'

/**
 * 组件定义
 */
export interface ComponentDefinition {
  // 组件标识
  type: string
  name: string
  category: string

  // Vue组件
  component: Component

  // 配置Schema（JSON Schema格式）
  configSchema: {
    base: ConfigSchema // 基础配置schema
    interaction: ConfigSchema // 交互配置schema
    content: ConfigSchema // 内容配置schema
  }

  // 默认配置
  defaults: {
    layout: { w: number; h: number; minW?: number; minH?: number }
    config: { base: any; interaction: any; content: any }
    style: any
  }

  // 组件元信息
  meta: {
    title: string
    description?: string
    icon?: string
    poster?: string // 预览图
    version: string
    author?: string
    keywords?: string[]
  }

  // 响应式配置
  responsive: {
    autoResize: boolean
    maintainAspectRatio?: boolean
    resizeHandles?: Array<'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw'>
  }
}

/**
 * 配置Schema
 */
export interface ConfigSchema {
  type: 'object' | 'array' | 'string' | 'number' | 'boolean' | 'enum'
  title?: string
  description?: string
  properties?: Record<string, ConfigSchema>
  required?: string[]
  items?: ConfigSchema
  enum?: any[]
  enumLabels?: string[]
  default?: any

  // UI配置
  ui?: {
    component?: string
    componentProps?: Record<string, any>
    layout?: any
    className?: string
    style?: Record<string, any>
  }
}

/**
 * 分类定义
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
    customIcon?: Component
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
 * 分类树节点
 */
export interface CategoryTreeNode {
  id: string
  name: string
  icon?: string
  type: 'category' | 'component'
  children?: CategoryTreeNode[]

  // 分类特有属性
  categoryData?: CategoryDefinition
  componentData?: ComponentDefinition

  // UI状态
  expanded?: boolean
  visible?: boolean
  disabled?: boolean

  // 统计信息
  componentCount?: number
  totalCount?: number
}

/**
 * 搜索查询
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
 * 搜索索引
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
 * 验证结果
 */
export interface ValidationResult {
  valid: boolean
  errors: ValidationError[]
  warnings: ValidationWarning[]
}

export interface ValidationError {
  path: string
  message: string
  code: string
  severity: 'error' | 'warning' | 'info'
}

export interface ValidationWarning {
  path: string
  message: string
  code: string
}

/**
 * 节点注册引擎接口
 */
export interface NodeRegistryEngine {
  // 组件注册表
  registry: {
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
  categories: {
    // 创建分类
    createCategory(category: CategoryDefinition): void
    updateCategory(id: string, update: Partial<CategoryDefinition>): void
    deleteCategory(id: string): void

    // 分类查询
    getCategory(id: string): CategoryDefinition | null
    getRootCategories(): CategoryDefinition[]
    getCategoryTree(): CategoryTreeNode[]

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
    generateTree(options?: TreeOptions): CategoryTreeNode[]
    // 生成扁平列表（用于搜索结果）
    generateFlatList(options?: ListOptions): ComponentListItem[]
    // 过滤树形结构
    filterTree(tree: CategoryTreeNode[], predicate: (node: any) => boolean): CategoryTreeNode[]
  }
}

export interface TreeOptions {
  expandAll?: boolean
  showEmptyCategories?: boolean
  sortBy?: 'name' | 'order' | 'count'
  sortOrder?: 'asc' | 'desc'
}

export interface ListOptions {
  groupByCategory?: boolean
  includeHidden?: boolean
  maxItems?: number
}

export interface ComponentListItem {
  component: ComponentDefinition
  category: CategoryDefinition
  path: string[]
}

/**
 * 节点注册引擎实现
 */
export class PanelNodeRegistryEngine implements NodeRegistryEngine {
  // 组件注册表
  public registry = {
    components: new Map<string, ComponentDefinition>(),
    categories: new Map<string, CategoryDefinition>(),
    searchIndex: {
      keywords: new Map<string, Set<string>>(),
      categories: new Map<string, Set<string>>(),
      tags: new Map<string, Set<string>>(),
      authors: new Map<string, Set<string>>()
    } as SearchIndex
  }

  constructor() {
    this.initializeBuiltInCategories()
  }

  /**
   * 初始化内置分类
   */
  private initializeBuiltInCategories() {
    const builtInCategories: CategoryDefinition[] = [
      {
        id: 'basic',
        name: '基础组件',
        description: '常用的基础UI组件',
        icon: 'layers',
        order: 1,
        display: { collapsible: true, defaultExpanded: true, showCount: true },
        meta: { createdAt: Date.now(), updatedAt: Date.now(), version: '1.0.0' }
      },
      {
        id: 'chart',
        name: '图表组件',
        description: '各种数据可视化图表',
        icon: 'chart-bar',
        order: 2,
        display: { collapsible: true, defaultExpanded: true, showCount: true },
        meta: { createdAt: Date.now(), updatedAt: Date.now(), version: '1.0.0' }
      },
      {
        id: 'form',
        name: '表单组件',
        description: '表单输入和交互组件',
        icon: 'form',
        order: 3,
        display: { collapsible: true, defaultExpanded: false, showCount: true },
        meta: { createdAt: Date.now(), updatedAt: Date.now(), version: '1.0.0' }
      },
      {
        id: 'media',
        name: '媒体组件',
        description: '图片、视频等媒体组件',
        icon: 'image',
        order: 4,
        display: { collapsible: true, defaultExpanded: false, showCount: true },
        meta: { createdAt: Date.now(), updatedAt: Date.now(), version: '1.0.0' }
      },
      {
        id: 'advanced',
        name: '高级组件',
        description: '复杂的业务组件',
        icon: 'puzzle',
        order: 5,
        display: { collapsible: true, defaultExpanded: false, showCount: true },
        meta: { createdAt: Date.now(), updatedAt: Date.now(), version: '1.0.0' }
      },
      {
        id: 'plugin',
        name: '插件组件',
        description: '第三方插件提供的组件',
        icon: 'plugin',
        order: 6,
        display: { collapsible: true, defaultExpanded: false, showCount: true },
        meta: { createdAt: Date.now(), updatedAt: Date.now(), version: '1.0.0' }
      }
    ]

    builtInCategories.forEach(category => {
      this.registry.categories.set(category.id, category)
    })
  }

  // 组件管理器实现
  public manager = {
    register: async (component: ComponentDefinition): Promise<void> => {
      // 验证组件定义
      const validation = this.manager.validate(component)
      if (!validation.valid) {
        throw new Error(`组件注册失败: ${validation.errors.map(e => e.message).join(', ')}`)
      }

      // 注册组件
      this.registry.components.set(component.type, component)

      // 更新搜索索引
      this.search.updateSearchIndex(component)

      // 将组件分配到对应分类
      this.categories.assignComponentToCategory(component.type, component.category)

      console.debug(`组件已注册: ${component.type}`)
    },

    unregister: async (type: string): Promise<void> => {
      const component = this.registry.components.get(type)
      if (!component) {
        console.warn(`尝试注销不存在的组件: ${type}`)
        return
      }

      // 从注册表中移除
      this.registry.components.delete(type)

      // 从搜索索引中移除
      this.removeFromSearchIndex(component)

      // 从分类中移除
      this.categories.removeComponentFromCategory(type, component.category)

      console.debug(`组件已注销: ${type}`)
    },

    batchRegister: async (components: ComponentDefinition[]): Promise<void> => {
      const errors: string[] = []

      for (const component of components) {
        try {
          await this.manager.register(component)
        } catch (error) {
          errors.push(`${component.type}: ${error instanceof Error ? error.message : String(error)}`)
        }
      }

      if (errors.length > 0) {
        console.warn('批量注册时发现错误:', errors)
      }

      // 重建搜索索引以优化性能
      this.search.buildSearchIndex()
    },

    getComponent: (type: string): ComponentDefinition | null => {
      return this.registry.components.get(type) || null
    },

    getComponentsByCategory: (categoryId: string): ComponentDefinition[] => {
      return Array.from(this.registry.components.values()).filter(component => component.category === categoryId)
    },

    getAllComponents: (): ComponentDefinition[] => {
      return Array.from(this.registry.components.values())
    },

    validate: (component: ComponentDefinition): ValidationResult => {
      const errors: ValidationError[] = []
      const warnings: ValidationWarning[] = []

      // 基础验证
      if (!component.type) {
        errors.push({
          path: 'type',
          message: '组件类型不能为空',
          code: 'REQUIRED_FIELD',
          severity: 'error'
        })
      }

      if (!component.name) {
        errors.push({
          path: 'name',
          message: '组件名称不能为空',
          code: 'REQUIRED_FIELD',
          severity: 'error'
        })
      }

      if (!component.component) {
        errors.push({
          path: 'component',
          message: 'Vue组件不能为空',
          code: 'REQUIRED_FIELD',
          severity: 'error'
        })
      }

      // 检查类型唯一性
      if (this.registry.components.has(component.type)) {
        errors.push({
          path: 'type',
          message: `组件类型已存在: ${component.type}`,
          code: 'DUPLICATE_TYPE',
          severity: 'error'
        })
      }

      // 检查分类是否存在
      if (!this.registry.categories.has(component.category)) {
        warnings.push({
          path: 'category',
          message: `分类不存在，将使用默认分类: ${component.category}`,
          code: 'UNKNOWN_CATEGORY'
        })
      }

      // 验证默认配置
      if (!component.defaults) {
        warnings.push({
          path: 'defaults',
          message: '建议提供默认配置',
          code: 'MISSING_DEFAULTS'
        })
      }

      return {
        valid: errors.length === 0,
        errors,
        warnings
      }
    },

    validateAll: (): ValidationResult[] => {
      return Array.from(this.registry.components.values()).map(component => this.manager.validate(component))
    }
  }

  // 分类管理器实现
  public categories = {
    createCategory: (category: CategoryDefinition) => {
      this.registry.categories.set(category.id, category)
      console.debug(`分类已创建: ${category.id}`)
    },

    updateCategory: (id: string, update: Partial<CategoryDefinition>) => {
      const existing = this.registry.categories.get(id)
      if (existing) {
        const updated = { ...existing, ...update }
        updated.meta.updatedAt = Date.now()
        this.registry.categories.set(id, updated)
        console.debug(`分类已更新: ${id}`)
      }
    },

    deleteCategory: (id: string) => {
      // 检查是否有组件使用此分类
      const componentsInCategory = this.manager.getComponentsByCategory(id)
      if (componentsInCategory.length > 0) {
        console.warn(`无法删除分类 ${id}，仍有 ${componentsInCategory.length} 个组件使用此分类`)
        return
      }

      this.registry.categories.delete(id)
      console.debug(`分类已删除: ${id}`)
    },

    getCategory: (id: string): CategoryDefinition | null => {
      return this.registry.categories.get(id) || null
    },

    getRootCategories: (): CategoryDefinition[] => {
      return Array.from(this.registry.categories.values())
        .filter(category => !category.parentId)
        .sort((a, b) => a.order - b.order)
    },

    getCategoryTree: (): CategoryTreeNode[] => {
      return this.tree.generateTree()
    },

    assignComponentToCategory: (componentType: string, categoryId: string) => {
      // 确保分类存在
      if (!this.registry.categories.has(categoryId)) {
        // 创建默认分类
        this.categories.createCategory({
          id: categoryId,
          name: categoryId,
          order: 999,
          display: { collapsible: true, defaultExpanded: false, showCount: true },
          meta: { createdAt: Date.now(), updatedAt: Date.now(), version: '1.0.0' }
        })
      }

      // 更新搜索索引
      if (!this.registry.searchIndex.categories.has(categoryId)) {
        this.registry.searchIndex.categories.set(categoryId, new Set())
      }
      this.registry.searchIndex.categories.get(categoryId)!.add(componentType)
    },

    removeComponentFromCategory: (componentType: string, categoryId: string) => {
      const categoryComponents = this.registry.searchIndex.categories.get(categoryId)
      if (categoryComponents) {
        categoryComponents.delete(componentType)
        if (categoryComponents.size === 0) {
          this.registry.searchIndex.categories.delete(categoryId)
        }
      }
    }
  }

  // 搜索功能实现
  public search = {
    searchComponents: (query: SearchQuery): ComponentDefinition[] => {
      const results: ComponentDefinition[] = []
      const { keyword, categories, tags, author, options } = query

      // 从所有组件中搜索
      const allComponents = this.manager.getAllComponents()

      for (const component of allComponents) {
        let matches = true

        // 关键词匹配
        if (keyword) {
          const searchText = [
            component.name,
            component.meta.title,
            options.searchInDescription ? component.meta.description : '',
            options.searchInKeywords ? component.meta.keywords?.join(' ') : ''
          ]
            .join(' ')
            .toLowerCase()

          const searchKeyword = options.caseSensitive ? keyword : keyword.toLowerCase()

          if (options.fuzzy) {
            matches = matches && this.fuzzyMatch(searchText, searchKeyword)
          } else {
            matches = matches && searchText.includes(searchKeyword)
          }
        }

        // 分类过滤
        if (categories && categories.length > 0) {
          matches = matches && categories.includes(component.category)
        }

        // 标签过滤
        if (tags && tags.length > 0) {
          const componentTags = component.meta.keywords || []
          matches = matches && tags.some(tag => componentTags.includes(tag))
        }

        // 作者过滤
        if (author) {
          matches = matches && component.meta.author === author
        }

        if (matches) {
          results.push(component)

          // 限制结果数量
          if (results.length >= options.maxResults) {
            break
          }
        }
      }

      return results
    },

    buildSearchIndex: () => {
      // 清空现有索引
      this.registry.searchIndex.keywords.clear()
      this.registry.searchIndex.categories.clear()
      this.registry.searchIndex.tags.clear()
      this.registry.searchIndex.authors.clear()

      // 重建索引
      for (const component of this.registry.components.values()) {
        this.search.updateSearchIndex(component)
      }

      console.debug('搜索索引已重建')
    },

    updateSearchIndex: (component: ComponentDefinition) => {
      const { type, name, category, meta } = component

      // 关键词索引
      const keywords = [name, meta.title, meta.description, ...(meta.keywords || [])]
        .filter(Boolean)
        .map(k => k!.toLowerCase())

      for (const keyword of keywords) {
        if (!this.registry.searchIndex.keywords.has(keyword)) {
          this.registry.searchIndex.keywords.set(keyword, new Set())
        }
        this.registry.searchIndex.keywords.get(keyword)!.add(type)
      }

      // 分类索引
      if (!this.registry.searchIndex.categories.has(category)) {
        this.registry.searchIndex.categories.set(category, new Set())
      }
      this.registry.searchIndex.categories.get(category)!.add(type)

      // 标签索引
      if (meta.keywords) {
        for (const tag of meta.keywords) {
          if (!this.registry.searchIndex.tags.has(tag)) {
            this.registry.searchIndex.tags.set(tag, new Set())
          }
          this.registry.searchIndex.tags.get(tag)!.add(type)
        }
      }

      // 作者索引
      if (meta.author) {
        if (!this.registry.searchIndex.authors.has(meta.author)) {
          this.registry.searchIndex.authors.set(meta.author, new Set())
        }
        this.registry.searchIndex.authors.get(meta.author)!.add(type)
      }
    },

    getSuggestions: (partialQuery: string): string[] => {
      const suggestions: string[] = []
      const query = partialQuery.toLowerCase()

      // 从关键词索引中获取建议
      for (const keyword of this.registry.searchIndex.keywords.keys()) {
        if (keyword.startsWith(query) && keyword !== query) {
          suggestions.push(keyword)
        }
      }

      // 从分类中获取建议
      for (const category of this.registry.categories.values()) {
        const categoryName = category.name.toLowerCase()
        if (categoryName.startsWith(query) && categoryName !== query) {
          suggestions.push(category.name)
        }
      }

      return suggestions.slice(0, 10) // 限制建议数量
    }
  }

  // 树形结构生成器实现
  public tree = {
    generateTree: (options: TreeOptions = {}): CategoryTreeNode[] => {
      const { expandAll = false, showEmptyCategories = true, sortBy = 'order', sortOrder = 'asc' } = options

      const rootCategories = this.categories.getRootCategories()
      const tree: CategoryTreeNode[] = []

      for (const category of rootCategories) {
        const node = this.buildCategoryNode(category, options)

        if (showEmptyCategories || node.componentCount! > 0) {
          tree.push(node)
        }
      }

      return this.sortTreeNodes(tree, sortBy, sortOrder)
    },

    generateFlatList: (options: ListOptions = {}): ComponentListItem[] => {
      const { groupByCategory = false, includeHidden = false, maxItems = 1000 } = options

      const list: ComponentListItem[] = []
      const components = this.manager.getAllComponents()

      for (const component of components) {
        const category = this.categories.getCategory(component.category)
        if (!category) continue

        const item: ComponentListItem = {
          component,
          category,
          path: this.getCategoryPath(category)
        }

        list.push(item)

        if (list.length >= maxItems) break
      }

      return list
    },

    filterTree: (tree: CategoryTreeNode[], predicate: (node: any) => boolean): CategoryTreeNode[] => {
      const filtered: CategoryTreeNode[] = []

      for (const node of tree) {
        if (predicate(node)) {
          const filteredNode = { ...node }

          if (node.children) {
            filteredNode.children = this.tree.filterTree(node.children, predicate)
          }

          filtered.push(filteredNode)
        }
      }

      return filtered
    }
  }

  /**
   * 构建分类节点
   */
  private buildCategoryNode(category: CategoryDefinition, options: TreeOptions): CategoryTreeNode {
    const components = this.manager.getComponentsByCategory(category.id)
    const componentNodes: CategoryTreeNode[] = components.map(component => ({
      id: component.type,
      name: component.name,
      icon: component.meta.icon,
      type: 'component' as const,
      componentData: component,
      visible: true,
      disabled: false
    }))

    // 获取子分类
    const childCategories = Array.from(this.registry.categories.values()).filter(cat => cat.parentId === category.id)

    const childNodes: CategoryTreeNode[] = childCategories.map(child => this.buildCategoryNode(child, options))

    const totalCount = componentNodes.length + childNodes.reduce((sum, child) => sum + (child.totalCount || 0), 0)

    return {
      id: category.id,
      name: category.name,
      icon: category.icon,
      type: 'category' as const,
      children: [...childNodes, ...componentNodes],
      categoryData: category,
      expanded: options.expandAll || category.display.defaultExpanded,
      visible: true,
      disabled: false,
      componentCount: componentNodes.length,
      totalCount
    }
  }

  /**
   * 排序树节点
   */
  private sortTreeNodes(nodes: CategoryTreeNode[], sortBy: string, sortOrder: string): CategoryTreeNode[] {
    return nodes.sort((a, b) => {
      let comparison = 0

      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name)
          break
        case 'order': {
          const orderA = a.categoryData?.order || 999
          const orderB = b.categoryData?.order || 999
          comparison = orderA - orderB
          break
        }
        case 'count':
          comparison = (a.totalCount || 0) - (b.totalCount || 0)
          break
      }

      return sortOrder === 'desc' ? -comparison : comparison
    })
  }

  /**
   * 获取分类路径
   */
  private getCategoryPath(category: CategoryDefinition): string[] {
    const path: string[] = [category.name]

    if (category.parentId) {
      const parent = this.categories.getCategory(category.parentId)
      if (parent) {
        path.unshift(...this.getCategoryPath(parent))
      }
    }

    return path
  }

  /**
   * 模糊匹配
   */
  private fuzzyMatch(text: string, pattern: string): boolean {
    let patternIndex = 0

    for (let textIndex = 0; textIndex < text.length && patternIndex < pattern.length; textIndex++) {
      if (text[textIndex] === pattern[patternIndex]) {
        patternIndex++
      }
    }

    return patternIndex === pattern.length
  }

  /**
   * 从搜索索引中移除组件
   */
  private removeFromSearchIndex(component: ComponentDefinition) {
    const { type, category, meta } = component

    // 从关键词索引中移除
    for (const componentTypes of this.registry.searchIndex.keywords.values()) {
      componentTypes.delete(type)
    }

    // 从分类索引中移除
    const categoryComponents = this.registry.searchIndex.categories.get(category)
    if (categoryComponents) {
      categoryComponents.delete(type)
      if (categoryComponents.size === 0) {
        this.registry.searchIndex.categories.delete(category)
      }
    }

    // 从标签索引中移除
    if (meta.keywords) {
      for (const tag of meta.keywords) {
        const tagComponents = this.registry.searchIndex.tags.get(tag)
        if (tagComponents) {
          tagComponents.delete(type)
          if (tagComponents.size === 0) {
            this.registry.searchIndex.tags.delete(tag)
          }
        }
      }
    }

    // 从作者索引中移除
    if (meta.author) {
      const authorComponents = this.registry.searchIndex.authors.get(meta.author)
      if (authorComponents) {
        authorComponents.delete(type)
        if (authorComponents.size === 0) {
          this.registry.searchIndex.authors.delete(meta.author)
        }
      }
    }
  }

  /**
   * 销毁注册引擎
   */
  public destroy() {
    this.registry.components.clear()
    this.registry.categories.clear()
    this.registry.searchIndex.keywords.clear()
    this.registry.searchIndex.categories.clear()
    this.registry.searchIndex.tags.clear()
    this.registry.searchIndex.authors.clear()
  }
}

/**
 * 创建节点注册引擎实例
 */
export function createNodeRegistryEngine(): PanelNodeRegistryEngine {
  const engine = new PanelNodeRegistryEngine()

  // 注册默认组件
  engine.manager.registerComponent({
    type: 'text-card',
    name: '文本卡片',
    category: 'basic',
    meta: {
      icon: 'fas fa-font',
      title: '文本卡片',
      description: '用于显示文本内容的基础卡片',
      keywords: ['text', 'card', '文本', '卡片']
    },
    defaults: {
      config: {
        base: {},
        interaction: {},
        content: {
          title: '新建文本卡片',
          content: '请输入内容...'
        }
      },
      layout: { w: 4, h: 3, x: 0, y: 0 }
    }
  })

  engine.manager.registerComponent({
    type: 'image-card',
    name: '图片卡片',
    category: 'basic',
    meta: {
      icon: 'fas fa-image',
      title: '图片卡片',
      description: '用于显示图片内容的卡片',
      keywords: ['image', 'card', '图片', '卡片']
    },
    defaults: {
      config: {
        base: {},
        interaction: {},
        content: {
          src: '',
          alt: '图片'
        }
      },
      layout: { w: 4, h: 4, x: 0, y: 0 }
    }
  })

  // 注册默认分类
  engine.categories.registerCategory({
    id: 'basic',
    name: '基础组件',
    order: 1,
    meta: {
      icon: 'fas fa-cube',
      description: '基础的面板组件'
    }
  })

  return engine
}
