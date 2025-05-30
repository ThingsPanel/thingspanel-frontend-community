import { defineAsyncComponent } from 'vue'
import poster from '@/components/panel/chart-card/demo1/poster.png'
import type { ICardDefine } from '@/components/panel/card'
import { $t } from '@/locales'

export default {
  id: 'chart-demo2',
  type: 'chart',
  component: defineAsyncComponent(() => import('./component.vue')),
  poster,
  title: $t('card.testDemo'),
  configForm: defineAsyncComponent(() => import('./card-config.vue')),
  preset: {
    dataSource: {
      origin: 'system',
      sourceNum: 1,
      systemSource: [{}]
    },
    config: {
      name: '123'
    }
  }
} as ICardDefine
