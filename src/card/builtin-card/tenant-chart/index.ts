import { defineAsyncComponent } from 'vue';
import type { ICardDefine } from '@/components/panel/card';
import { $t } from '@/locales';
import poster from './image.png'; 

export default {
  id: 'tenant-chart',
  type: 'builtin',
  component: defineAsyncComponent(() => import('./component.vue')),
  poster,
  title: $t('card.tenantChart.title'),
  description: $t('card.tenantChart.description'),
  preset: {
    dataSource: {
      origin: 'device',
      isSupportTimeRange: true,
      dataTimeRange: '1h',
      isSupportAggregate: true,
      dataAggregateRange: '1m',
      systemSource: [],
      deviceSource: []
    },
    config: {},
    iCardViewDefault: {
      lg: { w: 6, h: 8, x: 0, y: 0 },
      md: { w: 5, h: 8, x: 0, y: 0 },
      sm: { w: 4, h: 7, x: 0, y: 0 },
      minW: 3,
      minH: 5
    }
  }
} as ICardDefine;
