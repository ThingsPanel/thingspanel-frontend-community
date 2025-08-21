/**
 * IoT设备状态卡片组件定义
 * 专为物联网设备监控设计的状态卡片
 */

import type { ComponentDefinition } from '@/card2.1/core/types'
import IoTDeviceStatusCard from './IoTDeviceStatusCard.vue'
import IoTDeviceStatusConfig from './config/IoTDeviceStatusConfig.vue'

const iotDeviceStatusCardDefinition: ComponentDefinition = {
  // 基础信息
  type: 'iot-device-status-card',
  name: 'IoT设备状态卡片',
  description: '专为物联网设备监控设计，支持实时状态、指标监控、告警处理',
  category: 'IoT设备',
  version: '1.0.0',
  author: 'ThingsPanel',

  // 组件实现
  component: IoTDeviceStatusCard,
  configComponent: IoTDeviceStatusConfig,

  // 默认配置
  defaultConfig: {
    // 设备基础信息
    deviceName: 'IoT设备',
    deviceType: '温湿度传感器',
    deviceCategory: 'sensor',

    // 显示配置
    showLocation: true,
    showSignalStrength: true,
    showActions: true,

    // 图标配置
    iconSize: 28,
    deviceIcon: 'sensor',

    // 指标配置
    primaryMetrics: [],
    maxMetricsDisplay: 4,

    // 操作配置
    actions: [
      { key: 'refresh', label: '刷新', type: 'default', icon: 'restart' },
      { key: 'configure', label: '配置', type: 'primary', icon: 'configure' }
    ],
    actionSize: 'small',

    // 样式配置
    backgroundColor: '#ffffff',
    borderColor: '#e6e6e6',
    borderRadius: 12,
    textColor: '#333333',
    headerColor: '#1a1a1a',
    padding: 16,
    minHeight: 280,

    // 状态配置
    statusColors: {
      online: '#52c41a',
      offline: '#ff4d4f',
      warning: '#faad14',
      error: '#ff4d4f'
    }
  },

  // 默认布局
  defaultLayout: {
    canvas: {
      width: 350,
      height: 320,
      x: 0,
      y: 0
    },
    gridstack: {
      w: 3,
      h: 4,
      x: 0,
      y: 0,
      minW: 2,
      minH: 3,
      maxW: 6,
      maxH: 8
    }
  },

  // 数据源支持
  supportedDataSources: ['api', 'websocket', 'mqtt', 'static'],

  // 数据需求声明
  dataRequirements: {
    // 主要数据字段
    primary: {
      name: 'deviceStatus',
      type: 'object',
      required: true,
      description: '设备状态对象，包含设备基本信息和运行状态'
    },

    // 可选数据字段
    fields: [
      {
        name: 'deviceName',
        type: 'string',
        required: false,
        description: '设备名称'
      },
      {
        name: 'deviceType',
        type: 'string',
        required: false,
        description: '设备类型'
      },
      {
        name: 'status',
        type: 'string',
        required: true,
        enum: ['online', 'offline', 'warning', 'error'],
        description: '设备运行状态'
      },
      {
        name: 'location',
        type: 'string',
        required: false,
        description: '设备位置'
      },
      {
        name: 'metrics',
        type: 'array',
        required: false,
        description: '设备监控指标数据'
      },
      {
        name: 'signalStrength',
        type: 'number',
        required: false,
        description: '信号强度 (0-100)'
      },
      {
        name: 'batteryLevel',
        type: 'number',
        required: false,
        description: '电池电量 (0-100)'
      },
      {
        name: 'lastUpdate',
        type: 'date',
        required: false,
        description: '最后更新时间'
      },
      {
        name: 'alerts',
        type: 'array',
        required: false,
        description: '告警信息列表'
      }
    ]
  },

  // 标签
  tags: ['iot', 'device', 'monitoring', 'status', 'realtime', 'sensors'],

  // 使用场景
  useCases: [
    {
      name: '环境监测传感器',
      description: '监控环境温度、湿度等参数的传感器设备',
      icon: 'thermometer'
    },
    {
      name: '智能网关设备',
      description: '物联网网关设备的状态监控',
      icon: 'router'
    },
    {
      name: '移动设备追踪',
      description: '移动IoT设备的位置和状态追踪',
      icon: 'location'
    },
    {
      name: '工业设备监控',
      description: '工业生产设备的运行状态监控',
      icon: 'factory'
    },
    {
      name: '智能家居设备',
      description: '智能家居设备的状态和控制',
      icon: 'home'
    }
  ],

  // 配置属性
  configSchema: {
    type: 'object',
    properties: {
      deviceName: {
        type: 'string',
        title: '设备名称',
        description: '设备的显示名称',
        default: 'IoT设备'
      },
      deviceType: {
        type: 'string',
        title: '设备类型',
        description: '设备的类型或型号',
        default: '温湿度传感器',
        enum: ['温湿度传感器', 'GPS追踪器', 'LoRa网关', '智能控制器', '环境监测器']
      },
      showLocation: {
        type: 'boolean',
        title: '显示位置信息',
        description: '是否显示设备位置信息',
        default: true
      },
      showSignalStrength: {
        type: 'boolean',
        title: '显示信号强度',
        description: '是否显示设备信号强度',
        default: true
      },
      showActions: {
        type: 'boolean',
        title: '显示操作按钮',
        description: '是否显示设备操作按钮',
        default: true
      },
      maxMetricsDisplay: {
        type: 'number',
        title: '最大指标数量',
        description: '最多显示的监控指标数量',
        default: 4,
        minimum: 1,
        maximum: 8
      },
      backgroundColor: {
        type: 'string',
        title: '背景色',
        description: '卡片背景颜色',
        format: 'color',
        default: '#ffffff'
      },
      textColor: {
        type: 'string',
        title: '文字色',
        description: '文字颜色',
        format: 'color',
        default: '#333333'
      },
      borderRadius: {
        type: 'number',
        title: '圆角大小',
        description: '卡片圆角大小',
        default: 12,
        minimum: 0,
        maximum: 50
      }
    }
  },

  // 交互事件
  events: {
    'device-action': {
      description: '设备操作事件',
      payload: {
        actionKey: 'string',
        actionLabel: 'string',
        deviceId: 'string',
        timestamp: 'date'
      }
    },
    'device-status-change': {
      description: '设备状态变化事件',
      payload: {
        deviceId: 'string',
        oldStatus: 'string',
        newStatus: 'string',
        timestamp: 'date'
      }
    },
    'alert-dismissed': {
      description: '告警消除事件',
      payload: {
        alertId: 'string',
        deviceId: 'string',
        timestamp: 'date'
      }
    }
  },

  // 性能配置
  performance: {
    // 推荐的数据更新间隔
    recommendedUpdateInterval: 5000,

    // 支持的并发实例数
    maxInstances: 50,

    // 内存使用等级
    memoryUsage: 'medium'
  },

  // 兼容性
  compatibility: {
    // 最低支持版本
    minVersion: '2.1.0',

    // 依赖的核心模块
    dependencies: ['interaction-system', 'data-binding', 'theme-system'],

    // 浏览器兼容性
    browsers: ['chrome', 'firefox', 'safari', 'edge']
  },

  // 特性标记
  features: {
    // 支持实时数据
    realtime: true,

    // 支持交互
    interactive: true,

    // 支持主题切换
    themeable: true,

    // 支持响应式布局
    responsive: true,

    // 支持数据绑定
    dataBinding: true,

    // 支持告警处理
    alerting: true
  },

  // 示例数据
  sampleData: {
    deviceName: '环境传感器01',
    deviceType: '温湿度传感器',
    status: 'online',
    location: '机房A-货架01',
    signalStrength: 85,
    batteryLevel: 78,
    lastUpdate: new Date(),
    metrics: [
      { label: '温度', value: 25.6, unit: '°C', color: '#ff6b6b', trend: 'up', trendText: '+0.5°C' },
      { label: '湿度', value: 68.2, unit: '%', color: '#4ecdc4', trend: 'stable', trendText: '持平' },
      { label: '压力', value: 1013.25, unit: 'hPa', color: '#45b7d1', trend: 'down', trendText: '-2.1hPa' },
      { label: '电池', value: 78, unit: '%', color: '#96ceb4', trend: 'down', trendText: '-5%' }
    ],
    alerts: []
  }
}

export default iotDeviceStatusCardDefinition
