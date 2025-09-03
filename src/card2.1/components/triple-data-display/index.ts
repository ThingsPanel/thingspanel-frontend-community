/**
 * triple-data-display 组件导出
 * 新三文件结构 - 标准组件模板
 */

import type { ComponentDefinition } from '@/card2.1/core/types'
import TripleDataDisplayComponent from './index.vue'
import TripleDataDisplaySetting from './setting.vue'
import { tripleDataDisplaySettingConfig } from './settingConfig'
import { componentRegistry } from '@/card2.1/core/component-registry'

/**
 * triple-data-display 组件定义
 * 基于新三文件架构的标准定义
 */
const tripleDataDisplayDefinition: ComponentDefinition = {
  // 基础信息
  type: 'triple-data-display',
  name: '三数据展示',
  description: '展示三个数据源的数据对比，支持多种布局模式和主题定制',
  category: '数据展示',
  version: '2.1.0',
  author: 'ThingsPanel',

  // 组件实现
  component: TripleDataDisplayComponent,

  // 配置组件
  configComponent: TripleDataDisplaySetting,

  // 默认配置 - 使用新的 CustomConfig 结构
  defaultConfig: tripleDataDisplaySettingConfig.customConfig,

  // 默认布局
  defaultLayout: {
    canvas: {
      width: 500,
      height: 350,
      x: 0,
      y: 0
    },
    gridstack: {
      w: 4,
      h: 4,
      x: 0,
      y: 0,
      minW: 3,
      minH: 3,
      maxW: 8,
      maxH: 6
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
    },
    {
      key: 'dataSource3',
      name: '第三个数据源',
      description: '第三个数据源数值',
      supportedTypes: ['static', 'api', 'websocket'],
      fieldMappings: {
        value: {
          targetField: 'dataSource3',
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
    componentType: 'triple-data-display',
    displayName: '三数据展示组件',
    description: '需要三个数据源进行对比展示',
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
      },
      {
        name: 'dataSource3',
        type: 'number',
        required: false,
        description: '第三个数据源数值'
      }
    ]
  },

  // 标签
  tags: ['data-display', 'comparison', 'triple-source', 'layout'],

  // 示例数据
  sampleData: {
    dataSource1: 78.5,
    dataSource2: 85.2,
    dataSource3: 92.1
  },

  // 特性标记
  features: {
    realtime: true,
    dataBinding: true,
    themeable: true,
    responsive: true,
    configurable: true,
    tripleDataSource: true,
    multiLayout: true
  }
}

// 注册组件到组件注册中心（包含自动属性暴露）
componentRegistry.registerComponent(tripleDataDisplayDefinition)
componentRegistry.registerSettingConfig(tripleDataDisplaySettingConfig)

console.log('🎯 [triple-data-display] 组件已注册，属性暴露配置已自动生成')

export default tripleDataDisplayDefinition
