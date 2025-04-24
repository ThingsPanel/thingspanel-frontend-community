import { defineAsyncComponent } from 'vue';
import type { ICardDefine } from '@/components/panel/card';
import { $t } from '@/locales';
import poster from './image.png'; 
export default {
  id: 'app-download',
  type: 'builtin',
  component: defineAsyncComponent(() => import('./component.vue')),
  poster,
  title: $t('card.appDownload.title'),
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
      w: 2,
      h:2,
      minW: 2,
      minH: 2
    }
  }
} as ICardDefine;
