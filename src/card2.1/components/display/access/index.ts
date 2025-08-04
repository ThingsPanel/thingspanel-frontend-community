import { defineAsyncComponent } from 'vue'
import type { IComponentDefinition } from '@/card2.1/core'
import { $t } from '@/locales'

const definition: IComponentDefinition = {
  id: 'access-num',
  is: defineAsyncComponent(() => import('./AccessCard.vue')),
  name: '设备接入数',
  category: 'display',
  component: defineAsyncComponent(() => import('./AccessCard.vue')),
  meta: {
    title: $t('card.deviceTotal'),
    description: '显示当前系统中的设备总数',
    icon: 'ant-design:bar-chart-outlined',
    tags: ['system', 'device', 'count']
  },
  properties: {
    title: {
      type: 'string',
      label: 'Title',
      default: $t('card.deviceTotal')
    },
    unit: {
      type: 'string',
      label: 'Unit',
      default: $t('card.deviceUnit')
    },
    icon: {
      type: 'string',
      label: 'Icon',
      default: 'ant-design:bar-chart-outlined'
    },
    startColor: {
      type: 'color',
      label: 'Start Color',
      default: '#ec4786'
    },
    endColor: {
      type: 'color',
      label: 'End Color',
      default: '#b955a4'
    }
  },
  events: {},
  slots: {}
}

export default definition
