/**
 * @file Card 2.1 系统入口
 * 动态导入并注册所有卡片组件
 */
import { componentRegistry } from './core'
import type { IComponentDefinition } from './core'
import { configRegistry } from '@/components/visual-editor/settings/ConfigRegistry'

// --- 直接导入组件 ---
import digitIndicatorDefinition from './components/digit-indicator/index'

// 所有组件定义数组
const componentsToRegister: IComponentDefinition[] = [digitIndicatorDefinition]

console.log(
  '[Card2.1] 组件定义列表:',
  componentsToRegister.map(c => ({ id: c.id, title: c.meta?.title }))
)
console.log('[Card2.1] digitIndicatorDefinition:', digitIndicatorDefinition)

// 注册所有组件
componentsToRegister.forEach(componentDef => {
  // 添加健壮性检查，确保组件定义和 ID 都存在
  if (componentDef && componentDef.id) {
    console.log(`🔧 [Card2.1] 正在注册组件: ${componentDef.id}`)
    console.log(`🔧 [Card2.1] 组件定义:`, componentDef)

    componentRegistry.register(componentDef.id, componentDef)

    // 如果组件有自定义配置组件，注册到配置注册表
    if (componentDef.configComponent) {
      console.log(`🔧 [Card2.1] 发现配置组件，正在检查是否已注册: ${componentDef.id}`)
      if (!configRegistry.has(componentDef.id)) {
        console.log(`🔧 [Card2.1] 注册配置组件: ${componentDef.id}`)
        configRegistry.register(componentDef.id, componentDef.configComponent)
        console.log(`🔧 [Card2.1] 注册配置组件成功: ${componentDef.id}`)
      } else {
        console.log(`🔧 [Card2.1] 配置组件已存在，跳过注册: ${componentDef.id}`)
      }
    } else {
      console.log(`🔧 [Card2.1] 组件 ${componentDef.id} 没有配置组件`)
    }
  } else {
    console.error(
      '[Card2.1] ❌ Found an invalid or incomplete component definition, skipping registration:',
      componentDef
    )
  }
})

const registeredIds = componentRegistry.getAll().map(c => c.id)
console.log(`[Card2.1] ✅ All Card 2.1 components registered. Total: ${registeredIds.length}. IDs:`, registeredIds)

// 添加调试信息
console.log('[Card2.1] 🔍 调试信息:')
console.log('- 组件定义数量:', componentsToRegister.length)
console.log('- 已注册组件:', registeredIds)
console.log(
  '- 组件注册表状态:',
  componentRegistry.getAll().map(c => ({ id: c.id, title: c.meta?.title }))
)

export default componentRegistry
