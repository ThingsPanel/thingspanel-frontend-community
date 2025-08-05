import { defineAsyncComponent } from 'vue'
import type { IComponentDefinition } from '@/card2.1/core'
import { $t } from '@/locales'
import poster from './image.png'

const NewsCard = defineAsyncComponent(() => import('./NewsCard.vue'))

const definition: IComponentDefinition = {
  id: 'news',
  is: NewsCard,
  name: $t('card.msgTotal'),
  icon: 'fa-envelope',
  category: 'display',
  component: NewsCard,
  meta: {
    title: $t('card.msgTotal'),
    description: 'Displays the total number of messages.',
    poster
  },
  properties: {
    title: {
      type: 'string',
      label: $t('common.title'),
      default: $t('card.msgTotal')
    },
    unit: {
      type: 'string',
      label: $t('common.unit'),
      default: $t('card.msgUnit')
    },
    icon: {
      type: 'string',
      label: $t('common.icon'),
      default: 'fa-envelope'
    },
    startColor: {
      type: 'color',
      label: 'Start Color',
      default: '#fcbc25'
    },
    endColor: {
      type: 'color',
      label: 'End Color',
      default: '#f68057'
    }
  },
  events: {},
  slots: {}
}

export default definition
