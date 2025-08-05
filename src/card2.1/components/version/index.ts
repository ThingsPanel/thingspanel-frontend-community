import { defineAsyncComponent } from 'vue'
import type { ComponentDefinition } from '../../core/types'
import { VersionIcon } from './icon'

// 异步加载组件
const VersionCard = defineAsyncComponent(() => import('./VersionCard.vue'))

// 组件定义
const versionDefinition: ComponentDefinition = {
  type: 'version',
  name: '版本信息',
  description: '显示系统版本信息的卡片组件',
  category: 'card21',
  icon: VersionIcon,
  component: VersionCard,
  // 注意：该组件没有 configForm，所以不创建配置组件
  // 注意：该组件没有 preset.dataSource，所以不定义数据源配置
  properties: {
    title: {
      type: 'string',
      default: '版本信息',
      description: '卡片标题'
    },
    showGithubLink: {
      type: 'boolean',
      default: true,
      description: '是否显示GitHub链接'
    },
    showLatestVersion: {
      type: 'boolean',
      default: true,
      description: '是否显示最新版本信息'
    }
  }
}

export default versionDefinition
