/**
 * 过滤数据展示组件定义
 */

import FilteredDataDemo from './FilteredDataDemo.vue'
import type { ComponentDefinition } from '../../core/types'

const filteredDataDemoDefinition: ComponentDefinition = {
  type: 'filtered-data-demo',
  name: '过滤数据展示',
  description: '展示经过数据过滤器处理后的最终数据',
  category: 'demo',
  mainCategory: '演示',
  subCategory: '数据过滤',
  icon: 'funnel',
  component: FilteredDataDemo,
  version: '1.0.0',
  author: 'ThingsPanel',
  permission: '不限',

  // 数据源需求声明
  dataSources: [
    {
      key: 'finalData',
      name: '最终数据',
      description: '经过过滤器处理的最终展示数据',
      supportedTypes: ['static', 'api'],
      required: false,
      fieldMappings: {
        data: {
          targetField: 'finalData',
          type: 'any',
          required: false,
          defaultValue: null
        }
      }
    }
  ],

  config: {
    width: 400,
    height: 300
  }
}

export default filteredDataDemoDefinition
