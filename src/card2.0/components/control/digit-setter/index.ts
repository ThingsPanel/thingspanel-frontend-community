/**
 * Card 2.0 数字设置器组件定义
 * 基于原有 digit-setter 组件迁移而来，采用新的架构设计
 */

import { defineAsyncComponent } from 'vue'
import type { IComponentDefinition, RendererType, DataSourceType } from '../../../core/types/component'
import { $t } from '@/locales'

/**
 * 数字设置器配置接口
 */
export interface DigitSetterConfig {
  /** 组件标题 */
  title?: string

  /** 数值设置 */
  value?: {
    /** 最小值 */
    min?: number
    /** 最大值 */
    max?: number
    /** 步长 */
    step?: number
    /** 小数位数 */
    decimals?: number
    /** 默认值 */
    defaultValue?: number
  }

  /** 显示设置 */
  display?: {
    /** 显示标题 */
    showTitle?: boolean
    /** 显示单位 */
    showUnit?: boolean
    /** 数值单位 */
    unit?: string
    /** 字体大小 */
    fontSize?: number
    /** 字体粗细 */
    fontWeight?: 'normal' | 'bold' | 'bolder'
    /** 文字对齐 */
    textAlign?: 'left' | 'center' | 'right'
  }

  /** 滑块样式 */
  slider?: {
    /** 滑块颜色 */
    color?: string
    /** 轨道颜色 */
    trackColor?: string
    /** 填充颜色 */
    fillColor?: string
    /** 滑块大小 */
    size?: 'small' | 'medium' | 'large'
    /** 显示刻度 */
    showMarks?: boolean
    /** 显示工具提示 */
    showTooltip?: boolean
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
  }

  /** 数据设置 */
  data?: {
    /** 数据字段名 */
    fieldName?: string
    /** 实时更新 */
    realTimeUpdate?: boolean
    /** 更新延迟（毫秒） */
    updateDelay?: number
  }

  /** 交互设置 */
  interaction?: {
    /** 启用键盘控制 */
    keyboard?: boolean
    /** 启用鼠标滚轮 */
    mouseWheel?: boolean
    /** 双击重置 */
    doubleClickReset?: boolean
  }
}

/**
 * 默认配置
 */
const defaultConfig: DigitSetterConfig = {
  title: '数字设置器',
  value: {
    min: 0,
    max: 100,
    step: 0.1,
    decimals: 1,
    defaultValue: 0
  },
  display: {
    showTitle: true,
    showUnit: true,
    unit: '',
    fontSize: 14,
    fontWeight: 'normal',
    textAlign: 'center'
  },
  slider: {
    color: '#18a058',
    trackColor: '#e0e0e6',
    fillColor: '#18a058',
    size: 'medium',
    showMarks: false,
    showTooltip: true
  },
  style: {
    backgroundColor: 'transparent',
    textColor: '#333333',
    border: {
      show: false,
      width: 1,
      color: '#e0e0e0',
      radius: 4
    }
  },
  data: {
    fieldName: 'value',
    realTimeUpdate: true,
    updateDelay: 300
  },
  interaction: {
    keyboard: true,
    mouseWheel: true,
    doubleClickReset: false
  }
}

/**
 * 数字设置器组件定义
 */
