import type { ComponentDefinition } from '@/card2.1/types'
import BarChart from './index.vue'

export const barChartDefinition: ComponentDefinition = {
  type: 'bar-chart',
  name: '柱状图',
  description: '通用柱状图，可绑定数组或对象数据源渲染多个系列',
  version: '1.0.0',
  author: 'ThingsPanel',
  component: BarChart,
  permission: '不限',
  tags: ['图表', '柱状图', '数据', 'ECharts'],

  // 数据源定义：支持直接提供系列数据
  dataSources: [
    {
      key: 'seriesList',
      name: '系列数据',
      description: '柱状图系列数组，支持多序列；每个序列包含 name 与数据点列表',
      supportedTypes: ['static', 'api', 'websocket'],
      required: false,
      example: {
        series: [
          {
            name: '系列A',
            // 支持 [timestamp, value] 或 { x, y } 两种点格式
            data: [
              [1716986172333, 8],
              [1716986177338, 21],
              { x: 1716986182345, y: 10 }
            ]
          },
          {
            name: '系列B',
            data: [
              [1716986172333, 12],
              [1716986177338, 18],
              { x: 1716986182345, y: 16 }
            ]
          }
        ],
        unit: ''
      }
    }
  ]
}

export default barChartDefinition

