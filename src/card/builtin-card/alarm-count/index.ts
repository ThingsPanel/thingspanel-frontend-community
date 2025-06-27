import { defineAsyncComponent } from 'vue'
import type { ICardDefine } from '@/components/panel/card'
import { $t } from '@/locales'
import poster from './alarm-count.png' // Placeholder, will copy image later

export default {
  id: 'alarm-count', // Changed ID
  type: 'builtin',
  component: defineAsyncComponent(() => import('./component.vue')),
  poster,
  title: '告警统计', // Changed title (assuming translation key)
  preset: {
    iCardViewDefault: {
      w: 3,
      h: 2,
      minH: 2,
      minW: 2
    }
  }
} as ICardDefine