export const digitSetterDefinition: IComponentDefinition = {
  // 基础信息
  id: 'digit-setter-v2',
  name: '数字设置器',
  version: '2.0.0',
  description: '用于设置和控制数值的交互组件，支持滑块操作和实时数据更新',
  category: 'control',
  tags: ['数字', '设置器', '滑块', '控制', '交互'],
  author: 'ThingsPanel',

  // 图标和缩略图
  icon: 'mdi:tune-vertical',
  thumbnail: './poster.png',

  // 支持的渲染器
  supportedRenderers: ['vue'] as RendererType[],

  // 组件尺寸
  size: {
    width: { min: 150, max: 600, default: 300 },
    height: { min: 80, max: 300, default: 150 }
  },

  // 兼容性信息
  compatibility: {
    legacy: {
      componentId: 'digit-setter',
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
    // 数据处理器
    dataProcessor: {
      // 数据转换
      transform: (rawData: any, config: DigitSetterConfig) => {
        if (!rawData) {
          return config.value?.defaultValue || 0
        }

        const fieldName = config.data?.fieldName || 'value'
        let value = rawData[fieldName] !== undefined ? rawData[fieldName] : rawData

        // 确保值在范围内
        const min = config.value?.min || 0
        const max = config.value?.max || 100
        value = Math.max(min, Math.min(max, Number(value) || 0))

        return value
      },

      // 数据验证
      validate: (data: any) => {
        return data !== null && data !== undefined && !isNaN(Number(data))
      }
    },

    // 生命周期
    lifecycle: {
      onMount: (instance: any) => {
        // 组件挂载时的初始化逻辑
      },

      onUnmount: (instance: any) => {
        // 组件卸载时的清理逻辑
      },

      onDataChange: (instance: any, data: any) => {
        // 数据变化时的处理逻辑
        if (instance.updateValue) {
          instance.updateValue(data)
        }
      }
    },

    // 自动刷新
    autoRefresh: {
      getInterval: (config: DigitSetterConfig) => {
        return 0 // 数字设置器通常不需要自动刷新
      },

      shouldRefresh: (config: DigitSetterConfig) => {
        return false
      }
    }
  },

  // Vue 视图
  view: {
    component: () => import('./component.vue')
  },

  // 配置模式
  configSchema: {
    type: 'object',
    properties: {
      title: {
        type: 'string',
        title: '标题',
        default: '数字设置器'
      },

      value: {
        type: 'object',
        title: '数值设置',
        properties: {
          min: {
            type: 'number',
            title: '最小值',
            default: 0
          },
          max: {
            type: 'number',
            title: '最大值',
            default: 100
          },
          step: {
            type: 'number',
            title: '步长',
            minimum: 0.001,
            default: 0.1
          },
          decimals: {
            type: 'number',
            title: '小数位数',
            minimum: 0,
            maximum: 10,
            default: 1
          },
          defaultValue: {
            type: 'number',
            title: '默认值',
            default: 0
          }
        }
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
          fontSize: {
            type: 'number',
            title: '字体大小',
            minimum: 10,
            maximum: 72,
            default: 14
          },
          fontWeight: {
            type: 'string',
            title: '字体粗细',
            enum: ['normal', 'bold', 'bolder'],
            default: 'normal'
          },
          textAlign: {
            type: 'string',
            title: '文字对齐',
            enum: ['left', 'center', 'right'],
            default: 'center'
          }
        }
      },

      slider: {
        type: 'object',
        title: '滑块设置',
        properties: {
          color: {
            type: 'string',
            title: '滑块颜色',
            format: 'color',
            default: '#18a058'
          },
          trackColor: {
            type: 'string',
            title: '轨道颜色',
            format: 'color',
            default: '#e0e0e6'
          },
          fillColor: {
            type: 'string',
            title: '填充颜色',
            format: 'color',
            default: '#18a058'
          },
          size: {
            type: 'string',
            title: '滑块大小',
            enum: ['small', 'medium', 'large'],
            default: 'medium'
          },
          showMarks: {
            type: 'boolean',
            title: '显示刻度',
            default: false
          },
          showTooltip: {
            type: 'boolean',
            title: '显示工具提示',
            default: true
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
          realTimeUpdate: {
            type: 'boolean',
            title: '实时更新',
            default: true
          },
          updateDelay: {
            type: 'number',
            title: '更新延迟(ms)',
            minimum: 0,
            maximum: 5000,
            default: 300
          }
        }
      },

      interaction: {
        type: 'object',
        title: '交互设置',
        properties: {
          keyboard: {
            type: 'boolean',
            title: '启用键盘控制',
            default: true
          },
          mouseWheel: {
            type: 'boolean',
            title: '启用鼠标滚轮',
            default: true
          },
          doubleClickReset: {
            type: 'boolean',
            title: '双击重置',
            default: false
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
    external: ['naive-ui'],
    internal: ['@/components/common']
  },

  // 样式文件
  styles: ['./digit-setter.css']
}

export default digitSetterDefinition
