import { defineAsyncComponent } from 'vue'
import type { IComponentDefinition } from '@/card2.1/core'
import { $t } from '@/locales'
import poster from './image.png'

const TenantChartCard = defineAsyncComponent(() => import('./TenantChartCard.vue'))

const definition: IComponentDefinition = {
  id: 'tenant-chart',
  is: TenantChartCard,
  name: $t('card.tenantChart.title'),
  icon: 'mdi:chart-bar-stacked',
  category: 'chart',
  component: TenantChartCard,
  meta: {
    title: $t('card.tenantChart.title'),
    description: $t('card.tenantChart.description'),
    poster
  },
  properties: {
    title: {
      type: 'string',
      label: $t('common.title'),
      default: $t('card.tenantChart.title')
    }
  },
  events: {},
  slots: {}
}

export default definition
