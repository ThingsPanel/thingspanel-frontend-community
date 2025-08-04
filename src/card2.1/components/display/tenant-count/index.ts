import { defineAsyncComponent } from 'vue'
import type { IComponentDefinition } from '@/card2.1/core'
import { $t } from '@/locales'
import poster from './image.png'

const TenantCountCard = defineAsyncComponent(() => import('./TenantCountCard.vue'))

const definition: IComponentDefinition = {
  id: 'tenant-count',
  is: TenantCountCard,
  name: $t('card.tenantCount.title'),
  icon: 'mdi:account-group',
  category: 'display',
  component: TenantCountCard,
  meta: {
    title: $t('card.tenantCount.title'),
    description: 'Displays the total number of tenants.',
    poster
  },
  properties: {
    title: {
      type: 'string',
      label: $t('common.title'),
      default: $t('card.tenantCount.title')
    },
    unit: {
      type: 'string',
      label: $t('common.unit'),
      default: $t('card.tenantCount.unit', '个')
    },
    icon: {
      type: 'string',
      label: $t('common.icon'),
      default: 'mdi:account-group'
    },
    startColor: {
      type: 'color',
      label: 'Start Color',
      default: '#3b82f6'
    },
    endColor: {
      type: 'color',
      label: 'End Color',
      default: '#60a5fa'
    }
  },
  events: {},
  slots: {}
}

export default definition
