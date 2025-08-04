import { defineAsyncComponent } from 'vue'
import type { IComponentDefinition } from '@/card2.1/core'
import { $t } from '@/locales'
import poster from './image.png'

const InformationCard = defineAsyncComponent(() => import('./InformationCard.vue'))

const definition: IComponentDefinition = {
  id: 'information',
  component: InformationCard,
  meta: {
    name: 'information',
    title: '信息卡片',
    description: '一个通用的信息展示卡片（占位符，待实现）。',
    category: 'display',
    icon: 'mdi:information-outline',
    version: '1.0.0'
  },
  properties: {
    icon: {
      type: 'string',
      label: 'Icon',
      default: 'mdi:information-outline'
    },
    text: {
      type: 'string',
      label: 'Display Text',
      default: '信息卡片，功能待后续版本开发。'
    }
  }
}

export default definition
