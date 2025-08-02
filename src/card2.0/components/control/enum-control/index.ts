/**
 * Card 2.0 枚举控制组件定义
 * 提供多选项按钮控制功能，支持属性、遥测、命令数据发送
 */

import { defineAsyncComponent } from 'vue'
import type { IComponentDefinition, RendererType, DataSourceType } from '../../../core/types/component'
import { $t } from '@/locales'

/** 按钮选项配置 */
export interface ButtonOption {
  /** 按钮显示文本 */
  label: string
  /** 按钮值 */
  value: string | number
  /** 按钮图标 */
  icon?: string
  /** 按钮颜色 */
  color?: string
  /** 是否禁用 */
  disabled?: boolean
}

/** 枚举控制组件配置接口 */
export interface EnumControlConfig {
  /** 基础设置 */
  basic: {
    /** 组件标题 */
    title: string
    /** 显示设备名称 */
    showDeviceName: boolean
    /** 自定义设备名称 */
    customDeviceName?: string
    /** 显示当前值 */
    showCurrentValue: boolean
    /** 当前值标签 */
    currentValueLabel?: string
  }

  /** 按钮设置 */
  buttons: {
    /** 按钮选项列表 */
    options: ButtonOption[]
    /** 按钮大小 */
    size: 'small' | 'medium' | 'large'
    /** 按钮形状 */
    shape: 'default' | 'round' | 'circle'
    /** 布局方向 */
    direction: 'horizontal' | 'vertical'
    /** 按钮间距 */
    gap: number
    /** 每行按钮数量（水平布局时） */
    itemsPerRow?: number
    /** 禁用所有按钮 */
    disabled: boolean
  }

  /** 数据设置 */
  data: {
    /** 数据类型 */
    type: 'attributes' | 'telemetry' | 'command'
    /** 数据键名 */
    key: string
    /** 数据格式 */
    format: 'string' | 'number' | 'boolean' | 'json'
    /** 值映射 */
    valueMapping?: Record<string, any>
  }

  /** 样式设置 */
  style: {
    /** 容器样式 */
    container: {
      /** 背景色 */
      backgroundColor: string
      /** 边框设置 */
      border: {
        show: boolean
        width: number
        color: string
        radius: number
      }
      /** 内边距 */
      padding: {
        top: number
        right: number
        bottom: number
        left: number
      }
      /** 对齐方式 */
      align: 'start' | 'center' | 'end'
      /** 垂直对齐 */
      verticalAlign: 'start' | 'center' | 'end'
    }
    /** 按钮样式 */
    button: {
      /** 默认背景色 */
      backgroundColor: string
      /** 激活背景色 */
      activeBackgroundColor: string
      /** 悬停背景色 */
      hoverBackgroundColor: string
      /** 默认文字颜色 */
      color: string
      /** 激活文字颜色 */
      activeColor: string
      /** 边框设置 */
      border: {
        show: boolean
        width: number
        color: string
        activeColor: string
        radius: number
      }
      /** 阴影设置 */
      shadow: {
        show: boolean
        blur: number
        color: string
        offsetX: number
        offsetY: number
      }
      /** 字体设置 */
      font: {
        size: number
        weight: string | number
        family?: string
      }
    }
    /** 设备名称样式 */
    deviceName: {
      fontSize: number
      color: string
      fontWeight: string | number
      position: 'top' | 'bottom'
      margin: number
    }
    /** 当前值样式 */
    currentValue: {
      fontSize: number
      color: string
      fontWeight: string | number
      position: 'top' | 'bottom'
      margin: number
      prefix?: string
      suffix?: string
    }
  }

  /** 交互设置 */
  interaction: {
    /** 确认对话框 */
    confirm: {
      enabled: boolean
      title: string
      content: string
    }
    /** 防抖设置 */
    debounce: {
      enabled: boolean
      delay: number
    }
    /** 反馈设置 */
    feedback: {
      successMessage: string
      errorMessage: string
      duration: number
    }
    /** 动画设置 */
    animation: {
      enabled: boolean
      duration: number
      easing: string
    }
  }

  /** 高级设置 */
  advanced: {
    /** 重试设置 */
    retry: {
      enabled: boolean
      maxRetries: number
      retryDelay: number
    }
    /** 响应式调整 */
    responsive: {
      enabled: boolean
      breakpoints: {
        mobile: number
        tablet: number
        desktop: number
      }
    }
  }
}

/**
 * Card 2.0 枚举控制组件定义
 */
