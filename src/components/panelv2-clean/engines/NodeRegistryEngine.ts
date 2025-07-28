/**
 * @file NodeRegistryEngine 节点注册引擎
 * @description 管理组件树形结构和注册系统的具体实现
 * 负责组件注册、分类管理、搜索功能和树形结构生成
 */

import { reactive, ref } from 'vue'
import type { ComponentDefinition } from '../types/core'
import type {
  NodeRegistryEngine as INodeRegistryEngine,
  ComponentTreeNode,
  CategoryDefinition,
  SearchQuery,
  SearchIndex,
  ValidationResult,
  TreeOptions,
  ComponentListItem
} from './interfaces/NodeRegistry'

/**
 * 预制分类定义
 */
const BUILT_IN_CATEGORIES: CategoryDefinition[] = [
  {
    id: 'basic',
    name: '基础组件',
    description: '常用的基础UI组件',
    icon: '🧩',
    order: 1,
    display: { collapsible: true, defaultExpanded: true, showCount: true },
    meta: { createdAt: Date.now(), updatedAt: Date.now(), version: '1.0.0' }
  },
  {
    id: 'chart',
    name: '图表组件',
    description: '数据可视化图表组件',
    icon: '📊',
    order: 2,
    display: { collapsible: true, defaultExpanded: true, showCount: true },
    meta: { createdAt: Date.now(), updatedAt: Date.now(), version: '1.0.0' }
  },
  {
    id: 'form',
    name: '表单组件',
    description: '表单输入和控制组件',
    icon: '📝',
    order: 3,
    display: { collapsible: true, defaultExpanded: false, showCount: true },
    meta: { createdAt: Date.now(), updatedAt: Date.now(), version: '1.0.0' }
  },
  {
    id: 'layout',
    name: '布局组件',
    description: '页面布局和容器组件',
    icon: '📐',
    order: 4,
    display: { collapsible: true, defaultExpanded: false, showCount: true },
    meta: { createdAt: Date.now(), updatedAt: Date.now(), version: '1.0.0' }
  },
  {
    id: 'advanced',
    name: '高级组件',
    description: '复杂的高级功能组件',
    icon: '⚡',
    order: 5,
    display: { collapsible: true, defaultExpanded: false, showCount: true },
    meta: { createdAt: Date.now(), updatedAt: Date.now(), version: '1.0.0' }
  },
  {
    id: 'custom',
    name: '自定义组件',
    description: '用户自定义和插件组件',
    icon: '🎨',
    order: 6,
    display: { collapsible: true, defaultExpanded: false, showCount: true },
    meta: { createdAt: Date.now(), updatedAt: Date.now(), version: '1.0.0' }
  }
]

/**
 * 节点注册引擎实现类
 */
export class NodeRegistryEngine implements INodeRegistryEngine {
  /** 组件映射表 */
  private components = new Map<string, ComponentDefinition>()

  /** 分类映射表 */
  private categories = new Map<string, CategoryDefinition>()

  /** 搜索索引 */
  private searchIndex: SearchIndex = {
    keywords: new Map(),
    categories: new Map(),
    tags: new Map(),
    authors: new Map()
  }

  /** 树形数据 */
  private treeData = ref<ComponentTreeNode[]>([])

  /** 统计信息 */
  private stats = reactive({
    totalComponents: 0,
    totalCategories: 0
  })

  constructor() {
    console.log('NodeRegistryEngine: 节点注册引擎已初始化')

    // 确保实例属性正确初始化
    if (!(this.categories instanceof Map)) {
      console.error('NodeRegistryEngine: categories不是Map实例，重新初始化')
      this.categories = new Map<string, CategoryDefinition>()
    }

    if (!(this.components instanceof Map)) {
      console.error('NodeRegistryEngine: components不是Map实例，重新初始化')
      this.components = new Map<string, ComponentDefinition>()
    }

    this.initializeBuiltInCategories()
  }

  // ==================== 公共属性 ====================

  /** 组件注册表（只读） */
  get registry() {
    return {
      components: this.components,
      categories: this.categories,
      searchIndex: this.searchIndex
    }
  }

  // ==================== 组件管理 ====================

