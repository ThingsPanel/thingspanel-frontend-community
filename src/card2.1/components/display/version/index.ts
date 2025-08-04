import { defineAsyncComponent } from 'vue'
import type { IComponentDefinition } from '@/card2.1/core'
import { $t } from '@/locales'

const definition: IComponentDefinition = {
  id: 'version-info',
  component: defineAsyncComponent(() => import('./VersionCard.vue')),
  meta: {
    name: 'version-info',
    title: $t('card.versionInfo.title'),
    description: '显示当前系统版本和最新版本信息',
    category: 'display',
    icon: 'carbon:information-square-filled',
    version: '1.0.0',
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
  }
}

export default definition
