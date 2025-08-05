import { defineAsyncComponent } from 'vue'
import type { IComponentDefinition } from '@/card2.1/core'
import { $t } from '@/locales'
import poster from './poster.png'

const InstrumentPanelCard = defineAsyncComponent(() => import('./component.vue'))
const InstrumentPanelConfig = defineAsyncComponent(() => import('./card-config.vue'))

const definition: IComponentDefinition = {
  id: 'chart-instrument-panel',
  component: InstrumentPanelCard,
  meta: {
    name: 'chart-instrument-panel',
    title: $t('dashboard_panel.cardName.instrumentPanel') || '仪表板',
    description: '仪表板显示组件',
    category: 'chart',
    icon: 'mdi:gauge',
    version: '1.0.0',
    poster
  },
  properties: {
    title: {
      type: 'string',
      label: $t('common.title'),
      default: $t('dashboard_panel.cardName.instrumentPanel') || '仪表板'
    },
    unit: {
      type: 'string',
      label: '单位',
      default: ''
    },
    min: {
      type: 'number',
      label: '最小值',
      default: 0
    },
    max: {
      type: 'number',
      label: '最大值',
      default: 200
    }
  },
  configComponent: {
    component: InstrumentPanelConfig,
    replaceDefault: false
  },
  defaultSize: {
    width: 5,
    height: 3
  },
  minSize: {
    width: 2,
    height: 1
  }
}

export default definition
