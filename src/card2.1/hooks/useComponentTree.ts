/**
 * Card 2.1 组件树形结构 Hook
 * 提供组件分类、筛选和树形结构生成功能
 */

import { ref, computed, onMounted, shallowRef, readonly } from 'vue'
import {
  initializeCard2System,
  getComponentTree,
  getComponentsByCategory as getComponentsByCategoryFromIndex,
  getCategories
} from '../index'
import type { ComponentDefinition } from '../core/types'
import type { ComponentTree, ComponentCategory } from '../core/auto-registry'

export interface ComponentTreeOptions {
  autoInit?: boolean
  filter?: (component: ComponentDefinition) => boolean
  sortBy?: 'name' | 'type' | 'category'
  sortOrder?: 'asc' | 'desc'
}

export interface FilteredComponentTree extends ComponentTree {
  filteredComponents: ComponentDefinition[]
  appliedFilters: {
    search?: string
    mainCategory?: string
    subCategory?: string
  }
}

export function useComponentTree(options: ComponentTreeOptions = {}) {
  const { autoInit = true, filter, sortBy = 'name', sortOrder = 'asc' } = options

  // 状态管理
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const componentTree = shallowRef<ComponentTree>({ categories: [], components: [], totalCount: 0 })

  // 筛选状态
  const searchQuery = ref('')
  const selectedMainCategory = ref<string>('')
  const selectedSubCategory = ref<string>('')

  /**
   * 初始化组件树
   */
  const initialize = async () => {
    console.log('🔧 [useComponentTree] 开始初始化...')
    if (isLoading.value) {
      console.log('🔧 [useComponentTree] 正在加载中，跳过重复初始化')
      return
    }

    isLoading.value = true
    error.value = null

    try {
      console.log('🔧 [useComponentTree] 调用 initializeCard2System...')
      await initializeCard2System()
      
      console.log('🔧 [useComponentTree] 调用 getComponentTree...')
      const tree = getComponentTree()
      console.log('🔧 [useComponentTree] 获取到组件树:', { 
        componentsCount: tree.components.length, 
        categoriesCount: tree.categories.length,
        totalCount: tree.totalCount 
      })
      
      componentTree.value = tree
      console.log('✅ [useComponentTree] 初始化完成')
    } catch (err) {
      error.value = err instanceof Error ? err.message : '初始化失败'
      console.error('❌ [useComponentTree] 初始化失败:', err)
    } finally {
      isLoading.value = false
    }
  }

  /**
   * 筛选组件
   */
  const filteredComponents = computed(() => {
    let components = componentTree.value.components

    // 应用自定义筛选器
    if (filter) {
      components = components.filter(filter)
    }

    // 应用搜索筛选
    if (searchQuery.value) {
      const query = searchQuery.value.toLowerCase()
      components = components.filter(
        comp =>
          (comp.name || '').toLowerCase().includes(query) ||
          (comp.description || '').toLowerCase().includes(query) ||
          (comp.type || '').toLowerCase().includes(query)
      )
    }

    // 应用分类筛选
    if (selectedMainCategory.value) {
      components = components.filter(comp => comp.mainCategory === selectedMainCategory.value)
    }

    if (selectedSubCategory.value) {
      components = components.filter(comp => comp.subCategory === selectedSubCategory.value)
    }

    // 排序
    components.sort((a, b) => {
      let aValue: string
      let bValue: string

      switch (sortBy) {
        case 'name':
          aValue = a.name || ''
          bValue = b.name || ''
          break
        case 'type':
          aValue = a.type || ''
          bValue = b.type || ''
          break
        case 'category':
          aValue = a.mainCategory || ''
          bValue = b.mainCategory || ''
          break
        default:
          aValue = a.name || ''
          bValue = b.name || ''
      }

      // 确保值不为undefined，防止localeCompare报错
      const safeAValue = String(aValue || '')
      const safeBValue = String(bValue || '')

      const comparison = safeAValue.localeCompare(safeBValue)
      return sortOrder === 'asc' ? comparison : -comparison
    })

    return components
  })

  /**
   * 获取筛选后的组件树
   */
  const getFilteredTree = computed((): FilteredComponentTree => {
    return {
      ...componentTree.value,
      filteredComponents: filteredComponents.value,
      appliedFilters: {
        search: searchQuery.value || undefined,
        mainCategory: selectedMainCategory.value || undefined,
        subCategory: selectedSubCategory.value || undefined
      }
    }
  })

  /**
   * 按分类获取组件
   */
  const getComponentsByCategory = (mainCategory?: string, subCategory?: string) => {
    return getComponentsByCategoryFromIndex(mainCategory, subCategory)
  }

  /**
   * 获取所有分类
   */
  const categories = computed(() => getCategories())

  /**
   * 获取可用的主分类
   */
  const availableMainCategories = computed(() => {
    const categories = new Set<string>()
    componentTree.value.components.forEach(comp => {
      if (comp.mainCategory) {
        categories.add(comp.mainCategory)
      }
    })
    return Array.from(categories).sort()
  })

  /**
   * 获取可用的子分类
   */
  const availableSubCategories = computed(() => {
    const categories = new Set<string>()
    componentTree.value.components.forEach(comp => {
      if (comp.subCategory && (!selectedMainCategory.value || comp.mainCategory === selectedMainCategory.value)) {
        categories.add(comp.subCategory)
      }
    })
    return Array.from(categories).sort()
  })

  /**
   * 清除筛选条件
   */
  const clearFilters = () => {
    searchQuery.value = ''
    selectedMainCategory.value = ''
    selectedSubCategory.value = ''
  }

  /**
   * 重置到初始状态
   */
  const reset = () => {
    clearFilters()
    componentTree.value = { categories: [], components: [], totalCount: 0 }
    error.value = null
  }

  // 自动初始化
  if (autoInit) {
    onMounted(() => {
      initialize()
    })
  }

  return {
    // 状态
    isLoading: readonly(isLoading),
    error: readonly(error),
    componentTree: readonly(componentTree),

    // 筛选状态
    searchQuery,
    selectedMainCategory,
    selectedSubCategory,

    // 计算属性
    filteredComponents,
    getFilteredTree,
    categories,
    availableMainCategories,
    availableSubCategories,

    // 方法
    initialize,
    getComponentsByCategory,
    clearFilters,
    reset
  }
}
