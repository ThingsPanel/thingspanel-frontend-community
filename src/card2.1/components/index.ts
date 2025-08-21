/**
 * Card 2.1 组件统一导出
 * 为编辑器集成提供标准化组件接口
 * 重构后只包含按照新数据源架构开发的组件
 */

import type { ComponentDefinition } from '../core/types'

// 导入新架构组件定义
import dualDataDisplayDefinition from './dual-data-display'

// ============ 组件注册表 ============

/**
 * 所有可用的 Card 2.1 组件定义
 * 重构后只包含按照新数据源架构开发的组件
 */
export const Card2Components: Record<string, ComponentDefinition[]> = {
  // 数据源测试分类
  数据源测试: [dualDataDisplayDefinition]
}

/**
 * 扁平化的组件映射表
 * 供编辑器快速查找组件定义
 */
export const Card2ComponentMap: Record<string, ComponentDefinition> = {
  'dual-data-display': dualDataDisplayDefinition
}

/**
 * 组件类型数组
 * 供编辑器枚举所有可用组件
 */
export const Card2ComponentTypes = Object.keys(Card2ComponentMap)

// ============ 编辑器集成工具函数 ============

/**
 * 根据类型获取组件定义
 * @param type 组件类型
 * @returns 组件定义或 undefined
 */
export function getComponentDefinition(type: string): ComponentDefinition | undefined {
  return Card2ComponentMap[type]
}

/**
 * 获取指定分类下的所有组件
 * @param category 组件分类
 * @returns 该分类下的组件定义数组
 */
export function getComponentsByCategory(category: string): ComponentDefinition[] {
  return Card2Components[category] || []
}

/**
 * 获取所有组件定义
 * @returns 所有组件定义数组
 */
export function getAllComponents(): ComponentDefinition[] {
  return Object.values(Card2ComponentMap)
}

/**
 * 根据标签筛选组件
 * @param tags 标签数组
 * @returns 匹配标签的组件定义数组
 */
export function getComponentsByTags(tags: string[]): ComponentDefinition[] {
  return getAllComponents().filter(component => component.tags && tags.some(tag => component.tags!.includes(tag)))
}

/**
 * 检查组件是否支持特定数据源类型
 * @param componentType 组件类型
 * @param dataSourceType 数据源类型
 * @returns 是否支持
 */
export function isDataSourceSupported(componentType: string, dataSourceType: string): boolean {
  const definition = getComponentDefinition(componentType)
  return definition?.supportedDataSources?.includes(dataSourceType) || false
}

// ============ 组件元数据统计 ============

/**
 * 组件统计信息
 */
export const ComponentStats = {
  total: Card2ComponentTypes.length,
  categories: Object.keys(Card2Components),
  byCategory: Object.fromEntries(
    Object.entries(Card2Components).map(([category, components]) => [category, components.length])
  ),
  supportedDataSources: Array.from(new Set(getAllComponents().flatMap(c => c.supportedDataSources || []))),
  versions: Array.from(
    new Set(
      getAllComponents()
        .map(c => c.version)
        .filter(Boolean)
    )
  )
}

// ============ 单独导出组件定义 ============

// 新架构组件导出
export { default as dualDataDisplayDefinition } from './dual-data-display'

// 默认导出主要接口
export default {
  components: Card2ComponentMap,
  categories: Card2Components,
  types: Card2ComponentTypes,
  stats: ComponentStats,
  getComponentDefinition,
  getComponentsByCategory,
  getAllComponents,
  getComponentsByTags,
  isDataSourceSupported
}
