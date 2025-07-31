/**
 * Card Scanner
 * 卡片扫描器，自动扫描并注册现有的builtin-card和chart-card
 */

import { defineAsyncComponent } from 'vue'
import type { CardDefinition } from './CardRegistry'
import { cardRegistry, CardCategory } from './CardRegistry'
import type { ICardDefine } from '@/components/panel/card'
import { PanelCards } from '@/components/panel'


// 卡片适配器：将ICardDefine转换为CardDefinition
export class CardAdapter {
  /**
   * 将ICardDefine转换为CardDefinition
   */
  static adaptCard(card: ICardDefine): CardDefinition {
    // 根据卡片ID推断分类
    const category = this.inferCategory(card.id, card.type)
    
    return {
      id: card.id,
      name: card.title,
      title: card.title,
      description: '',
      category,
      type: card.type as any,
      component: card.component,
      poster: card.poster,
      tags: [],
      preset: {
        w: card.preset?.iCardViewDefault?.w || 4,
        h: card.preset?.iCardViewDefault?.h || 3,
        minW: card.preset?.iCardViewDefault?.minW || 2,
        minH: card.preset?.iCardViewDefault?.minH || 2,
        maxW: card.preset?.iCardViewDefault?.maxW,
        maxH: card.preset?.iCardViewDefault?.maxH
      },
      config: card.preset?.config || {},
      version: '1.0.0',
      deprecated: false
    }
  }

  /**
   * 根据卡片ID和类型推断分类
   */
  private static inferCategory(id: string, type: string): CardCategory {
    // 图表类卡片
    if (type === 'chart' || id.includes('chart') || id.includes('bar') || id.includes('curve') || id.includes('instrument')) {
      return CardCategory.CHART
    }

    // 系统监控类
    if (id.includes('cpu') || id.includes('memory') || id.includes('disk') || 
        id.includes('online') || id.includes('offline') || id.includes('system')) {
      return CardCategory.SYSTEM
    }

    // 数据展示类
    if (id.includes('table') || id.includes('info') || id.includes('data') || 
        id.includes('count') || id.includes('digit') || id.includes('text')) {
      return CardCategory.DATA
    }

    // 控制类
    if (id.includes('switch') || id.includes('control') || id.includes('setter') || id.includes('enum')) {
      return CardCategory.CONTROL
    }

    // 内置类型默认为BUILTIN
    if (type === 'builtin') {
      return CardCategory.BUILTIN
    }

    // 其他归为自定义
    return CardCategory.CUSTOM
  }
}

// 卡片扫描器
export class CardScanner {
  private static scannedBuiltinCards = false
  private static scannedChartCards = false

  /**
   * 扫描并注册所有内置卡片
   */
  static async scanBuiltinCards(): Promise<void> {
    if (this.scannedBuiltinCards) return

    const builtinCards = PanelCards.builtin as ICardDefine[]
    builtinCards.forEach(card => {
      const adaptedCard = CardAdapter.adaptCard(card)
      cardRegistry.register(adaptedCard)
    })

    this.scannedBuiltinCards = true
    console.log(`Scanned and registered ${builtinCards.length} builtin cards`)
  }

  /**
   * 扫描并注册所有图表卡片
   */
  static async scanChartCards(): Promise<void> {
    if (this.scannedChartCards) return

    const chartCards = PanelCards.chart as ICardDefine[]
    chartCards.forEach(card => {
      const adaptedCard = CardAdapter.adaptCard(card)
      cardRegistry.register(adaptedCard)
    })

    this.scannedChartCards = true
    console.log(`Scanned and registered ${chartCards.length} chart cards`)
  }

  /**
   * 扫描并注册所有卡片
   */
  static async scanAllCards(): Promise<void> {
    await Promise.all([
      this.scanBuiltinCards(),
      this.scanChartCards()
    ])

    console.log('All cards scanned and registered:', cardRegistry.getStats())
  }



  /**
   * 重新扫描（强制刷新）
   */
  static async rescan(): Promise<void> {
    this.scannedBuiltinCards = false
    this.scannedChartCards = false
    cardRegistry.clear()
    await this.scanAllCards()
  }
}

export default CardScanner