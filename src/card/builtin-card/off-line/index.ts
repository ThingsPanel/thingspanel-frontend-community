import { defineAsyncComponent } from 'vue';
import type { ICardDefine } from '@/components/panel/card';
import poster from './off-line.png';
export default {
  id: 'off-num',
  type: 'builtin',
  component: defineAsyncComponent(() => import('./component.vue')),
  poster,
  title: '离线设备数',
  preset: {
    iCardViewDefault: {
      w: 3,
      h: 2,
      minH: 2,
      minW: 2
    }
  }
} as ICardDefine;
