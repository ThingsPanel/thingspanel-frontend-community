import { defineAsyncComponent } from 'vue'
import type { IComponentDefinition } from '@/card2.1/core'
import { $t } from '@/locales'
import poster from './image.png'

const ReportedDataCard = defineAsyncComponent(() => import('./ReportedDataCard.vue'))

const definition: IComponentDefinition = {
  id: 'reported-data',
  is: ReportedDataCard,
  name: $t('card.reportedData.title'),
  icon: 'mdi:chart-bar',
  category: 'display',
  component: ReportedDataCard,
  meta: {
    title: $t('card.reportedData.title'),
    description: 'Displays the latest telemetry data from devices with real-time updates.',
    poster
  },
  properties: {
    title: {
      type: 'string',
      label: $t('common.title'),
      default: $t('card.reportedData.title')
    }
  },
  events: {},
  slots: {}
}

export default definition
