/**
 * 对象数据源示例组件定义
 */

import ObjectDataDemo from './ObjectDataDemo.vue'
import type { ComponentDefinition } from '../../core/types'

const objectDataDemoDefinition: ComponentDefinition = {
  type: 'object-data-demo',
  name: '对象数据源示例',
  description: '演示对象类型数据源的基本用法',
  category: 'demo',
  mainCategory: '演示',
  subCategory: '数据源',
  icon: 'cube',
  component: ObjectDataDemo,
  version: '1.0.0',
  author: 'ThingsPanel',
  permission: '不限',

  // 数据源需求声明
  dataSources: [
    {
      key: 'objectData',
      name: '对象数据',
      description: '单个对象类型的数据源',
      supportedTypes: ['static', 'api'],
      required: false,
      fieldMappings: {
        data: {
          targetField: 'objectData',
          type: 'object',
          required: false,
          defaultValue: {
            name: '示例设备',
            status: 'online',
            temperature: 25.6,
            humidity: 60.2
          }
        }
      }
    }
  ],

  config: {
    width: 300,
    height: 200
  }
}

export default objectDataDemoDefinition
