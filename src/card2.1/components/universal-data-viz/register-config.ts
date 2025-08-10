/**
 * 通用数据可视化组件配置注册
 * 在Visual Editor中启用配置功能
 */

import { getConfigDiscovery } from '@/components/visual-editor/core/ConfigDiscovery'
import UniversalDataVizConfigPanel from './UniversalDataVizConfigPanel.vue'

/**
 * 注册通用数据可视化组件的配置面板
 * 需要在应用启动时或组件系统初始化时调用
 */
export function registerUniversalDataVizConfig() {
  console.log('🔧 [UniversalDataViz] 开始注册配置组件...')
  
  try {
    const configDiscovery = getConfigDiscovery()
    
    // 动态添加配置组件
    configDiscovery.addConfigComponent({
      component: UniversalDataVizConfigPanel,
      filePath: '/src/card2.1/components/universal-data-viz/UniversalDataVizConfigPanel.vue',
      type: 'card21',
      format: 'vue-component',
      componentId: 'universal-data-viz',
      priority: 100 // 最高优先级
    })
    
    console.log('✅ [UniversalDataViz] 配置组件注册成功')
    return true
  } catch (error) {
    console.error('❌ [UniversalDataViz] 配置组件注册失败:', error)
    return false
  }
}

// 导出配置组件供其他地方使用
export { UniversalDataVizConfigPanel }
export default registerUniversalDataVizConfig