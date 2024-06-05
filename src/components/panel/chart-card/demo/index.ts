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
      origin: 'system',
      sourceNum: 1,
      systemSource: [{}]
    },
    config: {
      name: '123'
    }
  }
} as ICardDefine;
