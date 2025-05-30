import { defineAsyncComponent } from 'vue'
import type { ICardDefine } from '@/components/panel/card'
import { $t } from '@/locales'
import poster from './poster.png'

export default {
  id: 'chart-demo',
  type: 'chart',
  component: defineAsyncComponent(() => import('./component.vue')),
  poster,
  title: $t('card.digitalIndicator'),
  configForm: defineAsyncComponent(() => import('./card-config.vue')),
  preset: {
    dataSource: {
      origin: 'device',
      sourceNum: 1,
      systemSource: [{}],
      deviceSource: [{}]
    },
    config: {
      name: '123'
    },
    iCardViewDefault: {
      w: 5,
      h: 3,
      minH: 1,
      minW: 2
    }
  }
} as ICardDefine
