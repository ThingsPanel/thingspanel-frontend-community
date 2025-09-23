/**
 * Visual Editor 集成配置
 * 为 Card 2.1 组件提供编辑器集成的标准配置
 */

import type { ComponentDefinition } from '@/card2.1/types'
import { Card2ComponentMap, Card2Components, ComponentStats } from '@/card2.1/components'

// ============ 编辑器组件转换器 ============

/**
 * Card2Widget 接口定义（与Visual Editor兼容）
 */
export interface Card2Widget {
  type: string
  name: string
  category: string
  icon: string
  description: string
  version?: string
  tags?: string[]

  // 编辑器布局配置
  defaultLayout: {
    canvas: {
      width: number
      height: number
      x?: number
      y?: number
    }
    gridstack: {
      w: number // 栅格宽度
      h: number // 栅格高度
      minW?: number
      minH?: number
      maxW?: number
      maxH?: number
    }
  }

  // 默认属性配置
  defaultProperties: Record<string, any>

  // 元数据
  metadata: {
    isCard2Component: boolean
    card2ComponentId: string
    card2Definition: ComponentDefinition
    supportedDataSources?: string[]
    examples?: Array<{
      name: string
      description: string
      config: Record<string, any>
    }>
  }
}

/**
 * 将 Card 2.1 ComponentDefinition 转换为 Visual Editor Widget
 * @param definition Card 2.1 组件定义
 * @returns Visual Editor 兼容的组件配置
 */
export function convertToCard2Widget(definition: ComponentDefinition): Card2Widget {
  // 计算默认布局尺寸
  const defaultWidth = definition.config?.style?.width || definition.defaultSize?.width || 300
  const defaultHeight = definition.config?.style?.height || definition.defaultSize?.height || 200

  return {
    type: definition.type,
    name: definition.name,
    category: definition.mainCategory || definition.category,
    icon: definition.icon,
    description: definition.description,
    version: definition.version,
    tags: definition.tags,

    // 布局配置转换
    defaultLayout: {
      canvas: {
        width: defaultWidth,
        height: defaultHeight,
        x: 0,
        y: 0
      },
      gridstack: {
        w: Math.ceil(defaultWidth / 100), // 假设每个栅格单元100px宽
        h: Math.ceil(defaultHeight / 100),
        minW: definition.minSize ? Math.ceil(definition.minSize.width / 100) : 2,
        minH: definition.minSize ? Math.ceil(definition.minSize.height / 100) : 2,
        maxW: 12,
        maxH: 8
      }
    },

    // 默认属性配置
    defaultProperties: definition.config || {},

    // 组件元数据
    metadata: {
      isCard2Component: true,
      card2ComponentId: definition.type,
      card2Definition: definition,
      supportedDataSources: definition.supportedDataSources,
      examples: definition.examples
    }
  }
}

// ============ 可用组件转换 ============

/**
 * 所有 Card 2.1 组件的 Visual Editor 兼容配置
 */
export const AvailableCard2Widgets: Card2Widget[] = Object.values(Card2ComponentMap).map(convertToCard2Widget)

/**
 * 按分类组织的组件配置
 */
export const Card2WidgetsByCategory: Record<string, Card2Widget[]> = Object.fromEntries(
  Object.entries(Card2Components).map(([category, definitions]) => [category, definitions.map(convertToCard2Widget)])
)

// ============ 编辑器集成工具函数 ============

/**
 * 根据组件类型获取 Widget 配置
 * @param type 组件类型
 * @returns Widget 配置或 undefined
 */
export function getCard2Widget(type: string): Card2Widget | undefined {
  const definition = Card2ComponentMap[type]
  return definition ? convertToCard2Widget(definition) : undefined
}

/**
 * 检查是否为 Card 2.1 组件
 * @param type 组件类型
 * @returns 是否为 Card 2.1 组件
 */
export function isCard2Component(type: string): boolean {
  return type in Card2ComponentMap
}

/**
 * 获取组件的原始 Card 2.1 定义
 * @param type 组件类型
 * @returns 原始组件定义
 */
export function getCard2Definition(type: string): ComponentDefinition | undefined {
  return Card2ComponentMap[type]
}

/**
 * 根据支持的数据源类型筛选组件
 * @param dataSourceType 数据源类型
 * @returns 支持该数据源的组件列表
 */
export function getWidgetsByDataSource(dataSourceType: string): Card2Widget[] {
  return AvailableCard2Widgets.filter(widget => widget.metadata.supportedDataSources?.includes(dataSourceType))
}

// ============ 编辑器集成配置 ============

/**
 * Visual Editor 集成的主配置
 */
export const VisualEditorIntegrationConfig = {
  // 组件相关
  widgets: AvailableCard2Widgets,
  categories: Card2WidgetsByCategory,
  componentCount: ComponentStats.total,

  // 工具函数
  getWidget: getCard2Widget,
  isCard2Component,
  getDefinition: getCard2Definition,
  getWidgetsByDataSource,

  // 编辑器特定配置
  editorSettings: {
    // 组件面板标题
    panelTitle: 'Card 2.1 组件',

    // 默认组件大小
    defaultComponentSize: {
      width: 300,
      height: 200
    },

    // 栅格系统配置
    gridConfig: {
      cellHeight: 100,
      cellWidth: 100,
      // 默认无间距：从 [10, 10] 调整为 [0, 0]
      margin: [0, 0],
      outerMargin: true,
      resizable: true,
      draggable: true
    },

    // 支持的渲染器
    supportedRenderers: ['canvas', 'gridstack', 'grid-layout-plus'],

    // 组件预览设置
    previewSettings: {
      showInteractionIndicator: true,
      enableDebugMode: true,
      autoStartDataSimulator: true
    }
  },

  // 版本信息
  version: '2.1.0',
  compatibleEditorVersions: ['>=1.0.0'],

  // 统计信息
  stats: ComponentStats
}

// ============ 默认导出 ============

export default VisualEditorIntegrationConfig
