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
import type { ComponentDefinition } from '@/card2.1/types'
import type { ComponentTree, ComponentCategory } from '@/card2.1/core/auto-registry'

// 🔥 全局共享状态，确保多个实例同步
let globalComponentTree = shallowRef<ComponentTree>({ categories: [], components: [], totalCount: 0 })
let globalIsLoading = ref(false)
let globalError = ref<string | null>(null)
let globalInitialized = false

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

  // 🔥 修复：使用全局共享状态，确保多个实例同步
  const isLoading = globalIsLoading
  const error = globalError
  const componentTree = globalComponentTree

  // 筛选状态
  const searchQuery = ref('')
  const selectedMainCategory = ref<string>('')
  const selectedSubCategory = ref<string>('')

  /**
   * 初始化组件树
   */
  const initialize = async () => {
    console.log('🔧 [useComponentTree] 开始初始化...', { globalInitialized, isLoading: isLoading.value })

    // 🔥 修复：检查全局初始化状态
    if (globalInitialized && componentTree.value.totalCount > 0) {
      console.log('🔧 [useComponentTree] 已全局初始化，跳过重复初始化')
      return
    }

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
        totalCount: tree.totalCount,
        rawTree: tree
      })

      console.log('🔧 [useComponentTree] 赋值前 componentTree.value:', componentTree.value)
      componentTree.value = tree
      console.log('🔧 [useComponentTree] 赋值后 componentTree.value:', componentTree.value)

      // 🔥 修复：强制触发响应性更新
      console.log('🔧 [useComponentTree] 触发响应性更新...')
      componentTree.value = { ...tree }

      // 🔥 修复：标记全局初始化完成
      globalInitialized = true

      console.log('✅ [useComponentTree] 初始化完成，最终状态:', {
        componentTreeValue: componentTree.value,
        filteredComponentsLength: filteredComponents.value.length,
        globalInitialized
      })
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

  /**
   * 🔥 关键修复：获取指定类型的组件实例
   * Card2Wrapper 需要此方法来加载实际的 Vue 组件
   */
  const getComponent = async (componentType: string) => {
    console.log(`🔧 [useComponentTree] getComponent 被调用:`, {
      componentType,
      isLoading: isLoading.value,
      error: error.value,
      componentTreeData: componentTree.value,
      filteredComponentsCount: filteredComponents.value?.length || 0,
      allFilteredComponents: filteredComponents.value?.map(c => c.type) || []
    })

    // 🔥 调试：如果没有组件，强制重新初始化
    if (filteredComponents.value.length === 0) {
      console.warn(`⚠️ [useComponentTree] 没有可用组件，强制重新初始化...`)
      await initialize()

      console.log(`🔧 [useComponentTree] 重新初始化后:`, {
        componentsCount: filteredComponents.value?.length || 0,
        allComponents: filteredComponents.value?.map(c => c.type) || []
      })
    }

    // 从已注册的组件中查找
    const componentDefinition = filteredComponents.value.find(comp => comp.type === componentType)

    if (!componentDefinition) {
      console.error(`❌ [useComponentTree] 组件类型未找到: ${componentType}`)
      console.log(
        `❌ [useComponentTree] 可用组件:`,
        filteredComponents.value.map(c => c.type)
      )
      console.log(`❌ [useComponentTree] componentTree原始数据:`, componentTree.value)
      return null
    }

    console.log(`✅ [useComponentTree] 找到组件定义:`, {
      type: componentDefinition.type,
      name: componentDefinition.name,
      hasComponent: !!componentDefinition.component,
      componentKeys: componentDefinition.component ? Object.keys(componentDefinition.component) : []
    })

    // 返回组件实例
    return componentDefinition.component
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
    getComponent,
    getComponentsByCategory,
    clearFilters,
    reset
  }
}
