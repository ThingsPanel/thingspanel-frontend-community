/**
 * 双数据源示例组件定义
 */

import DualDataDemo from './DualDataDemo.vue'
import type { ComponentDefinition } from '../../core/types'

const dualDataDemoDefinition: ComponentDefinition = {
  type: 'dual-data-demo',
  name: '双数据源示例',
  description: '演示对象+数组双数据源的组合使用',
  category: 'demo',
  mainCategory: '演示',
  subCategory: '数据源',
  icon: 'layers',
  component: DualDataDemo,
  version: '1.0.0',
  author: 'ThingsPanel',
  permission: '不限',

  // 双数据源需求声明
  dataSources: [
    {
      key: 'objectData',
      name: '对象数据',
      description: '主要的对象数据源',
      supportedTypes: ['static', 'api'],
      required: false,
      fieldMappings: {
        mainData: {
          targetField: 'objectData',
          type: 'object',
          required: false,
          defaultValue: {
            deviceName: '智能传感器',
            location: '机房A',
            status: 'online',
            lastUpdate: '2024-08-14 20:30:00'
          }
        }
      }
    },
    {
      key: 'arrayData',
      name: '数组数据',
      description: '辅助的数组数据源',
      supportedTypes: ['static', 'api'],
      required: false,
      fieldMappings: {
        listData: {
          targetField: 'arrayData',
          type: 'array',
          required: false,
          defaultValue: [
            { metric: '温度', value: 25.6, unit: '°C' },
            { metric: '湿度', value: 60.2, unit: '%' },
            { metric: '压力', value: 1013.25, unit: 'hPa' },
            { metric: '光照', value: 350, unit: 'lux' }
          ]
        }
      }
    }
  ],

  config: {
    width: 400,
    height: 350
  }
}

export default dualDataDemoDefinition
