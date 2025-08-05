import { defineAsyncComponent } from 'vue'
import type { ComponentDefinition } from '../../core/types'
import type { ComponentDataSourceDefinition } from '../../../components/visual-editor/types/data-source'
import { BarChartIcon } from './icon'

// 异步加载组件
const BarChartCard = defineAsyncComponent(() => import('./BarChartCard.vue'))
const BarChartConfig = defineAsyncComponent(() => import('./BarChartConfig.vue'))

// 数据源定义 - 支持最多9个设备数据源
const dataSourceDefinitions: ComponentDataSourceDefinition[] = [
  {
    name: 'deviceData1',
    type: 'object',
    required: false,
    description: '设备数据源1',
    defaultValue: {},
    mappingKeys: ['deviceId', 'metricsId', 'data']
  },
  {
    name: 'deviceData2',
    type: 'object',
    required: false,
    description: '设备数据源2',
    defaultValue: {},
    mappingKeys: ['deviceId', 'metricsId', 'data']
  },
  {
    name: 'deviceData3',
    type: 'object',
    required: false,
    description: '设备数据源3',
    defaultValue: {},
    mappingKeys: ['deviceId', 'metricsId', 'data']
  },
  {
    name: 'deviceData4',
    type: 'object',
    required: false,
    description: '设备数据源4',
    defaultValue: {},
    mappingKeys: ['deviceId', 'metricsId', 'data']
  },
  {
    name: 'deviceData5',
    type: 'object',
    required: false,
    description: '设备数据源5',
    defaultValue: {},
    mappingKeys: ['deviceId', 'metricsId', 'data']
  },
  {
    name: 'deviceData6',
    type: 'object',
    required: false,
    description: '设备数据源6',
    defaultValue: {},
    mappingKeys: ['deviceId', 'metricsId', 'data']
  },
  {
    name: 'deviceData7',
    type: 'object',
    required: false,
    description: '设备数据源7',
    defaultValue: {},
    mappingKeys: ['deviceId', 'metricsId', 'data']
  },
  {
    name: 'deviceData8',
    type: 'object',
    required: false,
    description: '设备数据源8',
    defaultValue: {},
    mappingKeys: ['deviceId', 'metricsId', 'data']
  },
  {
    name: 'deviceData9',
    type: 'object',
    required: false,
    description: '设备数据源9',
    defaultValue: {},
    mappingKeys: ['deviceId', 'metricsId', 'data']
  }
]

// 组件定义
const barChartDefinition: ComponentDefinition = {
  type: 'bar-chart',
  name: '柱状图',
  description: '支持多数据源的柱状图组件，可配置颜色主题，支持时间范围查询和数据聚合',
  category: 'chart',
  mainCategory: '曲线',
  subCategory: '图表组件',
  icon: BarChartIcon,
  component: BarChartCard,
  configComponent: BarChartConfig,
  dataSourceDefinitions,
  properties: {
    selectedTheme: {
      type: 'string',
      default: 'colorGroups',
      description: '颜色主题选择'
    },
    colorGroups: {
      type: 'object',
      default: {},
      description: '颜色组配置'
    }
  }
}

export default barChartDefinition
