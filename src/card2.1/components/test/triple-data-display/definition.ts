/**
 * triple-data-display 组件定义
 * 基于新的三文件结构标准
 */

import type { ComponentDefinition } from '../../../types'
import { tripleDataDisplaySettingConfig, customConfig } from './settingConfig'
import type { TripleDataDisplayConfig } from './settingConfig'
import TripleDataDisplayCard from './index.vue'
import TripleDataDisplaySetting from './setting.vue'

/**
 * 三数据展示组件定义
 */
export const tripleDataDisplayDefinition: ComponentDefinition<TripleDataDisplayConfig> = {
  // 基础信息
  type: 'triple-data-display',
  name: '三数据展示',
  description: '展示三个数据源的数据，支持多种布局方式和数据格式化',
  category: '数据展示',
  mainCategory: '测试',
  subCategory: '展示组件',
  icon: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-1 9H9V9h10v2zm-4 4H9v-2h6v2zm4-8H9V5h10v2z"/></svg>`,
  version: '2.1.0',
  author: 'ThingsPanel',

  // 组件实现
  component: TripleDataDisplayCard,

  // 配置组件
  configComponent: TripleDataDisplaySetting,

  // 默认配置
  defaultConfig: customConfig,

  // 默认配置
  config: {
    type: 'triple-data-display',
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
      width: 450,
      height: 300,
      x: 0,
      y: 0
    },
    gridstack: {
      w: 8,
      h: 5,
      x: 0,
      y: 0,
      minW: 6,
      minH: 4,
      maxW: 12,
      maxH: 8
    }
  },

  // 布局配置
  layout: {
    defaultSize: {
      width: 8,
      height: 5
    },
    minSize: {
      width: 6,
      height: 4
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
  tags: ['数据展示', '三数据', '仪表板', '监控', 'test'],

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
      supportedActions: ['jump', 'modify', 'updateData'],
      defaultPermissions: {
        allowExternalControl: true,
        requirePermissionCheck: false
      },
      listenableProperties: ['title', 'dataSource1', 'dataSource2', 'dataSource3', 'themeColor', 'layout']
    },

    examples: [
      {
        name: '三数据联动示例',
        description: '当其他组件数据变化时，自动更新三个数据源',
        scenario: 'triple-data-update',
        config: {
          event: 'dataChange',
          responses: [
            {
              action: 'modify',
              modifyConfig: {
                targetComponentId: 'self',
                targetProperty: 'dataValues',
                updateValue: '{{newDataSet}}',
                updateMode: 'replace'
              }
            }
          ],
          enabled: true,
          priority: 1
        }
      },
      {
        name: '点击查看详情',
        description: '点击组件跳转到三数据详情页面',
        scenario: 'click-detail',
        config: {
          event: 'click',
          responses: [
            {
              action: 'jump',
              jumpConfig: {
                jumpType: 'internal',
                url: '/triple-data-detail',
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
      description: '第一个数据源，用于三数据对比展示',
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
      description: '第二个数据源，用于三数据对比展示',
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
    },
    {
      key: 'dataSource3',
      name: '数据源3',
      description: '第三个数据源，用于三数据对比展示',
      supportedTypes: ['static', 'api', 'websocket'],
      fieldMappings: {
        'value': {
          targetField: 'dataSource3Value',
          type: 'value',
          required: true,
          defaultValue: 0
        },
        'label': {
          targetField: 'dataSource3Label',
          type: 'value',
          required: false,
          defaultValue: '数据源3'
        },
        'unit': {
          targetField: 'dataSource3Unit',
          type: 'value',
          required: false,
          defaultValue: ''
        }
      },
      required: false
    }
  ],

  // 设置配置 - 用于属性暴露和配置面板
  settingConfig: tripleDataDisplaySettingConfig
}

/**
 * 注册组件到系统
 */
export function registerTripleDataDisplayComponent() {
  // 这里可以添加组件注册逻辑
  console.log('Triple Data Display Component registered:', tripleDataDisplayDefinition.type)
}

// 默认导出
export default tripleDataDisplayDefinition
