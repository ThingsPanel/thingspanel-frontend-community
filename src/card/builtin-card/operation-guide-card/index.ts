import { defineAsyncComponent } from 'vue'
import type { ICardDefine } from '@/components/panel/card'
import { $t } from '@/locales'
import poster from './poster.png'

export default {
  id: 'operation-guide',
  type: 'builtin', // 修改为有效的类型 'builtin'
  component: defineAsyncComponent(() => import('./component.vue')),
  poster,
  title: $t('card.common.operationGuide'),
  preset: {
    dataSource: {
      // 操作向导通常不需要外部数据源，但需要提供完整结构以避免类型错误
      origin: 'system',
      isSupportTimeRange: false,
      dataTimeRange: '', // 添加 dataTimeRange
      isSupportAggregate: false,
      dataAggregateRange: '', // 添加 dataAggregateRange
      systemSource: [],
      deviceSource: []
    },
    config: {
      guideList: [
        {
          titleKey: 'card.operationGuide.addDevice.title',
          descriptionKey: 'card.operationGuide.addDevice.description',
          link: '/device/manage'
        },
        {
          titleKey: 'card.operationGuide.configureDevice.title',
          descriptionKey: 'card.operationGuide.configureDevice.description',
          link: '/device/manage'
        },
        {
          titleKey: 'card.operationGuide.createDashboard.title',
          descriptionKey: 'card.operationGuide.createDashboard.description',
          link: '/visualization/kanban'
        }
      ],
      guideListAdmin: [
        {
          titleKey: 'card.operationGuide.createTenant.title',
          descriptionKey: 'card.operationGuide.createTenant.description',
          link: '/management/user'
        },
        {
          titleKey: 'card.operationGuide.configureNotification.title',
          descriptionKey: 'card.operationGuide.configureNotification.description'
        },
        {
          titleKey: 'card.operationGuide.configurePlugin.title',
          descriptionKey: 'card.operationGuide.configurePlugin.description'
        }
      ]
    },
    iCardViewDefault: {
      w: 3, // 默认宽度
      h: 5, // 默认高度
      minW: 2,
      minH: 2
    }
  }
} as ICardDefine
