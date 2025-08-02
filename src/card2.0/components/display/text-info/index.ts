/**
 * Card 2.0 文本信息组件定义
 * 基于原有 chart-text 组件迁移而来，采用新的架构设计
 */

import { defineAsyncComponent } from 'vue'
import type { IComponentDefinition, RendererType, DataSourceType } from '../../../core/types/component'
import { $t } from '@/locales'

/**
 * 文本信息配置接口
 */
export interface TextInfoConfig {
  /** 组件标题 */
  title?: string

  /** 显示设置 */
  display?: {
    /** 是否显示指标名称 */
    showMetricName?: boolean
    /** 指标名称位置 */
    metricNamePosition?: 'top' | 'bottom' | 'left' | 'right'
    /** 自定义指标名称 */
    customMetricName?: string
    /** 是否显示单位 */
    showUnit?: boolean
    /** 单位位置 */
    unitPosition?: 'after' | 'below' | 'above'
    /** 自定义单位 */
    customUnit?: string
  }

  /** 样式设置 */
  style?: {
    /** 值字体大小 */
    valueFontSize?: number
    /** 值字体权重 */
    valueFontWeight?: 'normal' | 'bold' | 'bolder' | number
    /** 值颜色 */
    valueColor?: string
    /** 指标名称字体大小 */
    metricNameFontSize?: number
    /** 指标名称颜色 */
    metricNameColor?: string
    /** 单位字体大小 */
    unitFontSize?: number
    /** 单位颜色 */
    unitColor?: string
    /** 背景色 */
    backgroundColor?: string
    /** 边框 */
    border?: {
      show?: boolean
      width?: number
      color?: string
      radius?: number
    }
    /** 内边距 */
    padding?: {
      top?: number
      right?: number
      bottom?: number
      left?: number
    }
    /** 文本对齐 */
    textAlign?: 'left' | 'center' | 'right'
    /** 垂直对齐 */
    verticalAlign?: 'top' | 'middle' | 'bottom'
  }

  /** 数据设置 */
  data?: {
    /** 默认值 */
    defaultValue?: string | number
    /** 数据格式化 */
    format?: {
      /** 数值类型 */
      type?: 'number' | 'string' | 'boolean'
      /** 数值精度（仅数值类型） */
      precision?: number
      /** 千分位分隔符 */
      thousandsSeparator?: boolean
      /** 前缀 */
      prefix?: string
      /** 后缀 */
      suffix?: string
    }
    /** 数据映射 */
    mapping?: {
      /** 是否启用映射 */
      enabled?: boolean
      /** 映射规则 */
      rules?: Array<{
        /** 原始值 */
        value: any
        /** 显示值 */
        display: string
        /** 显示颜色 */
        color?: string
      }>
    }
  }

  /** 动画设置 */
  animation?: {
    /** 是否启用动画 */
    enabled?: boolean
    /** 数值变化动画 */
    valueChange?: {
      /** 动画时长（毫秒） */
      duration?: number
      /** 动画类型 */
      easing?: 'linear' | 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out'
    }
    /** 闪烁提醒 */
    blink?: {
      /** 是否启用 */
      enabled?: boolean
      /** 闪烁颜色 */
      color?: string
      /** 闪烁次数 */
      count?: number
      /** 闪烁间隔（毫秒） */
      interval?: number
    }
  }

  /** 响应式设置 */
  responsive?: {
    /** 是否启用响应式字体 */
    enabled?: boolean
    /** 最小字体大小 */
    minFontSize?: number
    /** 最大字体大小 */
    maxFontSize?: number
    /** 字体缩放比例 */
    fontScale?: number
  }
}

/**
 * Card 2.0 文本信息组件定义
 * 从 src/card/chart-card/text-info 迁移而来
 */
