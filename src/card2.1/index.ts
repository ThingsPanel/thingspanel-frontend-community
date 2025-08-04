/**
 * @file Card 2.1 系统入口
 * 动态导入并注册所有卡片组件
 */
import { componentRegistry } from './core'
import type { IComponentDefinition } from './core'
import { configRegistry } from '@/components/visual-editor/settings/ConfigRegistry'

// --- 静态导入所有组件分类 ---
// 使用静态路径可以避免 Vite 在某些情况下的 glob 缓存问题
const digitIndicators = import.meta.glob('./components/digit-indicator/index.ts', { eager: true, import: 'default' })

// 合并所有模块
const modules = { ...digitIndicators }

console.log('[Card2.1] Discovered component modules:', modules)

// 过滤掉任何可能未定义或无效的模块
const componentsToRegister = Object.values(modules).filter(Boolean) as IComponentDefinition[]

console.log(`[Card2.1] Found ${componentsToRegister.length} valid component definitions to register.`)

componentsToRegister.forEach(componentDef => {
  // 添加健壮性检查，确保组件定义和 ID 都存在
  if (componentDef && componentDef.id) {
    componentRegistry.register(componentDef.id, componentDef)

    // 如果组件有自定义配置组件，注册到配置注册表
    if (componentDef.configComponent) {
      configRegistry.register(componentDef.id, componentDef.configComponent)
      console.log(`🔧 [Card2.1] 注册配置组件: ${componentDef.id}`)
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

export default componentRegistry
