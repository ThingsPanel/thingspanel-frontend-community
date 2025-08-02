/**
 * Card 2.0 数字指示器组件定义
 * 基于原有 chart-digit 组件迁移而来，采用新的架构设计
 */

import { defineAsyncComponent } from 'vue'
import type { IComponentDefinition } from '../../../core/types/component'
import { $t } from '@/locales'

/**
 * 数字指示器配置接口
 */
export interface DigitIndicatorConfig {
  /** 组件标题 */
  title?: string

  /** 显示设置 */
  display?: {
    /** 显示标题 */
    showTitle?: boolean
    /** 显示单位 */
    showUnit?: boolean
    /** 数值单位 */
    unit?: string
    /** 数值精度 */
    precision?: number
    /** 数值格式化 */
    formatter?: string
    /** 字体大小 */
    fontSize?: number
    /** 字体粗细 */
    fontWeight?: 'normal' | 'bold' | 'bolder'
    /** 文字对齐 */
    textAlign?: 'left' | 'center' | 'right'
  }

  /** 样式设置 */
  style?: {
    /** 背景色 */
    backgroundColor?: string
    /** 文字颜色 */
    textColor?: string
    /** 边框设置 */
    border?: {
      show?: boolean
      width?: number
      color?: string
      radius?: number
    }
    /** 阴影设置 */
    shadow?: {
      show?: boolean
      color?: string
      blur?: number
      offsetX?: number
      offsetY?: number
    }
  }

  /** 数据设置 */
  data?: {
    /** 数据字段名 */
    fieldName?: string
    /** 默认值 */
    defaultValue?: number
    /** 数值范围 */
    range?: {
      min?: number
      max?: number
    }
    /** 阈值设置 */
    thresholds?: Array<{
      value: number
      color: string
      label?: string
    }>
  }

  /** 动画设置 */
  animation?: {
    /** 启用动画 */
    enabled?: boolean
    /** 动画持续时间 */
    duration?: number
    /** 数值滚动效果 */
    countUp?: boolean
    /** 闪烁效果 */
    blink?: boolean
  }

  /** 自动刷新 */
  autoRefresh?: {
    /** 启用自动刷新 */
    enabled?: boolean
    /** 刷新间隔（秒） */
    interval?: number
  }
}

/**
 * 默认配置
 */
const defaultConfig: DigitIndicatorConfig = {
  title: '数字指示器',
  display: {
    showTitle: true,
    showUnit: true,
    unit: '',
    precision: 2,
    fontSize: 48,
    fontWeight: 'bold',
    textAlign: 'center'
  },
  style: {
    backgroundColor: 'transparent',
    textColor: '#333333',
    border: {
      show: false,
      width: 1,
      color: '#e0e0e0',
      radius: 4
    },
    shadow: {
      show: false,
      color: 'rgba(0,0,0,0.1)',
      blur: 4,
      offsetX: 0,
      offsetY: 2
    }
  },
  data: {
    fieldName: 'value',
    defaultValue: 0,
    thresholds: []
  },
  animation: {
    enabled: true,
    duration: 1000,
    countUp: true,
    blink: false
  },
  autoRefresh: {
    enabled: false,
    interval: 30
  }
}

/**
 * 数字指示器组件定义
 */
