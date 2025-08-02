/**
 * Card Registry
 * 卡片注册中心，统一管理所有可用的卡片定义
 */

import type { Component } from 'vue'

// 卡片分类枚举
export enum CardCategory {
  BUILTIN = 'builtin', // 内置卡片
  CHART = 'chart', // 图表卡片
  SYSTEM = 'system', // 系统监控
  DATA = 'data', // 数据展示
  CONTROL = 'control', // 控制组件
  CUSTOM = 'custom' // 自定义组件
}

// 统一的卡片定义接口
export interface CardDefinition {
  id: string // 卡片唯一标识
  name: string // 卡片名称
  title: string // 显示标题
  description?: string // 卡片描述
  category: CardCategory // 卡片分类
  type: 'builtin' | 'chart' | 'custom' // 卡片类型
  component: Component // Vue组件
  poster?: string // 预览图
  icon?: string // 图标
  tags?: string[] // 标签
  preset: {
    // 预设配置
    w: number // 默认宽度（网格单位）
    h: number // 默认高度（网格单位）
    minW?: number // 最小宽度
    minH?: number // 最小高度
    maxW?: number // 最大宽度
    maxH?: number // 最大高度
  }
  config?: Record<string, any> // 默认配置
  dataSource?: {
    // 数据源配置
    required: boolean // 是否需要数据源
    types: string[] // 支持的数据源类型
  }
  version?: string // 版本号
  author?: string // 作者
  deprecated?: boolean // 是否已废弃
}

// 卡片搜索选项
export interface CardSearchOptions {
  category?: CardCategory
  type?: string
  tags?: string[]
  keyword?: string
  includeDeprecated?: boolean
}

// 卡片注册中心类
export class CardRegistry {
  private cards = new Map<string, CardDefinition>()
  private categories = new Map<CardCategory, CardDefinition[]>()

  /**
   * 注册卡片
   */
  register(card: CardDefinition): void {
    if (this.cards.has(card.id)) {
      console.warn(`Card with id "${card.id}" already exists. Overriding.`)
    }

    this.cards.set(card.id, card)
    this.updateCategory(card)

    console.log(`Card registered: ${card.id} (${card.name})`)
  }

  /**
   * 批量注册卡片
   */
  registerBatch(cards: CardDefinition[]): void {
    cards.forEach(card => this.register(card))
  }

  /**
   * 取消注册卡片
   */
  unregister(id: string): boolean {
    const card = this.cards.get(id)
    if (!card) return false

    this.cards.delete(id)
    this.removeFromCategory(card)

    console.log(`Card unregistered: ${id}`)
    return true
  }

  /**
   * 获取单个卡片定义
   */
  get(id: string): CardDefinition | undefined {
    return this.cards.get(id)
  }

  /**
   * 获取所有卡片
   */
  getAll(): CardDefinition[] {
    return Array.from(this.cards.values())
  }

  /**
   * 按分类获取卡片
   */
  getByCategory(category: CardCategory): CardDefinition[] {
    return this.categories.get(category) || []
  }

  /**
   * 搜索卡片
   */
  search(options: CardSearchOptions = {}): CardDefinition[] {
    let results = this.getAll()

    // 过滤已废弃的卡片
    if (!options.includeDeprecated) {
      results = results.filter(card => !card.deprecated)
    }

    // 按分类过滤
    if (options.category) {
      results = results.filter(card => card.category === options.category)
    }

    // 按类型过滤
    if (options.type) {
      results = results.filter(card => card.type === options.type)
    }

    // 按标签过滤
    if (options.tags && options.tags.length > 0) {
      results = results.filter(card => card.tags && options.tags!.some(tag => card.tags!.includes(tag)))
    }

    // 关键词搜索
    if (options.keyword) {
      const keyword = options.keyword.toLowerCase()
      results = results.filter(
        card =>
          card.name.toLowerCase().includes(keyword) ||
          card.title.toLowerCase().includes(keyword) ||
          card.description?.toLowerCase().includes(keyword) ||
          card.tags?.some(tag => tag.toLowerCase().includes(keyword))
      )
    }

    return results
  }

  /**
   * 获取所有分类
   */
  getCategories(): CardCategory[] {
    return Array.from(this.categories.keys())
  }

  /**
   * 获取分类统计
   */
  getCategoryStats(): Record<CardCategory, number> {
    const stats = {} as Record<CardCategory, number>

    for (const category of Object.values(CardCategory)) {
      stats[category] = this.getByCategory(category).length
    }

    return stats
  }

  /**
   * 检查卡片是否存在
   */
  has(id: string): boolean {
    return this.cards.has(id)
  }

  /**
   * 清空所有卡片
   */
  clear(): void {
    this.cards.clear()
    this.categories.clear()
    console.log('Card registry cleared')
  }

  /**
   * 获取注册统计信息
   */
  getStats() {
    return {
      total: this.cards.size,
      categories: this.getCategoryStats(),
      deprecated: this.getAll().filter(card => card.deprecated).length
    }
  }

  /**
   * 验证卡片定义
   */
  private validateCard(card: CardDefinition): boolean {
    if (!card.id || !card.name || !card.component) {
      console.error('Invalid card definition: missing required fields', card)
      return false
    }

    if (!card.preset || typeof card.preset.w !== 'number' || typeof card.preset.h !== 'number') {
      console.error('Invalid card definition: invalid preset', card)
      return false
    }

    return true
  }

  /**
   * 更新分类索引
   */
  private updateCategory(card: CardDefinition): void {
    this.removeFromCategory(card)

    if (!this.categories.has(card.category)) {
      this.categories.set(card.category, [])
    }

    this.categories.get(card.category)!.push(card)
  }

  /**
   * 从分类中移除卡片
   */
  private removeFromCategory(card: CardDefinition): void {
    const categoryCards = this.categories.get(card.category)
    if (categoryCards) {
      const index = categoryCards.findIndex(c => c.id === card.id)
      if (index > -1) {
        categoryCards.splice(index, 1)
      }
    }
  }
}

// 默认单例实例
export const cardRegistry = new CardRegistry()

export default cardRegistry
