/**
 * Card 2.0 组件统一导出文件
 * 提供所有已迁移组件的统一入口
 */

// 图表组件
export { default as barChartDefinition } from './chart/bar/index'
export { default as curveChartDefinition } from './chart/curve/index'
export { default as gaugeDefinition } from './chart/gauge/index'
export { default as tableDefinition } from './chart/table/index'

// 控制组件
export { default as digitSetterDefinition } from './control/digit-setter/index'
export { default as dispatchDataDefinition } from './control/dispatch-data/index'
export { default as enumControlDefinition } from './control/enum-control/index'
export { default as switchDefinition } from './control/switch/index'

// 显示组件
export { default as digitIndicatorDefinition } from './display/digit-indicator/index'
export { default as stateDisplayDefinition } from './display/state-display/index'
export { default as textInfoDefinition } from './display/text-info/index'

// 媒体组件
export { default as videoPlayerDefinition } from './media/video-player/index'

// 组件类型导出
export type { BarChartConfig } from './chart/bar/index'
export type { CurveChartConfig } from './chart/curve/index'
export type { GaugeConfig } from './chart/gauge/index'
export type { TableConfig } from './chart/table/index'

export type { DigitSetterConfig } from './control/digit-setter/index'
export type { DispatchDataConfig } from './control/dispatch-data/index'
export type { EnumControlConfig } from './control/enum-control/index'
export type { SwitchConfig } from './control/switch/index'

export type { DigitIndicatorConfig } from './display/digit-indicator/index'
export type { StateDisplayConfig } from './display/state-display/index'
export type { TextInfoConfig } from './display/text-info/index'

export type { VideoPlayerConfig } from './media/video-player/index'

/**
 * 组件分类映射
 */
export const COMPONENT_CATEGORIES = {
  chart: {
    name: '图表组件',
    description: '用于数据可视化的图表组件',
    components: ['bar-chart', 'curve-chart', 'gauge', 'table']
  },
  control: {
    name: '控制组件',
    description: '用于设备控制和数据输入的组件',
    components: ['digit-setter', 'dispatch-data', 'enum-control', 'switch']
  },
  display: {
    name: '显示组件',
    description: '用于信息展示的组件',
    components: ['digit-indicator', 'state-display', 'text-info']
  },
  media: {
    name: '媒体组件',
    description: '用于媒体播放和展示的组件',
    components: ['video-player']
  }
} as const

/**
 * 所有组件定义的数组
 */
export const ALL_COMPONENT_DEFINITIONS = [
  // 图表组件
  barChartDefinition,
  curveChartDefinition,
  gaugeDefinition,
  tableDefinition,

  // 控制组件
  digitSetterDefinition,
  dispatchDataDefinition,
  enumControlDefinition,
  switchDefinition,

  // 显示组件
  digitIndicatorDefinition,
  stateDisplayDefinition,
  textInfoDefinition,

  // 媒体组件
  videoPlayerDefinition
]

/**
 * 组件统计信息
 */
export const COMPONENT_STATS = {
  total: ALL_COMPONENT_DEFINITIONS.length,
  byCategory: {
    chart: 4,
    control: 4,
    display: 3,
    media: 1
  }
}

/**
 * 根据分类获取组件定义
 */
export function getComponentsByCategory(category: keyof typeof COMPONENT_CATEGORIES) {
  switch (category) {
    case 'chart':
      return [barChartDefinition, curveChartDefinition, gaugeDefinition, tableDefinition]
    case 'control':
      return [digitSetterDefinition, dispatchDataDefinition, enumControlDefinition, switchDefinition]
    case 'display':
      return [digitIndicatorDefinition, stateDisplayDefinition, textInfoDefinition]
    case 'media':
      return [videoPlayerDefinition]
    default:
      return []
  }
}

/**
 * 根据组件ID获取组件定义
 */
export function getComponentById(componentId: string) {
  return ALL_COMPONENT_DEFINITIONS.find(def => def.id === componentId)
}

/**
 * 搜索组件
 */
export function searchComponents(query: string) {
  const lowerQuery = query.toLowerCase()
  return ALL_COMPONENT_DEFINITIONS.filter(
    def =>
      def.id.toLowerCase().includes(lowerQuery) ||
      def.name.toLowerCase().includes(lowerQuery) ||
      def.description?.toLowerCase().includes(lowerQuery) ||
      def.tags?.some(tag => tag.toLowerCase().includes(lowerQuery))
  )
}

/**
 * 验证组件定义
 */
export function validateComponentDefinition(definition: any): boolean {
  return !!(definition?.id && definition?.name && definition?.component)
}

/**
 * 获取组件元数据
 */
export function getComponentMetadata() {
  return ALL_COMPONENT_DEFINITIONS.map(def => ({
    id: def.id,
    name: def.name,
    version: def.version,
    description: def.description,
    category: def.category,
    tags: def.tags,
    author: def.author,
    icon: def.icon,
    thumbnail: def.thumbnail
  }))
}

/**
 * 导出默认对象
 */
export default {
  definitions: ALL_COMPONENT_DEFINITIONS,
  categories: COMPONENT_CATEGORIES,
  stats: COMPONENT_STATS,
  getComponentsByCategory,
  getComponentById,
  searchComponents,
  validateComponentDefinition,
  getComponentMetadata
}
