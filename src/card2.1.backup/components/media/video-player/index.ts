import { defineAsyncComponent } from 'vue'
import type { IComponentDefinition } from '@/card2.1/core'
import { $t } from '@/locales'
import poster from './poster.png'

const VideoPlayerCard = defineAsyncComponent(() => import('./component.vue'))

const definition: IComponentDefinition = {
  id: 'media-video-player',
  component: VideoPlayerCard,
  meta: {
    name: 'media-video-player',
    title: $t('dashboard_panel.cardName.videoPlayer') || '视频播放器',
    description: '视频播放组件',
    category: 'media',
    icon: 'mdi:video',
    version: '1.0.0',
    poster
  },
  properties: {
    title: {
      type: 'string',
      label: $t('common.title'),
      default: $t('dashboard_panel.cardName.videoPlayer') || '视频播放器'
    }
  },
  defaultSize: {
    width: 5,
    height: 3
  },
  minSize: {
    width: 2,
    height: 1
  }
}

export default definition
