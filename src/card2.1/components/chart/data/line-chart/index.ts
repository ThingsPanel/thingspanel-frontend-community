/**
 * 折线图组件定义
 */
import LineChart from './index.vue'
import LineChartSetting from './setting.vue'
import type { ComponentDefinition } from '@/card2.1/core2'
import type { LineChartCustomize } from './settingConfig'

const lineChartDefinition: ComponentDefinition = {
  type: 'line-chart',
  name: '折线图',
  description: 'ECharts折线图，用于展示数据随时间变化的趋势',
  icon: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M3,14L3.5,14.07L8.07,9.5C7.89,8.85 8.06,8.11 8.59,7.59C9.37,6.8 10.63,6.8 11.41,7.59C11.94,8.11 12.11,8.85 11.93,9.5L14.5,12.07L15,12C15.18,12 15.35,12 15.5,12.07L19.07,8.5C19,8.35 19,8.18 19,8C19,6.89 19.89,6 21,6C22.11,6 23,6.89 23,8C23,9.11 22.11,10 21,10C20.82,10 20.65,10 20.5,9.93L16.93,13.5C17,13.65 17,13.82 17,14C17,15.11 16.11,16 15,16C13.89,16 13,15.11 13,14C13,13.82 13,13.65 13.07,13.5L10.5,10.93C10.35,11 10.18,11 10,11C9.82,11 9.65,11 9.5,10.93L4.93,15.5C5,15.65 5,15.82 5,16C5,17.11 4.11,18 3,18C1.89,18 1,17.11 1,16C1,14.89 1.89,14 3,14Z"/></svg>',
  version: '1.0.0',
  author: 'ThingsPanel',
  component: LineChart,
  configComponent: LineChartSetting,

  // 默认配置
  defaultConfig: {
    type: 'line-chart',
    root: {
      transform: { rotate: 0, scale: 1 }
    },
    customize: {
      title: '数据趋势',
      showLegend: true,
      smooth: true,
      showArea: false,
      xAxisLabel: '时间',
      yAxisLabel: '数值',
      showGrid: true,
      lineColor: '#5470c6',
      areaColor: 'rgba(84, 112, 198, 0.3)',
      showDataPoints: true,
      dataPointSize: 6,
      animationDuration: 1000
    }
  },

  config: {
    type: 'line-chart',
    root: {
      transform: { rotate: 0, scale: 1 }
    },
    customize: {
      title: '数据趋势',
      showLegend: true,
      smooth: true,
      showArea: false,
      xAxisLabel: '时间',
      yAxisLabel: '数值',
      showGrid: true,
      lineColor: '#5470c6',
      areaColor: 'rgba(84, 112, 198, 0.3)',
      showDataPoints: true,
      dataPointSize: 6,
      animationDuration: 1000
    }
  },

  // 布局配置
  defaultLayout: {
    gridstack: {
      w: 4,
      h: 3,
      x: 0,
      y: 0,
      minW: 3,
      minH: 2,
      maxW: 8,
      maxH: 6
    }
  },

  layout: {
    defaultSize: { width: 4, height: 3 },
    minSize: { width: 3, height: 2 },
    maxSize: { width: 8, height: 6 },
    resizable: true
  },

  // 权限控制
  permission: '不限',

  // 分类信息
  tags: ['图表', '折线图', 'ECharts', '趋势'],

  // 功能特性
  features: {
    realtime: true,
    dataBinding: true,
    configurable: true
  },

  // 数据源定义
  dataSources: [
    {
      key: 'main',
      name: '数据源',
      description: '折线图的时间序列数据',
      supportedTypes: ['static', 'api', 'websocket'],
      required: false,
      example: {
        xData: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00'],
        yData: [120, 200, 150, 80, 70, 110],
        timestamp: '2025-10-15T10:30:00.000Z'
      }
    }
  ],

  // 交互能力
  interactionCapabilities: {
    supportedEvents: ['click', 'dataChange'],
    availableActions: ['navigateToUrl', 'updateComponentData', 'showNotification'],
    watchableProperties: {},
    defaultInteractions: []
  }
}

export default lineChartDefinition
