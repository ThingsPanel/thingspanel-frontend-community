import { defineAsyncComponent } from 'vue'
import type { IComponentDefinition } from '@/card2.1/core'
import { $t } from '@/locales'
import poster from './poster.png'

const DigitSetterCard = defineAsyncComponent(() => import('./component.vue'))
const DigitSetterConfig = defineAsyncComponent(() => import('./card-config.vue'))

const definition: IComponentDefinition = {
  id: 'chart-digit-setter',
  component: DigitSetterCard,
  meta: {
    name: 'chart-digit-setter',
    title: $t('card.numControl') || '数字设置器',
    description: '数字输入和设置组件',
    category: 'chart',
    icon: 'mdi:numeric',
    version: '1.0.0',
    poster
  },
  properties: {
    title: {
      type: 'string',
      label: $t('common.title'),
      default: $t('card.numControl') || '数字设置器'
    }
  },
  configComponent: {
    component: DigitSetterConfig,
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
