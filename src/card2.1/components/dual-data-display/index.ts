/**
 * dual-data-display 组件导出
 * 新三文件结构 - 标准组件模板
 */

import type { ComponentDefinition } from '@/card2.1/core/types'
import DualDataDisplayComponent from './index.vue'
import DualDataDisplaySetting from './setting.vue'
import { dualDataDisplaySettingConfig } from './settingConfig'
import { componentRegistry } from '@/card2.1/core/component-registry'

/**
 * dual-data-display 组件定义
 * 基于新三文件架构的标准定义
 */
const dualDataDisplayDefinition: ComponentDefinition = {
  // 基础信息
  type: 'dual-data-display',
  name: '双数据展示',
  description: '展示两个数据源的数据对比，支持多种数字格式和主题定制',
  category: '数据展示',
  version: '2.1.0',
  author: 'ThingsPanel',

  // 组件实现
  component: DualDataDisplayComponent,

  // 配置组件
  configComponent: DualDataDisplaySetting,

  // 默认配置 - 使用新的 CustomConfig 结构
  defaultConfig: dualDataDisplaySettingConfig.customConfig,

  // 默认布局
  defaultLayout: {
    canvas: {
      width: 400,
      height: 280,
      x: 0,
      y: 0
    },
    gridstack: {
      w: 3,
      h: 3,
      x: 0,
      y: 0,
      minW: 2,
      minH: 2,
      maxW: 6,
      maxH: 4
    }
  },

  // 支持的数据源类型
  supportedDataSources: ['static', 'api', 'websocket'],

  // 数据源需求声明 (ComponentRegistry 需要的格式)
  dataSources: [
    {
      key: 'dataSource1',
      name: '第一个数据源',
      description: '第一个数据源数值',
      supportedTypes: ['static', 'api', 'websocket'],
      fieldMappings: {
        value: {
          targetField: 'dataSource1',
          type: 'value',
          required: false,
          defaultValue: 0
        }
      },
      required: false
    },
    {
      key: 'dataSource2',
      name: '第二个数据源',
      description: '第二个数据源数值',
      supportedTypes: ['static', 'api', 'websocket'],
      fieldMappings: {
        value: {
          targetField: 'dataSource2',
          type: 'value',
          required: false,
          defaultValue: 0
        }
      },
      required: false
    }
  ],

  // 数据需求声明 (保持向后兼容)
  dataRequirements: {
    componentType: 'dual-data-display',
    displayName: '双数据展示组件',
    description: '需要两个数据源进行对比显示',
    primaryData: {
      name: 'dataSource1',
      type: 'number',
      required: false,
      description: '第一个数据源'
    },
    dataFields: [
      {
        name: 'dataSource1',
        type: 'number',
        required: false,
        description: '第一个数据源数值'
      },
      {
        name: 'dataSource2',
        type: 'number',
        required: false,
        description: '第二个数据源数值'
      }
    ]
  },

  // 标签
  tags: ['data-display', 'comparison', 'dual-source'],

  // 示例数据
  sampleData: {
    dataSource1: 85.6,
    dataSource2: 92.3
  },

  // 特性标记
  features: {
    realtime: true,
    dataBinding: true,
    themeable: true,
    responsive: true,
    configurable: true,
    dualDataSource: true
  }
}

// 注册组件到组件注册中心（包含自动属性暴露）
componentRegistry.registerComponent(dualDataDisplayDefinition)
componentRegistry.registerSettingConfig(dualDataDisplaySettingConfig)

console.log('🎯 [dual-data-display] 组件已注册，属性暴露配置已自动生成')

export default dualDataDisplayDefinition
