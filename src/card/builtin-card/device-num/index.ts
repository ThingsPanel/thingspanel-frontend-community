import { defineAsyncComponent } from 'vue';
import type { ICardDefine } from '@/components/panel/card';
import poster from './device-num.png';
export default {
  id: 'device-num',
  type: 'builtin',
  component: defineAsyncComponent(() => import('./component.vue')),
  poster,
  title: 'dashboard_panel.cardName.deviceNum',
  w: 475,
  h: 165
} as ICardDefine;
