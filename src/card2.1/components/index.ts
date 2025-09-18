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

// 🔥 修复：使用同步eager加载确保组件在页面加载时立即可用
let initializationPromise: Promise<void> | null = null
let isInitialized = false

/**
 * 确保自动注册系统已初始化
 * 使用同步eager加载，确保组件立即可用
 */
async function ensureInitialized(): Promise<void> {
  // 如果已经初始化，直接返回
  if (isInitialized) {
    return
  }
  
  // 如果正在初始化，等待完成
  if (initializationPromise) {
    return initializationPromise
  }

  initializationPromise = (async () => {
    try {
      console.log('🚀 [ensureInitialized] 开始初始化Card2.1组件系统...')
      
      // 使用 **/* 模式，动态扫描所有组件的 index.ts 文件
      // 这可以确保扫描到任意深度的子目录，更具扩展性
      const allModules = import.meta.glob('./**/index.ts', { eager: true });
      
      console.log(`🔥 [ensureInitialized] 发现 ${Object.keys(allModules).length} 个组件模块:`, Object.keys(allModules))
      
      // 处理已加载的模块
      const loadedModules: Record<string, any> = {}
      for (const [path, module] of Object.entries(allModules)) {
        try {
          const componentId = extractComponentIdFromPath(path)
          if (componentId && module) {
            // 附加源路径，便于后续根据路径推断分层分类
            loadedModules[componentId] = { ...(module as any), __sourcePath: path }
            console.log(`✅ [ensureInitialized] 加载组件: ${componentId} (${path})`)
          }
        } catch (error) {
          console.warn(`⚠️ [ensureInitialized] 处理组件失败: ${path}`, error)
        }
      }

      console.log(`🔥 [ensureInitialized] 准备注册 ${Object.keys(loadedModules).length} 个组件:`, Object.keys(loadedModules))

      // 使用 autoRegistry.autoRegister 注册所有组件
      const registeredComponents = await autoRegistry.autoRegister(loadedModules)
      
      isInitialized = true
      console.log(`✅ [ensureInitialized] 组件初始化完成，注册了 ${registeredComponents.length} 个组件`)
      
    } catch (error) {
      console.error('❌ [ensureInitialized] 组件初始化失败:', error)
      throw error
    } finally {
      initializationPromise = null
    }
  })()

  return initializationPromise
}

/**
 * 从文件路径提取组件ID
 */
function extractComponentIdFromPath(path: string): string | null {
  // 通用提取：获取 index.ts 之前的最后一级目录名作为组件ID
  // 兼容以下结构：
  // ./category/component/index.ts
  // ./category/subcategory/component/index.ts
  // ./top/category/component/index.ts（新增顶层目录）
  // ./a/b/c/d/component/index.ts（更深层预留）
  const match = path.match(/\/([^/]+)\/index\.ts$/)
  if (match) {
    const componentId = match[1]
    console.log(`🔥 [extractComponentIdFromPath] 通用路径匹配: ${path} -> ${componentId}`)
    return componentId
  }
  console.warn(`⚠️ [extractComponentIdFromPath] 路径格式不匹配: ${path}`)
  return null
}

/**
 * 所有可用的 Card 2.1 组件定义（按分类）
 * 动态从自动注册表获取，支持热重载
 */
export const Card2Components = new Proxy({} as Record<string, ComponentDefinition[]>, {
  get(target, prop: string) {
    if (typeof prop !== 'string') return undefined
    
    // 🔥 修复：确保初始化完成
    if (!isInitialized) {
      console.warn(`⚠️ [Card2Components] 组件系统未初始化，分类: ${prop}`)
      return []
    }
    
    return autoRegistry.getComponentsByCategory(prop)
  },
  ownKeys() {
    if (!isInitialized) return []
    return autoRegistry.getCategories().map(cat => cat.name)
  },
  has(target, prop: string) {
    if (!isInitialized) return false
    return autoRegistry.getCategories().some(cat => cat.name === prop)
  }
})

/**
 * 扁平化的组件映射表
 * 供编辑器快速查找组件定义，动态生成
 */
export const Card2ComponentMap = new Proxy({} as Record<string, ComponentDefinition>, {
  get(target, prop: string) {
    if (typeof prop !== 'string') return undefined
    
    // 🔥 修复：确保初始化完成
    if (!isInitialized) {
      console.warn(`⚠️ [Card2ComponentMap] 组件系统未初始化，组件类型: ${prop}`)
      return undefined
    }
    
    // 从所有组件中查找指定类型的组件
    return autoRegistry.getAllComponents().find(comp => comp.type === prop)
  },
  ownKeys() {
    if (!isInitialized) return []
    return autoRegistry.getAllComponents().map(comp => comp.type)
  },
  has(target, prop: string) {
    if (!isInitialized) return false
    return autoRegistry.getAllComponents().some(comp => comp.type === prop)
  }
})

