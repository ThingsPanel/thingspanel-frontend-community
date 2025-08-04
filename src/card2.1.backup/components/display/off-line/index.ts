import { defineAsyncComponent } from 'vue'
import type { IComponentDefinition } from '@/card2.1/core'
import { $t } from '@/locales'
import poster from './image.png'

const OffLineCard = defineAsyncComponent(() => import('./OffLineCard.vue'))

const definition: IComponentDefinition = {
  id: 'off-line',
  is: OffLineCard,
  name: $t('card.offlineDev'),
  icon: 'fa-ban',
  category: 'display',
  component: OffLineCard,
  meta: {
    title: $t('card.offlineDev'),
    description: 'Displays the total number of offline devices.',
    poster
  },
  properties: {
    title: {
      type: 'string',
      label: $t('common.title'),
      default: $t('card.offlineDev')
    },
    unit: {
      type: 'string',
      label: $t('common.unit'),
      default: $t('card.deviceUnit')
    },
    icon: {
      type: 'string',
      label: $t('common.icon'),
      default: 'fa-ban'
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
