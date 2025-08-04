import { defineAsyncComponent } from 'vue'
import type { IComponentDefinition } from '@/card2.1/core'
import { $t } from '@/locales'
import poster from './poster.png'

const DigitIndicatorCard = defineAsyncComponent(() => import('./DigitIndicatorCard.vue'))
const DigitIndicatorConfig = defineAsyncComponent(() => import('./DigitIndicatorConfig.vue'))

const definition: IComponentDefinition = {
  id: 'chart-digit',
  component: DigitIndicatorCard,
  meta: {
    name: 'chart-digit',
    title: $t('card.digitalIndicator'),
    description: '显示数字指示器，支持遥测数据和属性数据',
    category: 'display',
    icon: 'mdi:numeric',
    version: '1.0.0',
    poster
  },
  properties: {
    title: {
      type: 'string',
      label: $t('common.title'),
      default: $t('card.digitalIndicator')
    }
  },
  configComponent: {
    component: DigitIndicatorConfig,
    replaceDefault: false,
    extraConfigKeys: ['unit', 'color', 'iconName']
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
