import { defineAsyncComponent } from 'vue';
import type { ICardDefine } from '@/components/panel/card';
import poster from './poster.png';

export default {
  id: 'chart-digitsetter',
  type: 'chart',
  component: defineAsyncComponent(() => import('./component.vue')),
  configForm: defineAsyncComponent(() => import('./card-config.vue')),
  poster,
  title: '数值控制',
  preset: {
    dataSource: {
      origin: 'device',
      sourceNum: 1,
      systemSource: [{}],
      deviceSource: [{}]
    },
    iCardViewDefault: {
      w: 2,
      h: 2,
      minW: 1,
      minH: 1
    }
  }
} as ICardDefine;
