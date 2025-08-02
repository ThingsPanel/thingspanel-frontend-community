/**
 * Card 2.0 数据发送组件定义
 * 基于原有 chart-dispatch 组件迁移而来，采用新的架构设计
 */

import { defineAsyncComponent } from 'vue'
import type { IComponentDefinition, RendererType, DataSourceType } from '../../../core/types/component'
import { $t } from '@/locales'

/**
 * 数据发送配置接口
 */
export interface DispatchDataConfig {
  /** 基础设置 */
  basic?: {
    /** 组件标题 */
    title?: string
    /** 设备名称显示 */
    showDeviceName?: boolean
    /** 自定义设备名称 */
    customDeviceName?: string
  }

  /** 按钮设置 */
  button?: {
    /** 按钮文本 */
    text?: string
    /** 按钮图标 */
    icon?: string
    /** 按钮大小 */
    size?: 'small' | 'medium' | 'large'
    /** 按钮形状 */
    shape?: 'default' | 'round' | 'circle'
    /** 禁用状态 */
    disabled?: boolean
    /** 加载状态 */
    loading?: boolean
  }

  /** 数据设置 */
  data?: {
    /** 数据类型 */
    type?: 'attributes' | 'telemetry' | 'command'
    /** 发送的数据值 */
    value?: string
    /** 数据键名 */
    key?: string
    /** 数据格式 */
    format?: 'string' | 'number' | 'boolean' | 'json'
  }

  /** 样式设置 */
  style?: {
    /** 容器样式 */
    container?: {
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
      /** 布局方向 */
      direction?: 'column' | 'row'
      /** 对齐方式 */
      align?: 'start' | 'center' | 'end'
      /** 间距 */
      gap?: number
    }

    /** 按钮样式 */
    button?: {
      /** 背景色 */
      backgroundColor?: string
      /** 悬停背景色 */
      hoverBackgroundColor?: string
      /** 文字颜色 */
      color?: string
      /** 图标颜色 */
      iconColor?: string
      /** 边框 */
      border?: {
        show?: boolean
        width?: number
        color?: string
        radius?: number
      }
      /** 阴影 */
      shadow?: {
        show?: boolean
        blur?: number
        color?: string
        offsetX?: number
        offsetY?: number
      }
    }

    /** 设备名称样式 */
    deviceName?: {
      /** 字体大小 */
      fontSize?: number
      /** 字体颜色 */
      color?: string
      /** 字体粗细 */
      fontWeight?: 'normal' | 'bold' | number
      /** 位置 */
      position?: 'top' | 'bottom'
    }

    /** 按钮文本样式 */
    buttonText?: {
      /** 字体大小 */
      fontSize?: number
      /** 字体颜色 */
      color?: string
      /** 字体粗细 */
      fontWeight?: 'normal' | 'bold' | number
      /** 位置 */
      position?: 'top' | 'bottom' | 'left' | 'right' | 'none'
    }
  }

  /** 交互设置 */
  interaction?: {
    /** 确认对话框 */
    confirm?: {
      /** 启用确认 */
      enabled?: boolean
      /** 对话框标题 */
      title?: string
      /** 对话框内容 */
      content?: string
    }
    /** 防抖设置 */
    debounce?: {
      /** 启用防抖 */
      enabled?: boolean
      /** 延迟时间 */
      delay?: number
    }
    /** 成功反馈 */
    feedback?: {
      /** 成功消息 */
      successMessage?: string
      /** 错误消息 */
      errorMessage?: string
      /** 显示时长 */
      duration?: number
    }
  }

  /** 高级设置 */
  advanced?: {
    /** 重试设置 */
    retry?: {
      /** 启用重试 */
      enabled?: boolean
      /** 重试次数 */
      maxRetries?: number
      /** 重试间隔 */
      retryDelay?: number
    }
    /** 响应式调整 */
    responsive?: {
      /** 启用响应式 */
      enabled?: boolean
      /** 最小尺寸 */
      minSize?: number
      /** 最大尺寸 */
      maxSize?: number
    }
  }
}

