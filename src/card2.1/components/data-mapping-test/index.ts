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

  // ===== V6标准化定义 =====
  // 静态参数定义
  staticParams: [
    {
      key: 'title',
      label: '组件标题',
      type: 'text',
      defaultValue: '数据映射测试',
      description: '自定义组件标题文本'
    },
    {
      key: 'showTitle',
      label: '显示标题',
      type: 'switch',
      defaultValue: true,
      description: '是否显示组件标题'
    },
    {
      key: 'showDebugInfo',
      label: '显示调试信息',
      type: 'switch',
      defaultValue: false,
      description: '是否显示详细的调试信息'
    }
  ],

  // 数据源需求定义
  dataSources: [
    {
      key: 'arrayDataSource',
      label: '数组数据源',
      description: '用于数组数据JSON路径映射测试',
      fieldsToMap: [
        {
          key: 'field1Path',
          label: '字段1映射路径',
          targetProperty: 'arrayMappings.field1Path',
          description: '数组中第一个字段的JSON路径，如: [0].name',
          placeholder: '如: [0].name'
        },
        {
          key: 'field2Path',
          label: '字段2映射路径',
          targetProperty: 'arrayMappings.field2Path',
          description: '数组中第二个字段的JSON路径，如: [0].value',
          placeholder: '如: [0].value'
        },
        {
          key: 'field3Path',
          label: '字段3映射路径',
          targetProperty: 'arrayMappings.field3Path',
          description: '数组中第三个字段的JSON路径，如: [0].status',
          placeholder: '如: [0].status'
        }
      ]
    },
    {
      key: 'objectDataSource',
      label: '对象数据源',
      description: '用于对象数据JSON路径映射测试',
      fieldsToMap: [
        {
          key: 'fieldAPath',
          label: '字段A映射路径',
          targetProperty: 'objectMappings.fieldAPath',
          description: '对象中字段A的JSON路径，如: user.name',
          placeholder: '如: user.name'
        },
        {
          key: 'fieldBPath',
          label: '字段B映射路径',
          targetProperty: 'objectMappings.fieldBPath',
          description: '对象中字段B的JSON路径，如: device.value',
          placeholder: '如: device.value'
        },
        {
          key: 'fieldCPath',
          label: '字段C映射路径',
          targetProperty: 'objectMappings.fieldCPath',
          description: '对象中字段C的JSON路径，如: location.city',
          placeholder: '如: location.city'
        }
      ]
    }
  ],

  // 传统属性定义（向后兼容，保留）
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
