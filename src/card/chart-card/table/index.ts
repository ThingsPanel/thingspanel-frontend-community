import { defineAsyncComponent } from 'vue'
import type { ICardDefine } from '@/components/panel/card'
import { $t } from '@/locales'
import poster from './poster.png'

export default {
  id: 'chart-table',
  type: 'chart',
  component: defineAsyncComponent(() => import('./component.vue')),
  poster,
  title: $t('generate.table'),
  configForm: defineAsyncComponent(() => import('./card-config.vue')),
  preset: {
    dataSource: {
      origin: 'device',
      sourceNum: 20,
      isSupportTimeRange: true,
      isSupportAggregate: true,
      systemSource: [{}],
      deviceSource: [{}]
    },
    config: {
      name: '123'
    },
    iCardViewDefault: {
      w: 8,
      h: 5,
      minW: 3,
      minH: 3
    }
  }
} as ICardDefine
