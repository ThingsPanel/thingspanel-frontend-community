/**
 * @file Card组件加载器
 * @description 动态扫描和加载src/card目录中的所有card组件
 * 将现有的card组件集成到新架构中进行测试
 */

import type { ICardDefine } from '@/components/panel/card'
import type { ComponentDefinition } from '../types/core'
import { CardComponentAdapter } from '../adapters/CardComponentAdapter'

/**
 * Card组件加载器类
 */
export class CardComponentLoader {
  private static instance: CardComponentLoader | null = null
  private loadedCards: Map<string, ICardDefine> = new Map()
  private adaptedComponents: Map<string, ComponentDefinition> = new Map()
  private loading = false

  /**
   * 获取单例实例
   */
  static getInstance(): CardComponentLoader {
    if (!CardComponentLoader.instance) {
      CardComponentLoader.instance = new CardComponentLoader()
    }
    return CardComponentLoader.instance
  }

  /**
   * 加载所有可用的card组件
   */
  async loadAllCards(): Promise<ComponentDefinition[]> {
    if (this.loading) {
      console.warn('CardComponentLoader: 正在加载中，跳过重复请求')
      return Array.from(this.adaptedComponents.values())
    }

    this.loading = true
    console.log('CardComponentLoader: 开始加载所有card组件')

    try {
      // 清空之前的数据
      this.loadedCards.clear()
      this.adaptedComponents.clear()

      // 加载builtin-card组件
      await this.loadBuiltinCards()
      
      // 加载chart-card组件  
      await this.loadChartCards()

      // 转换为新架构组件
      this.adaptAllCards()

      const components = Array.from(this.adaptedComponents.values())
      console.log(`CardComponentLoader: 加载完成，共 ${components.length} 个组件`)
      
      return components

    } catch (error) {
      console.error('CardComponentLoader: 加载失败', error)
      return []
    } finally {
      this.loading = false
    }
  }

  /**
   * 加载内置card组件
   */
  private async loadBuiltinCards(): Promise<void> {
    console.log('CardComponentLoader: 加载builtin-card组件')

    // 定义内置组件列表
    const builtinCards = [
      'access',
      'alarm-count', 
      'alarm-info',
      'app-download',
      'cpu-usage',
      'disk-usage',
      'memory-usage',
      'news',
      'off-line',
      'on-line',
      'online-trend',
      'operation-guide-card',
      'recently-visited',
      'reported-data',
      'system-metrics-history',
      'tenant-chart',
      'tenant-count',
      'version'
    ]

    for (const cardName of builtinCards) {
      try {
        console.log(`CardComponentLoader: 加载builtin-card/${cardName}`)
        
        // 动态导入组件定义
        const cardModule = await import(`@/card/builtin-card/${cardName}/index.ts`)
        const cardDefine: ICardDefine = cardModule.default
        
        if (cardDefine && cardDefine.id) {
          this.loadedCards.set(cardDefine.id, cardDefine)
          console.log(`CardComponentLoader: 成功加载 ${cardDefine.id}`)
        } else {
          console.warn(`CardComponentLoader: ${cardName} 缺少有效的card定义`)
        }
        
      } catch (error) {
        console.warn(`CardComponentLoader: 加载 builtin-card/${cardName} 失败`, error)
      }
    }
  }

  /**
   * 加载图表card组件
   */
  private async loadChartCards(): Promise<void> {
    console.log('CardComponentLoader: 加载chart-card组件')

    // 定义图表组件列表
    const chartCards = [
      'bar',
      'curve', 
      'demo',
      'digit-indicator',
      'digit-setter',
      'dispatch-data',
      'enum-control',
      'instrument-panel',
      'state-display',
      'switch',
      'table',
      'text-info',
      'video-player'
    ]

    for (const cardName of chartCards) {
      try {
        console.log(`CardComponentLoader: 加载chart-card/${cardName}`)
        
        // 动态导入组件定义
        const cardModule = await import(`@/card/chart-card/${cardName}/index.ts`)
        const cardDefine: ICardDefine = cardModule.default
        
        if (cardDefine && cardDefine.id) {
          this.loadedCards.set(cardDefine.id, cardDefine)
          console.log(`CardComponentLoader: 成功加载 ${cardDefine.id}`)
        } else {
          console.warn(`CardComponentLoader: ${cardName} 缺少有效的card定义`)
        }
        
      } catch (error) {
        console.warn(`CardComponentLoader: 加载 chart-card/${cardName} 失败`, error)
      }
    }
  }

