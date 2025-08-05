import { defineAsyncComponent } from 'vue'
import type { IComponentDefinition } from '@/card2.1/core'
import { $t } from '@/locales'
import poster from './poster.png'

const EnumControlCard = defineAsyncComponent(() => import('./component.vue'))
const EnumControlConfig = defineAsyncComponent(() => import('./card-config.vue'))

const definition: IComponentDefinition = {
  id: 'chart-enum-control',
  component: EnumControlCard,
  meta: {
    name: 'chart-enum-control',
    title: $t('card.enumControl') || '枚举控制',
    description: '枚举选择控制组件',
    category: 'chart',
    icon: 'mdi:format-list-bulleted',
    version: '1.0.0',
    poster
  },
  properties: {
    title: {
      type: 'string',
      label: $t('common.title'),
      default: $t('card.enumControl') || '枚举控制'
    }
  },
  configComponent: {
    component: EnumControlConfig,
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
