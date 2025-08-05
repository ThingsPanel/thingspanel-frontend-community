import { defineAsyncComponent } from 'vue'
import type { IComponentDefinition } from '@/card2.1/core'
import { $t } from '@/locales'
import poster from './image.png'

const OnlineTrendCard = defineAsyncComponent(() => import('./OnlineTrendCard.vue'))

const definition: IComponentDefinition = {
  id: 'online-trend',
  component: OnlineTrendCard,
  meta: {
    name: 'online-trend',
    title: $t('card.onlineTrend'),
    description: 'Displays the trend of online and offline devices.',
    category: 'chart',
    icon: 'mdi:chart-line',
    version: '1.0.0'
  },
  properties: {
    title: {
      type: 'string',
      label: $t('common.title'),
      default: $t('card.onlineTrend')
    }
  }
}

export default definition
