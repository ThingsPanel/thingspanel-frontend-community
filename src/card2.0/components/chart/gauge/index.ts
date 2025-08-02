/**
 * Card 2.0 仪表盘组件定义
 * 基于原有 instrument-panel 组件迁移而来，采用新的架构设计
 */

import { defineAsyncComponent } from 'vue'
import type { IComponentDefinition, RendererType, DataSourceType } from '../../../core/types/component'
import { $t } from '@/locales'

/**
 * 仪表盘配置接口
 */
export interface GaugeConfig {
  /** 组件标题 */
  title?: string

  /** 数值设置 */
  value?: {
    /** 最小值 */
    min?: number
    /** 最大值 */
    max?: number
    /** 当前值 */
    current?: number
    /** 数值单位 */
    unit?: string
    /** 数值精度 */
    precision?: number
  }

  /** 仪表盘样式 */
  gauge?: {
    /** 起始角度 */
    startAngle?: number
    /** 结束角度 */
    endAngle?: number
    /** 半径 */
    radius?: string
    /** 中心位置 */
    center?: [string, string]
    /** 分割段数 */
    splitNumber?: number
    /** 轴线宽度 */
    axisLineWidth?: number
    /** 显示指针 */
    showPointer?: boolean
    /** 显示刻度线 */
    showSplitLine?: boolean
    /** 显示刻度标签 */
    showAxisLabel?: boolean
  }

  /** 颜色设置 */
  colors?: {
    /** 进度颜色 */
    progressColor?: string
    /** 轨道颜色 */
    trackColor?: string
    /** 文字颜色 */
    textColor?: string
    /** 标签颜色 */
    labelColor?: string
    /** 指针颜色 */
    pointerColor?: string
    /** 渐变色配置 */
    gradient?: {
      enabled?: boolean
      colors?: Array<{ offset: number; color: string }>
    }
  }

  /** 文字设置 */
  text?: {
    /** 显示数值 */
    showValue?: boolean
    /** 显示单位 */
    showUnit?: boolean
    /** 显示标题 */
    showTitle?: boolean
    /** 数值字体大小 */
    valueFontSize?: number
    /** 标题字体大小 */
    titleFontSize?: number
    /** 标签字体大小 */
    labelFontSize?: number
    /** 数值位置偏移 */
    valueOffset?: [string, string]
    /** 标题位置偏移 */
    titleOffset?: [string, string]
  }

