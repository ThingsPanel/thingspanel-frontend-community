import { defineAsyncComponent } from 'vue'
import type { IComponentDefinition } from '@/card2.1/core'
import { $t } from '@/locales'
import poster from './poster.png'

const DispatchDataCard = defineAsyncComponent(() => import('./component.vue'))
const DispatchDataConfig = defineAsyncComponent(() => import('./card-config.vue'))

const definition: IComponentDefinition = {
  id: 'chart-dispatch-data',
  component: DispatchDataCard,
  meta: {
    name: 'chart-dispatch-data',
    title: $t('card.dataSent') || '数据分发',
    description: '数据分发和传输组件',
    category: 'chart',
    icon: 'mdi:export',
    version: '1.0.0',
    poster
  },
  properties: {
    title: {
      type: 'string',
      label: $t('common.title'),
      default: $t('card.dataSent') || '数据分发'
    }
  },
  configComponent: {
    component: DispatchDataConfig,
    replaceDefault: false
  },
  defaultSize: {
    width: 3,
    height: 2
  },
  minSize: {
    width: 2,
    height: 1
  }
}

export default definition
