/**
 * dual-data-display 组件定义
 * 基于新的三文件结构标准
 */

import type { ComponentDefinition } from '../../../core/types'
import type { DualDataDisplayConfig, DualDataDisplayCustomize } from './settingConfig'
import { customConfig } from './settingConfig'
import DualDataDisplayCard from './index.vue'
import DualDataDisplaySetting from './setting.vue'

/**
 * dual-data-display 组件定义
 */
export const dualDataDisplayDefinition: ComponentDefinition<DualDataDisplayConfig> = {
  // 基础信息
  id: 'dual-data-display',
  name: '双数据展示',
  description: '展示两个数据源的对比数据，支持多种布局和格式化选项',
  version: '1.0.0',
  author: 'ThingsPanel',

  // 组件实现
  component: DualDataDisplayCard,

  // 配置组件
  settingComponent: DualDataDisplaySetting,

  // 默认配置
  defaultConfig: {
    customize: customConfig,
    root: {
      transform: {
        rotate: 0,
        scale: 1
      }
    }
  },

  // 默认布局
  defaultLayout: {
    w: 6,
    h: 4,
    minW: 4,
    minH: 3,
    maxW: 12,
    maxH: 8
  },

  // 权限配置
  permissions: {
    view: ['admin', 'user'],
    edit: ['admin'],
    delete: ['admin']
  },

  // 标签
  tags: ['数据展示', '对比', '双数据', '测试'],

  // 分类
  category: 'data-display',

  // 图标
  icon: 'mdi:chart-box-multiple-outline',

  // 特性标记
  features: {
    responsive: true,
    configurable: true,
    interactive: true,
    realtime: true,
    exportable: false,
    printable: true
  },

  // 数据源需求
  dataSources: {
    required: true,
    multiple: true,
    maxCount: 2,
    types: ['api', 'websocket', 'static'],
    description: '需要配置两个数据源进行对比展示'
  },

  // 交互能力
  interactions: {
    // 支持的事件
    events: [
      {
        name: 'click',
        description: '点击组件时触发',
        params: {
          componentId: 'string',
          timestamp: 'string'
        }
      },
      {
        name: 'hover',
        description: '鼠标悬停时触发',
        params: {
          componentId: 'string',
          type: 'enter | leave'
        }
      },
      {
        name: 'dataChange',
        description: '数据变化时触发',
        params: {
          source: 'dataSource1 | dataSource2',
          value: 'any'
        }
      }
    ],

    // 支持的动作
    actions: [
      {
        name: 'jump',
        description: '跳转到指定页面或组件',
        params: {
          target: 'string',
          type: 'page | component'
        }
      },
      {
        name: 'modify',
        description: '修改其他组件的属性',
        params: {
          targetId: 'string',
          property: 'string',
          value: 'any'
        }
      }
    ],

    // 交互示例
    examples: [
      {
        name: '数据对比警告',
        description: '当两个数据源差异超过阈值时显示警告',
        trigger: {
          event: 'dataChange',
          condition: 'Math.abs(dataSource1 - dataSource2) > threshold'
        },
        action: {
          type: 'modify',
          target: 'alert-component',
          property: 'visible',
          value: true
        }
      },
      {
        name: '点击查看详情',
        description: '点击组件跳转到详细数据页面',
        trigger: {
          event: 'click'
        },
        action: {
          type: 'jump',
          target: '/data-detail',
          params: {
            dataSource1: '{{dataSource1}}',
            dataSource2: '{{dataSource2}}'
          }
        }
      }
    ]
  }
}

/**
 * 注册组件到组件库
 * 这里可以添加组件注册逻辑，如添加到全局组件注册表
 */
export function registerDualDataDisplayComponent() {
  // 组件注册逻辑
  console.log('Dual Data Display component registered:', dualDataDisplayDefinition.id)
}

// 导出组件类型定义
export type { DualDataDisplayConfig, DualDataDisplayCustomize }

// 默认导出组件定义
export default dualDataDisplayDefinition
