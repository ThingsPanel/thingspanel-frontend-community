import { defineAsyncComponent } from 'vue';
import type { ICardDefine } from '@/components/panel/card';
import { $t } from '@/locales';
import poster from './poster.png';

export default {
  id: 'chart-digit',
  type: 'chart',
  component: defineAsyncComponent(() => import('./component.vue')),
  poster,
  title: `${$t('card.digitalIndicator')}2`,
  configForm: defineAsyncComponent(() => import('./card-config.vue')),
  preset: {
    dataSource: {
      origin: 'device',
      sourceNum: 1,
      systemSource: [{}],
      deviceSource: [{}]
    },
    config: {
      name: '123'
    },
    iCardViewDefault: {
      w: 2,
      h: 2,
      minH: 1,
      minW: 1
    }
  }
} as ICardDefine;
