import { defineAsyncComponent } from 'vue';
import type { ICardDefine } from '@/components/panel/card';
import { $t } from '@/locales';
import poster from './image.png'; // Placeholder, will copy image later

export default {
  id: 'tenant-count', // Changed ID to tenant-count
  type: 'builtin',
  component: defineAsyncComponent(() => import('./component.vue')),
  poster,
  title: $t('card.tenantCount.title'), // Changed title key
  preset: {
    iCardViewDefault: {
      w: 3,
      h: 2,
      minH: 2,
      minW: 2
    }
  }
} as ICardDefine;