export const enumControlDefinition: IComponentDefinition<EnumControlConfig> = {
  // 组件元数据
  meta: {
    id: 'control-enum-control-v2',
    name: 'generate.enumControl',
    version: '2.0.0',
    description: '多选项按钮控制组件，支持属性、遥测、命令数据发送',
    category: 'control',
    tags: ['control', 'enum', 'button', 'selection'],
    author: 'ThingsPanel',
    icon: 'mdi:radiobox-marked',
    thumbnail: '/assets/thumbnails/enum-control.png'
  },

  // 渲染器支持
  renderers: ['vue'] as RendererType[],

  // 组件尺寸
  size: {
    width: 4,
    height: 3,
    minWidth: 3,
    minHeight: 2,
    maxWidth: 8,
    maxHeight: 6
  },

  // 兼容性配置
  compatibility: {
    // 旧版组件ID
    legacyIds: ['chart-enumcontrol'],

    // 配置迁移
    migrateConfig: (oldConfig: any): EnumControlConfig => {
      const btOptions = oldConfig.btOptions || [
        { label: '加热', value: 'heat' },
        { label: '制冷', value: 'cool' },
        { label: '通风', value: 'fan' },
        { label: '自动', value: 'auto' }
      ]

      return {
        basic: {
          title: '枚举控制',
          showDeviceName: true,
          showCurrentValue: true,
          currentValueLabel: '当前状态'
        },
        buttons: {
          options: btOptions.map((option: any) => ({
            label: option.label,
            value: option.value,
            disabled: false
          })),
          size: 'medium',
          shape: 'default',
          direction: 'horizontal',
          gap: 8,
          disabled: false
        },
        data: {
          type: 'telemetry',
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
            align: 'center',
            verticalAlign: 'center'
          },
          button: {
            backgroundColor: '#f5f5f5',
            activeBackgroundColor: '#1890ff',
            hoverBackgroundColor: '#e6f7ff',
            color: '#333333',
            activeColor: '#ffffff',
            border: {
              show: true,
              width: 1,
              color: '#d9d9d9',
              activeColor: '#1890ff',
              radius: 4
            },
            shadow: {
              show: false,
              blur: 4,
              color: 'rgba(0, 0, 0, 0.1)',
              offsetX: 0,
              offsetY: 2
            },
            font: {
              size: 14,
              weight: 'normal'
            }
          },
          deviceName: {
            fontSize: 14,
            color: '#666666',
            fontWeight: 'normal',
            position: 'top',
            margin: 8
          },
          currentValue: {
            fontSize: 12,
            color: '#999999',
            fontWeight: 'normal',
            position: 'bottom',
            margin: 8,
            prefix: '当前: ',
            suffix: ''
          }
        },
        interaction: {
          confirm: {
            enabled: false,
            title: '确认操作',
            content: '确定要执行此操作吗？'
          },
          debounce: {
            enabled: true,
            delay: 300
          },
          feedback: {
            successMessage: '操作成功',
            errorMessage: '操作失败',
            duration: 3000
          },
          animation: {
            enabled: true,
            duration: 200,
            easing: 'ease-in-out'
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
            breakpoints: {
              mobile: 480,
              tablet: 768,
              desktop: 1024
            }
          }
        }
      }
    },
    dataMigration: (oldData: any) => {
      return oldData
    }
  },

  // 数据处理逻辑
  dataProcessor: {
    // 处理设备属性数据
    processDeviceAttributes: (data: any, config: EnumControlConfig) => {
      const key = config.data.key
      if (data && typeof data === 'object' && key in data) {
        return {
          currentValue: data[key],
          timestamp: Date.now()
        }
      }
      return null
    },

    // 处理API数据
    processApiData: (data: any, config: EnumControlConfig) => {
      if (Array.isArray(data) && data.length > 0) {
        const latest = data[data.length - 1]
        const key = config.data.key
        if (latest && typeof latest === 'object' && key in latest) {
          return {
            currentValue: latest[key],
            timestamp: latest.timestamp || Date.now()
          }
        }
      }
      return null
    },

    // 验证数据格式
    validateData: (data: any) => {
      return data !== null && data !== undefined
    },

    // 格式化显示数据
    formatDisplayData: (data: any, config: EnumControlConfig) => {
      if (!data || data.currentValue === undefined) return ''

      const { format, valueMapping } = config.data
      let value = data.currentValue

      // 应用值映射
      if (valueMapping && valueMapping[value] !== undefined) {
        value = valueMapping[value]
      }

      // 根据格式转换
      switch (format) {
        case 'number':
          return Number(value).toString()
        case 'boolean':
          return Boolean(value).toString()
        case 'json':
          return JSON.stringify(value)
        default:
          return String(value)
      }
    }
  },

  // 生命周期钩子
  lifecycle: {
    onInit: (config: EnumControlConfig) => {
      console.log('EnumControl component initialized', config)
    },

    onDestroy: () => {
      console.log('EnumControl component destroyed')
    },

    onDataUpdate: (data: any, config: EnumControlConfig) => {
      console.log('EnumControl data updated', data)
    },

    onConfigUpdate: (newConfig: EnumControlConfig, oldConfig: EnumControlConfig) => {
      console.log('EnumControl config updated', { newConfig, oldConfig })
    }
  },

  // Vue 视图组件路径
  component: () => import('./component.vue'),

  // 配置组件路径
  configComponent: () => import('./config.vue'),

  // 默认配置
  defaultConfig: {
    basic: {
      title: '枚举控制',
      showDeviceName: true,
      customDeviceName: '',
      showCurrentValue: true,
      currentValueLabel: '当前状态'
    },
    buttons: {
      options: [
        { label: '加热', value: 'heat', disabled: false },
        { label: '制冷', value: 'cool', disabled: false },
        { label: '通风', value: 'fan', disabled: false },
        { label: '自动', value: 'auto', disabled: false }
      ],
      size: 'medium',
      shape: 'default',
      direction: 'horizontal',
      gap: 8,
      itemsPerRow: 4,
      disabled: false
    },
    data: {
      type: 'telemetry',
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
        align: 'center',
        verticalAlign: 'center'
      },
      button: {
        backgroundColor: '#f5f5f5',
        activeBackgroundColor: '#1890ff',
        hoverBackgroundColor: '#e6f7ff',
        color: '#333333',
        activeColor: '#ffffff',
        border: {
          show: true,
          width: 1,
          color: '#d9d9d9',
          activeColor: '#1890ff',
          radius: 4
        },
        shadow: {
          show: false,
          blur: 4,
          color: 'rgba(0, 0, 0, 0.1)',
          offsetX: 0,
          offsetY: 2
        },
        font: {
          size: 14,
          weight: 'normal'
        }
      },
      deviceName: {
        fontSize: 14,
        color: '#666666',
        fontWeight: 'normal',
        position: 'top',
        margin: 8
      },
      currentValue: {
        fontSize: 12,
        color: '#999999',
        fontWeight: 'normal',
        position: 'bottom',
        margin: 8,
        prefix: '当前: ',
        suffix: ''
      }
    },
    interaction: {
      confirm: {
        enabled: false,
        title: '确认操作',
        content: '确定要执行此操作吗？'
      },
      debounce: {
        enabled: true,
        delay: 300
      },
      feedback: {
        successMessage: '操作成功',
        errorMessage: '操作失败',
        duration: 3000
      },
      animation: {
        enabled: true,
        duration: 200,
        easing: 'ease-in-out'
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
        breakpoints: {
          mobile: 480,
          tablet: 768,
          desktop: 1024
        }
      }
    }
  },

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
          showCurrentValue: { type: 'boolean', title: '显示当前值' },
          currentValueLabel: { type: 'string', title: '当前值标签' }
        }
      },
      buttons: {
        type: 'object',
        title: '按钮设置',
        properties: {
          options: {
            type: 'array',
            title: '按钮选项',
            items: {
              type: 'object',
              properties: {
                label: { type: 'string', title: '显示文本' },
                value: { type: ['string', 'number'], title: '按钮值' },
                icon: { type: 'string', title: '图标' },
                color: { type: 'string', title: '颜色' },
                disabled: { type: 'boolean', title: '禁用' }
              }
            }
          },
          size: { type: 'string', enum: ['small', 'medium', 'large'], title: '按钮大小' },
          shape: { type: 'string', enum: ['default', 'round', 'circle'], title: '按钮形状' },
          direction: { type: 'string', enum: ['horizontal', 'vertical'], title: '布局方向' },
          gap: { type: 'number', title: '按钮间距' },
          itemsPerRow: { type: 'number', title: '每行按钮数量' },
          disabled: { type: 'boolean', title: '禁用所有按钮' }
        }
      }
    }
  },

  // 支持的数据源类型
  supportedDataSources: ['device', 'api'] as Array<'device' | 'api' | 'static'>,

  // 布局信息
  layout: {
    grid: {
      minW: 2,
      minH: 1,
      maxW: 12,
      maxH: 8,
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
    'naive-ui': '^2.0.0'
  },

  // 样式文件
  styles: ['./component.scss']
}

/** 导出组件定义 */
export default enumControlDefinition
/** 导出类型 */
export type { ButtonOption }
