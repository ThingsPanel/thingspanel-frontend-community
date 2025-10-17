/**
 * 折线图组件定义
 */
import type { ComponentDefinition } from '@/card2.1/core2'
import type { LineChartCustomize } from './settingConfig'

export const lineChartDefinition: ComponentDefinition = {
  id: 'line-chart',
  name: '折线图',
  description: 'ECharts折线图，用于展示数据随时间变化的趋势',
  category: 'chart',
  subCategory: 'data',
  version: '1.0.0',
  author: 'ThingsPanel',

  // 组件配置接口
  component: {} as LineChartCustomize,

  // 默认配置
  defaultConfig: {
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
  },

  // 数据源定义 - 支持时间序列数据
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
    canTrigger: false,
    canReceive: false,
    exposedProperties: []
  },

  // 组件标签
  tags: ['图表', '折线图', 'ECharts', '趋势'],

  // 预览配置
  preview: {
    width: 400,
    height: 300
  }
}
