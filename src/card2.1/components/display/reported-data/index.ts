import { defineAsyncComponent } from 'vue'
import type { IComponentDefinition } from '@/card2.1/core'
import { $t } from '@/locales'
import poster from './image.png'

const ReportedDataCard = defineAsyncComponent(() => import('./ReportedDataCard.vue'))

const definition: IComponentDefinition = {
  id: 'reported-data',
  component: ReportedDataCard,
  meta: {
    name: 'reported-data',
    title: $t('card.reportedData.title'),
    description: 'Displays the latest telemetry data from devices with real-time updates.',
    category: 'display',
    icon: 'mdi:chart-bar',
    version: '1.0.0'
  },
  properties: {
    title: {
      type: 'string',
      label: $t('common.title'),
      default: $t('card.reportedData.title')
    }
  }
}

export default definition
