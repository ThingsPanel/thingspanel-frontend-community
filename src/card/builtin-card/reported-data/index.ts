import { defineAsyncComponent } from 'vue'
import type { ICardDefine } from '@/components/panel/card'
import { $t } from '@/locales'
import poster from './poster.png'
export default {
  id: 'reported-data',
  type: 'builtin',
  component: defineAsyncComponent(() => import('./component.vue')),
  poster,
  title: $t('card.reportedData.title'), // 需要在语言文件中添加 'page.dashboard.cards.reportedData' 键值对
  preset: {
    dataSource: {
      origin: 'device', // 数据源通常来自设备
      isSupportTimeRange: true, // 通常需要支持时间范围
      dataTimeRange: '1h', // 默认时间范围
      isSupportAggregate: true, // 通常需要支持聚合
      dataAggregateRange: '1m', // 默认聚合范围
      systemSource: [],
      deviceSource: [] // 默认设备源为空，由用户配置
    },
    config: {},
    iCardViewDefault: {
      w: 2, // 默认宽度
      h: 2, // 默认高度
      minW: 2,
      minH: 2
    }
  }
} as ICardDefine
