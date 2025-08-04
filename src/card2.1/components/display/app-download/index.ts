import { defineAsyncComponent } from 'vue'
import type { IComponentDefinition } from '@/card2.1/core'
import { $t } from '@/locales'
import poster from './image.png'

const AppDownloadCard = defineAsyncComponent(() => import('./AppDownloadCard.vue'))

const definition: IComponentDefinition = {
  id: 'app-download',
  component: AppDownloadCard,
  meta: {
    name: 'app-download',
    title: $t('card.appDownload.title'),
    description: $t('card.appDownload.description'),
    category: 'display',
    icon: 'material-symbols:download-for-offline-outline',
    version: '1.0.0'
  },
  properties: {
    title: {
      type: 'string',
      label: $t('common.title'),
      default: $t('card.appDownload.title')
    },
    qrCode: {
      type: 'string',
      label: 'QR Code Image URL',
      default: '' // Default will be handled by the component
    },
    appStoreLink: {
      type: 'string',
      label: 'App Store Link',
      default: '#'
    },
    googlePlayLink: {
      type: 'string',
      label: 'Google Play Link',
      default: '#'
    },
    scanText: {
      type: 'string',
      label: 'Scan Text',
      default: $t('card.appDownload.scanOrClick')
    }
  }
}

export default definition
