/**
 * Card 2.1 集成 Hook (已废弃)
 * 请使用 @/card2.1/hooks/useVisualEditorIntegration 替代
 *
 * @deprecated 此 Hook 将在未来版本中移除
 */

import { ref, computed, onMounted, shallowRef } from 'vue'
import { useVisualEditorIntegration } from '@/card2.1/hooks/useVisualEditorIntegration'
import type { ComponentDefinition } from '@/card2.1/core/types'
import type { WidgetType, WidgetMeta } from '../types'

// 使用新的集成 Hook
const newIntegration = useVisualEditorIntegration({
  autoInit: true,
  enableI18n: true
})

export interface Card2IntegrationOptions {
  autoInit?: boolean
  componentFilter?: (definition: ComponentDefinition) => boolean
}

export interface Card2Widget extends WidgetMeta {
  definition: ComponentDefinition
  isCard2Component: true
}

/**
 * Card 2.1 集成 Hook (已废弃)
 * 请使用 @/card2.1/hooks/useVisualEditorIntegration 替代
 */
export function useCard2Integration(options: Card2IntegrationOptions = {}) {
  console.warn('⚠️ useCard2Integration 已废弃，请使用 useVisualEditorIntegration 替代')

  // 返回新 Hook 的接口，保持向后兼容
  return {
    // 状态
    isInitialized: newIntegration.isInitialized,
    isLoading: newIntegration.isLoading,
    error: newIntegration.error,

    // 数据
    availableComponents: newIntegration.availableWidgets,

    // 方法
    initialize: newIntegration.initialize,
    isCard2Component: newIntegration.isCard2Component,
    getComponentDefinition: newIntegration.getComponentDefinition,

    // 向后兼容的别名
    availableWidgets: newIntegration.availableWidgets
  }
}
