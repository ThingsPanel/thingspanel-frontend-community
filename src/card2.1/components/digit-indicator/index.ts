import { defineAsyncComponent } from 'vue'
import type { IComponentDefinition } from '@/card2.1/core'
import { $t } from '@/locales'

const DigitIndicatorCard = defineAsyncComponent(() => import('./DigitIndicatorCard.vue'))
const DigitIndicatorConfig = defineAsyncComponent(() => import('./DigitIndicatorConfig.vue'))

const definition: IComponentDefinition = {
  id: 'chart-digit',
  component: DigitIndicatorCard,
  meta: {
    name: 'chart-digit',
    title: $t('card.digitalIndicator'),
    description: '显示数字指示器，支持自定义单位、颜色和图标',
    category: 'display',
    icon: 'mdi:numeric',
    version: '2.1.0'
  },
  properties: {
    title: {
      type: 'string',
      label: $t('common.title'),
      default: $t('card.digitalIndicator')
    },
    unit: {
      type: 'string',
      label: $t('device_template.table_header.unit'),
      default: '%'
    },
    color: {
      type: 'string',
      label: $t('generate.color'),
      default: 'blue'
    },
    iconName: {
      type: 'string',
      label: '图标',
      default: 'Water'
    },
    value: {
      type: 'string',
      label: '值',
      default: '45'
    }
  },
  configComponent: DigitIndicatorConfig,
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
