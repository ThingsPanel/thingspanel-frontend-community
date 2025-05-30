import { defineAsyncComponent } from 'vue'
import type { ICardDefine } from '@/components/panel/card'
import poster from './poster.png'
export default {
  id: 'instrument-panel',
  type: 'chart',
  component: defineAsyncComponent(() => import('./component.vue')),
  configForm: defineAsyncComponent(() => import('./card-config.vue')),
  poster,
  title: 'dashboard_panel.cardName.instrumentPanel',
  preset: {
    dataSource: {
      origin: 'device',
      sourceNum: 1,
      systemSource: [{}],
      deviceSource: [{}]
    },
    config: {
      unit: '',
      min: 0,
      max: 200
    },
    iCardViewDefault: {
      w: 5,
      h: 3,
      minH: 1,
      minW: 2
    }
  }
} as ICardDefine
