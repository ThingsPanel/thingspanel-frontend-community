/**
 * Card 2.1 组件统一导出
 * 使用自动注册系统，无需手动维护组件列表
 * 支持动态发现和注册所有符合规范的组件
 */

import type { ComponentDefinition } from '@/card2.1/types'
import { autoRegistry } from '@/card2.1/components/auto-registry'
import { ComponentRegistry } from '@/card2.1/core/component-registry'

// ============ 自动化组件注册表 ============

/**
 * 确保自动注册系统已初始化
 * 在首次访问时自动初始化
 */
async function ensureInitialized(): Promise<void> {
  await autoRegistry.initialize()
}

/**
 * 所有可用的 Card 2.1 组件定义（按分类）
 * 动态从自动注册表获取，支持热重载
 */
export const Card2Components = new Proxy({} as Record<string, ComponentDefinition[]>, {
  get(target, prop: string) {
    if (typeof prop !== 'string') return undefined
    return autoRegistry.getComponentsByCategory(prop)
  },
  ownKeys() {
    return autoRegistry.getAllCategories()
  },
  has(target, prop: string) {
    return autoRegistry.getAllCategories().includes(prop)
  }
})

/**
 * 扁平化的组件映射表
 * 供编辑器快速查找组件定义，动态生成
 */
export const Card2ComponentMap = new Proxy({} as Record<string, ComponentDefinition>, {
  get(target, prop: string) {
    if (typeof prop !== 'string') return undefined
    return autoRegistry.getComponentDefinition(prop)
  },
  ownKeys() {
    return autoRegistry.getAllComponentTypes()
  },
  has(target, prop: string) {
    return autoRegistry.getComponentDefinition(prop) !== undefined
  }
})

/**
 * 组件类型数组
 * 供编辑器枚举所有可用组件，动态生成
 */
export const Card2ComponentTypes = new Proxy([] as string[], {
  get(target, prop) {
    if (prop === 'length') return autoRegistry.getAllComponentTypes().length
    if (prop === Symbol.iterator) {
      return function* () {
        yield* autoRegistry.getAllComponentTypes()
      }
    }
    if (typeof prop === 'string' && /^\d+$/.test(prop)) {
      const index = parseInt(prop)
      return autoRegistry.getAllComponentTypes()[index]
    }
    const types = autoRegistry.getAllComponentTypes()
    return (types as any)[prop]
  }
})

// ============ 编辑器集成工具函数 ============

/**
 * 获取组件树结构
 * 用于 useComponentTree Hook 的数据源
 */
export function getComponentTree() {
  const components = autoRegistry.getAllComponents()
  const categories = autoRegistry.getAllCategories()

  if (process.env.NODE_ENV === 'development') {
  }

  // 过滤掉无效组件
  const validComponents = components.filter(comp => comp && comp.type && comp.name)
  if (components.length !== validComponents.length) {
    console.error(
      `❌ [getComponentTree] 发现 ${components.length - validComponents.length} 个无效组件`,
      components.filter(comp => !comp || !comp.type || !comp.name)
    )
  }

  return {
    components: validComponents,
    categories: categories.map(category => ({
      name: category,
      components: autoRegistry.getComponentsByCategory(category).filter(comp => comp && comp.type && comp.name)
    })),
    totalCount: validComponents.length
  }
}

/**
 * 获取所有分类
 * 用于组件树筛选和分类显示
 */
export function getCategories() {
  return autoRegistry.getAllCategories()
}

/**
 * 根据类型获取组件定义
 * @param type 组件类型
 * @returns 组件定义或 undefined
 */
export function getComponentDefinition(type: string): ComponentDefinition | undefined {
  return autoRegistry.getComponentDefinition(type)
}

/**
 * 获取指定分类下的所有组件
 * @param category 组件分类
 * @returns 该分类下的组件定义数组
 */
export function getComponentsByCategory(category: string): ComponentDefinition[] {
  return autoRegistry.getComponentsByCategory(category)
}

/**
 * 获取所有组件定义
 * @returns 所有组件定义数组
 */
export function getAllComponents(): ComponentDefinition[] {
  return autoRegistry.getAllComponents()
}

/**
 * 根据标签筛选组件
 * @param tags 标签数组
 * @returns 匹配标签的组件定义数组
 */
export function getComponentsByTags(tags: string[]): ComponentDefinition[] {
  return autoRegistry.getComponentsByTags(tags)
}

/**
 * 检查组件是否支持特定数据源类型
 * @param componentType 组件类型
 * @param dataSourceType 数据源类型
 * @returns 是否支持
 */
