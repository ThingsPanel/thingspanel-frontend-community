/**
 * @file Card 2.1 系统入口
 * 动态导入并注册所有卡片组件
 */
import { componentRegistry } from './core/registry'
import digitIndicatorDefinition from './components/digit-indicator'
import multiDataTestDefinition from './components/multi-data-test'

// 注册组件
componentRegistry.register('digit-indicator', digitIndicatorDefinition)
componentRegistry.register('multi-data-test', multiDataTestDefinition)

console.log('🔧 [Card2.1] 组件注册完成:', {
  digitIndicator: '✅',
  multiDataTest: '✅'
})

export { componentRegistry }
export default componentRegistry
