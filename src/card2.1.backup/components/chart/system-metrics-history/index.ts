import { defineAsyncComponent } from 'vue'
import type { IComponentDefinition } from '@/card2.1/core'
import { $t } from '@/locales'
import poster from './image.png'

const SystemMetricsHistoryCard = defineAsyncComponent(() => import('./SystemMetricsHistoryCard.vue'))

const definition: IComponentDefinition = {
  id: 'system-metrics-history',
  is: SystemMetricsHistoryCard,
  name: $t('card.systemMetricsHistory.title'),
  icon: 'mdi:chart-timeline-variant',
  category: 'chart',
  component: SystemMetricsHistoryCard,
  meta: {
    title: $t('card.systemMetricsHistory.title'),
    description: 'Displays the historical trends of system metrics like CPU, memory, and disk.',
    poster
  },
  properties: {
    title: {
      type: 'string',
      label: $t('common.title'),
      default: $t('card.systemMetricsHistory.title')
    }
  },
  events: {},
  slots: {}
}

export default definition
