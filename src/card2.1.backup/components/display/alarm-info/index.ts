import { defineAsyncComponent } from 'vue'
import type { IComponentDefinition } from '@/card2.1/core'
import { $t } from '@/locales'

const definition: IComponentDefinition = {
  id: 'alarm-info',
  is: defineAsyncComponent(() => import('./AlarmInfoCard.vue')),
  name: '告警信息',
  category: 'display',
  component: defineAsyncComponent(() => import('./AlarmInfoCard.vue')),
  meta: {
    title: $t('card.alarmInfo.title'),
    description: '显示最新的告警信息列表',
    icon: 'clarity:alarm-line',
    tags: ['system', 'alarm', 'list']
  },
  properties: {
    title: {
      type: 'string',
      label: 'Title',
      default: $t('card.alarmInfo.title', '告警信息')
    },
    viewAllText: {
      type: 'string',
      label: 'View All Text',
      default: $t('card.alarmInfo.viewAll', '查看全部')
    },
    viewAllRoute: {
      type: 'string',
      label: 'View All Route',
      default: '/alarm/warning-message'
    }
  },
  events: {},
  slots: {}
}

export default definition
