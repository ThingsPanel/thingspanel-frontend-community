import { defineAsyncComponent } from 'vue'
import type { IComponentDefinition } from '@/card2.1/core'
import { $t } from '@/locales'
import poster from './poster.png'

const TableCard = defineAsyncComponent(() => import('./component.vue'))
const TableConfig = defineAsyncComponent(() => import('./card-config.vue'))

const definition: IComponentDefinition = {
  id: 'chart-table',
  component: TableCard,
  meta: {
    name: 'chart-table',
    title: $t('generate.table') || '表格',
    description: '数据表格显示组件',
    category: 'chart',
    icon: 'mdi:table',
    version: '1.0.0',
    poster
  },
  properties: {
    title: {
      type: 'string',
      label: $t('common.title'),
      default: $t('generate.table') || '表格'
    },
    name: {
      type: 'string',
      label: '名称',
      default: '123'
    }
  },
  configComponent: {
    component: TableConfig,
    replaceDefault: false
  },
  defaultSize: {
    width: 8,
    height: 5
  },
  minSize: {
    width: 3,
    height: 3
  }
}

export default definition
