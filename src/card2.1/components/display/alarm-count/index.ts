import { defineAsyncComponent } from 'vue'
import type { IComponentDefinition } from '@/card2.1/core'
import { $t } from '@/locales'

const definition: IComponentDefinition = {
  id: 'alarm-count',
  is: defineAsyncComponent(() => import('./AlarmCountCard.vue')),
  name: '告警次数',
  category: 'display',
  component: defineAsyncComponent(() => import('./AlarmCountCard.vue')),
  meta: {
    title: $t('card.alarmCount'),
    description: '显示系统中的总告警次数',
    icon: 'fa-bell',
    tags: ['system', 'alarm', 'count']
  },
  properties: {
    title: {
      type: 'string',
      label: 'Title',
      default: $t('card.alarmCount')
    },
    unit: {
      type: 'string',
      label: 'Unit',
      default: $t('card.alarmUnit')
    },
    icon: {
      type: 'string',
      label: 'Icon',
      default: 'fa-bell'
    },
    startColor: {
      type: 'color',
      label: 'Start Color',
      default: '#f97316'
    },
    endColor: {
      type: 'color',
      label: 'End Color',
      default: '#ef4444'
    }
  },
  events: {},
  slots: {}
}

export default definition
