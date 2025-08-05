import { defineAsyncComponent } from 'vue'
import type { IComponentDefinition } from '@/card2.1/core'
import { $t } from '@/locales'
import poster from './image.png'

const RecentlyVisitedCard = defineAsyncComponent(() => import('./RecentlyVisitedCard.vue'))

const definition: IComponentDefinition = {
  id: 'recently-visited',
  is: RecentlyVisitedCard,
  name: $t('card.recentlyVisited.title'),
  icon: 'mdi:history',
  category: 'display',
  component: RecentlyVisitedCard,
  meta: {
    title: $t('card.recentlyVisited.title'),
    description: $t('card.recentlyVisited.description'),
    poster
  },
  properties: {
    title: {
      type: 'string',
      label: $t('common.title'),
      default: $t('card.recentlyVisited.title')
    }
  },
  events: {},
  slots: {}
}

export default definition
