/**
 * @file Card 2.1 系统入口
 * 动态导入并注册所有卡片组件
 */
import { componentRegistry } from './core'
import type { IComponentDefinition } from './core'

// 使用 Vite 的 import.meta.glob 动态、同步地导入所有组件定义
// eager: true -> 同步导入，确保在后续代码执行前所有模块已加载
// import: 'default' -> 只导入每个模块的 default export
const modules = import.meta.glob('./components/*/*/index.ts', { eager: true, import: 'default' })

console.log('[Card2.1] Discovered component modules:', modules)

// 过滤掉任何可能未定义或无效的模块
const componentsToRegister = Object.values(modules).filter(Boolean) as IComponentDefinition[]

console.log(`[Card2.1] Found ${componentsToRegister.length} valid component definitions to register.`)

componentsToRegister.forEach(componentDef => {
  // 添加健壮性检查，确保组件定义和 ID 都存在
  if (componentDef && componentDef.id) {
    componentRegistry.register(componentDef.id, componentDef)
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
