import { defineAsyncComponent } from 'vue'
import type { ComponentDefinition } from '../../core/types'
import type { ComponentDataSourceDefinition } from '../../../components/visual-editor/types/data-source'
import { MultiDataTestIcon } from './icon'

// 异步加载组件
const MultiDataTestCard = defineAsyncComponent(() => import('./MultiDataTestCard.vue'))
const MultiDataTestConfig = defineAsyncComponent(() => import('./MultiDataTestConfig.vue'))

// 组件数据源定义 - 两个数据源
const dataSourceDefinitions: ComponentDataSourceDefinition[] = [
  {
    name: 'environmentData',
    type: 'object',
    required: true,
    description: '环境数据源，包含温度和湿度',
    defaultValue: { temperature: 0, humidity: 0 },
    mappingKeys: ['temperature', 'humidity']
  },
  {
    name: 'deviceStatus',
    type: 'string',
    required: false,
    description: '设备状态数据源',
    defaultValue: '正常',
    mappingKeys: ['status']
  }
]

// 组件定义
const multiDataTestDefinition: ComponentDefinition = {
  type: 'multi-data-test',
  name: '多数据测试',
  description: '测试多数据源支持的组件，支持从不同数据源获取数据',
  category: 'card21',
  icon: MultiDataTestIcon,
  component: MultiDataTestCard,
  configComponent: MultiDataTestConfig,
  dataSourceDefinitions, // 添加数据源定义
  properties: {
    title: {
      type: 'string',
      default: '多数据测试',
      description: '显示标题'
    },
    color: {
      type: 'string',
      default: '#1890ff',
      description: '显示颜色'
    },
    fontSize: {
      type: 'number',
      default: 16,
      description: '字体大小'
    }
  }
}

export default multiDataTestDefinition
