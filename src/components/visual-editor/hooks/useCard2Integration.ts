/**
 * Card 2.1 集成 Hook
 * 提供 Visual Editor 与 Card 2.1 的桥接功能
 */

import { ref, computed, onMounted, shallowRef } from 'vue'
import componentRegistry from '@/card2.1'
import type { IComponentDefinition } from '@/card2.1/core'
import type { WidgetType, WidgetMeta } from '../types'

export interface Card2IntegrationOptions {
  autoInit?: boolean
  componentFilter?: (definition: IComponentDefinition) => boolean
}

export interface Card2Widget extends WidgetMeta {
  definition: IComponentDefinition
  isCard2Component: true
}

// 使用 shallowRef 避免不必要的深度响应 (单例模式的状态)
const isInitialized = shallowRef(false)
const isLoading = shallowRef(false)
const error = shallowRef<string | null>(null)
const availableComponents = shallowRef<Card2Widget[]>([])

/**
 * Card 2.1 集成 Hook (单例模式)
 */
export function useCard2Integration(options: Card2IntegrationOptions = {}) {
  const { autoInit = true, componentFilter = () => true } = options

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
      const definitions = componentRegistry.getAll().filter(componentFilter)

      availableComponents.value = definitions.map(definition => {
        const meta = definition.meta || {} // 容错处理
        return {
          type: definition.id as WidgetType,
          name: meta.title || meta.name || definition.id, // 提供多重后备
          description: meta.description || '', // 提供空字符串后备
          icon: meta.icon, // icon 可以为 undefined
          category: meta.category,
          version: meta.version,
          isCard2Component: true,
          definition
        }
      })

      console.log(`✅ 加载了 ${availableComponents.value.length} 个 Card 2.1 组件。`)
    } catch (err) {
      console.error('❌ 加载 Card 2.1 组件失败:', err)
      availableComponents.value = []
    }
  }

  const isCard2Component = (type: string): boolean => {
    return availableComponents.value.some(widget => widget.type === type)
  }

  const getComponentDefinition = (type: string): IComponentDefinition | undefined => {
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
    availableComponents: computed(() => availableComponents.value),
    getComponentsByCategory,
    initialize,
    isCard2Component,
    getComponentDefinition // <--- 确保导出这个函数
  }
}
