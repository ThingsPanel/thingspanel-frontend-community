import { defineAsyncComponent } from 'vue';
import type { ICardDefine } from '@/components/panel/card';
import poster from './bug-num.png';
export default {
  id: 'bug-num',
  type: 'builtin',
  component: defineAsyncComponent(() => import('./component.vue')),
  poster,
  title: 'dashboard_panel.cardName.bugNum',
  w: 475,
  h: 165
} as ICardDefine;
