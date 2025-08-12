/**
 * @file Card 2.1 系统入口
 * 使用自动注册系统，支持目录扫描和动态加载
 *
 * 📚 开发文档：
 * - README.md - 完整开发指南
 * - AI_MIGRATION_PROMPT.md - AI迁移提示词
 * - AI_PROMPT_TEMPLATE.md - 简化提示词模板
 * - MIGRATION_TODO.md - 迁移进度跟踪
 */

import { componentRegistry } from './core/registry'
import { AutoRegistry } from './core/auto-registry'
import { ComponentLoader } from './core/component-loader'
import { componentDataRequirementsRegistry } from '@/components/visual-editor/core/component-data-requirements'

// 创建自动注册系统
const autoRegistry = new AutoRegistry(componentRegistry)
const componentLoader = new ComponentLoader()

// 初始化状态
let isInitialized = false
let initializationPromise: Promise<void> | null = null

/**
 * 初始化 Card 2.1 系统
 * 自动扫描并注册所有组件
 */
export async function initializeCard2System() {
  if (isInitialized) {
    console.log('🔄 [Card2.1] 系统已初始化，跳过重复初始化')
    return
  }

  if (initializationPromise) {
    console.log('🔄 [Card2.1] 系统正在初始化中，等待完成...')
    return initializationPromise
  }

  initializationPromise = (async () => {
    try {
      console.log('🚀 [Card2.1] 开始初始化系统...')

      // 1. 加载组件模块
      const componentModules = await componentLoader.loadComponents()

      // 2. 获取组件统计信息
      const stats = componentLoader.getComponentStats(componentModules)
      console.log('📊 [Card2.1] 组件统计:', stats)

      // 3. 自动注册组件（包含权限过滤）
      const registeredComponents = await autoRegistry.autoRegister(componentModules)

      // 4. 注册预设的数据需求
      componentDataRequirementsRegistry.registerPresets()
      console.log('📋 [Card2.1] 数据需求预设注册完成')

      // 5. 注册各组件的专用数据需求和配置
      console.log('🔧 [Card2.1] 开始注册组件专用数据需求...')

      // 检查并调用已注册组件的数据需求注册函数
      for (const component of registeredComponents) {
        if (component.type === 'universal-data-viz') {
          try {
            const { registerUniversalDataVizConfig } = await import('./components/universal-data-viz/register-config')
            registerUniversalDataVizConfig()
            console.log('✅ [Card2.1] universal-data-viz 多数据源需求注册成功')
          } catch (error) {
            console.error('❌ [Card2.1] universal-data-viz 多数据源需求注册失败:', error)
          }
        }
        // 在这里可以添加其他组件的数据需求注册
      }

      console.log('🔧 [Card2.1] 组件专用数据需求注册完成')

      // 6. 获取组件树形结构
      const componentTree = autoRegistry.getComponentTree()

      console.log('🎉 [Card2.1] 系统初始化完成!', {
        注册组件数: registeredComponents.length,
        分类数: componentTree.categories.length,
        总组件数: componentTree.totalCount
      })

      isInitialized = true
    } catch (error) {
      console.error('❌ [Card2.1] 系统初始化失败:', error)
      throw error
    } finally {
      initializationPromise = null
    }
  })()

  return initializationPromise
}

/**
 * 获取组件注册表
 */
export function getComponentRegistry() {
  if (!isInitialized) {
    console.warn('⚠️ [Card2.1] 系统未初始化，请先调用 initializeCard2System()')
  }
  return componentRegistry
}

/**
 * 获取组件树形结构
 */
export function getComponentTree() {
  if (!isInitialized) {
    console.warn('⚠️ [Card2.1] 系统未初始化，请先调用 initializeCard2System()')
    return { categories: [], components: [], totalCount: 0 }
  }
  return autoRegistry.getComponentTree()
}

/**
 * 按分类获取组件
 */
export function getComponentsByCategory(mainCategory?: string, subCategory?: string) {
  if (!isInitialized) {
    console.warn('⚠️ [Card2.1] 系统未初始化，请先调用 initializeCard2System()')
    return []
  }
  return autoRegistry.getComponentsByCategory(mainCategory, subCategory)
}

/**
 * 获取所有分类
 */
export function getCategories() {
  if (!isInitialized) {
    console.warn('⚠️ [Card2.1] 系统未初始化，请先调用 initializeCard2System()')
    return []
  }
  return autoRegistry.getCategories()
}

/**
 * 重新应用权限过滤
 * 当用户权限发生变化时调用此函数
 */
export function reapplyPermissionFilter() {
  if (!isInitialized) {
    console.warn('⚠️ [Card2.1] 系统未初始化，请先调用 initializeCard2System()')
    return
  }
  autoRegistry.reapplyPermissionFilter()
}

/**
 * 获取所有组件（包括无权限的，用于调试）
 */
export function getAllComponents() {
  if (!isInitialized) {
    console.warn('⚠️ [Card2.1] 系统未初始化，请先调用 initializeCard2System()')
    return []
  }
  return autoRegistry.getAllComponents()
}

// 导出核心模块
export { componentRegistry }
export { AutoRegistry, ComponentLoader }
export type { ComponentTree, ComponentCategory } from './core/auto-registry'

// 导出权限相关工具
export * from './core/permission-utils'
export type { ComponentPermission } from './core/types'

// 导出 Hooks
export * from './hooks'

// 默认导出注册表（保持向后兼容）
export default componentRegistry
