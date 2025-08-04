/**
 * Card2.1 组件注册表
 * 简单而有效的组件管理
 */

import type { CardComponent, CardRegistry } from './types'
import { createLogger } from '@/utils/logger'

const logger = createLogger('CardRegistry')

class Registry implements CardRegistry {
  private cards = new Map<string, CardComponent>()

  register(card: CardComponent): void {
    if (this.cards.has(card.id)) {
      logger.warn(`组件 ${card.id} 已存在，将被覆盖`)
    }

    this.cards.set(card.id, card)
    logger.info(`注册组件: ${card.id} (${card.name})`)
  }

  unregister(id: string): void {
    if (this.cards.delete(id)) {
      logger.info(`注销组件: ${id}`)
    } else {
      logger.warn(`尝试注销不存在的组件: ${id}`)
    }
  }

  get(id: string): CardComponent | undefined {
    return this.cards.get(id)
  }

  getAll(): CardComponent[] {
    return Array.from(this.cards.values())
  }

  has(id: string): boolean {
    return this.cards.has(id)
  }

  // 调试方法
  list(): void {
    console.table(
      Array.from(this.cards.entries()).map(([id, card]) => ({
        ID: id,
        名称: card.name,
        有配置: !!card.config,
        有预览: !!card.poster
      }))
    )
  }
}

// 全局单例
export const cardRegistry = new Registry()

// 便捷的注册函数
export function registerCard(card: CardComponent): void {
  cardRegistry.register(card)
}

export function getCard(id: string): CardComponent | undefined {
  return cardRegistry.get(id)
}

export function getAllCards(): CardComponent[] {
  return cardRegistry.getAll()
}
