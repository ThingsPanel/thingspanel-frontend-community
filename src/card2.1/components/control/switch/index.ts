import { defineAsyncComponent } from 'vue'
import type { IComponentDefinition } from '@/card2.1/core'
import { $t } from '@/locales'
import poster from './poster.png'

const SwitchCard = defineAsyncComponent(() => import('./component.vue'))
const SwitchConfig = defineAsyncComponent(() => import('./switch-config.vue'))

const definition: IComponentDefinition = {
  id: 'control-switch',
  component: SwitchCard,
  meta: {
    name: 'control-switch',
    title: $t('card.deviceStateController') || '开关',
    description: '开关控制组件',
    category: 'control',
    icon: 'mdi:toggle-switch',
    version: '1.0.0',
    poster
  },
  properties: {
    title: {
      type: 'string',
      label: $t('common.title'),
      default: $t('card.deviceStateController') || '开关'
    }
  },
  configComponent: {
    component: SwitchConfig,
    replaceDefault: false
  },
  defaultSize: {
    width: 3,
    height: 2
  },
  minSize: {
    width: 2,
    height: 1
  }
}

export default definition
