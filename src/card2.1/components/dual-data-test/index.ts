/**
 * 双数据源测试组件定义
 * 用于测试对象数据源和数组数据源，每个数据源包含示例数据字段
 */

import DualDataTest from './DualDataTest.vue'
import type { ComponentDefinition } from '../../core/types'

const dualDataTestDefinition: ComponentDefinition = {
  type: 'dual-data-test',
  name: '双数据源测试',
  description: '测试对象和数组两种数据源的组件',
  category: 'test',
  mainCategory: '测试',
  subCategory: '数据源',
  icon: 'database',
  component: DualDataTest,
  version: '1.0.0',
  author: 'ThingsPanel',
  permission: '不限',

  // 🔥 修复：参考 ArrayDataDemo 的简化成功模式
  dataSources: [
    {
      key: 'objectData',
      name: '对象数据源',
      description: '对象类型的数据源',
      supportedTypes: ['static', 'api'],
      required: false,
      fieldMappings: {
        // 直接映射到组件 prop
        objectData: {
          targetField: 'objectData',
          type: 'object',
          required: false,
          description: '对象数据源',
          defaultValue: {
            name: '测试对象',
            status: 'online',
            value: 42,
            timestamp: new Date().toISOString()
          }
        }
      }
    },
    {
      key: 'arrayData',
      name: '数组数据源',
      description: '数组类型的数据源',
      supportedTypes: ['static', 'api'],
      required: false,
      fieldMappings: {
        // 直接映射到组件 prop
        arrayData: {
          targetField: 'arrayData',
          type: 'array',
          required: false,
          description: '数组数据源',
          defaultValue: [
            { id: 1, name: '项目A', value: 100, status: 'active' },
            { id: 2, name: '项目B', value: 200, status: 'inactive' },
            { id: 3, name: '项目C', value: 150, status: 'active' }
          ]
        }
      }
    }
  ],

  config: {
    width: 400,
    height: 300
  }
}

export default dualDataTestDefinition
