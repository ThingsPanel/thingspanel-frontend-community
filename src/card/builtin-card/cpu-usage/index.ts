import { defineAsyncComponent } from 'vue'
import type { ICardDefine } from '@/components/panel/card'
import { $t } from '@/locales'
// Assuming a cpu-usage.png will be created or copied later
// Comment out the poster import for now if the file doesn't exist
import poster from './image.png'

export default {
  id: 'cpu-usage',
  type: 'builtin',
  component: defineAsyncComponent(() => import('./component.vue')),
  poster, // Also comment out the usage if the file doesn't exist
  title: $t('card.cpuUsage'),
  preset: {
    iCardViewDefault: {
      w: 3,
      h: 2,
      minH: 2,
      minW: 2
    }
  }
} as ICardDefine
