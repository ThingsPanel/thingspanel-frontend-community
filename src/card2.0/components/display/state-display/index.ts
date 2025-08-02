/**
 * Card 2.0 状态显示组件定义
 * 基于原有 chart-state 组件迁移而来，采用新的架构设计
 */

import { defineAsyncComponent } from 'vue'
import type { IComponentDefinition, RendererType, DataSourceType } from '../../../core/types/component'
import { $t } from '@/locales'

/**
 * 状态显示配置接口
 */
export interface StateDisplayConfig {
  /** 基础设置 */
  basic?: {
    /** 组件标题 */
    title?: string
    /** 显示设备名称 */
    showDeviceName?: boolean
    /** 自定义设备名称 */
    customDeviceName?: string
    /** 显示指标名称 */
    showMetricName?: boolean
    /** 自定义指标名称 */
    customMetricName?: string
  }

  /** 状态设置 */
  state?: {
    /** 激活状态图标 */
    activeIcon?: string
    /** 非激活状态图标 */
    inactiveIcon?: string
    /** 激活状态颜色 */
    activeColor?: string
    /** 非激活状态颜色 */
    inactiveColor?: string
    /** 激活状态值 */
    activeValue?: string | number | boolean
    /** 非激活状态值 */
    inactiveValue?: string | number | boolean
  }

  /** 数据设置 */
  data?: {
    /** 数据类型 */
    type?: 'attributes' | 'telemetry'
    /** 数据键名 */
    key?: string
    /** 数据格式 */
    format?: 'string' | 'number' | 'boolean'
  }

  /** 样式设置 */
  style?: {
    /** 容器样式 */
    container?: {
      /** 背景颜色 */
      backgroundColor?: string
      /** 边框设置 */
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
      /** 对齐方式 */
      align?: 'start' | 'center' | 'end'
      /** 垂直对齐 */
      verticalAlign?: 'start' | 'center' | 'end'
    }

    /** 图标样式 */
    icon?: {
      /** 图标大小 */
      size?: number
      /** 图标边距 */
      margin?: number
      /** 阴影设置 */
      shadow?: {
        show?: boolean
        blur?: number
        color?: string
        offsetX?: number
        offsetY?: number
      }
    }

    /** 文本样式 */
    text?: {
      /** 字体大小 */
      fontSize?: number
      /** 字体颜色 */
      color?: string
      /** 字体粗细 */
      fontWeight?: 'normal' | 'bold' | number
      /** 字体系列 */
      fontFamily?: string
      /** 文本位置 */
      position?: 'top' | 'bottom' | 'left' | 'right'
      /** 文本边距 */
      margin?: number
    }
  }

  /** 交互设置 */
  interaction?: {
    /** 悬停效果 */
    hover?: {
      /** 启用悬停效果 */
      enabled?: boolean
      /** 悬停缩放比例 */
      scale?: number
      /** 悬停动画时长 */
      duration?: number
    }
    /** 点击效果 */
    click?: {
      /** 启用点击效果 */
      enabled?: boolean
      /** 点击动画 */
      animation?: 'pulse' | 'bounce' | 'shake'
    }
  }

  /** 高级设置 */
  advanced?: {
    /** 响应式设置 */
    responsive?: {
      /** 启用响应式 */
      enabled?: boolean
      /** 断点设置 */
      breakpoints?: {
        mobile?: number
        tablet?: number
        desktop?: number
      }
    }
    /** 自动刷新 */
    autoRefresh?: {
      /** 启用自动刷新 */
      enabled?: boolean
      /** 刷新间隔（秒） */
      interval?: number
    }
  }
}

/**
 * Card 2.0 状态显示组件定义
 */
