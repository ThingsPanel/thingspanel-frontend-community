import { defineAsyncComponent } from 'vue'
import type { IComponentDefinition } from '@/card2.1/core'
import { $t } from '@/locales'
import poster from './image.png'

const OperationGuideCard = defineAsyncComponent(() => import('./OperationGuideCard.vue'))

const definition: IComponentDefinition = {
  id: 'operation-guide-card',
  is: OperationGuideCard,
  name: $t('card.operationGuide'),
  icon: 'mdi:directions-fork',
  category: 'display',
  component: OperationGuideCard,
  meta: {
    title: $t('card.operationGuide'),
    description: 'Displays a list of operational guides based on user role.',
    poster
  },
  properties: {
    title: {
      type: 'string',
      label: $t('common.title'),
      default: $t('card.operationGuide')
    },
    serialBgColor: {
      type: 'color',
      label: 'Serial Number BG Color',
      default: '#2080f0'
    },
    guideList: {
      type: 'array',
      label: 'Default Guide List',
      default: [
        {
          titleKey: 'card.operationGuideCard.guideItems.addDevice.title',
          descriptionKey: 'card.operationGuideCard.guideItems.addDevice.description',
          link: '/device/manage'
        },
        {
          titleKey: 'card.operationGuideCard.guideItems.configureDevice.title',
          descriptionKey: 'card.operationGuideCard.guideItems.configureDevice.description',
          link: '/device/manage'
        },
        {
          titleKey: 'card.operationGuideCard.guideItems.createDashboard.title',
          descriptionKey: 'card.operationGuideCard.guideItems.createDashboard.description',
          link: '/visualization/kanban'
        }
      ]
    },
    guideListAdmin: {
      type: 'array',
      label: 'Admin Guide List',
      default: [
        {
          titleKey: 'card.operationGuideAdmin.guideItems.createTenant.title',
          descriptionKey: 'card.operationGuideAdmin.guideItems.createTenant.description',
          link: '/management/user'
        },
        {
          titleKey: 'card.operationGuideAdmin.guideItems.configureNotification.title',
          descriptionKey: 'card.operationGuideAdmin.guideItems.configureNotification.description',
          link: '/management/notification'
        },
        {
          titleKey: 'card.operationGuideAdmin.guideItems.configurePlugin.title',
          descriptionKey: 'card.operationGuideAdmin.guideItems.configurePlugin.description',
          link: 'apply/plugin'
        }
      ]
    }
  },
  events: {},
  slots: {}
}

export default definition
