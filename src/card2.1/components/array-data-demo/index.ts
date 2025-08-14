/**
 * 数组数据源示例组件定义
 */

import ArrayDataDemo from './ArrayDataDemo.vue'
import type { ComponentDefinition } from '../../core/types'

const arrayDataDemoDefinition: ComponentDefinition = {
  type: 'array-data-demo',
  name: '数组数据源示例',
  description: '演示数组类型数据源的基本用法',
  category: 'demo',
  mainCategory: '演示',
  subCategory: '数据源',
  icon: 'list',
  component: ArrayDataDemo,
  version: '1.0.0',
  author: 'ThingsPanel',
  permission: '不限',

  // 数据源需求声明
  dataSources: [
    {
      key: 'arrayData',
      name: '数组数据',
      description: '数组类型的数据源',
      supportedTypes: ['static', 'api'],
      required: false,
      fieldMappings: {
        list: {
          targetField: 'arrayData',
          type: 'array',
          required: false,
          defaultValue: [
            { name: '设备1', status: 'online', value: 100 },
            { name: '设备2', status: 'offline', value: 85 },
            { name: '设备3', status: 'online', value: 120 }
          ]
        }
      }
    }
  ],

  config: {
    width: 350,
    height: 250
  }
}

export default arrayDataDemoDefinition
