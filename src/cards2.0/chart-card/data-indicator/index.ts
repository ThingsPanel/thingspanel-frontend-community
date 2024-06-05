import { defineAsyncComponent } from 'vue';
import poster from '@/components/panel/chart-card/demo/poster.png';
import type { CardItem } from '@/cards2.0/card';

export default {
  cardItemBase: {
    type: 'chart', // 卡片类型 'system' | 'plugins' | 'chart';
    id: 'chart-demo', // 卡片唯一标识，按照card_type_cardName命名不会错
    cardName: '数字指示器',
    sourceNumber: 1, // 数据个数，必须限制，开发卡片时想好
    basicSettings: {
      defaultTitle: '123', // 卡片标题 尽量使用国际化标题
      showTitle: false
    }, // 初始标题 可以不定义
    scene: 'all', // 'mobile' | 'pc' | 'all'; 预留暂时都选all
    minWH: {
      minW: 2, // 卡片最小宽度,数字则表示占几列，当前默认共24格，自行计算
      minH: 2 // 卡片最小高度,数字则表示占几行，当前默一行30px，自行计算
    },
    preset: {
      dataSource: {
        origin: 'system',
        sourceNum: 1,
        systemSource: [{}],
        deviceSource: [{}]
      },
      config: {
        name: '123'
      }
    } // 初始设定,可自定义,最终会暴露给卡片，请自行使用
  },
  component: defineAsyncComponent(() => import('./component.vue')),
  poster,
  configForm: defineAsyncComponent(() => import('./card-config.vue'))
} as CardItem;