/**
 * 数据发送组件定义
 */
export const dispatchDataDefinition: IComponentDefinition<DispatchDataConfig> = {
  // 组件元数据
  meta: {
    id: 'control-dispatch-data-v2',
    name: 'generate.dispatchData',
    version: '2.0.0',
    description: '数据发送组件，用于向设备发送控制指令或数据',
    category: 'control',
    tags: ['dispatch', 'control', 'command', 'device'],
    author: 'ThingsPanel',
    icon: 'mdi:send',
    thumbnail: '/assets/thumbnails/dispatch-data.png'
  },

  // 支持的渲染器
  renderers: ['vue'] as RendererType[],

  // 组件尺寸配置
  size: {
    width: 3,
    height: 2,
    minWidth: 2,
    minHeight: 1,
    maxWidth: 8,
    maxHeight: 6
  },

  // 兼容性配置
  compatibility: {
    // 旧版组件ID映射
    legacyIds: ['chart-dispatch'],

    // 配置迁移逻辑
    migrateConfig: (oldConfig: any): DispatchDataConfig => {
      return {
        basic: {
          title: $t('card.dataSent'),
          showDeviceName: true
        },
        button: {
          text: oldConfig.buttonText || $t('card.customData'),
          icon: oldConfig.iconName || 'Play',
          size: 'medium',
          shape: 'default',
          disabled: false,
          loading: false
        },
        data: {
          type: oldConfig.dataType || 'telemetry',
          value: oldConfig.valueToSend || '1',
          key: 'control',
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
            direction: 'column',
            align: 'center',
            gap: 12
          },
          button: {
            backgroundColor: oldConfig.buttonColor || '#ff4d4f',
            hoverBackgroundColor: oldConfig.buttonColor ? `${oldConfig.buttonColor}dd` : '#ff7875',
            color: '#ffffff',
            iconColor: oldConfig.buttonIconColor || '#ffffff',
            border: {
              show: false,
              width: 1,
              color: '#d9d9d9',
              radius: 8
            },
            shadow: {
              show: true,
              blur: 4,
              color: 'rgba(0, 0, 0, 0.1)',
              offsetX: 0,
              offsetY: 2
            }
          },
          deviceName: {
            fontSize: 14,
            color: '#666666',
            fontWeight: 'normal',
            position: 'top'
          },
          buttonText: {
            fontSize: 12,
            color: '#666666',
            fontWeight: 'normal',
            position: 'bottom'
          }
        },
        interaction: {
          confirm: {
            enabled: false,
            title: '确认操作',
            content: '确定要发送数据吗？'
          },
          debounce: {
            enabled: true,
            delay: 300
          },
          feedback: {
            successMessage: $t('card.dataSentSuccess'),
            errorMessage: $t('card.dataSentFail'),
            duration: 3000
          }
        },
        advanced: {
          retry: {
            enabled: true,
            maxRetries: 3,
            retryDelay: 1000
          },
          responsive: {
            enabled: true,
            minSize: 24,
            maxSize: 64
          }
        }
      }
    },

    // 数据迁移逻辑
    migrateData: (oldData: any) => {
      // 数据发送组件通常不需要迁移数据
      return oldData
    }
  },

  // 数据处理器
  dataProcessor: {
    // 处理设备数据
    processDeviceData: (data: any[], config: DispatchDataConfig) => {
      // 数据发送组件主要用于发送数据，不需要处理输入数据
      return {
        deviceId: data[0]?.deviceId,
        deviceName: data[0]?.deviceName || config.basic?.customDeviceName
      }
    },

    // 处理API数据
    processApiData: (data: any, config: DispatchDataConfig) => {
      return {
        deviceId: data?.deviceId,
        deviceName: data?.deviceName || config.basic?.customDeviceName
      }
    }
  },

  // 生命周期钩子
  lifecycle: {
    onMount: (instance: any) => {
      // 组件挂载时的逻辑
    },
    onUnmount: (instance: any) => {
      // 组件卸载时的逻辑
    },
    onDataChange: (instance: any, newData: any) => {
      // 数据变化时的逻辑
    }
  },

  // Vue组件
  component: {
    vue: defineAsyncComponent(() => import('./component.vue'))
  },

  // 配置组件
  configComponent: {
    vue: defineAsyncComponent(() => import('./config.vue'))
  },

  // 默认配置
  defaultConfig: {
    basic: {
      title: $t('card.dataSent'),
      showDeviceName: true
    },
    button: {
      text: $t('card.customData'),
      icon: 'Play',
      size: 'medium',
      shape: 'default',
      disabled: false,
      loading: false
    },
    data: {
      type: 'telemetry',
      value: '1',
      key: 'control',
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
        direction: 'column',
        align: 'center',
        gap: 12
      },
      button: {
        backgroundColor: '#ff4d4f',
        hoverBackgroundColor: '#ff7875',
        color: '#ffffff',
        iconColor: '#ffffff',
        border: {
          show: false,
          width: 1,
          color: '#d9d9d9',
          radius: 8
        },
        shadow: {
          show: true,
          blur: 4,
          color: 'rgba(0, 0, 0, 0.1)',
          offsetX: 0,
          offsetY: 2
        }
      },
      deviceName: {
        fontSize: 14,
        color: '#666666',
        fontWeight: 'normal',
        position: 'top'
      },
      buttonText: {
        fontSize: 12,
        color: '#666666',
        fontWeight: 'normal',
        position: 'bottom'
      }
    },
    interaction: {
      confirm: {
        enabled: false,
        title: '确认操作',
        content: '确定要发送数据吗？'
      },
      debounce: {
        enabled: true,
        delay: 300
      },
      feedback: {
        successMessage: $t('card.dataSentSuccess'),
        errorMessage: $t('card.dataSentFail'),
        duration: 3000
      }
    },
    advanced: {
      retry: {
        enabled: true,
        maxRetries: 3,
        retryDelay: 1000
      },
      responsive: {
        enabled: true,
        minSize: 24,
        maxSize: 64
      }
    }
  } as DispatchDataConfig,

  // JSON Schema定义
  schema: {
    type: 'object',
    properties: {
      basic: {
        type: 'object',
        title: '基础设置',
        properties: {
          title: {
            type: 'string',
            title: '组件标题',
            default: $t('card.dataSent')
          },
          showDeviceName: {
            type: 'boolean',
            title: '显示设备名称',
            default: true
          },
          customDeviceName: {
            type: 'string',
            title: '自定义设备名称'
          }
        }
      },
      button: {
        type: 'object',
        title: '按钮设置',
        properties: {
          text: {
            type: 'string',
            title: '按钮文本',
            default: $t('card.customData')
          },
          icon: {
            type: 'string',
            title: '按钮图标',
            default: 'Play'
          },
          size: {
            type: 'string',
            title: '按钮大小',
            enum: ['small', 'medium', 'large'],
            default: 'medium'
          }
        }
      },
      data: {
        type: 'object',
        title: '数据设置',
        properties: {
          type: {
            type: 'string',
            title: '数据类型',
            enum: ['attributes', 'telemetry', 'command'],
            default: 'telemetry'
          },
          value: {
            type: 'string',
            title: '发送的数据值',
            default: '1'
          }
        }
      }
    }
  },

  // 支持的数据源类型
  supportedDataSources: ['device'] as DataSourceType[],

  // 布局信息
  layout: {
    category: 'control',
    priority: 3,
    grid: {
      resizable: true,
      draggable: true
    }
  },

  // 依赖项
  dependencies: {
    external: [],
    internal: ['@/service/api/device']
  },

  // 样式文件
  styles: {
    css: []
  }
}

export default dispatchDataDefinition