/**
 * 组件类型数组
 * 供编辑器枚举所有可用组件，动态生成
 */
export const Card2ComponentTypes = new Proxy([] as string[], {
  get(target, prop) {
    if (!isInitialized) {
      if (prop === 'length') return 0
      if (prop === Symbol.iterator) {
        return function* () {
          // 空迭代器
        }
      }
      return undefined
    }
    
    const allTypes = autoRegistry.getAllComponents().map(comp => comp.type)
    if (prop === 'length') return allTypes.length
    if (prop === Symbol.iterator) {
      return function* () {
        yield* allTypes
      }
    }
    if (typeof prop === 'string' && /^\d+$/.test(prop)) {
      const index = parseInt(prop)
      return allTypes[index]
    }
    return (allTypes as any)[prop]
  }
})

// ============ 编辑器集成工具函数 ============

/**
 * 获取组件树结构
 * 用于 useComponentTree Hook 的数据源
 */
export async function getComponentTree() {
  // 🔥 修复：确保初始化完成
  await ensureInitialized()
  
  const componentTreeData = autoRegistry.getComponentTree()
  const components = componentTreeData.components
  const categories = autoRegistry.getCategories()

  if (process.env.NODE_ENV === 'development') {
    console.log(`🔥 [getComponentTree] 获取组件树: ${components.length} 个组件，${categories.length} 个分类`)
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
      name: category.name,
      components: autoRegistry.getComponentsByCategory(category.name).filter(comp => comp && comp.type && comp.name)
    })),
    totalCount: validComponents.length
  }
}

/**
 * 获取所有分类
 * 用于组件树筛选和分类显示
 */
export async function getCategories() {
  // 🔥 修复：确保初始化完成
  await ensureInitialized()
  return autoRegistry.getCategories().map(cat => cat.name)
}

/**
 * 根据类型获取组件定义
 * @param type 组件类型
 * @returns 组件定义或 undefined
 */
export async function getComponentDefinition(type: string): Promise<ComponentDefinition | undefined> {
  // 🔥 修复：确保初始化完成
  await ensureInitialized()
  return autoRegistry.getAllComponents().find(comp => comp.type === type)
}

/**
 * 获取指定分类下的所有组件
 * @param category 组件分类
 * @returns 该分类下的组件定义数组
 */
export async function getComponentsByCategory(category: string): Promise<ComponentDefinition[]> {
  // 🔥 修复：确保初始化完成
  await ensureInitialized()
  return autoRegistry.getComponentsByCategory(category)
}

/**
 * 获取所有组件定义
 * @returns 所有组件定义数组
 */
export async function getAllComponents(): Promise<ComponentDefinition[]> {
  // 🔥 修复：确保初始化完成
  await ensureInitialized()
  return autoRegistry.getAllComponents()
}

/**
 * 根据标签筛选组件
 * @param tags 标签数组
 * @returns 匹配标签的组件定义数组
 */
export function getComponentsByTags(tags: string[]): ComponentDefinition[] {
  return autoRegistry.getAllComponents().filter(
    component => component.tags && tags.some(tag => component.tags!.includes(tag))
  )
}

/**
 * 检查组件是否支持特定数据源类型
 * @param componentType 组件类型
 * @param dataSourceType 数据源类型
 * @returns 是否支持
 */
export function isDataSourceSupported(componentType: string, dataSourceType: string): boolean {
  const definition = autoRegistry.getAllComponents().find(comp => comp.type === componentType)
  return definition?.supportedDataSources?.includes(dataSourceType) || false
}

/**
 * 重新加载组件注册表
 * 用于开发时动态添加新组件后刷新
 */
export async function reloadComponents(): Promise<void> {
  // 重新初始化整个系统
  await ensureInitialized()

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
    console.log(`✅ [initializeCard2System] 系统初始化完成，注册了 ${allComponents.length} 个组件`)
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
    const components = autoRegistry.getAllComponents()
    const categories = autoRegistry.getCategories()
    
    const stats = {
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
    
    return stats[prop as keyof typeof stats]
  },
  ownKeys() {
    return ['total', 'categories', 'byCategory', 'supportedDataSources', 'versions']
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

// ============ 自动初始化 ============

// 🔥 重要：不再在文件级别自动初始化，改为按需初始化
// 这样可以避免页面刷新时的时序问题
// 初始化将由 useComponentTree 或其他需要组件的地方主动触发

if (process.env.NODE_ENV === 'development') {
  // 开发模式下，延迟进行组件验证（不阻塞加载）
  setTimeout(async () => {
    try {
      await ensureInitialized()
      const validation = validateComponents()
      if (!validation.valid) {
        console.error('[Card2.1] 发现组件定义问题:', validation.issues)
      }
    } catch (error) {
      console.error('[Card2.1] 开发模式验证失败:', error)
    }
  }, 3000)
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
