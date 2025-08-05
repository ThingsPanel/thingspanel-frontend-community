/**
 * 数据源测试组件
 * 用于验证数据源系统的完整闭环流程
 */

import type { ComponentDefinition } from '../../core/types'
import DataSourceTestCard from './DataSourceTestCard.vue'
import DataSourceTestConfig from './DataSourceTestConfig.vue'

// SVG图标字符串
const iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M21 16V8a2 2 0 0 0-1-1.73L14 4a2 2 0 0 0-2 0L6 6.27A2 2 0 0 0 5 8v8a2 2 0 0 0 1 1.73L12 20a2 2 0 0 0 2 0l6-2.27A2 2 0 0 0 21 16z"/>
  <polyline points="7.5,8 12,11 16.5,8"/>
  <polyline points="7.5,16 12,13 16.5,16"/>
</svg>`

export const dataSourceTestDefinition: ComponentDefinition = {
  type: 'data-source-test',
  name: '数据源测试',
  description: '用于测试数据源配置和绑定功能的组件',
  category: 'test',
  subCategory: 'development',
  mainCategory: 'test',
  icon: iconSvg,
  component: DataSourceTestCard,
  configComponent: DataSourceTestConfig,

  // 组件属性定义
  properties: {
    title: {
      type: 'string',
      default: '数据源测试组件',
      description: '组件标题'
    },
    showDebugInfo: {
      type: 'boolean',
      default: true,
      description: '显示调试信息'
    }
  }
}

export default dataSourceTestDefinition