  /** 组件管理器 */
  manager = {
    /**
     * 注册单个组件
     */
    register: async (component: ComponentDefinition): Promise<void> => {
      // 验证组件定义
      if (!component.type || !component.name) {
        throw new Error('组件定义不完整: 缺少type或name')
      }

      if (this.components.has(component.type)) {
        console.warn(`NodeRegistryEngine: 组件 "${component.type}" 已存在，将被覆盖`)
      }

      // 注册组件
      this.components.set(component.type, component)
      this.stats.totalComponents = this.components.size

      // 更新搜索索引
      this.updateSearchIndex(component)

      // 更新树形结构
      this.updateTreeStructure()

      console.log(`NodeRegistryEngine: 组件 "${component.type}" 注册成功`)
    },

    /**
     * 取消注册组件
     */
    unregister: async (type: string): Promise<void> => {
      if (this.components.delete(type)) {
        this.stats.totalComponents = this.components.size
        this.updateTreeStructure()
        console.log(`NodeRegistryEngine: 组件 "${type}" 已取消注册`)
      }
    },

    /**
     * 批量注册组件
     */
    batchRegister: async (components: ComponentDefinition[]): Promise<void> => {
      for (const component of components) {
        try {
          await this.manager.register(component)
        } catch (error) {
          console.error(`NodeRegistryEngine: 注册组件 "${component.type}" 失败`, error)
        }
      }
    },

    /**
     * 获取单个组件
     */
    getComponent: (type: string): ComponentDefinition | null => {
      return this.components.get(type) || null
    },

    /**
     * 按分类获取组件
     */
    getComponentsByCategory: (categoryId: string): ComponentDefinition[] => {
      return Array.from(this.components.values()).filter(component => component.category === categoryId)
    },

    /**
     * 获取所有组件
     */
    getAllComponents: (): ComponentDefinition[] => {
      return Array.from(this.components.values())
    },

    /**
     * 验证组件定义
     */
    validate: (component: ComponentDefinition): ValidationResult => {
      const errors: string[] = []
      const warnings: string[] = []

      if (!component.type) errors.push('缺少组件类型')
      if (!component.name) errors.push('缺少组件名称')
      if (!component.category) warnings.push('未指定分类，将使用默认分类')

      return {
        valid: errors.length === 0,
        errors,
        warnings
      }
    },

    /**
     * 验证所有组件
     */
    validateAll: (): ValidationResult[] => {
      return Array.from(this.components.values()).map(this.manager.validate)
    }
  }

  // ==================== 分类管理 ====================

  /** 分类管理器 */
  categoryManager = {
    /**
     * 创建分类
     */
    createCategory: (category: CategoryDefinition): void => {
      this.categories.set(category.id, category)
      this.stats.totalCategories = this.categories.size
      this.updateTreeStructure()
    },

    /**
     * 更新分类
     */
    updateCategory: (id: string, update: Partial<CategoryDefinition>): void => {
      const existing = this.categories.get(id)
      if (existing) {
        const updated = { ...existing, ...update }
        this.categories.set(id, updated)
        this.updateTreeStructure()
      }
    },

    /**
     * 删除分类
     */
    deleteCategory: (id: string): void => {
      if (this.categories.delete(id)) {
        this.stats.totalCategories = this.categories.size
        this.updateTreeStructure()
      }
    },

    /**
     * 获取分类
     */
    getCategory: (id: string): CategoryDefinition | null => {
      return this.categories.get(id) || null
    },

    /**
     * 获取根分类
     */
    getRootCategories: (): CategoryDefinition[] => {
      return Array.from(this.categories.values()).filter(cat => !cat.parentId)
    },

    /**
     * 获取分类树
     */
    getCategoryTree: (): ComponentTreeNode[] => {
      return this.treeData.value
    },

    /**
     * 分配组件到分类
     */
    assignComponentToCategory: (componentType: string, categoryId: string): void => {
      const component = this.components.get(componentType)
      if (component) {
        component.category = categoryId
        this.updateTreeStructure()
      }
    },

    /**
     * 从分类中移除组件
     */
    removeComponentFromCategory: (componentType: string, categoryId: string): void => {
      const component = this.components.get(componentType)
      if (component && component.category === categoryId) {
        component.category = 'basic' // 移动到默认分类
        this.updateTreeStructure()
      }
    }
  }

  // ==================== 搜索功能 ====================

  /** 搜索管理器 */
  search = {
    /**
     * 搜索组件
     */
    searchComponents: (query: SearchQuery): ComponentDefinition[] => {
      const keyword = query.keyword.toLowerCase()

      if (!keyword.trim()) {
        return this.manager.getAllComponents()
      }

      return Array.from(this.components.values())
        .filter(component => {
          return (
            component.name.toLowerCase().includes(keyword) ||
            component.type.toLowerCase().includes(keyword) ||
            component.meta?.description?.toLowerCase().includes(keyword) ||
            component.meta?.keywords?.some(kw => kw.toLowerCase().includes(keyword))
          )
        })
        .slice(0, query.options.maxResults || 50)
    },

    /**
     * 构建搜索索引
     */
    buildSearchIndex: (): void => {
      this.searchIndex.keywords.clear()
      this.searchIndex.categories.clear()
      this.searchIndex.tags.clear()
      this.searchIndex.authors.clear()

      this.components.forEach((component, type) => {
        this.updateSearchIndex(component)
      })
    },

    /**
     * 更新搜索索引
     */
    updateSearchIndex: (component: ComponentDefinition): void => {
      const type = component.type

      // 关键词索引
      const keywords = [component.name, component.type, ...(component.meta?.keywords || [])]
      keywords.forEach(keyword => {
        const key = keyword.toLowerCase()
        if (!this.searchIndex.keywords.has(key)) {
          this.searchIndex.keywords.set(key, new Set())
        }
        this.searchIndex.keywords.get(key)!.add(type)
      })

      // 分类索引
      if (component.category) {
        if (!this.searchIndex.categories.has(component.category)) {
          this.searchIndex.categories.set(component.category, new Set())
        }
        this.searchIndex.categories.get(component.category)!.add(type)
      }
    },

    /**
     * 获取搜索建议
     */
    getSuggestions: (partialQuery: string): string[] => {
      const partial = partialQuery.toLowerCase()
      const suggestions: string[] = []

      this.searchIndex.keywords.forEach((_, keyword) => {
        if (keyword.includes(partial)) {
          suggestions.push(keyword)
        }
      })

      return suggestions.slice(0, 10)
    }
  }

