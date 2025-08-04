/**
 * Card2.1 主入口
 * 简洁明了的 API
 */

// 导入核心功能
import { cardRegistry, registerCard } from './core/registry'

// 导出核心类型
export type { CardComponent, CardConfig, ConfigContext, CardLayout, CardRegistry } from './core/types'

// 导出注册表
export { cardRegistry, registerCard, getCard, getAllCards } from './core/registry'

// 导出工具组件
export { default as ConfigProvider } from './utils/ConfigProvider.vue'

// 导出内置组件
export { textComponent } from './components/text'

// 版本信息
export const version = '2.1.0'

// 简单的初始化函数
export async function initCard21() {
  // 自动注册内置组件
  const { textComponent: textComp } = await import('./components/text')
  registerCard(textComp)

  console.log(`🎯 Card2.1 v${version} 初始化完成`)
  console.log(`📦 已注册 ${cardRegistry.getAll().length} 个组件`)
}

// 默认导出注册表（向后兼容）
export default cardRegistry