  /**
   * 将所有加载的card转换为新架构组件
   */
  private adaptAllCards(): void {
    console.log(`CardComponentLoader: 开始转换 ${this.loadedCards.size} 个card组件`)

    this.loadedCards.forEach((cardDefine, cardId) => {
      try {
        const componentDefinition = CardComponentAdapter.adaptCard(cardDefine)
        this.adaptedComponents.set(cardId, componentDefinition)
        console.log(`CardComponentLoader: 成功转换 ${cardId}`)
      } catch (error) {
        console.error(`CardComponentLoader: 转换 ${cardId} 失败`, error)
      }
    })

    console.log(`CardComponentLoader: 转换完成，成功 ${this.adaptedComponents.size} 个组件`)
  }

  /**
   * 获取指定类型的组件
   */
  getComponentsByType(type: 'builtin' | 'chart' | 'all' = 'all'): ComponentDefinition[] {
    const allComponents = Array.from(this.adaptedComponents.values())
    
    if (type === 'all') {
      return allComponents
    }

    return allComponents.filter(component => {
      // 根据category判断类型
      if (type === 'builtin') {
        return component.category === 'basic'
      } else if (type === 'chart') {
        return component.category === 'chart'
      }
      return true
    })
  }

  /**
   * 获取指定组件
   */
  getComponent(componentId: string): ComponentDefinition | null {
    return this.adaptedComponents.get(componentId) || null
  }

  /**
   * 获取组件统计信息
   */
  getStats() {
    const componentsByCategory = new Map<string, number>()
    
    this.adaptedComponents.forEach(component => {
      const category = component.category
      componentsByCategory.set(category, (componentsByCategory.get(category) || 0) + 1)
    })

    return {
      totalCards: this.loadedCards.size,
      totalComponents: this.adaptedComponents.size,
      categoryCounts: Object.fromEntries(componentsByCategory),
      loadedCardIds: Array.from(this.loadedCards.keys()),
      componentIds: Array.from(this.adaptedComponents.keys())
    }
  }

  /**
   * 重新加载指定组件
   */
  async reloadCard(cardId: string): Promise<ComponentDefinition | null> {
    console.log(`CardComponentLoader: 重新加载组件 ${cardId}`)
    
    const cardDefine = this.loadedCards.get(cardId)
    if (!cardDefine) {
      console.warn(`CardComponentLoader: 未找到组件 ${cardId}`)
      return null
    }

    try {
      const componentDefinition = CardComponentAdapter.adaptCard(cardDefine)
      this.adaptedComponents.set(cardId, componentDefinition)
      console.log(`CardComponentLoader: 重新加载 ${cardId} 成功`)
      return componentDefinition
    } catch (error) {
      console.error(`CardComponentLoader: 重新加载 ${cardId} 失败`, error)
      return null
    }
  }

  /**
   * 清空所有已加载的组件
   */
  clear(): void {
    console.log('CardComponentLoader: 清空所有组件')
    this.loadedCards.clear()
    this.adaptedComponents.clear()
  }
}

/**
 * 全局Card组件加载器实例
 */
export const globalCardLoader = CardComponentLoader.getInstance()

/**
 * 便捷的加载函数
 */
export const loadAllCardComponents = () => globalCardLoader.loadAllCards()
export const getCardComponent = (componentId: string) => globalCardLoader.getComponent(componentId)
export const getCardComponentsByType = (type: 'builtin' | 'chart' | 'all' = 'all') => 
  globalCardLoader.getComponentsByType(type)