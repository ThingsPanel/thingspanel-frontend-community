/**
 * 仪表盘图表组件定义
 * 用于展示单个数值的仪表盘可视化
 */

import type { ComponentDefinition } from '@/card2.1/types'
import { customConfig, gaugeChartSettingConfig } from './settingConfig'
import GaugeChart from './index.vue'
import GaugeChartSetting from './setting.vue'
import { createPropertyWhitelist } from '@/card2.1/core2/property'

export const gaugeChartDefinition: ComponentDefinition = {
  // 基础信息
  type: 'gauge-chart',
  name: '📊 仪表盘图表',
  description: '圆形仪表盘，用于展示单个数值指标的进度和状态',
  icon: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4A8,8 0 0,1 20,12C20,14.4 19,16.5 17.3,18C15.9,16.7 14,16 12,16C10,16 8.2,16.7 6.7,18C5,16.5 4,14.4 4,12A8,8 0 0,1 12,4M14,5.89C13.62,5.9 13.26,6.15 13.1,6.54L11.81,9.77L11.71,10C11,10.13 10.41,10.6 10.14,11.26C9.73,12.29 10.23,13.45 11.26,13.86C12.29,14.27 13.45,13.77 13.86,12.74C14.12,12.08 14,11.32 13.57,10.76L13.67,10.5L14.96,7.29L14.97,7.26C15.17,6.75 14.92,6.17 14.41,5.96C14.28,5.91 14.15,5.89 14,5.89M10,6A1,1 0 0,0 9,7A1,1 0 0,0 10,8A1,1 0 0,0 11,7A1,1 0 0,0 10,6M7,9A1,1 0 0,0 6,10A1,1 0 0,0 7,11A1,1 0 0,0 8,10A1,1 0 0,0 7,9M17,9A1,1 0 0,0 16,10A1,1 0 0,0 17,11A1,1 0 0,0 18,10A1,1 0 0,0 17,9Z" /></svg>',
  version: '1.0.0',
  author: 'ThingsPanel',

  // 主分类和子分类
  mainCategory: 'categories.chart',
  subCategory: 'categories.data',

  // 组件和配置组件
  component: GaugeChart,
  configComponent: GaugeChartSetting,

  // 默认配置
  defaultConfig: {
    type: 'gauge-chart',
    root: {
      transform: {
        rotate: 0,
        scale: 1
      }
    },
    customize: customConfig
  },

  // 组件配置
  config: {
    type: 'gauge-chart',
    root: {
      transform: {
        rotate: 0,
        scale: 1
      }
    },
    customize: customConfig
  },

  // 默认布局（网格系统）
  defaultLayout: {
    gridstack: {
      w: 3,
      h: 3,
      x: 0,
      y: 0,
      minW: 2,
      minH: 2,
      maxW: 6,
      maxH: 6
    }
  },

  // 布局约束
  layout: {
    defaultSize: { width: 3, height: 3 },
    minSize: { width: 2, height: 2 },
    maxSize: { width: 6, height: 6 },
    resizable: true
  },

  // 权限和标签
  permission: '不限',
  tags: ['图表', '仪表盘', '数据可视化', '指标'],

  // 功能特性
  features: {
    realtime: true,       // 支持实时数据更新
    dataBinding: true,    // 支持数据绑定
    configurable: true    // 可配置
  },

  // 数据源定义
  dataSources: [
    {
      key: 'main',
      name: '数据源',
      description: '仪表盘图表的主要数据源，包含数值、单位和指标名称',
      supportedTypes: ['static', 'api', 'websocket'],
      required: false,
      example: {
        value: 75,
        unit: '℃',
        metricsName: '温度',
        timestamp: '2025-10-15T10:30:00.000Z'
      }
    }
  ],

  // 配置表单
  settingConfig: gaugeChartSettingConfig,

  // 🎯 交互能力声明
  interactionCapabilities: {
    // 支持的交互事件类型
    supportedEvents: ['click', 'hover', 'dataChange'],

    // 可触发的交互动作类型
    availableActions: [
      'navigateToUrl',
      'updateComponentData',
      'changeVisibility',
      'showNotification',
      'emitEvent'
    ],

    // 可被其他组件监听的属性列表
    watchableProperties: {
      'value': {
        type: 'number',
        description: '当前数值',
        defaultValue: 75
      },
      'min': {
        type: 'number',
        description: '最小值',
        defaultValue: 0
      },
      'max': {
        type: 'number',
        description: '最大值',
        defaultValue: 100
      },
      'title': {
        type: 'string',
        description: '标题',
        defaultValue: '数据指标'
      },
      'percentage': {
        type: 'number',
        description: '百分比值（自动计算）',
        defaultValue: 0
      }
    },

    // 默认交互配置
    defaultInteractions: [
      {
        event: 'dataChange',
        responses: [
          {
            action: 'showNotification',
            delay: 0,
            name: '数值变化通知',
            enabled: true
          }
        ],
        enabled: true,
        name: '数值变化时通知',
        watchedProperty: 'value'
      }
    ]
  },

  // 🔒 属性暴露白名单配置
  propertyWhitelist: createPropertyWhitelist({
    // 🔒 核心数据属性 - 可在交互中使用
    value: {
      level: 'public',
      type: 'number',
      description: '当前数值',
      defaultValue: 75,
      visibleInInteraction: true,
      visibleInDebug: true
    },
    min: {
      level: 'public',
      type: 'number',
      description: '最小值',
      defaultValue: 0,
      visibleInInteraction: true,
      visibleInDebug: true
    },
    max: {
      level: 'public',
      type: 'number',
      description: '最大值',
      defaultValue: 100,
      visibleInInteraction: true,
      visibleInDebug: true
    },
    title: {
      level: 'public',
      type: 'string',
      description: '标题',
      defaultValue: '数据指标',
      visibleInInteraction: true,
      visibleInDebug: true
    },

    // 🔒 计算属性 - 只读，供交互系统使用
    percentage: {
      level: 'public',
      type: 'number',
      description: '百分比值（自动计算）',
      defaultValue: 0,
      readonly: true,
      visibleInInteraction: true,
      visibleInDebug: true
    },

    // 🔒 状态属性 - 只读
    lastUpdated: {
      level: 'public',
      type: 'string',
      description: '最后更新时间',
      readonly: true,
      visibleInInteraction: false,
      visibleInDebug: true
    },

    // 🔒 基础UI属性 - 受保护级别
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

export default gaugeChartDefinition
