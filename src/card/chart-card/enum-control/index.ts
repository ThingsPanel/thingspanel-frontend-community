import { defineAsyncComponent } from 'vue';
import type { ICardDefine } from '@/components/panel/card';
import { $t } from '@/locales';
import poster from './poster.png';

export default {
  id: 'chart-enumcontrol',
  type: 'chart',
  component: defineAsyncComponent(() => import('./component.vue')),
  configForm: defineAsyncComponent(() => import('./card-config.vue')),
  poster,
  title: $t('card.enumController'),
  preset: {
    dataSource: {
      origin: 'device',
      sourceNum: 1,
      systemSource: [{}],
      deviceSource: [{}]
    },
    iCardViewDefault: {
      w: 3,
      h: 2,
      minH: 1
    }
  }
} as ICardDefine;
