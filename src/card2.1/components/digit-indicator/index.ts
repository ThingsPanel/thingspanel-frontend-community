import { defineAsyncComponent } from 'vue'
import type { ComponentDefinition } from '../../core/types'
import type { ComponentDataSourceDefinition } from '../../../components/visual-editor/types/data-source'
import { DigitIndicatorIcon } from './icon'

// 异步加载组件
const DigitIndicatorCard = defineAsyncComponent(() => import('./DigitIndicatorCard.vue'))
const DigitIndicatorConfig = defineAsyncComponent(() => import('./DigitIndicatorConfig.vue'))

// 组件数据源定义 - 一个数据源的三个key
const dataSourceDefinitions: ComponentDataSourceDefinition[] = [
  {
    name: 'mainData',
    type: 'object',
    required: true,
    description: '主要数据源，包含value、unit、title三个属性',
    defaultValue: { value: 0, unit: '', title: '数值' },
    mappingKeys: ['value', 'unit', 'title']
  }
]

// 组件定义
const digitIndicatorDefinition: ComponentDefinition = {
  type: 'digit-indicator',
  name: '数字指示器',
  description: '显示数值的指示器组件',
  category: 'chart', // 改为chart分类，这样会显示在曲线标签页
  icon: DigitIndicatorIcon,
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
