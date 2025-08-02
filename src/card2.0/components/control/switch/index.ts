/**
 * Card 2.0 开关控制组件定义
 * 基于原有 chart-switch 组件迁移而来，采用新的架构设计
 */

import { defineAsyncComponent } from 'vue'
import type { IComponentDefinition, RendererType, DataSourceType } from '../../../core/types/component'
import { $t } from '@/locales'

/**
 * 开关控制配置接口
 */
export interface SwitchConfig {
  /** 基础设置 */
  basic?: {
    /** 组件标题 */
    title?: string
    /** 开关标签 */
    label?: string
    /** 是否显示标签 */
    showLabel?: boolean
  }

  /** 开关设置 */
  switch?: {
    /** 开关大小 */
    size?: 'small' | 'medium' | 'large'
    /** 是否禁用 */
    disabled?: boolean
    /** 加载状态 */
    loading?: boolean
    /** 开关形状 */
    round?: boolean
  }

  /** 数值映射 */
  mapping?: {
    /** 开启时的值 */
    activeValue?: string | number | boolean
    /** 关闭时的值 */
    inactiveValue?: string | number | boolean
    /** 数据类型 */
    dataType?: 'string' | 'number' | 'boolean'
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
      /** 对齐方式 */
      textAlign?: 'left' | 'center' | 'right'
      /** 垂直对齐 */
      verticalAlign?: 'top' | 'middle' | 'bottom'
    }
    /** 开关样式 */
    switch?: {
      /** 开启时的颜色 */
      activeColor?: string
      /** 关闭时的颜色 */
      inactiveColor?: string
      /** 开关轨道颜色 */
      railColor?: string
    }
    /** 标签样式 */
    label?: {
      /** 字体大小 */
      fontSize?: number
      /** 字体颜色 */
      color?: string
      /** 字体权重 */
      fontWeight?: 'normal' | 'bold' | number
      /** 标签位置 */
      position?: 'top' | 'bottom' | 'left' | 'right'
      /** 标签间距 */
      spacing?: number
    }
  }

  /** 交互设置 */
  interaction?: {
    /** 确认操作 */
    confirm?: {
      /** 是否启用确认 */
      enabled?: boolean
      /** 确认标题 */
      title?: string
      /** 确认内容 */
      content?: string
    }
    /** 防抖设置 */
    debounce?: {
      /** 是否启用防抖 */
      enabled?: boolean
      /** 防抖延迟(ms) */
      delay?: number
    }
  }

  /** 状态指示 */
  indicator?: {
    /** 是否显示状态指示 */
    show?: boolean
    /** 开启状态文本 */
    activeText?: string
    /** 关闭状态文本 */
    inactiveText?: string
    /** 指示器位置 */
    position?: 'inside' | 'outside'
  }

  /** 动画设置 */
  animation?: {
    /** 是否启用动画 */
    enabled?: boolean
    /** 动画时长 */
    duration?: number
    /** 缓动函数 */
    easing?: string
  }
}

/**
 * Card 2.0 开关控制组件定义
 * 从 src/card/chart-card/switch 迁移而来
 */
