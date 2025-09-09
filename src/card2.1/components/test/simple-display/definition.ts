/**
 * simple-display 组件定义
 * 新三文件结构 - 标准组件模板
 */

import type { ComponentDefinition } from '../../../core/types'
import SimpleDisplayComponent from './index.vue'
import SimpleDisplaySetting from './setting.vue'
import { simpleDisplaySettingConfig, customConfig, type SimpleDisplayConfig } from './settingConfig'

/**
 * simple-display 组件定义
 */
const simpleDisplayDefinition: ComponentDefinition<SimpleDisplayConfig> = {
  // 基础信息
  type: 'simple-display',
  name: '简单展示',
  description: '静态内容展示组件，支持自定义文字、图标和样式，无需数据源',
  category: '数据展示',
  mainCategory: '测试',
  subCategory: '展示组件',
  icon: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L2 7v10c0 5.55 3.84 9.74 9 11 5.16-1.26 9-5.45 9-11V7l-10-5z"/></svg>`,
  version: '2.1.0',
  author: 'ThingsPanel',

  // 组件实现
  component: SimpleDisplayComponent,

  // 配置组件
  configComponent: SimpleDisplaySetting,

  // 默认配置
  defaultConfig: customConfig,

  // 默认配置
  config: {
    type: 'simple-display',
    root: {
      transform: {
        rotate: 0,
        scale: 1
      }
    },
    customize: customConfig
  },

  // 默认布局
  defaultLayout: {
    canvas: {
      width: 300,
      height: 200,
      x: 0,
      y: 0
    },
    gridstack: {
      w: 2,
      h: 2,
      x: 0,
      y: 0,
      minW: 2,
      minH: 1,
      maxW: 4,
      maxH: 3
    }
  },

  // 布局配置
  layout: {
    defaultSize: {
      width: 2,
      height: 2
    },
    minSize: {
      width: 2,
      height: 1
    },
    maxSize: {
      width: 4,
      height: 3
    },
    resizable: true
  },

  // 权限配置 - 谁可以使用这个组件
  permission: '不限', // '不限' | 'TENANT_ADMIN' | 'TENANT_USER' | 'SYS_ADMIN'

  // 标签
  tags: ['static', 'display', 'simple', 'basic', 'text'],

  // 特性标记
  features: {
    realtime: false, // 静态组件无需实时数据
    dataBinding: false, // 静态组件无需数据绑定
    themeable: true, // 支持主题定制
    responsive: true, // 支持响应式
    configurable: true // 支持配置定制
  },

  // 交互能力定义
  interaction: {
    capability: {
      supportedEvents: ['click', 'hover'],
      supportedActions: ['jump', 'modify'],
      defaultPermissions: {
        allowExternalControl: true,
        requirePermissionCheck: false
      },
      listenableProperties: ['title', 'content', 'themeColor', 'fontSize', 'showIcon', 'iconName']
    },

    examples: [
      {
        name: '点击跳转示例',
        description: '点击组件时跳转到外部URL',
        scenario: 'click-jump',
        config: {
          event: 'click',
          responses: [
            {
              action: 'jump',
              jumpConfig: {
                jumpType: 'external',
                url: 'https://example.com',
                target: '_blank'
              }
            }
          ],
          enabled: true,
          priority: 1
        }
      },

      {
        name: '悬停修改属性',
        description: '悬停时修改其他组件的背景色',
        scenario: 'hover-modify',
        config: {
          event: 'hover',
          responses: [
            {
              action: 'modify',
              modifyConfig: {
                targetComponentId: 'comp-456',
                targetProperty: 'themeColor',
                updateValue: '#ff6b6b',
                updateMode: 'replace'
              }
            }
          ],
          enabled: true
        }
      }
    ]
  }
}

export default simpleDisplayDefinition
