import { defineAsyncComponent } from 'vue'
import type { IComponentDefinition } from '@/card2.1/core'
import { $t } from '@/locales'

const definition: IComponentDefinition = {
  id: 'version-info',
  is: defineAsyncComponent(() => import('./VersionCard.vue')),
  name: '版本信息',
  category: 'display',
  component: defineAsyncComponent(() => import('./VersionCard.vue')),
  meta: {
    title: $t('card.versionInfo.title'),
    description: '显示当前系统版本和最新版本信息',
    icon: 'carbon:information-square-filled',
    tags: ['system', 'info', 'version']
  },
  properties: {
    title: {
      type: 'string',
      label: 'Title',
      default: $t('card.versionInfo.title')
    },
    currentVersionLabel: {
      type: 'string',
      label: 'Current Version Label',
      default: $t('card.versionInfo.currentVersion')
    },
    latestLabel: {
      type: 'string',
      label: 'Latest Label',
      default: $t('card.versionInfo.latest')
    },
    latestVersionLabel: {
      type: 'string',
      label: 'Latest Version Label',
      default: $t('card.versionInfo.latestVersion')
    },
    githubUrl: {
      type: 'string',
      label: 'GitHub URL',
      default: 'https://github.com/ThingsPanel/thingspanel-frontend-community'
    }
  },
  events: {},
  slots: {}
}

export default definition
