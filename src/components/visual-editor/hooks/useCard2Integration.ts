/**
 * Card 2.1 集成 Hook
 * 提供 Visual Editor 与 Card 2.1 的桥接功能
 */

import { ref, computed, onMounted, shallowRef } from 'vue'
import componentRegistry from '@/card2.1'
import type { ComponentDefinition } from '@/card2.1/core/types'
import type { WidgetType, WidgetMeta } from '../types'
import { $t } from '@/locales'

// 组件ID到国际化键的映射
const COMPONENT_I18N_KEYS: Record<string, string> = {
  // Display 类组件 (从 builtin-card 迁移)
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

  // Chart 类组件 (从 builtin-card 和 chart-card 迁移)
  'online-trend': 'card.onlineTrend',
  'system-metrics-history': 'card.systemMetricsHistory.title',
  'tenant-chart': 'card.tenantChart.title',
  'chart-bar': 'card.barChart',
  'chart-curve': 'card.curve',
  'chart-digit': 'card.digitalIndicator',

  // Card 2.1 组件
  'digit-indicator': 'card.digitalIndicator',
  'multi-data-test': '多数据测试'
}

export interface Card2IntegrationOptions {
  autoInit?: boolean
  componentFilter?: (definition: ComponentDefinition) => boolean
}

export interface Card2Widget extends WidgetMeta {
  definition: ComponentDefinition
  isCard2Component: true
}

// 使用 shallowRef 避免不必要的深度响应 (单例模式的状态)
const isInitialized = shallowRef(false)
const isLoading = shallowRef(false)
const error = shallowRef<string | null>(null)
const registeredDefinitions = shallowRef<ComponentDefinition[]>([])

/**
 * Card 2.1 集成 Hook (单例模式)
 */
export function useCard2Integration(options: Card2IntegrationOptions = {}) {
  const { autoInit = true, componentFilter = () => true } = options

  // 将 availableComponents 改为响应式计算属性，以支持国际化切换
  const availableComponents = computed(() => {
    return registeredDefinitions.value.map(definition => {
      // 优先使用动态国际化翻译，回退到静态标题
      const i18nKey = COMPONENT_I18N_KEYS[definition.type]
      const displayName = i18nKey ? $t(i18nKey as any) : definition.name

      const widget = {
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

      // 调试图标信息
      console.log(`🎨 组件 ${definition.type} 图标信息:`, {
        type: definition.type,
        icon: definition.icon,
        iconType: typeof definition.icon,
        hasIcon: !!definition.icon,
        iconName: typeof definition.icon === 'object' ? definition.icon?.name : 'string'
      })

      return widget
    })
  })

  const initialize = async () => {
    if (isInitialized.value) return

    try {
      isLoading.value = true
      error.value = null
      console.log('🚀 初始化 Card 2.1 集成...')

      await loadAvailableComponents()

      isInitialized.value = true
      console.log('✅ Card 2.1 集成初始化完成')
    } catch (err: any) {
      error.value = err.message || '初始化失败'
      console.error('❌ Card 2.1 集成初始化失败:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const loadAvailableComponents = async () => {
    try {
      // 确保 Card 2.1 组件已经被注册
      console.log('🔍 检查 Card 2.1 注册表状态...')
      const allComponents = componentRegistry.getAll()
      console.log(
        'Card 2.1 注册表中的组件:',
        allComponents.map(c => ({ type: c.type, name: c.name }))
      )

      const definitions = allComponents.filter(componentFilter)
      registeredDefinitions.value = definitions
      console.log(`✅ 加载了 ${definitions.length} 个 Card 2.1 组件。`)
      console.log(
        '加载的组件详情:',
        definitions.map(d => ({ type: d.type, name: d.name, category: d.category }))
      )

      // 检查每个组件的详细信息
      definitions.forEach(def => {
        console.log(`🔍 组件 ${def.type} 详细信息:`, {
          type: def.type,
          name: def.name,
          category: def.category,
          hasComponent: !!def.component,
          hasConfigComponent: !!def.configComponent,
          properties: def.properties,
          dataSourceDefinitions: def.dataSourceDefinitions
        })
      })
    } catch (err) {
      console.error('❌ 加载 Card 2.1 组件失败:', err)
      registeredDefinitions.value = []
    }
  }

  const isCard2Component = (type: string): boolean => {
    return availableComponents.value.some(widget => widget.type === type)
  }

  const getComponentDefinition = (type: string): ComponentDefinition | undefined => {
    const widget = availableComponents.value.find(w => w.type === type)
    return widget?.definition
  }

  const getComponentsByCategory = computed(() => {
    const categories: Record<string, Card2Widget[]> = {}

    availableComponents.value.forEach(widget => {
      const category = widget.category || 'other'
      if (!categories[category]) {
        categories[category] = []
      }
      categories[category].push(widget)
    })

    return categories
  })

  if (autoInit && !isInitialized.value) {
    onMounted(() => {
      initialize().catch(console.error)
    })
  }

  return {
    isInitialized: computed(() => isInitialized.value),
    isLoading: computed(() => isLoading.value),
    error: computed(() => error.value),
    availableComponents, // 现在是计算属性，会响应语言变化
    getComponentsByCategory,
    initialize,
    isCard2Component,
    getComponentDefinition
  }
}
