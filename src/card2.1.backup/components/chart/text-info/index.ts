import { defineAsyncComponent } from 'vue'
import type { IComponentDefinition } from '@/card2.1/core'
import { $t } from '@/locales'
import poster from './poster.png'

const TextInfoCard = defineAsyncComponent(() => import('./component.vue'))
const TextInfoConfig = defineAsyncComponent(() => import('./card-config.vue'))

const definition: IComponentDefinition = {
  id: 'chart-text-info',
  component: TextInfoCard,
  meta: {
    name: 'chart-text-info',
    title: $t('card.textInfo') || '文本信息',
    description: '文本信息显示组件',
    category: 'chart',
    icon: 'mdi:text',
    version: '1.0.0',
    poster
  },
  properties: {
    title: {
      type: 'string',
      label: $t('common.title'),
      default: $t('card.textInfo') || '文本信息'
    }
  },
  configComponent: {
    component: TextInfoConfig,
    replaceDefault: false
  },
  defaultSize: {
    width: 2,
    height: 2
  },
  minSize: {
    width: 1,
    height: 1
  }
}

export default definition
