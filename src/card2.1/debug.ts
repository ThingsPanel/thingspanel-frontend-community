/**
 * Card 2.1 调试工具
 * 用于测试组件加载和注册
 */

import { initializeCard2System } from './index'
import { componentRegistry } from './core/registry'

export async function debugCard2System() {
  console.log('🔍 [Debug] 开始调试 Card 2.1 系统...')

  try {
    // 初始化系统
    await initializeCard2System()

    // 获取所有组件
    const allComponents = componentRegistry.getAll()
    console.log(
      '📊 [Debug] 注册表中的组件:',
      allComponents.map(c => ({
        type: c.type,
        name: c.name,
        category: c.category,
        mainCategory: c.mainCategory,
        subCategory: c.subCategory
      }))
    )

    console.log('✅ [Debug] 调试完成')
    return allComponents
  } catch (error) {
    console.error('❌ [Debug] 调试失败:', error)
    throw error
  }
}
