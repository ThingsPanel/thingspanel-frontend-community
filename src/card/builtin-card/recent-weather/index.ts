import { defineAsyncComponent } from 'vue';
import type { ICardDefine } from '@/components/panel/card';
import poster from './recent-weather.png';
export default {
  id: 'recent-weather',
  type: 'builtin',
  component: defineAsyncComponent(() => import('./component.vue')),
  poster,
  title: 'dashboard_panel.cardName.weatherOverview',
  w: 619,
  h: 233,
  preset: {
    iCardViewDefault: {
      w: 6,
      h: 4,
      minH: 2
    }
  }
} as ICardDefine;
