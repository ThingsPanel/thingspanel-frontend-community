import { defineAsyncComponent } from 'vue'
import type { ComponentDefinition } from '../../core/types'
import { AppDownloadIcon } from './icon'

// 异步加载组件
const AppDownloadCard = defineAsyncComponent(() => import('./AppDownloadCard.vue'))

// 组件定义
const appDownloadDefinition: ComponentDefinition = {
  type: 'app-download',
  name: '应用下载',
  description: '显示应用下载二维码和下载链接的卡片组件',
  category: 'card21',
  icon: AppDownloadIcon,
  component: AppDownloadCard,
  // 注意：该组件没有 configForm，所以不创建配置组件
  // 注意：该组件没有 preset.dataSource，所以不定义数据源配置
  properties: {
    title: {
      type: 'string',
      default: '应用下载',
      description: '卡片标题'
    },
    showQRCode: {
      type: 'boolean',
      default: true,
      description: '是否显示二维码'
    },
    showAppStore: {
      type: 'boolean',
      default: true,
      description: '是否显示App Store链接'
    },
    showGooglePlay: {
      type: 'boolean',
      default: true,
      description: '是否显示Google Play链接'
    }
  }
}

export default appDownloadDefinition
