import { defineAsyncComponent } from 'vue';
import type { ICardDefine } from '@/components/panel/card';
import poster from './poster.png';

export default {
  id: 'chart-switch',
  type: 'chart',
  component: defineAsyncComponent(() => import('./component.vue')),
  configForm: defineAsyncComponent(() => import('./switch-config.vue')),
  poster,
  title: '设备开关控制',
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
