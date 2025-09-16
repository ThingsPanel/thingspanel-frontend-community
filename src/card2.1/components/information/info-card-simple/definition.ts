/**
 * 简单信息卡片组件定义
 */

import type { ComponentDefinition } from '@/card2.1/types'
import type { InfoCardSimpleConfig } from './settingConfig'
import { customConfig, infoCardSimpleSettingConfig } from './settingConfig'
import InfoCardSimple from './index.vue'
import InfoCardSimpleSetting from './setting.vue'

/**
 * 简单信息卡片组件定义
 */
export const infoCardSimpleDefinition: ComponentDefinition<InfoCardSimpleConfig> = {
  // 基础信息
  type: 'info-card-simple',
  name: 'ℹ️信息卡片',
  description: '简单的信息展示卡片，用于显示基本信息和状态',
  icon: `<svg viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-6h2v6zm0-8h-2V7h2v4z"/>
  </svg>`,
  version: '1.0.0',
  author: 'ThingsPanel',

  // 组件实现
  component: InfoCardSimple,
  configComponent: InfoCardSimpleSetting,

  // 默认配置
  defaultConfig: customConfig,

  // 组件配置
  config: {
    type: 'info-card-simple',
    root: {
      transform: {
        rotate: 0,
        scale: 1
      }
    },
    customize: customConfig
  },

  // 默认布局
  defaultLayout: {
    canvas: {
      width: 250,
      height: 150,
      x: 0,
      y: 0
    },
    gridstack: {
      w: 3,
      h: 2,
      x: 0,
      y: 0,
      minW: 2,
      minH: 1,
      maxW: 6,
      maxH: 4
    }
  },

  // 布局配置
  layout: {
    defaultSize: {
      width: 3,
      height: 2
    },
    minSize: {
      width: 2,
      height: 1
    },
    maxSize: {
      width: 6,
      height: 4
    },
    resizable: true
  },

  // 权限配置
  permission: '不限',

  // 标签
  tags: ['信息', '基础', '状态', '展示', '简单'],

  // 特性标记
  features: {
    realtime: true,
    dataBinding: true,
    themeable: true,
    responsive: true,
    configurable: true
  },

  // 数据源需求定义
  dataSources: [
    {
      key: 'infoData',
      name: '信息数据',
      description: '信息卡片显示的数据源',
      supportedTypes: ['static', 'api', 'websocket'],
      example: {
        "title": "设备状态",
        "value": "在线",
        "subtext": "设备运行正常",
        "timestamp": 1694567890123
      },
      fieldMappings: {
        'title': {
          targetField: 'title',
          type: 'value',
          required: false,
          defaultValue: '信息标题'
        },
        'value': {
          targetField: 'value',
          type: 'value',
          required: true,
          defaultValue: '暂无数据'
        },
        'subtext': {
          targetField: 'subtext',
          type: 'value',
          required: false,
          defaultValue: ''
        },
        'timestamp': {
          targetField: 'timestamp',
          type: 'value',
          required: false,
          defaultValue: null
        }
      },
      required: true,
      updateInterval: 5000,
      errorHandling: {
        onError: 'showDefault',
        retryCount: 3,
        retryInterval: 5000
      }
    }
  ],

  // 设置配置
  settingConfig: infoCardSimpleSettingConfig,

  // 🎯 交互能力声明
  interactionCapabilities: {
    // 支持的交互事件类型
    supportedEvents: ['click', 'hover', 'focus', 'blur', 'dataChange'],
    
    // 可触发的交互动作类型
    availableActions: [
      'navigateToUrl', 'updateComponentData', 'changeVisibility', 
      'changeBackgroundColor', 'changeTextColor', 'triggerAnimation',
      'showNotification'
    ],
    
    // 可被其他组件监听的属性列表
    watchableProperties: {
      'title': {
        type: 'string',
        description: '信息卡片标题',
        defaultValue: '信息标题'
      },
      'value': {
        type: 'string',
        description: '信息卡片数值',
        defaultValue: '暂无数据'
      },
      'subtext': {
        type: 'string',
        description: '信息卡片子文本',
        defaultValue: ''
      },
      'timestamp': {
        type: 'number',
        description: '数据时间戳',
        defaultValue: null
      }
    },

    // 默认交互配置
    defaultInteractions: [
      {
        event: 'dataChange',
        responses: [
          {
            action: 'triggerAnimation',
            delay: 0,
            name: '数据更新动画',
            enabled: true
          }
        ],
        enabled: true,
        name: '数据变化反馈',
        watchedProperty: 'value'
      }
    ]
  }
}

export default infoCardSimpleDefinition