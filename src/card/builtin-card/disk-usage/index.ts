import { defineAsyncComponent } from 'vue'
import type { ICardDefine } from '@/components/panel/card'
import { $t } from '@/locales'
// Assuming a disk-usage.png will be created or copied later
// Comment out the poster import for now as the file doesn't exist
import poster from './image.png'

export default {
  id: 'disk-usage',
  type: 'builtin',
  component: defineAsyncComponent(() => import('./component.vue')),
  poster, // Also comment out the usage
  title: $t('card.diskUsage'),
  preset: {
    iCardViewDefault: {
      w: 3,
      h: 2,
      minH: 2,
      minW: 2
    }
  }
} as ICardDefine
