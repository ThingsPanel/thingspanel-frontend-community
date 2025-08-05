/**
 * Data Adapter - 数据适配器
 * 用于将编辑器组件数据适配到PanelV2的BaseCanvasItem结构
 */

import type { BaseCanvasItem, Position } from '@/components/panelv2/types/core'
import { DEFAULT_CONSTRAINTS } from '@/components/panelv2/types/core'
import { generateId } from '@/components/panelv2/utils/id'
import type { WidgetType, TextWidgetConfig, ImageWidgetConfig } from '../types'

/**
 * 生成默认的组件配置
 */
export const getDefaultWidgetConfig = (type: WidgetType): Record<string, any> => {
  switch (type) {
    case 'text':
      return {
        content: '文本内容',
        fontSize: 14,
        color: 'var(--n-text-color)',
        textAlign: 'left',
        fontWeight: 'normal'
      } as TextWidgetConfig

    case 'image':
      return {
        src: '',
        alt: '图片',
        objectFit: 'cover'
      } as ImageWidgetConfig

    default:
      return {}
  }
}

/**
 * 从组件类型创建BaseCanvasItem
 */
export const createCanvasItemFromWidget = (
  type: WidgetType,
  position: Position,
  customConfig?: Record<string, any>
): BaseCanvasItem => {
  const defaultConfig = getDefaultWidgetConfig(type)
  const config = { ...defaultConfig, ...customConfig }

  // 根据类型设置默认尺寸
  const getDefaultSize = (widgetType: WidgetType) => {
    switch (widgetType) {
      case 'text':
        return { width: 200, height: 40 }
      case 'image':
        return { width: 200, height: 150 }
      default:
        return { width: 200, height: 100 }
    }
  }

  return {
    id: generateId(),
    type: 'component',
    position,
    size: getDefaultSize(type),
    constraints: {
      ...DEFAULT_CONSTRAINTS,
      minWidth: type === 'text' ? 50 : 100,
      minHeight: type === 'text' ? 20 : 100
    },
    zIndex: 1,
    visible: true,
    locked: false,
    cardData: {
      cardId: type,
      title: `${type === 'text' ? '文本' : '图片'}组件`,
      type: 'chart',
      config
    },
    rendererData: {
      // 编辑器特有数据可以存储在这里
      editorType: 'visual-editor',
      widgetType: type
    },
    metadata: {
      createdAt: Date.now(),
      updatedAt: Date.now(),
      version: '1.0.0'
    }
  }
}

/**
 * 更新组件配置
 */
export const updateItemConfig = (item: BaseCanvasItem, configUpdates: Record<string, any>): BaseCanvasItem => {
  return {
    ...item,
    cardData: {
      ...item.cardData,
      config: {
        ...item.cardData.config,
        ...configUpdates
      }
    },
    metadata: {
      ...item.metadata,
      updatedAt: Date.now()
    }
  }
}

/**
 * 检查是否为编辑器创建的组件
 */
export const isEditorItem = (item: BaseCanvasItem): boolean => {
  return item.rendererData?.editorType === 'visual-editor'
}

/**
 * 获取组件类型
 */
export const getWidgetType = (item: BaseCanvasItem): WidgetType | null => {
  if (isEditorItem(item)) {
    return (item.rendererData?.widgetType as WidgetType) || null
  }
  return null
}
