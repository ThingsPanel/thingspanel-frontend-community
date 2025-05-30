import { defineAsyncComponent } from 'vue'
import type { ICardDefine } from '@/components/panel/card'
import { $t } from '@/locales'
import poster from './image.png'
export default {
  id: 'version-info',
  type: 'builtin',
  component: defineAsyncComponent(() => import('./component.vue')),
  poster,
  title: $t('card.versionInfo.title'),
  preset: {
    config: {},
    iCardViewDefault: {
      w: 3,
      h: 1,
      minW: 2,
      minH: 1
    }
  }
} as ICardDefine
