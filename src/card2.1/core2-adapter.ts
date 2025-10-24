/**
 * Core2 系统适配器
 * 提供从旧 core 系统到新 core2 系统的平滑切换
 * 保持向后兼容性，不删除原有 core 系统
 */

import { ComponentRegistry, AutoRegistry, componentRegistry } from './core2'
import { LegacyAdapter } from './core2/compatibility'

// ========== Core2 系统初始化 ==========

// 创建新的自动注册系统
const core2AutoRegistry = new AutoRegistry(componentRegistry)

// 初始化状态
let core2Initialized = false
let core2InitializationPromise: Promise<void> | null = null

/**
 * 初始化 Core2 系统
 */
export async function initializeCore2System() {
  if (core2Initialized) return

  if (core2InitializationPromise) {
    return core2InitializationPromise
  }

  core2InitializationPromise = (async () => {
    try {

      // 扫描组件
      const allComponentModules = import.meta.glob('@/card2.1/components/**/index.ts', { eager: true })

      // 排除 components/index.ts 本身避免冲突
      const componentModules = Object.fromEntries(
        Object.entries(allComponentModules).filter(([path]) => path !== '@/card2.1/components/index.ts')
      )

      // 调用 Core2 自动注册系统
      await core2AutoRegistry.autoRegister(componentModules)

      // 初始化向后兼容性
      LegacyAdapter.initialize()

      core2Initialized = true
    } catch (err) {
      throw err
    } finally {
      core2InitializationPromise = null
    }
  })()

  return core2InitializationPromise
}

/**
 * 获取 Core2 组件注册表
 */
export function getCore2ComponentRegistry() {
  return componentRegistry
}

/**
 * 获取 Core2 组件树形结构
 */
export function getCore2ComponentTree() {
  if (!core2Initialized) {
    return { components: [], categories: [], totalCount: 0 }
  }
  const tree = core2AutoRegistry.getComponentTree()

  console.log('🔥 [Core2] 组件树结果:')
  console.log('总组件数:', tree.totalCount)
  console.log('分类数:', tree.categories.length)
  console.log('组件数:', tree.components.length)

  return tree
}

/**
 * 按分类获取 Core2 组件
 */
export async function getCore2ComponentsByCategory(mainCategory?: string, subCategory?: string) {
  if (!core2Initialized) {
    return []
  }
  return core2AutoRegistry.getComponentsByCategory(mainCategory, subCategory)
}

/**
 * 获取 Core2 所有分类
 */
export function getCore2Categories() {
  if (!core2Initialized) {
    return []
  }
  return core2AutoRegistry.getCategories()
}

/**
 * 获取 Core2 系统初始化状态
 */
export function getCore2InitializationState() {
  return {
    isInitialized: core2Initialized,
    componentCount: core2Initialized ? core2AutoRegistry.getAllComponents().length : 0,
    categories: core2Initialized ? core2AutoRegistry.getCategories() : [],
    migrationStatus: LegacyAdapter.getMigrationStatus()
  }
}

/**
 * 检查 Core2 系统是否可用
 */
export function isCore2Available() {
  return core2Initialized
}

/**
 * 获取 Core2 系统统计信息
 */
export function getCore2Stats() {
  if (!core2Initialized) {
    return { totalComponents: 0, componentTypes: [], multiDataSourceComponents: 0 }
  }
  return componentRegistry.getStats()
}

// ========== 向后兼容桥接 ==========

/**
 * 向后兼容桥接 - 提供与旧系统相同的接口
 */
export const core2Bridge = {
  // 组件注册相关
  getComponentRegistry: getCore2ComponentRegistry,
  getComponentTree: getCore2ComponentTree,
  getComponentsByCategory: getCore2ComponentsByCategory,
  getCategories: getCore2Categories,

  // 系统状态相关
  getInitializationState: getCore2InitializationState,
  isInitialized: () => core2Initialized,

  // 工具方法
  initialize: initializeCore2System,
  clearCache: () => {
    core2Initialized = false
    core2InitializationPromise = null
  },

  // 迁移状态
  getMigrationStatus: LegacyAdapter.getMigrationStatus,
  getCompatibilityWarnings: LegacyAdapter.getCompatibilityWarnings,
  performMigrationCheck: LegacyAdapter.performMigrationCheck
}

/**
 * 全局导出 Core2 系统（仅在开发环境中）
 */
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  const win = window as any
  win.__CORE2_SYSTEM__ = {
    ...core2Bridge,
    ComponentRegistry: componentRegistry,
    AutoRegistry: core2AutoRegistry,
    LegacyAdapter
  }
}

// 默认导出桥接对象
export default core2Bridge