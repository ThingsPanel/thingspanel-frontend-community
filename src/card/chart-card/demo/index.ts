import { defineAsyncComponent } from 'vue';
import poster from '@/components/panel/chart-card/demo/poster.png';
import type { ICardDefine } from '@/components/panel/card';

export default {
  id: 'chart-demo',
  type: 'chart',
  component: defineAsyncComponent(() => import('./component.vue')),
  poster,
  title: '数字指示器',
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
      w: 5,
      h: 3,
      minH: 1,
      minW: 2
    }
  }
} as ICardDefine;
