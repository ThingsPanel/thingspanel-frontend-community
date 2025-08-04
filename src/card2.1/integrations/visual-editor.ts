/**
 * Card2.1 与 Visual Editor 的集成桥接器
 * 自动将 Card2.1 组件注册到 Visual Editor 的组件注册表中
 */

import { widgetRegistry, type WidgetDefinition } from '@/components/visual-editor/core/widget-registry'
import { cardRegistry, type CardComponent } from '../core/registry'
import { createLogger } from '@/utils/logger'

const logger = createLogger('Card21VisualEditorBridge')

/**
 * 将 Card2.1 组件转换为 Visual Editor 组件定义
 */
function convertCard21ToWidget(card: CardComponent): WidgetDefinition {
  return {
    type: `card21-${card.id}`,
    name: card.name,
    description: `Card2.1 组件: ${card.name}`,
    icon: 'mdi:card-text', // 默认图标，后续可以优化
    category: 'card21', // 新增 Card2.1 分类
    version: '2.1.0',
    defaultProperties: {
      // 从组件配置中提取默认属性
      content: card.id === 'text' ? '文本内容' : '',
      fontSize: 16,
      color: '#333'
    },
    defaultLayout: {
      canvas: {
        width: 200,
        height: 100
      },
      gridstack: {
        w: 4,
        h: 2
      }
    },
    metadata: {
      card21Id: card.id,
      hasConfig: !!card.config,
      poster: card.poster
    }
  }
}

/**
 * 将所有 Card2.1 组件注册到 Visual Editor
 */
export function registerCard21ComponentsToVisualEditor() {
  const cards = cardRegistry.getAll()
  const widgets: WidgetDefinition[] = []

  for (const card of cards) {
    const widget = convertCard21ToWidget(card)
    widgets.push(widget)
    logger.info(`转换 Card2.1 组件到 Visual Editor: ${card.id} -> ${widget.type}`)
  }

  if (widgets.length > 0) {
    widgetRegistry.register(...widgets)
    logger.info(`成功注册 ${widgets.length} 个 Card2.1 组件到 Visual Editor`)
  } else {
    logger.warn('没有找到 Card2.1 组件需要注册')
  }

  return widgets
}

/**
 * 监听 Card2.1 组件注册，自动同步到 Visual Editor
 */
export function setupAutoSync() {
  // 这里可以添加监听器，当有新的 Card2.1 组件注册时自动同步
  // 暂时先手动调用
  logger.info('Card2.1 与 Visual Editor 自动同步已设置')
}

/**
 * 获取 Card2.1 组件的配置组件
 */
export function getCard21ConfigComponent(widgetType: string) {
  // 从 widget type 中提取 card21 id
  const card21Id = widgetType.replace('card21-', '')
  const card = cardRegistry.get(card21Id)
  return card?.config
}

/**
 * 获取 Card2.1 组件的主体组件
 */
export function getCard21MainComponent(widgetType: string) {
  const card21Id = widgetType.replace('card21-', '')
  const card = cardRegistry.get(card21Id)
  return card?.component
}