  // ==================== 树形结构生成 ====================

  /** 树形管理器 */
  tree = {
    /**
     * 生成完整树形结构
     */
    generateTree: (options?: TreeOptions): ComponentTreeNode[] => {
      return this.treeData.value
    },

    /**
     * 生成扁平列表
     */
    generateFlatList: (): ComponentListItem[] => {
      const items: ComponentListItem[] = []

      this.components.forEach(component => {
        const category = this.categories.get(component.category)
        if (category) {
          items.push({
            component,
            category,
            path: [category.name]
          })
        }
      })

      return items
    },

    /**
     * 过滤树形结构
     */
    filterTree: (tree: ComponentTreeNode[], predicate: (node: any) => boolean): ComponentTreeNode[] => {
      return tree.filter(predicate)
    }
  }

  // ==================== 公共方法 ====================

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
   * 清空所有数据
   */
  clear(): void {
    this.components.clear()
    this.categories.clear()
    this.treeData.value = []
    this.stats.totalComponents = 0
    this.stats.totalCategories = 0
    this.initializeBuiltInCategories()
    console.log('NodeRegistryEngine: 所有数据已清空')
  }

  // ==================== 私有方法 ====================

  /**
   * 初始化内置分类
   */
  private initializeBuiltInCategories(): void {
    try {
      console.log('NodeRegistryEngine: 开始初始化内置分类', BUILT_IN_CATEGORIES.length)

      if (!(this.categories instanceof Map)) {
        console.error('NodeRegistryEngine: this.categories不是Map实例')
        this.categories = new Map<string, CategoryDefinition>()
      }

      BUILT_IN_CATEGORIES.forEach(category => {
        console.log('NodeRegistryEngine: 添加分类', category.id)
        this.categories.set(category.id, category)
      })

      this.stats.totalCategories = this.categories.size
      console.log('NodeRegistryEngine: 内置分类初始化完成，总数:', this.stats.totalCategories)
    } catch (error) {
      console.error('NodeRegistryEngine: 初始化内置分类失败', error)
      this.categories = new Map<string, CategoryDefinition>()
      this.stats.totalCategories = 0
    }
  }

  /**
   * 更新树形结构
   */
  private updateTreeStructure(): void {
    const categoryMap = new Map<string, ComponentTreeNode>()

    // 收集所有分类
    this.categories.forEach(category => {
      categoryMap.set(category.id, {
        id: category.id,
        name: category.name,
        type: 'category',
        icon: category.icon,
        children: []
      })
    })

    // 为每个分类添加组件
    this.components.forEach(component => {
      const categoryNode = categoryMap.get(component.category)
      if (categoryNode) {
        const componentNode: ComponentTreeNode = {
          id: component.type,
          name: component.name,
          type: 'component',
          icon: component.meta?.icon,
          componentDef: component
        }
        categoryNode.children!.push(componentNode)
      }
    })

    // 排序并更新
    const sortedCategories = Array.from(categoryMap.values())
      .filter(category => (category.children?.length || 0) > 0) // 只显示有组件的分类
      .sort((a, b) => {
        const categoryA = this.categories.get(a.id)
        const categoryB = this.categories.get(b.id)
        return (categoryA?.order || 999) - (categoryB?.order || 999)
      })

    // 对每个分类内的组件进行排序
    sortedCategories.forEach(category => {
      if (category.children) {
        category.children.sort((a, b) => a.name.localeCompare(b.name))
      }
    })

    this.treeData.value = sortedCategories
  }

  /**
   * 更新搜索索引（私有方法）
   */
  private updateSearchIndex(component: ComponentDefinition): void {
    this.search.updateSearchIndex(component)
  }
}

/**
 * 创建节点注册引擎实例
 */
export const createNodeRegistryEngine = (): NodeRegistryEngine => {
  try {
    console.log('createNodeRegistryEngine: 开始创建实例')
    const instance = new NodeRegistryEngine()
    console.log('createNodeRegistryEngine: 实例创建成功')
    return instance
  } catch (error) {
    console.error('createNodeRegistryEngine: 创建实例失败', error)
    throw error
  }
}

/**
 * 全局节点注册引擎实例（延迟初始化）
 */
let _globalNodeRegistryEngine: NodeRegistryEngine | null = null

export const globalNodeRegistryEngine = new Proxy({} as NodeRegistryEngine, {
  get(target, prop) {
    if (!_globalNodeRegistryEngine) {
      console.log('globalNodeRegistryEngine Proxy: 延迟初始化')
      _globalNodeRegistryEngine = createNodeRegistryEngine()
    }
    return _globalNodeRegistryEngine[prop as keyof NodeRegistryEngine]
  }
})
