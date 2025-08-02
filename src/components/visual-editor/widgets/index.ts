/**
 * Widget Components - 组件库入口
 * 导出所有可用的编辑器组件
 */

// 组件导出
export { default as TextWidget } from './TextWidget.vue'
export { default as ImageWidget } from './ImageWidget.vue'

// 组件注册表
import type { WidgetMeta, WidgetType } from '../types'

export const WIDGET_REGISTRY: Record<WidgetType, WidgetMeta> = {
  text: {
    type: 'text',
    name: '文本',
    icon: 'i-mdi-format-text',
    defaultSize: {
      width: 200,
      height: 40
    },
    constraints: {
      minWidth: 50,
      minHeight: 20,
      maxWidth: 800,
      maxHeight: 200
    }
  },
  image: {
    type: 'image',
    name: '图片',
    icon: 'i-mdi-image',
    defaultSize: {
      width: 200,
      height: 150
    },
    constraints: {
      minWidth: 50,
      minHeight: 50,
      maxWidth: 800,
      maxHeight: 600
    }
  }
}

/**
 * 获取组件元信息
 */
export const getWidgetMeta = (type: WidgetType): WidgetMeta | null => {
  return WIDGET_REGISTRY[type] || null
}

/**
 * 获取所有可用组件类型
 */
export const getAvailableWidgets = (): WidgetMeta[] => {
  return Object.values(WIDGET_REGISTRY)
}
