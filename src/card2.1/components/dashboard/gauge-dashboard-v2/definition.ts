/**
 * gauge-dashboard-v2 仪表盘组件定义
 * 基于Card2.1标准架构的仪表盘组件 - 使用vue-echarts重写版本
 */

import type { ComponentDefinition } from '../../../core/types'
import type { GaugeDashboardV2Config, GaugeDashboardCustomize } from './settingConfig'
import { customConfig, gaugeDashboardV2SettingConfig } from './settingConfig'
import GaugeDashboardV2Card from './index.vue'
import GaugeDashboardV2Setting from './setting.vue'

/**
 * gauge-dashboard-v2 仪表盘组件定义
 */
export const gaugeDashboardV2Definition: ComponentDefinition<GaugeDashboardV2Config> = {
  // 基础信息
  type: 'gauge-dashboard-v2',
  name: '🎯仪表盘V2-FINAL',
  description: '基于vue-echarts的高性能仪表盘组件',
  // category 字段会被自动注册系统根据文件夹路径自动覆盖，这里不设置
  icon: `<svg viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
    <circle cx="12" cy="12" r="2" fill="currentColor"/>
    <path d="M12 8l4 4-4 4z" fill="currentColor" opacity="0.6"/>
  </svg>`,
  version: '2.0.0',
  author: 'ThingsPanel',

  // 组件实现
  component: GaugeDashboardV2Card,

  // 配置组件
  configComponent: GaugeDashboardV2Setting,

  // 默认配置
  defaultConfig: customConfig,

  // 组件配置
  config: {
    type: 'gauge-dashboard-v2',
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
      width: 350,
      height: 300,
      x: 0,
      y: 0
    },
    gridstack: {
      w: 4,
      h: 4,
      x: 0,
      y: 0,
      minW: 3,
      minH: 3,
      maxW: 8,
      maxH: 6
    }
  },

  // 布局配置
  layout: {
    defaultSize: {
      width: 4,
      height: 4
    },
    minSize: {
      width: 3,
      height: 3
    },
    maxSize: {
      width: 8,
      height: 6
    },
    resizable: true
  },

  // 权限配置
  permission: '不限', // '不限' | 'TENANT_ADMIN' | 'TENANT_USER' | 'SYS_ADMIN'

  // 标签
  tags: ['仪表盘V2', 'vue-echarts', 'ECharts', '数据可视化', '实时数据', '监控', 'IoT', '传感器', '仪表', '图表'],

  // 特性标记
  features: {
    realtime: true,      // 支持实时数据
    dataBinding: true,   // 支持数据绑定
    themeable: true,     // 支持主题定制
    responsive: true,    // 支持响应式
    configurable: true   // 支持配置定制
  },

  // 数据源需求定义
  dataSources: [
    {
      key: 'primaryData',
      name: '主数据源',
      description: '仪表盘的主要数据源，用于显示当前数值',
      supportedTypes: ['static', 'api', 'websocket', 'mqtt'],
      // 🔥 统一标准：只使用 example 字段
      example: {
        "value": 65,
        "unit": "℃",
        "label": "温度传感器",
        "timestamp": 1694567890123
      },
      fieldMappings: {
        'value': {
          targetField: 'currentValue',
          type: 'value',
          required: true,
          defaultValue: 0,
          validator: {
            type: 'number',
            range: { min: 'minValue', max: 'maxValue' }
          }
        },
        'unit': {
          targetField: 'unit',
          type: 'value',
          required: false,
          defaultValue: '',
          validator: {
            type: 'string',
            maxLength: 10
          }
        },
        'label': {
          targetField: 'title',
          type: 'value',
          required: false,
          defaultValue: '数据仪表盘V2'
        },
        'timestamp': {
          targetField: 'lastUpdateTime',
          type: 'value',
          required: false,
          defaultValue: null
        }
      },
      required: true,
      updateInterval: 1000, // 1秒更新间隔
      errorHandling: {
        onError: 'showLastValue',
        retryCount: 3,
        retryInterval: 5000
      }
    }
  ],

  // 设置配置 - 用于属性暴露和配置面板
  settingConfig: gaugeDashboardV2SettingConfig,

  // 性能优化配置
  performance: {
    // 渲染优化
    renderOptimization: {
      useVirtualRendering: false,
      debounceUpdate: 100,
      throttleResize: 200
    },
    
    // 数据更新优化
    dataUpdateOptimization: {
      enableDeltaUpdate: true,
      batchSize: 1,
      updateThreshold: 0.01 // 数值变化超过1%才更新
    },
    
    // 动画优化
    animationOptimization: {
      useRequestAnimationFrame: true,
      maxFPS: 60,
      enableHardwareAcceleration: true
    }
  }
}

/**
 * 导出组件类型定义
 */
export type { GaugeDashboardV2Config, GaugeDashboardCustomize }

// 默认导出组件定义
export default gaugeDashboardV2Definition