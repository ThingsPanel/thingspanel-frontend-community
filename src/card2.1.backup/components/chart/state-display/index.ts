import { defineAsyncComponent } from 'vue'
import type { IComponentDefinition } from '@/card2.1/core'
import { $t } from '@/locales'
import poster from './poster.png'

const StateDisplayCard = defineAsyncComponent(() => import('./component.vue'))
const StateDisplayConfig = defineAsyncComponent(() => import('./card-config.vue'))

const definition: IComponentDefinition = {
  id: 'chart-state-display',
  component: StateDisplayCard,
  meta: {
    name: 'chart-state-display',
    title: $t('card.statusCard') || '状态显示',
    description: '状态信息显示组件',
    category: 'chart',
    icon: 'mdi:information',
    version: '1.0.0',
    poster
  },
  properties: {
    title: {
      type: 'string',
      label: $t('common.title'),
      default: $t('card.statusCard') || '状态显示'
    }
  },
  configComponent: {
    component: StateDisplayConfig,
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
