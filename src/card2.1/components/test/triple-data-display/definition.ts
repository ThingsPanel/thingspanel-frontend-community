/**
 * triple-data-display 组件定义
 * 基于新的三文件结构标准
 */

import type { ComponentDefinition } from '../../../core/types'
import { tripleDataDisplaySettingConfig, customConfig } from './settingConfig'
import type { TripleDataDisplayConfig } from './settingConfig'

/**
 * 三数据展示组件定义
 */
export const tripleDataDisplayDefinition: ComponentDefinition<TripleDataDisplayConfig> = {
  // 基础信息
  id: 'triple-data-display',
  name: '三数据展示',
  description: '展示三个数据源的数据，支持多种布局方式和数据格式化',
  version: '1.0.0',
  author: 'ThingsPanel',

  // 组件实现
  component: () => import('./index.vue'),

  // 配置组件
  settingComponent: () => import('./setting.vue'),

  // 默认配置
  defaultConfig: {
    root: {
      version: '1.0.0',
      theme: 'light',
      layout: {
        width: 400,
        height: 300,
        x: 0,
        y: 0,
        zIndex: 1
      },
      transform: {
        rotate: 0,
        scale: 1
      }
    },
    customize: customConfig
  },

  // 布局配置
  layout: {
    defaultWidth: 400,
    defaultHeight: 300,
    minWidth: 300,
    minHeight: 200,
    maxWidth: 800,
    maxHeight: 600,
    resizable: true,
    draggable: true
  },

  // 权限配置
  permissions: {
    view: ['admin', 'user', 'guest'],
    edit: ['admin', 'user'],
    delete: ['admin']
  },

  // 标签和分类
  tags: ['数据展示', '三数据', '仪表板', '监控'],
  category: 'data-display',

  // 图标
  icon: 'mdi:view-dashboard',

  // 特性标记
  features: {
    responsive: true,
    themeable: true,
    configurable: true,
    exportable: true,
    printable: true
  },

  // 数据源需求
  dataSources: {
    required: true,
    multiple: true,
    maxCount: 3,
    types: ['realtime', 'historical', 'static']
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
          source: 'dataSource1 | dataSource2 | dataSource3',
          value: 'any'
        }
      }
    ],

    // 支持的动作
    actions: [
      {
        name: 'updateData',
        description: '更新组件数据',
        params: {
          dataSource1: 'any',
          dataSource2: 'any',
          dataSource3: 'any'
        }
      },
      {
        name: 'updateConfig',
        description: '更新组件配置',
        params: {
          config: 'TripleDataDisplayConfig'
        }
      },
      {
        name: 'refresh',
        description: '刷新组件',
        params: {}
      }
    ],

    // 交互示例
    examples: [
      {
        title: '数据联动',
        description: '当其他组件数据变化时，自动更新三数据展示',
        code: `
// 监听其他组件的数据变化
componentBus.on('dataUpdate', (data) => {
  tripleDataDisplay.updateData({
    dataSource1: data.temperature,
    dataSource2: data.humidity,
    dataSource3: data.pressure
  })
})
        `
      },
      {
        title: '点击跳转',
        description: '点击数据项跳转到详情页面',
        code: `
// 监听组件点击事件
tripleDataDisplay.on('click', (event) => {
  router.push({
    path: '/detail',
    query: { componentId: event.componentId }
  })
})
        `
      }
    ]
  },

  // 设置配置
  settingConfig: tripleDataDisplaySettingConfig
}

/**
 * 注册组件到系统
 */
export function registerTripleDataDisplayComponent() {
  // 这里可以添加组件注册逻辑
  console.log('Triple Data Display Component registered:', tripleDataDisplayDefinition.id)
}

// 默认导出
export default tripleDataDisplayDefinition
