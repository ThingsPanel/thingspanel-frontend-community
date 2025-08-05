import { defineAsyncComponent } from 'vue'
import type { IComponentDefinition } from '@/card2.1/core'
import { $t } from '@/locales'
import poster from './poster.png'

const BarCard = defineAsyncComponent(() => import('./BarCard.vue'))
const BarConfig = defineAsyncComponent(() => import('./BarConfig.vue'))

const definition: IComponentDefinition = {
  id: 'chart-bar',
  component: BarCard,
  meta: {
    name: 'chart-bar',
    title: $t('card.barChart'),
    description: '显示柱状图表，支持多系列数据和时间聚合',
    category: 'chart',
    icon: 'mdi:chart-bar',
    version: '1.0.0',
    poster
  },
  properties: {
    title: {
      type: 'string',
      label: $t('common.title'),
      default: $t('card.barChart')
    },
    showLegend: {
      type: 'boolean',
      label: '显示图例',
      default: true
    }
  },
  configComponent: {
    component: BarConfig,
    replaceDefault: false, // 不替换默认属性面板，而是补充
    extraConfigKeys: ['selectedTheme', 'colorGroups']
  },
  defaultSize: {
    width: 6,
    height: 5
  },
  minSize: {
    width: 3,
    height: 3
  }
}

export default definition