export function isDataSourceSupported(componentType: string, dataSourceType: string): boolean {
  return autoRegistry.isDataSourceSupported(componentType, dataSourceType)
}

/**
 * 重新加载组件注册表
 * 用于开发时动态添加新组件后刷新
 */
export async function reloadComponents(): Promise<void> {
  await autoRegistry.reload()

  // 重新注册到 ComponentRegistry
  const allComponents = autoRegistry.getAllComponents()
  allComponents.forEach(definition => {
    ComponentRegistry.register(definition)
  })

  if (process.env.NODE_ENV === 'development') {
  }
}

/**
 * 初始化 Card2.1 系统
 * useComponentTree 和其他 Hook 的统一初始化入口
 */
export async function initializeCard2System(): Promise<void> {
  await ensureInitialized()

  // 注册所有组件到旧的组件注册表以保持兼容性
  const allComponents = autoRegistry.getAllComponents()
  allComponents.forEach(definition => {
    ComponentRegistry.register(definition)
  })

  if (process.env.NODE_ENV === 'development') {
  }
}

/**
 * 手动初始化组件系统
 * 确保在使用前完成初始化
 */
export async function initializeComponents(): Promise<void> {
  await initializeCard2System()
}

// ============ 组件元数据统计 ============

/**
 * 动态组件统计信息
 * 实时反映当前注册组件的状态
 */
export const ComponentStats = new Proxy({} as any, {
  get(target, prop: string) {
    const stats = autoRegistry.getStats()
    return stats[prop as keyof typeof stats]
  },
  ownKeys() {
    return Object.keys(autoRegistry.getStats())
  }
})

// ============ 开发工具函数 ============

/**
 * 开发模式下的调试函数
 * 列出所有已注册的组件信息
 */
export function debugComponents(): void {
  if (!import.meta.env.DEV) return

  console.group('[Card2.1 组件调试信息]')
  if (process.env.NODE_ENV === 'development') {
  }

  const components = autoRegistry.getAllComponents()
  console.table(
    components.map(c => ({
      类型: c.type,
      名称: c.name,
      分类: c.category || '其他',
      版本: c.version || '未指定',
      数据源: c.supportedDataSources?.join(', ') || '无',
      标签: c.tags?.join(', ') || '无'
    }))
  )
  console.groupEnd()
}

/**
 * 开发模式下检查组件定义规范性
 * 帮助开发者发现问题
 */
export function validateComponents(): { valid: boolean; issues: string[] } {
  const issues: string[] = []
  const components = autoRegistry.getAllComponents()

  for (const component of components) {
    // 检查必需字段
    if (!component.type) issues.push(`组件缺少 type 字段: ${component.name}`)
    if (!component.name) issues.push(`组件缺少 name 字段: ${component.type}`)
    if (!component.component) issues.push(`组件缺少 component 字段: ${component.type}`)

    // 检查类型命名规范
    if (component.type && !/^[a-z0-9-]+$/.test(component.type)) {
      issues.push(`组件类型命名不规范 (应为 kebab-case): ${component.type}`)
    }

    // 检查版本格式
    if (component.version && !/^\d+\.\d+\.\d+/.test(component.version)) {
      issues.push(`组件版本格式不正确: ${component.type} - ${component.version}`)
    }
  }

  return { valid: issues.length === 0, issues }
}

// 自动初始化并注册组件
initializeComponents()
  .then(() => {
    if (process.env.NODE_ENV === 'development') {
    }

    // 列出所有已注册的组件
    const components = getAllComponents()
    console.table(
      components.map(c => ({
        类型: c.type,
        名称: c.name,
        分类: c.category || '其他'
      }))
    )
  })
  .catch(error => {
    console.error('❌ [Card2.1] 组件自动注册失败:', error)
  })

// 开发模式下自动验证组件
if (import.meta.env.DEV) {
  // 延迟验证，确保所有组件都已加载
  setTimeout(() => {
    const validation = validateComponents()
    if (!validation.valid) {
      console.warn('[Card2.1] 发现组件定义问题:', validation.issues)
    }

    // 额外调试信息
    if (process.env.NODE_ENV === 'development') {
    }
  }, 2000)
}

// 默认导出主要接口
export default {
  // 动态属性
  get components() {
    return Card2ComponentMap
  },
  get categories() {
    return Card2Components
  },
  get types() {
    return Card2ComponentTypes
  },
  get stats() {
    return ComponentStats
  },

  // 功能函数
  getComponentDefinition,
  getComponentsByCategory,
  getAllComponents,
  getComponentsByTags,
  isDataSourceSupported,
  reloadComponents,
  initializeComponents,

  // 开发工具
  debugComponents,
  validateComponents
}
