import { defineAsyncComponent } from 'vue'
import type { ICardDefine } from '@/components/panel/card'
import { $t } from '@/locales'
import poster from './image.png'
import component from './component.vue'
export default {
  id: 'metrics-history',
  type: 'builtin',
  component,
  poster,
  title: $t('card.systemMetricsHistory.title'),
  preset: {
    config: {},
    iCardViewDefault: {
      w: 2,
      h: 2,
      minW: 2,
      minH: 2
    }
  }
} as ICardDefine