  /** 阈值设置 */
  thresholds?: {
    /** 启用阈值 */
    enabled?: boolean
    /** 阈值配置 */
    ranges?: Array<{
      min: number
      max: number
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
    /** 动画缓动函数 */
    easing?: string
    /** 数值变化动画 */
    valueAnimation?: boolean
  }

  /** 数据设置 */
  data?: {
    /** 数据字段名 */
    fieldName?: string
    /** 默认值 */
    defaultValue?: number
    /** 数据格式化 */
    formatter?: string
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
const defaultConfig: GaugeConfig = {
  title: '仪表盘',
  value: {
    min: 0,
    max: 100,
    current: 0,
    unit: '',
    precision: 1
  },
  gauge: {
    startAngle: 180,
    endAngle: -45,
    radius: '100%',
    center: ['50%', '80%'],
    splitNumber: 1,
    axisLineWidth: 30,
    showPointer: false,
    showSplitLine: false,
    showAxisLabel: true
  },
  colors: {
    progressColor: '#105ba8',
    trackColor: '#ddd',
    textColor: '#333333',
    labelColor: '#666666',
    pointerColor: '#105ba8',
    gradient: {
      enabled: false,
      colors: []
    }
  },
  text: {
    showValue: true,
    showUnit: true,
    showTitle: true,
    valueFontSize: 20,
    titleFontSize: 16,
    labelFontSize: 14,
    valueOffset: ['0', '-20%'],
    titleOffset: ['0', '20%']
  },
  thresholds: {
    enabled: false,
    ranges: []
  },
  animation: {
    enabled: true,
    duration: 1000,
    easing: 'cubicOut',
    valueAnimation: true
  },
  data: {
    fieldName: 'value',
    defaultValue: 0,
    formatter: '{value}'
  },
  autoRefresh: {
    enabled: false,
    interval: 30
  }
}

/**
 * 仪表盘组件定义
 */
export const gaugeDefinition: IComponentDefinition = {
  // 基础信息
  id: 'gauge-v2',
  name: '仪表盘',
  version: '2.0.0',
  description: '用于显示单个数值进度的仪表盘组件，支持阈值、动画和样式自定义',
  category: 'chart',
  tags: ['仪表盘', '进度', '数值', '图表'],
  author: 'ThingsPanel',

  // 图标和缩略图
  icon: 'mdi:gauge',
  thumbnail: './poster.png',

  // 支持的渲染器
  supportedRenderers: ['vue'] as RendererType[],

  // 组件尺寸
  size: {
    width: { min: 150, max: 600, default: 300 },
    height: { min: 150, max: 600, default: 300 }
  },

  // 兼容性信息
  compatibility: {
    legacy: {
      componentId: 'instrument-panel',
      migrationVersion: '2.0.0',
      deprecatedProps: [],
      propMapping: {
        name: 'title',
        'config.name': 'title',
        'config.min': 'value.min',
        'config.max': 'value.max',
        'config.unit': 'value.unit'
      }
    }
  },

  // 组件逻辑
  logic: {
    // 数据处理器
    dataProcessor: {
      // 数据转换
      transform: (rawData: any, config: GaugeConfig) => {
        if (!rawData) {
          return config.data?.defaultValue || 0
        }

        const fieldName = config.data?.fieldName || 'value'
        let value = rawData[fieldName] !== undefined ? rawData[fieldName] : rawData

        // 确保值在范围内
        const min = config.value?.min || 0
        const max = config.value?.max || 100
        value = Math.max(min, Math.min(max, Number(value) || 0))

        // 格式化精度
        const precision = config.value?.precision || 1
        return Number(value.toFixed(precision))
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
      getInterval: (config: GaugeConfig) => {
        return config.autoRefresh?.enabled ? (config.autoRefresh.interval || 30) * 1000 : 0
      },

      shouldRefresh: (config: GaugeConfig) => {
        return config.autoRefresh?.enabled || false
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
        default: '仪表盘'
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
            default: 1
          }
        }
      },

      gauge: {
        type: 'object',
        title: '仪表盘设置',
        properties: {
          startAngle: {
            type: 'number',
            title: '起始角度',
            minimum: 0,
            maximum: 360,
            default: 180
          },
          endAngle: {
            type: 'number',
            title: '结束角度',
            minimum: -360,
            maximum: 360,
            default: -45
          },
          radius: {
            type: 'string',
            title: '半径',
            default: '100%'
          },
          axisLineWidth: {
            type: 'number',
            title: '轴线宽度',
            minimum: 1,
            maximum: 100,
            default: 30
          },
          showPointer: {
            type: 'boolean',
            title: '显示指针',
            default: false
          },
          showSplitLine: {
            type: 'boolean',
            title: '显示刻度线',
            default: false
          },
          showAxisLabel: {
            type: 'boolean',
            title: '显示刻度标签',
            default: true
          }
        }
      },

      colors: {
        type: 'object',
        title: '颜色设置',
        properties: {
          progressColor: {
            type: 'string',
            title: '进度颜色',
            format: 'color',
            default: '#105ba8'
          },
          trackColor: {
            type: 'string',
            title: '轨道颜色',
            format: 'color',
            default: '#ddd'
          },
          textColor: {
            type: 'string',
            title: '文字颜色',
            format: 'color',
            default: '#333333'
          },
          labelColor: {
            type: 'string',
            title: '标签颜色',
            format: 'color',
            default: '#666666'
          }
        }
      },

      text: {
        type: 'object',
        title: '文字设置',
        properties: {
          showValue: {
            type: 'boolean',
            title: '显示数值',
            default: true
          },
          showUnit: {
            type: 'boolean',
            title: '显示单位',
            default: true
          },
          showTitle: {
            type: 'boolean',
            title: '显示标题',
            default: true
          },
          valueFontSize: {
            type: 'number',
            title: '数值字体大小',
            minimum: 10,
            maximum: 100,
            default: 20
          },
          titleFontSize: {
            type: 'number',
            title: '标题字体大小',
            minimum: 10,
            maximum: 50,
            default: 16
          },
          labelFontSize: {
            type: 'number',
            title: '标签字体大小',
            minimum: 8,
            maximum: 30,
            default: 14
          }
        }
      },

      thresholds: {
        type: 'object',
        title: '阈值设置',
        properties: {
          enabled: {
            type: 'boolean',
            title: '启用阈值',
            default: false
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
          valueAnimation: {
            type: 'boolean',
            title: '数值变化动画',
            default: true
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
    aspectRatio: 1 // 保持正方形比例
  },

  // 依赖项
  dependencies: {
    external: ['echarts', 'vue-echarts'],
    internal: ['@/components/common']
  },

  // 样式文件
  styles: ['./gauge.css']
}

export default gaugeDefinition
