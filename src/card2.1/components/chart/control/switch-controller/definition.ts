/**
 * 开关控制器组件定义
 */

import type { ComponentDefinition } from '@/card2.1/types'
import type { SwitchControllerConfig } from './settingConfig'
import { customConfig, switchControllerSettingConfig } from './settingConfig'
import SwitchController from './index.vue'
import SwitchControllerSetting from './setting.vue'
import { createPropertyWhitelist } from '@/card2.1/core/PropertyExposureManager'

/**
 * 开关控制器组件定义
 */
export const switchControllerDefinition: ComponentDefinition<SwitchControllerConfig> = {
  // 基础信息
  type: 'switch-controller',
  name: '🎮开关控制',
  description: '用于控制设备开关状态的控制组件',
  icon: `<svg viewBox="0 0 24 24" fill="currentColor">
    <path d="M14,2A8,8 0 0,1 22,10A8,8 0 0,1 14,18H10V16H14A6,6 0 0,0 20,10A6,6 0 0,0 14,4H10A6,6 0 0,0 4,10A6,6 0 0,0 10,16H12V18H10A8,8 0 0,1 2,10A8,8 0 0,1 10,2H14M7.5,9A1.5,1.5 0 0,1 9,10.5A1.5,1.5 0 0,1 7.5,12A1.5,1.5 0 0,1 6,10.5A1.5,1.5 0 0,1 7.5,9Z"/>
  </svg>`,
  version: '1.0.0',
  author: 'ThingsPanel',

  // 组件实现
  component: SwitchController,
  configComponent: SwitchControllerSetting,

  // 默认配置
  defaultConfig: customConfig,

  // 组件配置
  config: {
    type: 'switch-controller',
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
      width: 200,
      height: 180,
      x: 0,
      y: 0
    },
    gridstack: {
      w: 2,
      h: 3,
      x: 0,
      y: 0,
      minW: 2,
      minH: 2,
      maxW: 4,
      maxH: 4
    }
  },

  // 布局配置
  layout: {
    defaultSize: {
      width: 2,
      height: 3
    },
    minSize: {
      width: 2,
      height: 2
    },
    maxSize: {
      width: 4,
      height: 4
    },
    resizable: true
  },

  // 权限配置
  permission: '不限',

  // 标签
  tags: ['控制', '开关', '设备控制', '交互', 'IoT'],

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
      key: 'controlData',
      name: '控制数据',
      description: '设备开关状态数据源',
      supportedTypes: ['static', 'api', 'websocket'],
      example: {
        "title": "LED灯控制",
        "value": false,
        "description": "控制LED灯的开关",
        "timestamp": 1694567890123
      },
      fieldMappings: {
        'title': {
          targetField: 'title',
          type: 'value',
          required: false,
          defaultValue: '设备开关'
        },
        'value': {
          targetField: 'value',
          type: 'value',
          required: true,
          defaultValue: false,
          validator: {
            type: 'boolean'
          }
        },
        'description': {
          targetField: 'description',
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
      updateInterval: 3000,
      errorHandling: {
        onError: 'showLastValue',
        retryCount: 3,
        retryInterval: 5000
      }
    }
  ],

  // 设置配置
  settingConfig: switchControllerSettingConfig,

  // 🎯 交互能力声明
  interactionCapabilities: {
    // 支持的交互事件类型
    supportedEvents: ['click', 'hover', 'focus', 'blur', 'dataChange'],
    
    // 可触发的交互动作类型
    availableActions: [
      'navigateToUrl', 'updateComponentData', 'changeVisibility', 
      'changeBackgroundColor', 'triggerAnimation', 'showNotification',
      'emitEvent'
    ],
    
    // 可被其他组件监听的属性列表
    watchableProperties: {
      'title': {
        type: 'string',
        description: '开关控制器标题',
        defaultValue: '设备开关'
      },
      'value': {
        type: 'boolean',
        description: '开关状态值',
        defaultValue: false
      },
      'description': {
        type: 'string',
        description: '开关描述信息',
        defaultValue: ''
      },
      'timestamp': {
        type: 'number',
        description: '状态变化时间戳',
        defaultValue: null
      }
    },

    // 交互区域定义
    interactionZones: [
      {
        id: 'switch-button',
        name: '开关按钮',
        description: '可点击的开关控制按钮',
        selector: '.switch-button',
        supportedEvents: ['click', 'hover']
      }
    ],

    // 默认交互配置
    defaultInteractions: [
      {
        event: 'click',
        responses: [
          {
            action: 'updateComponentData',
            delay: 0,
            name: '切换开关状态',
            enabled: true
          },
          {
            action: 'triggerAnimation',
            delay: 100,
            name: '切换反馈动画',
            enabled: true
          }
        ],
        enabled: true,
        name: '开关控制交互'
      },
      {
        event: 'dataChange',
        responses: [
          {
            action: 'emitEvent',
            delay: 0,
            name: '广播状态变化',
            enabled: true
          }
        ],
        enabled: true,
        name: '状态变化通知',
        watchedProperty: 'value'
      }
    ]
  },

  // 🔒 属性暴露白名单配置
  propertyWhitelist: createPropertyWhitelist({
    // 🔒 核心控制属性 - 可在交互中使用
    title: {
      level: 'public',
      type: 'string',
      description: '开关控制器标题',
      defaultValue: '设备开关',
      visibleInInteraction: true,
      visibleInDebug: true
    },
    switchValue: {
      level: 'public',
      type: 'boolean',
      description: '开关状态值',
      defaultValue: false,
      alias: 'value', // 🔒 对外暴露为 value
      visibleInInteraction: true,
      visibleInDebug: true
    },
    description: {
      level: 'public',
      type: 'string',
      description: '开关描述信息',
      defaultValue: '',
      visibleInInteraction: true,
      visibleInDebug: true
    },

    // 🔒 状态属性 - 只读
    isUpdating: {
      level: 'public',
      type: 'boolean',
      description: '是否正在更新状态',
      defaultValue: false,
      readonly: true,
      visibleInInteraction: true,
      visibleInDebug: true
    },
    lastUpdated: {
      level: 'public',
      type: 'string',
      description: '最后更新时间',
      readonly: true,
      visibleInInteraction: false,
      visibleInDebug: true
    },

    // 🔒 计算属性 - 只读
    status: {
      level: 'public',
      type: 'string',
      description: '开关状态描述',
      readonly: true,
      visibleInInteraction: true,
      visibleInDebug: true
    },

    // 🔒 配置属性 - 受保护级别
    disabled: {
      level: 'protected',
      type: 'boolean',
      description: '是否禁用开关',
      defaultValue: false,
      visibleInInteraction: true,
      visibleInDebug: true
    },
    showStatus: {
      level: 'protected',
      type: 'boolean',
      description: '是否显示状态文字',
      defaultValue: true,
      visibleInInteraction: false,
      visibleInDebug: true
    }
  }, {
    enabled: true,
    defaultLevel: 'public',
    audit: {
      logAccess: process.env.NODE_ENV === 'development',
      logModification: true
    }
  })
}

export default switchControllerDefinition