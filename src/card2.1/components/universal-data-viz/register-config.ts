/**
 * 通用数据可视化组件配置注册
 * 在Visual Editor中启用配置功能，并注册多数据源需求
 */

import { getConfigDiscovery } from '@/components/visual-editor/core/ConfigDiscovery'
import { 
  createComponentDataRequirements, 
  componentDataRequirementsRegistry 
} from '@/components/visual-editor/core/component-data-requirements'
import UniversalDataVizConfigPanel from './UniversalDataVizConfigPanel.vue'

/**
 * 定义组件的多数据源需求
 */
/**
 * UniversalDataVizCard 组件数据需求声明
 * 
 * 组件明确声明自己需要什么类型的数据源：
 * - 主数据源（必需）：数组类型，用于时间序列图表
 * - 对比数据源（可选）：数组类型，用于多系列对比 
 * - 配置数据源（可选）：对象类型，用于图表配置参数
 */
const universalDataVizDataRequirements = createComponentDataRequirements(
  'universal-data-viz',
  '通用数据可视化'
)
  .addDataSource({
    id: 'primary',
    label: '主数据源',
    type: 'array', // 组件需要数组数据源
    required: true,
    description: '时间序列数据，用于生成趋势图表',
    usage: '提供图表的主要数据点，每个数组项包含时间戳和数值',
    icon: 'database',
    defaultConfig: {
      // 数组路径映射配置
      pathMapping: {
        xField: 'timestamp',    // 映射到 items[*].timestamp  
        yField: 'value',        // 映射到 items[*].value
        labelField: 'label'     // 映射到 items[*].label
      },
      // 示例数据结构说明
      expectedStructure: '[{timestamp, value, label, ...}, ...]'
    }
  })
  .addDataSource({
    id: 'comparison', 
    label: '对比数据源',
    type: 'array', // 组件需要数组数据源
    required: false,
    description: '对比数据序列，用于多系列对比图表',
    usage: '提供对比数据线，与主数据源在同一图表中显示',
    icon: 'compare',
    defaultConfig: {
      pathMapping: {
        xField: 'timestamp',
        yField: 'value',
        labelField: 'series'
      },
      expectedStructure: '[{timestamp, value, series, ...}, ...]'
    }
  })
  .addDataSource({
    id: 'config',
    label: '配置数据源', 
    type: 'object', // 组件需要对象数据源
    required: false,
    description: '图表配置参数，包含标题、颜色、轴配置等',
    usage: '定义图表的显示样式和配置选项',
    icon: 'settings',
    defaultConfig: {
      // 对象路径映射配置
      pathMapping: {
        title: 'chart.title',           // 映射到 config.chart.title
        xAxisLabel: 'chart.xAxis.label', // 映射到 config.chart.xAxis.label  
        yAxisLabel: 'chart.yAxis.label', // 映射到 config.chart.yAxis.label
        colors: 'theme.colors'           // 映射到 config.theme.colors
      },
      expectedStructure: '{chart: {title, xAxis: {label}, yAxis: {label}}, theme: {colors}}'
    }
  })
  .setLimits(1, 3) // 最少1个，最多3个数据源
  .build()

/**
 * 注册通用数据可视化组件的配置面板和数据需求
 * 需要在应用启动时或组件系统初始化时调用
 */
export function registerUniversalDataVizConfig() {
  console.log('🔧 [UniversalDataViz] 开始注册配置组件和数据需求...')
  
  try {
    // 1. 注册数据需求到全局注册表
    componentDataRequirementsRegistry.register('universal-data-viz', universalDataVizDataRequirements)
    console.log('📋 [UniversalDataViz] 数据需求注册成功')
    
    // 2. 注册配置面板
    const configDiscovery = getConfigDiscovery()
    
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
    console.error('❌ [UniversalDataViz] 注册失败:', error)
    return false
  }
}

// 导出配置组件和数据需求供其他地方使用
export { UniversalDataVizConfigPanel, universalDataVizDataRequirements }
export default registerUniversalDataVizConfig