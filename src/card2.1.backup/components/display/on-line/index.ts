import { defineAsyncComponent } from 'vue'
import type { IComponentDefinition } from '@/card2.1/core'
import { $t } from '@/locales'
import poster from './image.png'

const OnLineCard = defineAsyncComponent(() => import('./OnLineCard.vue'))

const definition: IComponentDefinition = {
  id: 'on-line',
  is: OnLineCard,
  name: $t('card.onlineDev'),
  icon: 'fa-wifi',
  category: 'display',
  component: OnLineCard,
  meta: {
    title: $t('card.onlineDev'),
    description: 'Displays the total number of online devices.',
    poster
  },
  properties: {
    title: {
      type: 'string',
      label: $t('common.title'),
      default: $t('card.onlineDev')
    },
    unit: {
      type: 'string',
      label: $t('common.unit'),
      default: $t('card.deviceUnit')
    },
    icon: {
      type: 'string',
      label: $t('common.icon'),
      default: 'fa-wifi'
    },
    startColor: {
      type: 'color',
      label: 'Start Color',
      default: '#865ec0'
    },
    endColor: {
      type: 'color',
      label: 'End Color',
      default: '#5144b4'
    }
  },
  events: {},
  slots: {}
}

export default definition