const stateDisplayDefinition: IComponentDefinition<StateDisplayConfig> = {
  id: 'state-display',
  name: '状态显示',
  version: '2.0.0',
  description: '状态显示组件，根据设备数据显示不同的图标和颜色来表示开关状态',
  category: 'display',
  tags: ['display', 'state', 'status', 'icon'],
  author: 'ThingsPanel',
  icon: 'mdi:lightbulb-outline',
  thumbnail: '/thumbnails/state-display.png',

  // 渲染器支持
  renderers: ['canvas', 'svg'] as RendererType[],

  // 组件尺寸
  size: {
    width: { min: 2, max: 8, default: 3 },
    height: { min: 1, max: 6, default: 2 }
  },

  // 兼容性配置
  compatibility: {
    // 旧版组件ID
    legacyId: 'chart-state',

    // 配置迁移
    migrateConfig: (oldConfig: any): StateDisplayConfig => {
      return {
        basic: {
          title: '状态显示',
          showDeviceName: true,
          showMetricName: true
        },
        state: {
          activeIcon: oldConfig.activeIconName || 'BulbOutline',
          inactiveIcon: oldConfig.inactiveIconName || 'Bulb',
          activeColor: oldConfig.activeColor || '#FFA500',
          inactiveColor: oldConfig.inactiveColor || '#808080',
          activeValue: oldConfig.active0 || '1',
          inactiveValue: oldConfig.active1 || '0'
        },
        data: {
          type: 'attributes',
          key: 'status',
          format: 'string'
        },
        style: {
          container: {
            backgroundColor: 'transparent',
            border: {
              show: false,
              width: 1,
              color: '#d9d9d9',
              radius: 4
            },
            padding: {
              top: 16,
              right: 16,
              bottom: 16,
              left: 16
            },
            align: 'center',
            verticalAlign: 'center'
          },
          icon: {
            size: 48,
            margin: 8,
            shadow: {
              show: false,
              blur: 4,
              color: 'rgba(0, 0, 0, 0.1)',
              offsetX: 0,
              offsetY: 2
            }
          },
          text: {
            fontSize: 14,
            color: '#666666',
            fontWeight: 'normal',
            position: 'bottom',
            margin: 8
          }
        },
        interaction: {
          hover: {
            enabled: true,
            scale: 1.1,
            duration: 200
          },
          click: {
            enabled: false,
            animation: 'pulse'
          }
        },
        advanced: {
          responsive: {
            enabled: true,
            breakpoints: {
              mobile: 480,
              tablet: 768,
              desktop: 1024
            }
          },
          autoRefresh: {
            enabled: false,
            interval: 30
          }
        }
      }
    },

    // 数据迁移
    migrateData: (oldData: any) => {
      return oldData
    }
  },

  // 数据处理器
  dataProcessor: {
    // 处理设备属性数据
    processDeviceData: (data: any[], config: StateDisplayConfig) => {
      const key = config.data?.key || 'status'
      if (data && data.length > 0) {
        const latest = data[data.length - 1]
        if (latest && typeof latest === 'object' && key in latest) {
          return {
            currentValue: latest[key],
            timestamp: latest.timestamp || Date.now()
          }
        }
      }
      return null
    },

    // 处理API数据
    processApiData: (data: any, config: StateDisplayConfig) => {
      const key = config.data?.key || 'status'
      if (data && typeof data === 'object' && key in data) {
        return {
          currentValue: data[key],
          timestamp: Date.now()
        }
      }
      return null
    },

    // 验证数据格式
    validateData: (data: any) => {
      return data !== null && data !== undefined
    },

    // 格式化显示数据
    formatDisplayData: (data: any, config: StateDisplayConfig) => {
      if (!data || data.currentValue === undefined) return null

      const { format } = config.data || {}
      let value = data.currentValue

      // 根据格式转换
      switch (format) {
        case 'number':
          return Number(value)
        case 'boolean':
          return Boolean(value)
        case 'string':
        default:
          return String(value)
      }
    }
  },

  // 生命周期钩子
  lifecycle: {
    onInit: (config: StateDisplayConfig) => {
      console.log('StateDisplay component initialized', config)
    },

    onDestroy: () => {
      console.log('StateDisplay component destroyed')
    },

    onDataUpdate: (data: any, config: StateDisplayConfig) => {
      console.log('StateDisplay data updated', { data, config })
    },

    onConfigUpdate: (newConfig: StateDisplayConfig, oldConfig: StateDisplayConfig) => {
      console.log('StateDisplay config updated', { newConfig, oldConfig })
    }
  },

  // Vue 视图组件路径
  component: () => import('./component.vue'),

  // 配置组件路径
  configComponent: () => import('./config.vue'),

  // 默认配置
  defaultConfig: {
    basic: {
      title: '状态显示',
      showDeviceName: true,
      customDeviceName: '',
      showMetricName: true,
      customMetricName: ''
    },
    state: {
      activeIcon: 'BulbOutline',
      inactiveIcon: 'Bulb',
      activeColor: '#FFA500',
      inactiveColor: '#808080',
      activeValue: '1',
      inactiveValue: '0'
    },
    data: {
      type: 'attributes',
      key: 'status',
      format: 'string'
    },
    style: {
      container: {
        backgroundColor: 'transparent',
        border: {
          show: false,
          width: 1,
          color: '#d9d9d9',
          radius: 4
        },
        padding: {
          top: 16,
          right: 16,
          bottom: 16,
          left: 16
        },
        align: 'center',
        verticalAlign: 'center'
      },
      icon: {
        size: 48,
        margin: 8,
        shadow: {
          show: false,
          blur: 4,
          color: 'rgba(0, 0, 0, 0.1)',
          offsetX: 0,
          offsetY: 2
        }
      },
      text: {
        fontSize: 14,
        color: '#666666',
        fontWeight: 'normal',
        position: 'bottom',
        margin: 8
      }
    },
    interaction: {
      hover: {
        enabled: true,
        scale: 1.1,
        duration: 200
      },
      click: {
        enabled: false,
        animation: 'pulse'
      }
    },
    advanced: {
      responsive: {
        enabled: true,
        breakpoints: {
          mobile: 480,
          tablet: 768,
          desktop: 1024
        }
      },
      autoRefresh: {
        enabled: false,
        interval: 30
      }
    }
  } as StateDisplayConfig,

  // JSON Schema 定义
  schema: {
    type: 'object',
    properties: {
      basic: {
        type: 'object',
        title: '基础设置',
        properties: {
          title: { type: 'string', title: '组件标题' },
          showDeviceName: { type: 'boolean', title: '显示设备名称' },
          customDeviceName: { type: 'string', title: '自定义设备名称' },
          showMetricName: { type: 'boolean', title: '显示指标名称' },
          customMetricName: { type: 'string', title: '自定义指标名称' }
        }
      },
      state: {
        type: 'object',
        title: '状态设置',
        properties: {
          activeIcon: { type: 'string', title: '激活状态图标' },
          inactiveIcon: { type: 'string', title: '非激活状态图标' },
          activeColor: { type: 'string', title: '激活状态颜色' },
          inactiveColor: { type: 'string', title: '非激活状态颜色' },
          activeValue: { type: ['string', 'number', 'boolean'], title: '激活状态值' },
          inactiveValue: { type: ['string', 'number', 'boolean'], title: '非激活状态值' }
        }
      }
    }
  },

  // 支持的数据源类型
  supportedDataSources: ['device', 'api'] as DataSourceType[],

  // 布局信息
  layout: {
    grid: {
      minW: 2,
      minH: 1,
      maxW: 8,
      maxH: 6,
      defaultW: 3,
      defaultH: 2
    },
    flex: {
      grow: 1,
      shrink: 1,
      basis: 'auto'
    }
  },

  // 依赖项
  dependencies: {
    vue: '^3.0.0',
    'naive-ui': '^2.0.0',
    '@vicons/ionicons5': '^0.12.0'
  },

  // 样式文件
  styles: ['./component.scss']
}

/** 导出组件定义 */
export default stateDisplayDefinition

/** 导出类型 */
export type { StateDisplayConfig }
