import { defineAsyncComponent } from 'vue'
import type { ComponentDefinition } from '../../core/types'
import type { ComponentDataSourceDefinition } from '../../../components/visual-editor/types/data-source'

// 异步加载组件
const DigitIndicatorCard = defineAsyncComponent(() => import('./DigitIndicatorCard.vue'))
const DigitIndicatorConfig = defineAsyncComponent(() => import('./DigitIndicatorConfig.vue'))

// 组件数据源定义
const dataSourceDefinitions: ComponentDataSourceDefinition[] = [
  {
    name: 'value',
    type: 'number',
    required: true,
    description: '显示的主要数值',
    defaultValue: 0
  },
  {
    name: 'unit',
    type: 'string',
    required: false,
    description: '数值单位',
    defaultValue: ''
  },
  {
    name: 'title',
    type: 'string',
    required: false,
    description: '显示标题',
    defaultValue: '数值'
  }
]

// 组件定义
const digitIndicatorDefinition: ComponentDefinition = {
  type: 'digit-indicator',
  name: '数字指示器',
  description: '显示数值的指示器组件',
  category: 'card21',
  icon: '📊',
  component: DigitIndicatorCard,
  configComponent: DigitIndicatorConfig,
  dataSourceDefinitions, // 添加数据源定义
  properties: {
    title: {
      type: 'string',
      default: '数值',
      description: '显示标题'
    },
    unit: {
      type: 'string',
      default: '',
      description: '数值单位'
    },
    color: {
      type: 'string',
      default: '#1890ff',
      description: '显示颜色'
    },
    fontSize: {
      type: 'number',
      default: 24,
      description: '字体大小'
    }
  }
}

export default digitIndicatorDefinition
