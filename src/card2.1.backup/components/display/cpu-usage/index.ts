import { defineAsyncComponent } from 'vue'
import type { IComponentDefinition } from '@/card2.1/core'
import { $t } from '@/locales'
import poster from './image.png'

const CpuUsageCard = defineAsyncComponent(() => import('./CpuUsageCard.vue'))

const definition: IComponentDefinition = {
  id: 'cpu-usage',
  is: CpuUsageCard,
  name: $t('card.cpuUsage'),
  icon: 'fa-microchip',
  category: 'display',
  component: CpuUsageCard,
  meta: {
    title: $t('card.cpuUsage'),
    description: 'Displays the current CPU usage of the system.',
    poster
  },
  properties: {
    title: {
      type: 'string',
      label: $t('common.title'),
      default: $t('card.cpuUsage')
    },
    icon: {
      type: 'string',
      label: $t('common.icon'),
      default: 'fa-microchip'
    },
    startColor: {
      type: 'color',
      label: 'Start Color',
      default: '#4ade80'
    },
    endColor: {
      type: 'color',
      label: 'End Color',
      default: '#22c55e'
    }
  },
  events: {},
  slots: {}
}

export default definition
