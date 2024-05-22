import { defineAsyncComponent } from 'vue';
import type { ICardDefine } from '@/components/panel/card';
import poster from './weather-station.png';
export default {
  id: 'weather-station',
  type: 'builtin',
  component: defineAsyncComponent(() => import('./component.vue')),
  poster,
  title: 'dashboard_panel.cardName.weatherStation',
  w: 619,
  h: 498,
  preset: {
    iCardViewDefault: {
      w: 6,
      h: 4,
      minH: 2
    }
  }
} as ICardDefine;
