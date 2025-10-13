/**
 * 卡片注册表
 * 负责加载并注册所有卡片清单
 */

import type { ICardManifest } from './interface'
import { ComponentRegistry } from '@/card2.1/core/component-registry'
import { adaptCard21ToManifest, batchAdaptCard21ToManifest } from './adapter'
import { testCardManifest } from './test-card-manifest'

/**
 * 卡片注册表类
 */
export class CardRegistry {
  /** 卡片清单注册表 */
  private manifests: Map<string, ICardManifest> = new Map()

  /** 单例实例 */
  private static instance: CardRegistry | null = null

  /**
   * 获取单例实例
   */
  static getInstance(): CardRegistry {
    if (!CardRegistry.instance) {
      CardRegistry.instance = new CardRegistry()
    }
    return CardRegistry.instance
  }

  /**
   * 注册卡片清单
   */
  register(manifest: ICardManifest): void {
    if (this.manifests.has(manifest.type)) {
      console.warn(`[CardRegistry] 卡片类型已存在，将被覆盖: ${manifest.type}`)
    }

    this.manifests.set(manifest.type, manifest)
  }

  /**
   * 批量注册卡片清单
   */
  registerBatch(manifests: ICardManifest[]): void {
    manifests.forEach(manifest => this.register(manifest))
  }

  /**
   * 从 Card2.1 注册表自动加载卡片
   */
  loadFromCard21(): void {
    // 获取所有 Card2.1 组件定义
    const card21Definitions = ComponentRegistry.getAll()

    // 转换并注册 Card2.1 组件
    const manifests = batchAdaptCard21ToManifest(card21Definitions)
    this.registerBatch(manifests)

    // 注册测试卡片
    this.register(testCardManifest as ICardManifest)

    console.log(
      `[CardRegistry] 成功加载 ${manifests.length + 1} 个卡片:`,
      [...manifests.map(m => m.type), 'test-card']
    )
  }

  /**
   * 获取卡片清单
   */
  get(type: string): ICardManifest | undefined {
    return this.manifests.get(type)
  }

  /**
   * 获取所有卡片清单
   */
  getAll(): ICardManifest[] {
    return Array.from(this.manifests.values())
  }

  /**
   * 按分类获取卡片清单
   */
  getByCategory(category: string): ICardManifest[] {
    return this.getAll().filter(manifest => manifest.category === category)
  }

  /**
   * 按标签搜索卡片清单
   */
  searchByTag(tag: string): ICardManifest[] {
    return this.getAll().filter(manifest => manifest.tags?.includes(tag))
  }

  /**
   * 模糊搜索卡片
   */
  search(keyword: string): ICardManifest[] {
    const lowerKeyword = keyword.toLowerCase()

    return this.getAll().filter(manifest => {
      return (
        manifest.type.toLowerCase().includes(lowerKeyword) ||
        manifest.name.toLowerCase().includes(lowerKeyword) ||
        manifest.description?.toLowerCase().includes(lowerKeyword) ||
        manifest.tags?.some(tag => tag.toLowerCase().includes(lowerKeyword))
      )
    })
  }

  /**
   * 获取所有分类
   */
  getAllCategories(): string[] {
    const categories = new Set<string>()
    this.getAll().forEach(manifest => {
      if (manifest.category) {
        categories.add(manifest.category)
      }
    })
    return Array.from(categories).sort()
  }

  /**
   * 获取所有标签
   */
  getAllTags(): string[] {
    const tags = new Set<string>()
    this.getAll().forEach(manifest => {
      manifest.tags?.forEach(tag => tags.add(tag))
    })
    return Array.from(tags).sort()
  }

  /**
   * 检查卡片是否存在
   */
  has(type: string): boolean {
    return this.manifests.has(type)
  }

  /**
   * 获取统计信息
   */
  getStats() {
    const manifests = this.getAll()
    const categoryCounts: Record<string, number> = {}
    const tagCounts: Record<string, number> = {}

    manifests.forEach(manifest => {
      // 统计分类
      if (manifest.category) {
        categoryCounts[manifest.category] = (categoryCounts[manifest.category] || 0) + 1
      }

      // 统计标签
      manifest.tags?.forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1
      })
    })

    return {
      totalCards: manifests.length,
      categories: Object.keys(categoryCounts).length,
      tags: Object.keys(tagCounts).length,
      categoryCounts,
      tagCounts,
      withDataSource: manifests.filter(m => m.dataSources && m.dataSources.length > 0).length,
      withInteraction: manifests.filter(m => m.interactionCapabilities).length,
      withConfig: manifests.filter(m => m.configComponent).length
    }
  }

  /**
   * 清空注册表
   */
  clear(): void {
    this.manifests.clear()
  }

  /**
   * 重新加载所有卡片
   */
  reload(): void {
    this.clear()
    this.loadFromCard21()
  }
}

/**
 * 获取默认的卡片注册表实例
 */
export const cardRegistry = CardRegistry.getInstance()

/**
 * 初始化卡片注册表
 * 在应用启动时调用
 */
export async function initializeCardRegistry(): Promise<void> {
  try {
    // 先初始化 Card2.1 系统
    const { initializeCard2System } = await import('@/card2.1')
    await initializeCard2System()

    // 然后加载卡片
    cardRegistry.loadFromCard21()

    // 打印统计信息
    const stats = cardRegistry.getStats()
    console.log('[CardRegistry] 卡片注册表初始化完成:', stats)
  } catch (error) {
    console.error('[CardRegistry] 初始化失败:', error)
    throw error
  }
}
