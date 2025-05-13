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
      guideList: [ // 使用 key 替代硬编码文本
        { titleKey: 'card.operationGuideCard.guideItems.addDevice.title', descriptionKey: 'card.operationGuideCard.guideItems.addDevice.description', link:'/device/manage'},
        { titleKey: 'card.operationGuideCard.guideItems.configureDevice.title', descriptionKey: 'card.operationGuideCard.guideItems.configureDevice.description' , link:'/device/manage'},
        { titleKey: 'card.operationGuideCard.guideItems.createDashboard.title', descriptionKey: 'card.operationGuideCard.guideItems.createDashboard.description' ,link:'/visualization/kanban'},
      ],
      guideListAdmin: [ 
        {
          titleKey: 'card.operationGuideAdmin.guideItems.createTenant.title',
          descriptionKey: 'card.operationGuideAdmin.guideItems.createTenant.description',
          link: '/management/user' // Example link, adjust if needed
        },
        {
          titleKey: 'card.operationGuideAdmin.guideItems.configureNotification.title',
          descriptionKey: 'card.operationGuideAdmin.guideItems.configureNotification.description',
    
        },
        {
          titleKey: 'card.operationGuideAdmin.guideItems.configurePlugin.title',
          descriptionKey: 'card.operationGuideAdmin.guideItems.configurePlugin.description',
      
        },
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