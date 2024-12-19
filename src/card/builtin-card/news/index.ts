import { defineAsyncComponent } from 'vue';
import type { ICardDefine } from '@/components/panel/card';
import { $t } from '@/locales';
import poster from './news.png';

export default {
  id: 'news-num',
  type: 'builtin',
  component: defineAsyncComponent(() => import('./component.vue')),
  poster,
  title: $t('card.msgTotal'),
  preset: {
    iCardViewDefault: {
      w: 3,
      h: 2,
      minH: 2,
      minW: 2
    }
  }
} as ICardDefine;