export const textInfoDefinition: IComponentDefinition<TextInfoConfig> = {
  // 基础信息
  id: 'card2-text-info',
  name: $t('card.textInfo'),
  version: '2.0.0',
  description: '用于显示单个文本信息或数值的组件，支持设备属性数据展示',

  // 分类和标签
  category: 'display',
  tags: ['text', 'info', 'display', 'attribute'],
  author: 'ThingsPanel',

  // 图标和缩略图
  icon: 'mdi:text-box',
  thumbnail: '/card2.0/thumbnails/text-info.png',

  // 渲染器支持
  supportedRenderers: ['vue'] as RendererType[],

  // 组件尺寸
  size: {
    width: 200,
    height: 120,
    minWidth: 100,
    minHeight: 80,
    maxWidth: 800,
    maxHeight: 400,
    aspectRatio: null
  },

  // 兼容性配置
  compatibility: {
    legacy: {
      id: 'chart-text',
      version: '1.0.0'
    },
    migration: {
      configMapping: {
        // 基础映射
        title: 'title',
        // 数据源映射
        'dataSource.deviceSource[0].metricsName': 'display.customMetricName',
        // 样式映射（从旧版的动态字体大小到新版的响应式设置）
        'responsive.enabled': true,
        'responsive.fontScale': 0.1
      },
      dataMapping: {
        // 设备属性数据映射
        'deviceSource[0].metricsType': 'attributes',
        'deviceSource[0].deviceId': 'deviceId',
        'deviceSource[0].metricsId': 'attributeKey'
      }
    }
  },

  // 数据处理逻辑
  dataProcessor: {
    // 处理设备属性数据
    processDeviceData: (data: any, config: TextInfoConfig) => {
      if (!data || typeof data !== 'object') {
        return config.data?.defaultValue || '1.9.2'
      }

      // 如果是属性数据
      if (data.value !== undefined) {
        let value = data.value

        // 数据格式化
        if (config.data?.format) {
          const format = config.data.format

          if (format.type === 'number' && typeof value === 'number') {
            // 数值精度
            if (format.precision !== undefined) {
              value = value.toFixed(format.precision)
            }

            // 千分位分隔符
            if (format.thousandsSeparator) {
              value = Number(value).toLocaleString()
            }
          }

          // 前缀后缀
          if (format.prefix) value = format.prefix + value
          if (format.suffix) value = value + format.suffix
        }

        // 数据映射
        if (config.data?.mapping?.enabled && config.data.mapping.rules) {
          const rule = config.data.mapping.rules.find(r => r.value === data.value)
          if (rule) {
            return {
              value: rule.display,
              color: rule.color,
              unit: data.unit
            }
          }
        }

        return {
          value,
          unit: data.unit
        }
      }

      return config.data?.defaultValue || '1.9.2'
    },

    // 处理API数据
    processApiData: (data: any, config: TextInfoConfig) => {
      if (Array.isArray(data) && data.length > 0) {
        return data[0].value || config.data?.defaultValue || '1.9.2'
      }
      return data?.value || config.data?.defaultValue || '1.9.2'
    }
  },

  // 生命周期钩子
  lifecycle: {
    onMounted: (instance: any) => {
      // 初始化响应式字体大小
      if (instance.config?.responsive?.enabled) {
        instance.setupResponsiveFont()
      }
    },

    onBeforeUnmount: (instance: any) => {
      // 清理响应式观察器
      if (instance.resizeObserver) {
        instance.resizeObserver.disconnect()
      }
    },

    onDataUpdate: (instance: any, newData: any) => {
      // 数据更新时的动画效果
      if (instance.config?.animation?.enabled && instance.config.animation.valueChange) {
        instance.animateValueChange(newData)
      }

      // 闪烁提醒
      if (instance.config?.animation?.blink?.enabled) {
        instance.triggerBlink()
      }
    }
  },

  // Vue组件路径
  component: {
    view: defineAsyncComponent(() => import('./component.vue')),
    config: defineAsyncComponent(() => import('./config.vue'))
  },

  // 默认配置
  defaultConfig: {
    title: '文本信息',
    display: {
      showMetricName: true,
      metricNamePosition: 'bottom',
      showUnit: false,
      unitPosition: 'after'
    },
    style: {
      valueFontSize: 48,
      valueFontWeight: 'bold',
      valueColor: '#333333',
      metricNameFontSize: 14,
      metricNameColor: '#666666',
      unitFontSize: 16,
      unitColor: '#999999',
      backgroundColor: 'transparent',
      border: {
        show: false,
        width: 1,
        color: '#e0e0e0',
        radius: 4
      },
      padding: {
        top: 10,
        right: 10,
        bottom: 10,
        left: 10
      },
      textAlign: 'center',
      verticalAlign: 'middle'
    },
    data: {
      defaultValue: '1.9.2',
      format: {
        type: 'string',
        precision: 2,
        thousandsSeparator: false
      },
      mapping: {
        enabled: false,
        rules: []
      }
    },
    animation: {
      enabled: false,
      valueChange: {
        duration: 300,
        easing: 'ease-out'
      },
      blink: {
        enabled: false,
        color: '#ff4d4f',
        count: 3,
        interval: 200
      }
    },
    responsive: {
      enabled: true,
      minFontSize: 12,
      maxFontSize: 72,
      fontScale: 0.1
    }
  } as TextInfoConfig,

  // JSON Schema定义
  schema: {
    type: 'object',
    properties: {
      title: {
        type: 'string',
        title: '组件标题',
        default: '文本信息'
      },
      display: {
        type: 'object',
        title: '显示设置',
        properties: {
          showMetricName: {
            type: 'boolean',
            title: '显示指标名称',
            default: true
          },
          metricNamePosition: {
            type: 'string',
            title: '指标名称位置',
            enum: ['top', 'bottom', 'left', 'right'],
            default: 'bottom'
          },
          customMetricName: {
            type: 'string',
            title: '自定义指标名称'
          },
          showUnit: {
            type: 'boolean',
            title: '显示单位',
            default: false
          },
          unitPosition: {
            type: 'string',
            title: '单位位置',
            enum: ['after', 'below', 'above'],
            default: 'after'
          }
        }
      },
      style: {
        type: 'object',
        title: '样式设置',
        properties: {
          valueFontSize: {
            type: 'number',
            title: '值字体大小',
            minimum: 12,
            maximum: 100,
            default: 48
          },
          valueColor: {
            type: 'string',
            title: '值颜色',
            format: 'color',
            default: '#333333'
          },
          textAlign: {
            type: 'string',
            title: '文本对齐',
            enum: ['left', 'center', 'right'],
            default: 'center'
          }
        }
      }
    }
  },

  // 支持的数据源类型
  supportedDataSources: ['device', 'api'] as DataSourceType[],

  // 布局信息
  layout: {
    grid: {
      w: 2,
      h: 2,
      minW: 1,
      minH: 1,
      maxW: 6,
      maxH: 4
    },
    resizable: true,
    movable: true
  },

  // 依赖项
  dependencies: {
    vue: '^3.0.0',
    'naive-ui': '^2.0.0'
  },

  // 样式文件
  styles: ['/card2.0/components/display/text-info/styles.css']
}

export default textInfoDefinition
