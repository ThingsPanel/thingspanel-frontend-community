import { defineAsyncComponent } from 'vue';
import type { ICardDefine } from '@/components/panel/card';
import poster from './access.png';
export default {
  id: 'access-num',
  type: 'builtin',
  component: defineAsyncComponent(() => import('./component.vue')),
  poster,
  title: '访问量',
  preset: {
    iCardViewDefault: {
      w: 3,
      h: 2,
      minH: 2,
      minW: 2
    }
  }
} as ICardDefine;
