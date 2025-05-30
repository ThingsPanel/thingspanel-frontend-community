import { defineAsyncComponent } from 'vue'
import type { ICardDefine } from '@/components/panel/card'
import { $t } from '@/locales'
import poster from './online-trend.png'

export default {
  id: 'trend-online',
  type: 'builtin',
  component: defineAsyncComponent(() => import('./component.vue')),
  poster,
  title: $t('card.onlineTrend'),
  preset: {
    iCardViewDefault: {
      w: 4,
      h: 3,
      minH: 2,
      minW: 2
    }
  }
} as ICardDefine
