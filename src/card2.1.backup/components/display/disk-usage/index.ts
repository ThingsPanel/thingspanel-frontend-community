import { defineAsyncComponent } from 'vue'
import type { IComponentDefinition } from '@/card2.1/core'
import { $t } from '@/locales'
import poster from './image.png'

const DiskUsageCard = defineAsyncComponent(() => import('./DiskUsageCard.vue'))

const definition: IComponentDefinition = {
  id: 'disk-usage',
  is: DiskUsageCard,
  name: $t('card.diskUsage'),
  icon: 'ant-design:hdd-outlined',
  category: 'display',
  component: DiskUsageCard,
  meta: {
    title: $t('card.diskUsage'),
    description: 'Displays the current disk usage of the system.',
    poster
  },
  properties: {
    title: {
      type: 'string',
      label: $t('common.title'),
      default: $t('card.diskUsage')
    },
    icon: {
      type: 'string',
      label: $t('common.icon'),
      default: 'ant-design:hdd-outlined'
    },
    startColor: {
      type: 'color',
      label: 'Start Color',
      default: '#fb923c'
    },
    endColor: {
      type: 'color',
      label: 'End Color',
      default: '#f97316'
    }
  },
  events: {},
  slots: {}
}

export default definition
