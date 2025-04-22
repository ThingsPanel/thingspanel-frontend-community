import { defineAsyncComponent } from 'vue';
import type { ICardDefine } from '@/components/panel/card';
import { $t } from '@/locales';
import poster from './poster.png';

export default {
  id: 'operation-guide',
  type: 'builtin', // 修改为有效的类型 'builtin'
  component: defineAsyncComponent(() => import('./component.vue')),
  poster,
  title: $t('card.operationGuide'), // 需要在语言文件中添加 'card.operationGuide'
  preset: {
    dataSource: { // 操作向导通常不需要外部数据源，但需要提供完整结构以避免类型错误
      origin: 'system',
      isSupportTimeRange: false,
      dataTimeRange: '', // 添加 dataTimeRange
      isSupportAggregate: false,
      dataAggregateRange: '', // 添加 dataAggregateRange
      systemSource: [],
      deviceSource: []
    },
    config: {
      guideList: [ // 重新添加 guideList 预设
        { title: '添加设备', description: '将您的物联网设备添加到平台中，建立设备连接井管理' ,link:'/device/manage'},
        { title: '配置设备', description: '为设备设置参数和属性，自定义数据收集规则' },
        { title: '创建看板', description: '可视化设备数据，创建实时监控仪表盘' },
      ]
    },
    iCardViewDefault: {
      w: 3, // 默认宽度
      h:5, // 默认高度
      minW: 2,
      minH:2
    }
  }
} as ICardDefine; 