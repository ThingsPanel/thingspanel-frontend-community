/**
 * Card 2.1 Visual Editor 集成 Hook
 * 提供与 Visual Editor 的桥接功能
 */

import { computed, ref } from 'vue'
import { initializeCard2System, getComponentRegistry } from '../index'
import { useComponentTree } from './useComponentTree'
import type { ComponentDefinition } from '../core/types'
import type { WidgetType, WidgetMeta } from '@/components/visual-editor/types'
import { $t } from '@/locales'

export interface VisualEditorIntegrationOptions {
  autoInit?: boolean
  componentFilter?: (definition: ComponentDefinition) => boolean
  enableI18n?: boolean
}

export interface Card2Widget extends WidgetMeta {
  definition: ComponentDefinition
  isCard2Component: true
}

// 组件ID到国际化键的映射
const COMPONENT_I18N_KEYS: Record<string, string> = {
  // Display 类组件
  'version-info': 'card.version',
  'access-num': 'card.deviceTotal',
  'alarm-count': 'card.alarmCount',
  'alarm-info': 'card.alarmInfo',
  'app-download': 'card.appDownload',
  'cpu-usage': 'card.cpuUsage',
  'disk-usage': 'card.diskUsage',
  'memory-usage': 'card.memoryUsage',
  information: 'card.information',
  news: 'card.news',
  'off-line': 'card.offlineDeviceCount',
  'on-line': 'card.onlineDeviceCount',
  'operation-guide-card': 'card.operationGuide',
  'recently-visited': 'card.recentlyVisited.title',
  'reported-data': 'card.reportedData.title',
  'tenant-count': 'card.tenantCount.title',

  // Chart 类组件
  'online-trend': 'card.onlineTrend',
  'system-metrics-history': 'card.systemMetricsHistory.title',
  'tenant-chart': 'card.tenantChart.title',
  'chart-bar': 'card.barChart',
  'chart-curve': 'card.curve',
  'chart-digit': 'card.digitalIndicator',

  // Card 2.1 组件
  'digit-indicator': 'card.digitalIndicator',
  'multi-data-test': '多数据测试',
  'bar-chart': 'card.barChart'
}

export function useVisualEditorIntegration(options: VisualEditorIntegrationOptions = {}) {
  const { autoInit = true, componentFilter = () => true, enableI18n = true } = options

  // 使用组件树 Hook
  const componentTree = useComponentTree({
    autoInit,
    filter: componentFilter
  })

  // 初始化状态
  const isInitialized = ref(false)
  const initializationError = ref<string | null>(null)

  /**
   * 初始化集成
   */
  const initialize = async () => {
    if (isInitialized.value) return

    try {
      await initializeCard2System()
      await componentTree.initialize()
      isInitialized.value = true
      console.log('🎯 [VisualEditorIntegration] 集成初始化完成')
    } catch (error) {
      initializationError.value = error instanceof Error ? error.message : '初始化失败'
      console.error('❌ [VisualEditorIntegration] 集成初始化失败:', error)
      throw error
    }
  }

  /**
   * 将 Card 2.1 组件转换为 Visual Editor Widget
   */
  const availableWidgets = computed(() => {
    if (!isInitialized.value) return []

    return componentTree.filteredComponents.map(definition => {
      // 获取显示名称（支持国际化）
      let displayName = definition.name
      if (enableI18n) {
        const i18nKey = COMPONENT_I18N_KEYS[definition.type]
        if (i18nKey) {
          try {
            displayName = $t(i18nKey as any) || definition.name
          } catch {
            // 国际化失败，使用默认名称
            displayName = definition.name
          }
        }
      }

      const widget: Card2Widget = {
        type: definition.type as WidgetType,
        name: displayName,
        description: definition.description || '',
        icon: definition.icon,
        category: definition.category,
        version: '2.1.0',
        source: 'card2' as const,
        isCard2Component: true as const,
        definition
      }

      return widget
    })
  })

  /**
   * 检查是否为 Card 2.1 组件
   */
  const isCard2Component = (type: string): boolean => {
    return componentTree.filteredComponents.some(comp => comp.type === type)
  }

  /**
   * 获取组件定义
   */
  const getComponentDefinition = (type: string): ComponentDefinition | undefined => {
    return componentTree.filteredComponents.find(comp => comp.type === type)
  }

  /**
   * 按分类获取组件
   */
  const getWidgetsByCategory = (mainCategory?: string, subCategory?: string) => {
    const components = componentTree.getComponentsByCategory(mainCategory, subCategory)
    return components.map(definition => {
      const i18nKey = COMPONENT_I18N_KEYS[definition.type]
      const displayName = enableI18n && i18nKey ? $t(i18nKey as any) : definition.name

      return {
        type: definition.type as WidgetType,
        name: displayName,
        description: definition.description || '',
        icon: definition.icon,
        category: definition.category,
        version: '2.1.0',
        source: 'card2' as const,
        isCard2Component: true as const,
        definition
      } as Card2Widget
    })
  }

  /**
   * 搜索组件
   */
  const searchWidgets = (query: string) => {
    componentTree.searchQuery.value = query
    return availableWidgets.value
  }

  /**
   * 获取组件统计信息
   */
  const getStats = computed(() => {
    const components = componentTree.filteredComponents
    const stats = {
      total: components.length,
      byCategory: {} as Record<string, number>,
      bySubCategory: {} as Record<string, number>
    }

    components.forEach(comp => {
      // 统计主分类
      const mainCat = comp.mainCategory || '未分类'
      stats.byCategory[mainCat] = (stats.byCategory[mainCat] || 0) + 1

      // 统计子分类
      const subCat = comp.subCategory || '未分类'
      stats.bySubCategory[subCat] = (stats.bySubCategory[subCat] || 0) + 1
    })

    return stats
  })

  return {
    // 状态
    isInitialized: readonly(isInitialized),
    initializationError: readonly(initializationError),
    isLoading: componentTree.isLoading,
    error: componentTree.error,

    // 数据
    availableWidgets,
    componentTree: componentTree.componentTree,
    filteredComponents: componentTree.filteredComponents,
    categories: componentTree.categories,

    // 方法
    initialize,
    isCard2Component,
    getComponentDefinition,
    getWidgetsByCategory,
    searchWidgets,
    getStats,

    // 筛选控制
    searchQuery: componentTree.searchQuery,
    selectedMainCategory: componentTree.selectedMainCategory,
    selectedSubCategory: componentTree.selectedSubCategory,
    clearFilters: componentTree.clearFilters,
    reset: componentTree.reset
  }
}
