/**
 * 实时图表卡片组件定义
 * 支持多种图表类型的实时数据可视化
 */

import type { ComponentDefinition } from '@/card2.1/core/types'
import RealtimeChartCard from './RealtimeChartCard.vue'
import RealtimeChartConfig from './config/RealtimeChartConfig.vue'

const realtimeChartCardDefinition: ComponentDefinition = {
  // 基础信息
  type: 'realtime-chart-card',
  name: '实时图表卡片',
  description: '支持多种图表类型的实时数据可视化组件，适用于时序数据展示和监控',
  category: '图表可视化',
  version: '1.0.0',
  author: 'ThingsPanel',

  // 组件实现
  component: RealtimeChartCard,
  configComponent: RealtimeChartConfig,

  // 默认配置
  defaultConfig: {
    // 图表配置
    title: '实时图表',
    subtitle: '数据实时更新',
    showSubtitle: true,
    chartType: 'line',

    // 数据配置
    maxDataPoints: 50,
    updateInterval: 2000,
    timeRange: 300, // 5分钟

    // 显示配置
    showLegend: true,
    showStats: true,
    showTimeRange: true,
    showRealtimeToggle: true,
    allowTypeSwitch: true,

    // 样式配置
    backgroundColor: '#ffffff',
    borderColor: '#e6e6e6',
    borderRadius: 8,
    textColor: '#333333',
    titleColor: '#1a1a1a',
    padding: 16,
    chartHeight: 300,

    // 图表样式
    gridColor: '#f0f0f0',
    axisColor: '#cccccc',
    lineWidth: 2,
    pointSize: 4,

    // 颜色配置
    seriesColors: ['#1890ff', '#52c41a', '#faad14', '#ff4d4f', '#722ed1']
  },

  // 默认布局
  defaultLayout: {
    canvas: {
      width: 500,
      height: 400,
      x: 0,
      y: 0
    },
    gridstack: {
      w: 4,
      h: 5,
      x: 0,
      y: 0,
      minW: 3,
      minH: 4,
      maxW: 8,
      maxH: 10
    }
  },

  // 数据源支持
  supportedDataSources: ['api', 'websocket', 'mqtt', 'static', 'database'],

  // 数据需求声明
  dataRequirements: {
    // 主要数据字段
    primary: {
      name: 'timeSeriesData',
      type: 'array',
      required: true,
      description: '时序数据集合，包含时间戳和数值'
    },

    // 可选数据字段
    fields: [
      {
        name: 'title',
        type: 'string',
        required: false,
        description: '图表标题'
      },
      {
        name: 'series',
        type: 'array',
        required: false,
        description: '数据系列配置'
      },
      {
        name: 'dataPoints',
        type: 'array',
        required: false,
        description: '数据点集合'
      },
      {
        name: 'timeRange',
        type: 'object',
        required: false,
        description: '时间范围配置'
      },
      {
        name: 'threshold',
        type: 'array',
        required: false,
        description: '阈值线配置'
      },
      {
        name: 'realtime',
        type: 'object',
        required: false,
        description: '实时更新配置'
      }
    ]
  },

  // 标签
  tags: ['chart', 'realtime', 'timeseries', 'visualization', 'data', 'monitoring'],

  // 使用场景
  useCases: [
    {
      name: '环境监控仪表板',
      description: '实时显示温度、湿度等环境参数变化',
      icon: 'thermometer'
    },
    {
      name: '系统性能监控',
      description: '监控系统CPU、内存等性能指标',
      icon: 'speedometer'
    },
    {
      name: '业务数据分析',
      description: '展示订单量、用户访问等业务指标趋势',
      icon: 'analytics'
    },
    {
      name: '设备状态追踪',
      description: '跟踪IoT设备的运行状态和数据变化',
      icon: 'pulse'
    },
    {
      name: '网络流量监控',
      description: '实时监控网络带宽和流量使用情况',
      icon: 'wifi'
    }
  ],

  // 配置属性
  configSchema: {
    type: 'object',
    properties: {
      title: {
        type: 'string',
        title: '图表标题',
        description: '图表的显示标题',
        default: '实时图表'
      },
      subtitle: {
        type: 'string',
        title: '图表副标题',
        description: '图表的副标题或描述',
        default: '数据实时更新'
      },
      chartType: {
        type: 'string',
        title: '图表类型',
        description: '图表的显示类型',
        default: 'line',
        enum: ['line', 'bar', 'area'],
        enumNames: ['折线图', '柱状图', '面积图']
      },
      maxDataPoints: {
        type: 'number',
        title: '最大数据点',
        description: '图表显示的最大数据点数量',
        default: 50,
        minimum: 10,
        maximum: 500
      },
      updateInterval: {
        type: 'number',
        title: '更新间隔',
        description: '数据更新间隔（毫秒）',
        default: 2000,
        minimum: 500,
        maximum: 60000
      },
      timeRange: {
        type: 'number',
        title: '时间范围',
        description: '图表显示的时间范围（秒）',
        default: 300,
        minimum: 60,
        maximum: 7200
      },
      showLegend: {
        type: 'boolean',
        title: '显示图例',
        description: '是否显示图表图例',
        default: true
      },
      showStats: {
        type: 'boolean',
        title: '显示统计',
        description: '是否显示统计信息',
        default: true
      },
      showRealtimeToggle: {
        type: 'boolean',
        title: '显示实时开关',
        description: '是否显示实时更新开关',
        default: true
      },
      allowTypeSwitch: {
        type: 'boolean',
        title: '允许切换图表类型',
        description: '是否允许用户切换图表类型',
        default: true
      },
      backgroundColor: {
        type: 'string',
        title: '背景色',
        description: '图表背景颜色',
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
      chartHeight: {
        type: 'number',
        title: '图表高度',
        description: '图表的高度（像素）',
        default: 300,
        minimum: 200,
        maximum: 800
      },
      lineWidth: {
        type: 'number',
        title: '线条宽度',
        description: '线条的宽度',
        default: 2,
        minimum: 1,
        maximum: 10
      }
    }
  },

  // 交互事件
  events: {
    'chart-type-change': {
      description: '图表类型变化事件',
      payload: {
        oldType: 'string',
        newType: 'string',
        timestamp: 'date'
      }
    },
    'realtime-toggle': {
      description: '实时更新开关事件',
      payload: {
        enabled: 'boolean',
        timestamp: 'date'
      }
    },
    'data-point-click': {
      description: '数据点点击事件',
      payload: {
        series: 'string',
        value: 'number',
        timestamp: 'number',
        index: 'number'
      }
    },
    'time-range-change': {
      description: '时间范围变化事件',
      payload: {
        oldRange: 'number',
        newRange: 'number',
        timestamp: 'date'
      }
    },
    'threshold-crossed': {
      description: '阈值穿越事件',
      payload: {
        series: 'string',
        value: 'number',
        threshold: 'number',
        direction: 'string', // 'up' or 'down'
        timestamp: 'date'
      }
    }
  },

  // 性能配置
  performance: {
    // 推荐的数据更新间隔
    recommendedUpdateInterval: 2000,

    // 支持的并发实例数
    maxInstances: 20,

    // 内存使用等级
    memoryUsage: 'high', // 图表组件内存使用较高

    // CPU 使用等级
    cpuUsage: 'medium'
  },

  // 兼容性
  compatibility: {
    // 最低支持版本
    minVersion: '2.1.0',

    // 依赖的核心模块
    dependencies: ['interaction-system', 'data-binding', 'theme-system', 'canvas-api'],

    // 浏览器兼容性
    browsers: ['chrome', 'firefox', 'safari', 'edge'],

    // 移动端支持
    mobile: true
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

    // 支持数据导出
    exportable: true,

    // 支持缩放
    zoomable: true,

    // 支持动画
    animated: true
  },

  // 示例数据
  sampleData: {
    title: '环境监控数据',
    subtitle: '过去5分钟实时数据',
    timeSeriesData: [
      { timestamp: Date.now() - 300000, value: 25.6, series: 'temperature' },
      { timestamp: Date.now() - 240000, value: 26.1, series: 'temperature' },
      { timestamp: Date.now() - 180000, value: 25.8, series: 'temperature' },
      { timestamp: Date.now() - 120000, value: 26.3, series: 'temperature' },
      { timestamp: Date.now() - 60000, value: 26.0, series: 'temperature' },
      { timestamp: Date.now(), value: 25.9, series: 'temperature' },

      { timestamp: Date.now() - 300000, value: 68.2, series: 'humidity' },
      { timestamp: Date.now() - 240000, value: 67.8, series: 'humidity' },
      { timestamp: Date.now() - 180000, value: 68.5, series: 'humidity' },
      { timestamp: Date.now() - 120000, value: 67.1, series: 'humidity' },
      { timestamp: Date.now() - 60000, value: 68.0, series: 'humidity' },
      { timestamp: Date.now(), value: 68.3, series: 'humidity' }
    ],
    series: [
      { name: '温度', color: '#1890ff', unit: '°C', visible: true },
      { name: '湿度', color: '#52c41a', unit: '%', visible: true }
    ],
    threshold: [
      { value: 30, color: '#ff4d4f', label: '高温警告', series: 'temperature' },
      { value: 80, color: '#faad14', label: '高湿度', series: 'humidity' }
    ],
    realtime: {
      enabled: true,
      interval: 2000,
      autoScroll: true,
      maxPoints: 50
    }
  },

  // 文档和帮助
  documentation: {
    // 快速开始指南
    quickStart: {
      title: '快速开始',
      description: '如何快速配置和使用实时图表卡片',
      steps: [
        '添加组件到画布',
        '配置图表标题和类型',
        '设置数据源和更新间隔',
        '自定义样式和显示选项',
        '启用实时更新功能'
      ]
    },

    // API 参考
    apiReference: {
      dataFormat: '数据格式：时序数据数组，每个数据点包含 timestamp 和 value',
      events: '支持的事件：图表类型变化、实时开关、数据点点击等',
      methods: '可用方法：addDataPoint, clearData, updateSeries, setTimeRange'
    },

    // 常见问题
    faq: [
      {
        question: '如何自定义图表颜色？',
        answer: '在配置面板的"系列颜色"部分可以设置每个数据系列的颜色'
      },
      {
        question: '数据更新频率如何控制？',
        answer: '通过"更新间隔"设置控制数据刷新频率，建议不低于500ms'
      },
      {
        question: '如何设置数据阈值告警？',
        answer: '通过数据源配置添加阈值配置，支持多个阈值线'
      }
    ]
  }
}

export default realtimeChartCardDefinition
