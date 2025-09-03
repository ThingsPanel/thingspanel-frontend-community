/**
 * Card 2.1 Visual Editor 集成 Hook
 * 提供与 Visual Editor 的桥接功能
 */

import { computed, ref, readonly, onMounted } from 'vue'
import { initializeCard2System, getComponentRegistry } from '../index'
import { useComponentTree } from './useComponentTree'
import type { ComponentDefinition } from '../core/types'
import type { WidgetType, WidgetDefinition } from '@/components/visual-editor/types'
import { $t } from '@/locales'
import { registerUniversalDataVizConfig } from '../components/universal-data-viz/register-config'

export interface VisualEditorIntegrationOptions {
  autoInit?: boolean
  componentFilter?: (definition: ComponentDefinition) => boolean
  enableI18n?: boolean
}

export interface Card2Widget extends WidgetDefinition {
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
  'bar-chart': 'card.barChart',
  'universal-data-viz': '通用数据可视化'
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

  // 自动初始化
  if (autoInit) {
    onMounted(() => {
      initialize()
    })
  }

  /**
   * 初始化集成
   */
  const initialize = async () => {
    if (isInitialized.value) return

    try {
      await initializeCard2System()
      await componentTree.initialize()

      // 注意：组件数据需求注册现在由 Card2.1 系统统一处理
      // registerUniversalDataVizConfig() - 已移至 Card2.1 系统初始化中

      isInitialized.value = true
    } catch (error) {
      initializationError.value = error instanceof Error ? error.message : '初始化失败'
      throw error
    }
  }

  /**
   * 将 Card 2.1 组件转换为 Visual Editor Widget
   */
  const availableWidgets = computed(() => {
    if (!isInitialized.value) {
      return []
    }

    const components = componentTree.filteredComponents.value
    if (!Array.isArray(components)) {
      return []
    }

    // 特别检查是否包含 universal-data-viz
    const hasUniversalDataViz = components.some(comp => comp.type === 'universal-data-viz')
    return components.map(definition => {
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
        definition,

        // ✅ 添加 Visual Editor 所需的布局配置
        defaultLayout: {
          canvas: {
            width: definition.config?.style?.width || 300,
            height: definition.config?.style?.height || 200
          },
          gridstack: {
            w: Math.ceil((definition.config?.style?.width || 300) / 150), // 网格单元宽度
            h: Math.ceil((definition.config?.style?.height || 200) / 150) // 网格单元高度
          }
        },

        // ✅ 添加默认属性配置
        defaultProperties: definition.config || {},

        // ✅ 添加元数据
        metadata: {
          isCard2Component: true,
          card2ComponentId: definition.type,
          card2Definition: definition,
          card2Data: null // 将在数据绑定时填充
        }
      }

      return widget
    })
  })

  /**
   * 检查是否为 Card 2.1 组件
   */
  const isCard2Component = (type: string): boolean => {
    const components = componentTree.filteredComponents.value
    return Array.isArray(components) && components.some(comp => comp.type === type)
  }

  /**
   * 获取组件定义 - 返回转换后的 WidgetDefinition
   */
  /**
   * 获取组件实例
   */
  const getComponent = (type: string) => {
    const registry = getComponentRegistry()
    const componentDef = registry.get(type)
    return componentDef ? componentDef.component : null
  }

  const getComponentDefinition = (type: string): Card2Widget | undefined => {
    // ✅ 修复：从转换后的 availableWidgets 中查找，而不是原始的 componentTree
    return availableWidgets.value.find(widget => widget.type === type)
  }

  /**
   * 按分类获取组件
   */
  const getWidgetsByCategory = (mainCategory?: string, subCategory?: string) => {
    const components = componentTree.getComponentsByCategory(mainCategory, subCategory)
    if (!Array.isArray(components)) return []

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
    const components = componentTree.filteredComponents.value
    const stats = {
      total: Array.isArray(components) ? components.length : 0,
      byCategory: {} as Record<string, number>,
      bySubCategory: {} as Record<string, number>
    }

    if (Array.isArray(components)) {
      components.forEach(comp => {
        // 统计主分类
        const mainCat = comp.mainCategory || '未分类'
        stats.byCategory[mainCat] = (stats.byCategory[mainCat] || 0) + 1

        // 统计子分类
        const subCat = comp.subCategory || '未分类'
        stats.bySubCategory[subCat] = (stats.bySubCategory[subCat] || 0) + 1
      })
    }

    return stats
  })

  /**
   * 获取集成状态
   */
  const getStatus = () => {
    return {
      isInitialized: isInitialized.value,
      isLoading: componentTree.isLoading.value,
      error: componentTree.error.value,
      componentCount: Array.isArray(componentTree.filteredComponents.value)
        ? componentTree.filteredComponents.value.length
        : 0,
      componentTree: componentTree.componentTree.value
    }
  }

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
    getComponent,
    getWidgetsByCategory,
    searchWidgets,
    getStats,
    getStatus,

    // 筛选控制
    searchQuery: componentTree.searchQuery,
    selectedMainCategory: componentTree.selectedMainCategory,
    selectedSubCategory: componentTree.selectedSubCategory,
    clearFilters: componentTree.clearFilters,
    reset: componentTree.reset
  }
}
