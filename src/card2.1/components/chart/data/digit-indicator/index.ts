/**
 * 数字指示器组件定义 - Card 2.1 版本
 *
 * 功能描述：
 * - 显示设备的遥测数据或属性数据
 * - 支持自定义图标、颜色和单位
 * - 响应式字体大小调整
 * - 支持 WebSocket 实时数据更新
 * - 完全兼容主题系统和国际化
 */

import DigitIndicator from './DigitIndicator.vue'
import DigitIndicatorSetting from './setting.vue'
import type { ComponentDefinition } from '../../../core/types'
import { customConfig, digitIndicatorSettingConfig } from './settingConfig'
import { createPropertyWhitelist } from '@/card2.1/core/PropertyExposureManager'

const digitIndicatorDefinition: ComponentDefinition = {
  // ===== 核心标识信息 =====
  type: 'digit-indicator',
  name: '数字指示器',
  description: '用于显示设备数据的数字指示器组件，支持图标、数值、单位和指标名称显示',
  icon: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12,2C13.1,2 14,2.9 14,4C14,5.1 13.1,6 12,6C10.9,6 10,5.1 10,4C10,2.9 10.9,2 12,2M21,9V7L15,1H5C3.89,1 3,1.89 3,3V21A2,2 0 0,0 5,23H19A2,2 0 0,0 21,21V9M19,9H14V4L19,9Z" /></svg>',
  version: '2.1.0',
  author: 'ThingsPanel',
  component: DigitIndicator,
  configComponent: DigitIndicatorSetting,

  // ===== 默认配置 =====
  defaultConfig: {
    type: 'digit-indicator',
    root: {
      transform: {
        rotate: 0,
        scale: 1
      }
    },
    customize: customConfig
  },

  config: {
    type: 'digit-indicator',
    root: {
      transform: {
        rotate: 0,
        scale: 1
      }
    },
    customize: customConfig
  },

  // ===== 布局配置 =====
  defaultLayout: {
    gridstack: {
      w: 2,
      h: 2,
      x: 0,
      y: 0,
      minW: 1,
      minH: 1,
      maxW: 4,
      maxH: 4
    }
  },

  layout: {
    defaultSize: { width: 2, height: 2 },
    minSize: { width: 1, height: 1 },
    maxSize: { width: 4, height: 4 },
    resizable: true
  },

  // ===== 权限控制 =====
  permission: '不限',

  // ===== 分类信息 =====
  tags: ['数据', '指示器', '设备', '遥测', '数值显示', '图标'],

  // ===== 功能特性 =====
  features: {
    realtime: true,
    dataBinding: true,
    configurable: true
  },

  // ===== 数据源需求声明 =====
  dataSources: [
    {
      key: 'main',
      name: '数据源',
      description: '数字指示器的主要数据源，包含数值、单位和指标名称',
      supportedTypes: ['static', 'api', 'websocket'],
      required: false,
      example: {
        value: 45,
        unit: '%',
        metricsName: '湿度',
        timestamp: '2025-09-28T02:18:46.567Z'
      }
    }
  ],

  // ===== 设置配置 =====
  settingConfig: digitIndicatorSettingConfig,

  // ===== 交互能力声明 =====
  interactionCapabilities: {
    supportedEvents: ['click', 'hover', 'dataChange'],
    availableActions: [
      'navigateToUrl', 'updateComponentData', 'changeVisibility',
      'showNotification', 'emitEvent'
    ],
    watchableProperties: {
      'value': {
        type: 'string',
        description: '当前显示的数值',
        defaultValue: '45'
      },
      'unit': {
        type: 'string',
        description: '数值单位',
        defaultValue: '%'
      },
      'metricsName': {
        type: 'string',
        description: '指标名称/标题',
        defaultValue: '湿度'
      },
      'iconColor': {
        type: 'string',
        description: '图标颜色',
        defaultValue: '#1890ff'
      },
      'iconName': {
        type: 'string',
        description: '图标名称',
        defaultValue: 'Water'
      }
    },
    defaultInteractions: [
      {
        event: 'dataChange',
        responses: [
          {
            action: 'showNotification',
            delay: 0,
            name: '数值更新通知',
            enabled: false
          }
        ],
        enabled: false,
        name: '数值变化响应',
        watchedProperty: 'value'
      }
    ]
  },

  // ===== 属性暴露白名单配置 =====
  propertyWhitelist: createPropertyWhitelist({
    // 核心业务属性
    value: {
      level: 'public',
      type: 'string',
      description: '当前显示的数值',
      defaultValue: '45',
      visibleInInteraction: true,
      visibleInDebug: true
    },
    unit: {
      level: 'public',
      type: 'string',
      description: '数值单位',
      defaultValue: '%',
      visibleInInteraction: true,
      visibleInDebug: true
    },
    metricsName: {
      level: 'public',
      type: 'string',
      description: '指标名称/标题',
      defaultValue: '湿度',
      visibleInInteraction: true,
      visibleInDebug: true
    },

    // 样式配置属性
    iconName: {
      level: 'public',
      type: 'string',
      description: '图标名称',
      defaultValue: 'Water',
      visibleInInteraction: true,
      visibleInDebug: true
    },
    iconColor: {
      level: 'public',
      type: 'string',
      description: '图标颜色',
      defaultValue: '#1890ff',
      visibleInInteraction: true,
      visibleInDebug: true
    },
    iconSize: {
      level: 'public',
      type: 'number',
      description: '图标大小',
      defaultValue: 48,
      visibleInInteraction: true,
      visibleInDebug: true
    },
    valueColor: {
      level: 'public',
      type: 'string',
      description: '数值颜色',
      defaultValue: 'var(--text-color)',
      visibleInInteraction: true,
      visibleInDebug: true
    },
    valueSize: {
      level: 'public',
      type: 'number',
      description: '数值字体大小',
      defaultValue: 32,
      visibleInInteraction: true,
      visibleInDebug: true
    },
    valueFontWeight: {
      level: 'public',
      type: 'number',
      description: '数值字体粗细',
      defaultValue: 700,
      visibleInInteraction: true,
      visibleInDebug: true
    },
    unitColor: {
      level: 'public',
      type: 'string',
      description: '单位颜色',
      defaultValue: 'var(--text-color-2)',
      visibleInInteraction: true,
      visibleInDebug: true
    },
    unitSize: {
      level: 'public',
      type: 'number',
      description: '单位字体大小',
      defaultValue: 16,
      visibleInInteraction: true,
      visibleInDebug: true
    },
    titleColor: {
      level: 'public',
      type: 'string',
      description: '标题颜色',
      defaultValue: 'var(--text-color-2)',
      visibleInInteraction: true,
      visibleInDebug: true
    },
    titleSize: {
      level: 'public',
      type: 'number',
      description: '标题字体大小',
      defaultValue: 14,
      visibleInInteraction: true,
      visibleInDebug: true
    },

    // 布局配置属性
    padding: {
      level: 'public',
      type: 'number',
      description: '组件内边距',
      defaultValue: 16,
      visibleInInteraction: false,
      visibleInDebug: true
    },
    backgroundColor: {
      level: 'public',
      type: 'string',
      description: '背景颜色',
      defaultValue: '',
      visibleInInteraction: false,
      visibleInDebug: true
    },
    showGradient: {
      level: 'public',
      type: 'boolean',
      description: '是否显示渐变背景',
      defaultValue: true,
      visibleInInteraction: false,
      visibleInDebug: true
    },
    enableHover: {
      level: 'public',
      type: 'boolean',
      description: '是否启用hover效果',
      defaultValue: true,
      visibleInInteraction: false,
      visibleInDebug: true
    },

    // 状态属性
    lastUpdated: {
      level: 'public',
      type: 'string',
      description: '最后更新时间',
      readonly: true,
      visibleInInteraction: false,
      visibleInDebug: true
    },
    visible: {
      level: 'protected',
      type: 'boolean',
      description: '组件可见性',
      defaultValue: true,
      visibleInInteraction: true,
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

export default digitIndicatorDefinition