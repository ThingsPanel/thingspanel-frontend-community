import { defineAsyncComponent } from 'vue';
import type { ICardDefine } from '@/components/panel/card';
import poster from './poster.png';
export default {
  id: 'video-player',
  type: 'chart',
  component: defineAsyncComponent(() => import('./component.vue')),
  poster,
  title: 'dashboard_panel.cardName.videoPlayer',
  preset: {
    dataSource: {
      origin: 'device',
      sourceNum: 1,
      systemSource: [{}],
      deviceSource: [{}]
    },
    iCardViewDefault: {
      w: 5,
      h: 3,
      minH: 1,
      minW: 2
    }
  }
} as ICardDefine;
