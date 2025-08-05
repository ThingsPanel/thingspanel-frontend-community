/**
 * @file Card 2.1 系统入口
 * 动态导入并注册所有卡片组件
 * 
 * 📚 开发文档：
 * - README.md - 完整开发指南
 * - AI_MIGRATION_PROMPT.md - AI迁移提示词
 * - AI_PROMPT_TEMPLATE.md - 简化提示词模板
 * - MIGRATION_TODO.md - 迁移进度跟踪
 */
import { componentRegistry } from './core/registry'
import digitIndicatorDefinition from './components/digit-indicator'
import multiDataTestDefinition from './components/multi-data-test'
import accessDefinition from './components/access'

// 注册组件
componentRegistry.register('digit-indicator', digitIndicatorDefinition)
componentRegistry.register('multi-data-test', multiDataTestDefinition)
componentRegistry.register('access', accessDefinition)

console.log('🔧 [Card2.1] 组件注册完成:', {
  digitIndicator: '✅',
  multiDataTest: '✅',
  access: '✅'
})

console.log('📚 [Card2.1] 开发文档已就绪，请查看 README.md 了解详细开发指南')

export { componentRegistry }
export default componentRegistry
