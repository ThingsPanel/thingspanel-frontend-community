/**
 * Cards Module
 * 卡片管理模块统一导出
 */

export { CardRegistry, cardRegistry, CardCategory } from './CardRegistry'
export { CardScanner, CardAdapter } from './CardScanner'

// 类型导出
export type { CardDefinition, CardSearchOptions } from './CardRegistry'

// 便捷函数
export async function initializeCardSystem() {
  const { CardScanner } = await import('./CardScanner')
  await CardScanner.scanAllCards()
}

export function getCardRegistry() {
  return cardRegistry
}

export async function searchCards(options: import('./CardRegistry').CardSearchOptions = {}) {
  return cardRegistry.search(options)
}

export async function getCardsByCategory(category: CardCategory) {
  return cardRegistry.getByCategory(category)
}
