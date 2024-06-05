import { defineAsyncComponent } from 'vue';
import type { CardItem } from '@/cards2.0/card';
import poster from './water-region.png';

export default {
  cardItemBase: {
    type: 'plugins',
    cardName: 'dashboard_panel.cardName.irrigationArea',
    id: 'plugins-water-region',
    sourceNumber: 0,
    scene: 'all',
    basicSettings: {
      defaultTitle: 'plugins-water-region', // 卡片标题 尽量使用国际化标题
      showTitle: false
    },
    minWH: {
      minW: 14, // 卡片最小宽度,数字则表示占几列，当前默认共24格，自行计算
      minH: 18 // 卡片最小高度,数字则表示占几行，当前默一行30px，自行计算
    },
    preset: {}
  },
  component: defineAsyncComponent(() => import('./component.vue')),
  configForm: defineAsyncComponent(() => import('./card-congig-form.vue')),
  poster
} as CardItem;
