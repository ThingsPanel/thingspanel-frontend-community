/**
 * dual-data-display 组件定义
 * 基于新的三文件结构标准
 */

import type { ComponentDefinition } from '../../../types'
import type { DualDataDisplayConfig, DualDataDisplayCustomize } from './settingConfig'
import { customConfig, dualDataDisplaySettingConfig } from './settingConfig'
import DualDataDisplayCard from './index.vue'
import DualDataDisplaySetting from './setting.vue'

/**
 * dual-data-display 组件定义
 */
export const dualDataDisplayDefinition: ComponentDefinition<DualDataDisplayConfig> = {
  // 基础信息
  type: 'dual-data-display',
  name: '双数据展示',
  description: '展示两个数据源的对比数据，支持多种布局和格式化选项',
  category: '数据展示',
  mainCategory: '测试',
  subCategory: '展示组件',
  icon: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/></svg>`,
  version: '2.1.0',
  author: 'ThingsPanel',

  // 组件实现
  component: DualDataDisplayCard,

  // 配置组件
  configComponent: DualDataDisplaySetting,

  // 默认配置
  defaultConfig: customConfig,

  // 默认配置
  config: {
    type: 'dual-data-display',
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
      width: 400,
      height: 250,
      x: 0,
      y: 0
    },
    gridstack: {
      w: 6,
      h: 4,
      x: 0,
      y: 0,
      minW: 4,
      minH: 3,
      maxW: 12,
      maxH: 8
    }
  },

  // 布局配置
  layout: {
    defaultSize: {
      width: 6,
      height: 4
    },
    minSize: {
      width: 4,
      height: 3
    },
    maxSize: {
      width: 12,
      height: 8
    },
    resizable: true
  },

  // 权限配置 - 谁可以使用这个组件
  permission: '不限', // '不限' | 'TENANT_ADMIN' | 'TENANT_USER' | 'SYS_ADMIN'

  // 标签
  tags: ['数据展示', '对比', '双数据', '测试'],

  // 特性标记
  features: {
    realtime: true, // 支持实时数据
    dataBinding: true, // 支持数据绑定
    themeable: true, // 支持主题定制
    responsive: true, // 支持响应式
    configurable: true // 支持配置定制
  },

  // 交互能力定义
  interaction: {
    capability: {
      supportedEvents: ['click', 'hover', 'dataChange'],
      supportedActions: ['jump', 'modify'],
      defaultPermissions: {
        allowExternalControl: true,
        requirePermissionCheck: false
      },
      listenableProperties: ['title', 'dataSource1', 'dataSource2', 'themeColor', 'layout']
    },

    examples: [
      {
        name: '数据对比警告示例',
        description: '当两个数据源差异超过阈值时修改其他组件',
        scenario: 'data-compare',
        config: {
          event: 'dataChange',
          responses: [
            {
              action: 'modify',
              modifyConfig: {
                targetComponentId: 'alert-comp-123',
                targetProperty: 'visible',
                updateValue: true,
                updateMode: 'replace'
              }
            }
          ],
          enabled: true,
          priority: 1
        }
      },
      {
        name: '点击跳转详情',
        description: '点击组件时跳转到详细数据页面',
        scenario: 'click-jump-detail',
        config: {
          event: 'click',
          responses: [
            {
              action: 'jump',
              jumpConfig: {
                jumpType: 'internal',
                url: '/data-detail',
                target: '_self'
              }
            }
          ],
          enabled: true
        }
      }
    ]
  },

  // 数据源需求定义 - 用于生成多个数据源插槽
  dataSources: [
    {
      key: 'dataSource1',
      name: '数据源1',
      description: '第一个数据源，用于对比展示',
      supportedTypes: ['static', 'api', 'websocket'],
      fieldMappings: {
        'value': {
          targetField: 'dataSource1Value',
          type: 'value',
          required: true,
          defaultValue: 0
        },
        'label': {
          targetField: 'dataSource1Label',
          type: 'value',
          required: false,
          defaultValue: '数据源1'
        },
        'unit': {
          targetField: 'dataSource1Unit',
          type: 'value',
          required: false,
          defaultValue: ''
        }
      },
      required: false
    },
    {
      key: 'dataSource2',
      name: '数据源2',
      description: '第二个数据源，用于对比展示',
      supportedTypes: ['static', 'api', 'websocket'],
      fieldMappings: {
        'value': {
          targetField: 'dataSource2Value',
          type: 'value',
          required: true,
          defaultValue: 0
        },
        'label': {
          targetField: 'dataSource2Label',
          type: 'value',
          required: false,
          defaultValue: '数据源2'
        },
        'unit': {
          targetField: 'dataSource2Unit',
          type: 'value',
          required: false,
          defaultValue: ''
        }
      },
      required: false
    }
  ],

  // 设置配置 - 用于属性暴露和配置面板
  settingConfig: dualDataDisplaySettingConfig
}

/**
 * 注册组件到组件库
 * 这里可以添加组件注册逻辑，如添加到全局组件注册表
 */
export function registerDualDataDisplayComponent() {
  // 组件注册逻辑
  console.log('Dual Data Display component registered:', dualDataDisplayDefinition.type)
}

// 导出组件类型定义
export type { DualDataDisplayConfig, DualDataDisplayCustomize }

// 默认导出组件定义
export default dualDataDisplayDefinition
