import { defineAsyncComponent } from 'vue'
import type { IComponentDefinition } from '@/card2.1/core'
import { $t } from '@/locales'
import poster from './poster.png'

const CurveCard = defineAsyncComponent(() => import('./CurveCard.vue'))

const definition: IComponentDefinition = {
  id: 'chart-curve',
  component: CurveCard,
  meta: {
    name: 'chart-curve',
    title: $t('card.curve'),
    description: '显示曲线图表，支持多系列数据和时间聚合',
    category: 'chart',
    icon: 'mdi:chart-line',
    version: '1.0.0',
    poster
  },
  properties: {
    title: {
      type: 'string',
      label: $t('common.title'),
      default: $t('card.curve')
    },
    showLegend: {
      type: 'boolean',
      label: '显示图例',
      default: true
    },
    curveWidth: {
      type: 'number',
      label: '线条宽度',
      default: 1,
      min: 1,
      max: 10
    },
    colorGroups: {
      type: 'object',
      label: '颜色配置',
      default: {
        colorGroup: [{ name: 'Sky Reflection', top: '#2563EB', bottom: '#93C5FD', line: '#2563EB' }]
      }
    }
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
