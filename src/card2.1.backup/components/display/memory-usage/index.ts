import { defineAsyncComponent } from 'vue'
import type { IComponentDefinition } from '@/card2.1/core'
import { $t } from '@/locales'
import poster from './image.png'

const MemoryUsageCard = defineAsyncComponent(() => import('./MemoryUsageCard.vue'))

const definition: IComponentDefinition = {
  id: 'memory-usage',
  is: MemoryUsageCard,
  name: $t('card.memoryUsage'),
  icon: 'clarity:memory-line',
  category: 'display',
  component: MemoryUsageCard,
  meta: {
    title: $t('card.memoryUsage'),
    description: 'Displays the current memory usage of the system.',
    poster
  },
  properties: {
    title: {
      type: 'string',
      label: $t('common.title'),
      default: $t('card.memoryUsage')
    },
    icon: {
      type: 'string',
      label: $t('common.icon'),
      default: 'clarity:memory-line'
    },
    startColor: {
      type: 'color',
      label: 'Start Color',
      default: '#56cdf3'
    },
    endColor: {
      type: 'color',
      label: 'End Color',
      default: '#719de3'
    }
  },
  events: {},
  slots: {}
}

export default definition
