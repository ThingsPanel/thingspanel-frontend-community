import { defineAsyncComponent } from 'vue'
import type { IComponentDefinition } from '@/card2.1/core'
import { $t } from '@/locales'
import poster from './poster.png'

const DemoCard = defineAsyncComponent(() => import('./component.vue'))
const DemoConfig = defineAsyncComponent(() => import('./card-config.vue'))

const definition: IComponentDefinition = {
  id: 'chart-demo',
  component: DemoCard,
  meta: {
    name: 'chart-demo',
    title: $t('card.demo') || '演示组件',
    description: '演示组件，用于展示基本功能',
    category: 'chart',
    icon: 'mdi:chart-line',
    version: '1.0.0',
    poster
  },
  properties: {
    name: {
      type: 'string',
      label: '名称',
      default: '123'
    }
  },
  configComponent: {
    component: DemoConfig,
    replaceDefault: false
  },
  defaultSize: {
    width: 5,
    height: 3
  },
  minSize: {
    width: 2,
    height: 1
  }
}

export default definition
