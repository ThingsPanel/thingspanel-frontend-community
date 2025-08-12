/**
 * 数据映射测试组件
 * 用于测试和展示JSON路径映射功能
 */

import DataMappingTestComponent from './component.vue'
import type { ComponentDefinition } from '../../core/types'

export const DataMappingTest: ComponentDefinition = {
  type: 'data-mapping-test',
  name: '数据映射测试',
  component: DataMappingTestComponent,
  meta: {
    name: '数据映射测试',
    description: '用于测试JSON路径映射功能的组件，支持数组和对象两种数据源',
    category: '测试组件',
    author: 'ThingsPanel',
    version: '1.0.0',
    tags: ['测试', '数据映射', 'JSON路径']
  },
  config: {
    style: {
      width: 400,
      height: 300
    }
  },
  // 组件属性定义（用于属性配置面板）
  properties: {
    showTitle: {
      type: 'boolean',
      default: true,
      label: '显示标题',
      description: '是否显示组件标题'
    },
    title: {
      type: 'string',
      default: '数据映射测试',
      label: '组件标题',
      description: '自定义组件标题文本'
    },
    showDebugInfo: {
      type: 'boolean',
      default: false,
      label: '显示调试信息',
      description: '是否显示详细的调试信息'
    }
  }
}

// 默认导出组件定义
export default DataMappingTest
