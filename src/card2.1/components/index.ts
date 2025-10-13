/**
 * Card 2.1 组件统一导出
 * 使用自动注册系统，无需手动维护组件列表
 * 支持动态发现和注册所有符合规范的组件
 */

import type { ComponentDefinition } from '@/card2.1/types'
import { AutoRegistry } from '@/card2.1/core/auto-registry'
import { ComponentRegistry, componentRegistry } from '@/card2.1/core/component-registry'

// 创建自动注册系统实例
const autoRegistry = new AutoRegistry(componentRegistry)

// ============ 自动化组件注册表 ============

// 组件初始化状态
let isInitialized = false

/**
 * 确保自动注册系统已初始化
 */
async function ensureInitialized(): Promise<void> {
  if (isInitialized) {
    return
  }

  try {
    // 使用 **/* 模式，动态扫描所有组件的 index.ts 文件
    const allModules = import.meta.glob('./**/index.ts', { eager: true });

    // 处理已加载的模块
    const loadedModules: Record<string, any> = {}
    for (const [path, module] of Object.entries(allModules)) {
      if (path && module) {
        loadedModules[path] = module
      }
    }

    // 使用 autoRegistry.autoRegister 注册所有组件
    await autoRegistry.autoRegister(loadedModules)

    isInitialized = true

  } catch (error) {
    console.error('❌ [ensureInitialized] 组件初始化失败:', error)
    throw error
  }
}

/**
 * 获取所有组件定义（按分类）
 */
export async function getCard2Components(): Promise<Record<string, ComponentDefinition[]>> {
  await ensureInitialized()
  const categories = autoRegistry.getCategories()
  const result: Record<string, ComponentDefinition[]> = {}

  for (const category of categories) {
    result[category.name] = autoRegistry.getComponentsByCategory(category.name)
  }

  return result
}

/**
 * 获取组件映射表
 */
export async function getCard2ComponentMap(): Promise<Record<string, ComponentDefinition>> {
  await ensureInitialized()
  const components = autoRegistry.getAllComponents()
  const result: Record<string, ComponentDefinition> = {}

  for (const component of components) {
    result[component.type] = component
  }

  return result
}

/**
 * 获取所有组件类型
 */
export async function getCard2ComponentTypes(): Promise<string[]> {
  await ensureInitialized()
  return autoRegistry.getAllComponents().map(comp => comp.type)
}

// ============ 编辑器集成工具函数 ============

/**
 * 获取组件树结构
 */
export async function getComponentTree() {
  await ensureInitialized()
  return autoRegistry.getComponentTree()
}

/**
 * 获取所有分类
 */
export async function getCategories(): Promise<string[]> {
  await ensureInitialized()
  return autoRegistry.getCategories().map(cat => cat.name)
}

/**
 * 根据类型获取组件定义
 */
export async function getComponentDefinition(type: string): Promise<ComponentDefinition | undefined> {
  await ensureInitialized()
  return autoRegistry.getAllComponents().find(comp => comp.type === type)
}

/**
 * 获取指定分类下的所有组件
 */
export async function getComponentsByCategory(category: string): Promise<ComponentDefinition[]> {
  await ensureInitialized()
  return autoRegistry.getComponentsByCategory(category)
}

/**
 * 获取所有组件定义
 */
export async function getAllComponents(): Promise<ComponentDefinition[]> {
  await ensureInitialized()
  return autoRegistry.getAllComponents()
}

/**
 * 重新加载组件注册表
 */
export async function reloadComponents(): Promise<void> {
  await ensureInitialized()
}

// ============ 组件元数据统计 ============

/**
 * 获取组件统计信息
 */
export async function getComponentStats() {
  await ensureInitialized()
  const components = autoRegistry.getAllComponents()
  const categories = autoRegistry.getCategories()

  return {
    total: components.length,
    categories: categories.map(cat => cat.name),
    byCategory: Object.fromEntries(
      categories.map(category => [category.name, autoRegistry.getComponentsByCategory(category.name).length])
    ),
    supportedDataSources: Array.from(new Set(components.flatMap(c => c.supportedDataSources || []))),
    versions: Array.from(
      new Set(
        components
          .map(c => c.version)
          .filter(Boolean)
      )
    )
  }
}

// ============ 开发工具函数 ============

/**
 * 开发模式下的调试函数
 */
export function debugComponents(): void {
  if (!import.meta.env.DEV) return

  console.group('[Card2.1 组件调试信息]')
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

// 默认导出主要接口
export default {
  // 功能函数
  getCard2Components,
  getCard2ComponentMap,
  getCard2ComponentTypes,
  getComponentTree,
  getCategories,
  getComponentDefinition,
  getComponentsByCategory,
  getAllComponents,
  getComponentStats,
  reloadComponents,

  // 开发工具
  debugComponents
}
