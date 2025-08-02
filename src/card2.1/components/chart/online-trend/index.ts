import { defineAsyncComponent } from 'vue'
import type { IComponentDefinition } from '@/card2.1/core'
import { $t } from '@/locales'
import poster from './image.png'

const OnlineTrendCard = defineAsyncComponent(() => import('./OnlineTrendCard.vue'))

const definition: IComponentDefinition = {
  id: 'online-trend',
  is: OnlineTrendCard,
  name: $t('card.onlineTrend'),
  icon: 'mdi:chart-line',
  category: 'chart',
  component: OnlineTrendCard,
  meta: {
    title: $t('card.onlineTrend'),
    description: 'Displays the trend of online and offline devices.',
    poster
  },
  properties: {
    title: {
      type: 'string',
      label: $t('common.title'),
      default: $t('card.onlineTrend')
    }
  },
  events: {},
  slots: {}
}

export default definition