export const digitIndicatorDefinition: IComponentDefinition = {
  // 基本信息
  id: 'digit-indicator-v2',
  name: '数字指示器',
  version: '2.0.0',
  description: '用于显示单个数值的大屏组件，支持阈值、动画和样式自定义',
  category: 'display',
  tags: ['数字', '指示器', '数值', '显示'],
  author: 'ThingsPanel',

  // 视觉信息
  icon: 'mdi:numeric',
  thumbnail: './poster.png',

  // 渲染信息
  supportedRenderers: ['vue'] as RendererType[],

  // 尺寸信息
  size: {
    width: { min: 100, max: 800, default: 200 },
    height: { min: 60, max: 400, default: 120 }
  },

  // 兼容性信息
  compatibility: {
    legacy: {
      componentId: 'chart-digit',
      migrationVersion: '2.0.0',
      deprecatedProps: [],
      propMapping: {
        name: 'title',
        'config.name': 'title'
      }
    }
  },

  // 组件逻辑
  logic: {
    // 数据处理
    dataProcessor: {
      // 输入数据转换
      transform: (rawData: any, config: DigitIndicatorConfig) => {
        if (!rawData) {
          return { value: config.data?.defaultValue || 0 }
        }

        // 如果是数组，取第一个元素
        const data = Array.isArray(rawData) ? rawData[0] : rawData

        // 提取指定字段的值
        const fieldName = config.data?.fieldName || 'value'
        let value = data[fieldName]

        // 数值处理
        if (typeof value === 'string') {
          value = parseFloat(value)
        }

        if (isNaN(value)) {
          value = config.data?.defaultValue || 0
        }

        // 精度处理
        const precision = config.display?.precision ?? 2
        value = Number(value.toFixed(precision))

        return { value, timestamp: data.timestamp || Date.now() }
      },

      // 数据验证
      validate: (data: any) => {
        return data && typeof data.value === 'number'
      }
    },

    // 生命周期钩子
    lifecycle: {
      onMount: (instance: any) => {
        console.log('DigitIndicator mounted:', instance.id)
      },

      onUnmount: (instance: any) => {
        console.log('DigitIndicator unmounted:', instance.id)
      },

      onDataChange: (instance: any, data: any) => {
        // 数据变化时的处理逻辑
        if (instance.component?.updateValue) {
          instance.component.updateValue(data.value)
        }
      }
    },

    // 自动刷新
    autoRefresh: {
      getInterval: (config: DigitIndicatorConfig) => {
        return config.autoRefresh?.enabled ? (config.autoRefresh.interval || 30) * 1000 : 0
      },

      shouldRefresh: (config: DigitIndicatorConfig) => {
        return config.autoRefresh?.enabled === true
      }
    }
  },

  // Vue 组件
  view: {
    component: () => import('./component.vue')
  },

  // 配置项定义
  configSchema: {
    type: 'object',
    properties: {
      title: {
        type: 'string',
        title: '标题',
        default: '数字指示器'
      },

      display: {
        type: 'object',
        title: '显示设置',
        properties: {
          showTitle: {
            type: 'boolean',
            title: '显示标题',
            default: true
          },
          showUnit: {
            type: 'boolean',
            title: '显示单位',
            default: true
          },
          unit: {
            type: 'string',
            title: '数值单位',
            default: ''
          },
          precision: {
            type: 'number',
            title: '数值精度',
            minimum: 0,
            maximum: 10,
            default: 2
          },
          fontSize: {
            type: 'number',
            title: '字体大小',
            minimum: 12,
            maximum: 200,
            default: 48
          },
          fontWeight: {
            type: 'string',
            title: '字体粗细',
            enum: ['normal', 'bold', 'bolder'],
            default: 'bold'
          },
          textAlign: {
            type: 'string',
            title: '文字对齐',
            enum: ['left', 'center', 'right'],
            default: 'center'
          }
        }
      },

      style: {
        type: 'object',
        title: '样式设置',
        properties: {
          backgroundColor: {
            type: 'string',
            title: '背景色',
            format: 'color',
            default: 'transparent'
          },
          textColor: {
            type: 'string',
            title: '文字颜色',
            format: 'color',
            default: '#333333'
          }
        }
      },

      data: {
        type: 'object',
        title: '数据设置',
        properties: {
          fieldName: {
            type: 'string',
            title: '数据字段名',
            default: 'value'
          },
          defaultValue: {
            type: 'number',
            title: '默认值',
            default: 0
          }
        }
      },

      animation: {
        type: 'object',
        title: '动画设置',
        properties: {
          enabled: {
            type: 'boolean',
            title: '启用动画',
            default: true
          },
          duration: {
            type: 'number',
            title: '动画持续时间(ms)',
            minimum: 100,
            maximum: 5000,
            default: 1000
          },
          countUp: {
            type: 'boolean',
            title: '数值滚动效果',
            default: true
          }
        }
      },

      autoRefresh: {
        type: 'object',
        title: '自动刷新',
        properties: {
          enabled: {
            type: 'boolean',
            title: '启用自动刷新',
            default: false
          },
          interval: {
            type: 'number',
            title: '刷新间隔(秒)',
            minimum: 1,
            maximum: 3600,
            default: 30
          }
        }
      }
    }
  },

  // 默认配置
  defaultConfig,

  // 数据源支持
  dataSources: {
    supported: ['device', 'api', 'static'] as DataSourceType[],
    required: false,
    multiple: false
  },

  // 布局信息
  layout: {
    resizable: true,
    rotatable: false,
    aspectRatio: null
  },

  // 依赖项
  dependencies: {
    external: [],
    internal: ['@/components/common']
  },

  // 样式文件
  styles: ['./digit-indicator.css']
}

// 默认导出
export default digitIndicatorDefinition