export const switchDefinition: IComponentDefinition<SwitchConfig> = {
  // 组件元数据
  meta: {
    id: 'control-switch-v2',
    name: 'generate.switch',
    version: '2.0.0',
    description: '开关控制组件，用于控制设备的开关状态',
    category: 'control',
    tags: ['switch', 'control', 'toggle', 'device'],
    author: 'ThingsPanel',
    icon: 'mdi:toggle-switch',
    thumbnail: '/assets/thumbnails/switch.png'
  },

  // 渲染器支持
  renderers: ['vue'] as RendererType[],

  // 组件尺寸
  size: {
    width: 2,
    height: 2,
    minWidth: 1,
    minHeight: 1,
    maxWidth: 6,
    maxHeight: 4
  },

  // 兼容性配置
  compatibility: {
    // 旧版组件ID映射
    legacyIds: ['chart-switch'],

    // 配置迁移函数
    migrateConfig: (oldConfig: any): SwitchConfig => {
      const newConfig: SwitchConfig = {
        basic: {
          title: oldConfig.title || $t('generate.switch'),
          showLabel: true
        },
        switch: {
          size: 'medium',
          disabled: false,
          loading: false,
          round: true
        },
        mapping: {
          activeValue: oldConfig.active0 || 1,
          inactiveValue: oldConfig.active1 || 0,
          dataType: 'number'
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
            textAlign: 'center',
            verticalAlign: 'middle'
          },
          switch: {
            activeColor: '#18a058',
            inactiveColor: '#d03050',
            railColor: '#e0e0e6'
          },
          label: {
            fontSize: 14,
            color: '#333333',
            fontWeight: 'normal',
            position: 'bottom',
            spacing: 20
          }
        },
        interaction: {
          confirm: {
            enabled: false,
            title: '确认操作',
            content: '确定要切换开关状态吗？'
          },
          debounce: {
            enabled: true,
            delay: 300
          }
        },
        indicator: {
          show: false,
          activeText: '开启',
          inactiveText: '关闭',
          position: 'inside'
        },
        animation: {
          enabled: true,
          duration: 300,
          easing: 'ease-in-out'
        }
      }

      // 迁移旧版配置
      if (oldConfig.active0 !== undefined) {
        newConfig.mapping!.activeValue = oldConfig.active0
      }
      if (oldConfig.active1 !== undefined) {
        newConfig.mapping!.inactiveValue = oldConfig.active1
      }

      return newConfig
    },

    // 数据迁移函数
    migrateData: (oldData: any) => {
      // 开关组件主要处理设备属性或遥测数据
      return oldData
    }
  },

  // 数据处理
  dataProcessor: {
    // 处理设备数据
    processDeviceData: (data: any[], config: SwitchConfig) => {
      if (!data || data.length === 0) {
        return {
          value: config.mapping?.inactiveValue || 0,
          state: false,
          error: null
        }
      }

      const deviceData = data[0]
      let rawValue = deviceData?.value

      if (rawValue === undefined || rawValue === null) {
        return {
          value: config.mapping?.inactiveValue || 0,
          state: false,
          error: '数据为空'
        }
      }

      // 根据数据类型转换值
      const dataType = config.mapping?.dataType || 'number'
      if (dataType === 'string') {
        rawValue = String(rawValue)
      } else if (dataType === 'number') {
        rawValue = Number(rawValue)
      } else if (dataType === 'boolean') {
        rawValue = Boolean(rawValue)
      }

      // 计算开关状态
      const activeValue = config.mapping?.activeValue
      const inactiveValue = config.mapping?.inactiveValue

      let state = false
      if (activeValue !== undefined) {
        state = rawValue === activeValue
      } else {
        state = rawValue !== (inactiveValue || 0)
      }

      return {
        value: rawValue,
        state,
        error: null
      }
    },

    // 处理API数据
    processApiData: (data: any, config: SwitchConfig) => {
      if (!data) {
        return {
          value: config.mapping?.inactiveValue || 0,
          state: false,
          error: '数据为空'
        }
      }

      let rawValue = data
      if (typeof data === 'object' && data.value !== undefined) {
        rawValue = data.value
      }

      // 根据数据类型转换值
      const dataType = config.mapping?.dataType || 'number'
      if (dataType === 'string') {
        rawValue = String(rawValue)
      } else if (dataType === 'number') {
        rawValue = Number(rawValue)
      } else if (dataType === 'boolean') {
        rawValue = Boolean(rawValue)
      }

      // 计算开关状态
      const activeValue = config.mapping?.activeValue
      const inactiveValue = config.mapping?.inactiveValue

      let state = false
      if (activeValue !== undefined) {
        state = rawValue === activeValue
      } else {
        state = rawValue !== (inactiveValue || 0)
      }

      return {
        value: rawValue,
        state,
        error: null
      }
    }
  },

  // 生命周期钩子
  lifecycle: {
    onMount: (instance: any) => {
      console.log('Switch component mounted:', instance.config.meta?.id)
    },
    onUnmount: (instance: any) => {
      console.log('Switch component unmounted:', instance.config.meta?.id)
    },
    onDataChange: (instance: any, newData: any) => {
      console.log('Switch data changed:', newData)
    }
  },

  // Vue组件路径
  component: {
    vue: defineAsyncComponent(() => import('./component.vue'))
  },

  // 配置组件路径
  configComponent: {
    vue: defineAsyncComponent(() => import('./config.vue'))
  },

  // 默认配置
  defaultConfig: {
    basic: {
      title: $t('generate.switch'),
      showLabel: true
    },
    switch: {
      size: 'medium',
      disabled: false,
      loading: false,
      round: true
    },
    mapping: {
      activeValue: 1,
      inactiveValue: 0,
      dataType: 'number'
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
        textAlign: 'center',
        verticalAlign: 'middle'
      },
      switch: {
        activeColor: '#18a058',
        inactiveColor: '#d03050',
        railColor: '#e0e0e6'
      },
      label: {
        fontSize: 14,
        color: '#333333',
        fontWeight: 'normal',
        position: 'bottom',
        spacing: 20
      }
    },
    interaction: {
      confirm: {
        enabled: false,
        title: '确认操作',
        content: '确定要切换开关状态吗？'
      },
      debounce: {
        enabled: true,
        delay: 300
      }
    },
    indicator: {
      show: false,
      activeText: '开启',
      inactiveText: '关闭',
      position: 'inside'
    },
    animation: {
      enabled: true,
      duration: 300,
      easing: 'ease-in-out'
    }
  } as SwitchConfig,

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
            default: $t('generate.switch')
          },
          label: {
            type: 'string',
            title: '开关标签'
          },
          showLabel: {
            type: 'boolean',
            title: '显示标签',
            default: true
          }
        }
      },
      switch: {
        type: 'object',
        title: '开关设置',
        properties: {
          size: {
            type: 'string',
            title: '开关大小',
            enum: ['small', 'medium', 'large'],
            default: 'medium'
          },
          disabled: {
            type: 'boolean',
            title: '禁用状态',
            default: false
          },
          round: {
            type: 'boolean',
            title: '圆形开关',
            default: true
          }
        }
      },
      mapping: {
        type: 'object',
        title: '数值映射',
        properties: {
          activeValue: {
            title: '开启时的值',
            default: 1
          },
          inactiveValue: {
            title: '关闭时的值',
            default: 0
          },
          dataType: {
            type: 'string',
            title: '数据类型',
            enum: ['string', 'number', 'boolean'],
            default: 'number'
          }
        }
      }
    }
  },

  // 支持的数据源类型
  supportedDataSources: ['device', 'api'] as DataSourceType[],

  // 布局信息
  layout: {
    category: 'control',
    priority: 1,
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

// 导出组件定义
export default switchDefinition
