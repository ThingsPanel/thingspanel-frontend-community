/**
 * 简单展示组件定义
 * 无数据源的静态展示组件示例
 */

import type { ComponentDefinition } from '@/card2.1/core/types'
import SimpleDisplay from './SimpleDisplay.vue'
import SimpleDisplayConfig from './SimpleDisplayConfig.vue'

const simpleDisplayDefinition: ComponentDefinition = {
  // 基础信息
  type: 'simple-display',
  name: '简单展示',
  description: '无数据源的静态展示组件，用于展示固定内容和配置',
  category: '基础组件',
  version: '1.0.0',
  author: 'ThingsPanel',

  // 组件实现
  component: SimpleDisplay,

  // 配置组件
  configComponent: SimpleDisplayConfig,

  // 默认配置
  defaultConfig: {
    title: '简单展示组件',
    content: '这是一个静态展示组件，不需要数据源',
    themeColor: '#2080f0',
    fontSize: 16,
    showIcon: true,
    iconName: '📊'
  },

  // 默认布局
  defaultLayout: {
    canvas: {
      width: 400,
      height: 300,
      x: 0,
      y: 0
    },
    gridstack: {
      w: 3,
      h: 3,
      x: 0,
      y: 0,
      minW: 2,
      minH: 2,
      maxW: 6,
      maxH: 4
    }
  },

  // 🔥 无数据源 - 此组件不需要数据源
  supportedDataSources: [],

  // 🔥 静态参数配置 - 组件基本属性
  staticParams: {
    componentId: {
      type: 'string',
      title: '组件ID',
      description: '组件的唯一标识符',
      defaultValue: '',
      required: false
    },
    title: {
      type: 'string',
      title: '组件标题',
      description: '显示在组件顶部的标题',
      defaultValue: '简单展示组件',
      required: false
    },
    content: {
      type: 'string',
      title: '展示内容',
      description: '组件展示的文本内容',
      defaultValue: '这是一个静态展示组件，不需要数据源',
      required: false
    }
  },

  // 数据需求声明 - 无数据源
  dataRequirements: {
    componentType: 'simple-display',
    displayName: '简单展示组件',
    description: '无需数据源的静态展示组件',

    // 无主要数据字段
    primaryData: null,

    // 无数据字段
    dataFields: []
  },

  // 标签
  tags: ['static', 'display', 'no-datasource', 'basic'],

  // 示例数据 - 空对象（无数据源）
  sampleData: {},

  // 特性标记
  features: {
    realtime: false, // 不支持实时数据
    dataBinding: false, // 不支持数据绑定
    themeable: true, // 支持主题
    responsive: true, // 支持响应式
    dualDataSource: false, // 不是双数据源
    configurable: true, // 支持配置
    interactive: true, // 支持交互
    static: true // 静态组件
  },

  // 交互系统配置
  interaction: {
    // 交互能力声明
    capability: {
      // 支持的交互事件
      supportedEvents: ['click', 'hover', 'dataChange'],

      // 支持的响应动作
      supportedActions: ['navigateToUrl', 'updateComponentData'],

      // 默认权限配置
      defaultPermissions: {
        allowExternalControl: true,
        requirePermissionCheck: false
      },

      // 可监听的属性列表
      listenableProperties: ['config', 'componentState', 'interactionState']
    },

    // 交互配置示例模板
    examples: [
      {
        name: '点击跳转网页',
        description: '点击组件时在新窗口打开指定网页',
        scenario: 'click-navigate',
        template: {
          event: 'click',
          responses: [
            {
              action: 'navigateToUrl',
              actionConfig: {
                url: 'https://www.example.com',
                target: '_blank',
                windowFeatures: 'width=800,height=600'
              },
              delay: 0,
              condition: null
            }
          ],
          enabled: true,
          priority: 1,
          name: '点击跳转网页',
          description: '点击时打开外部链接'
        }
      },
      {
        name: '点击跳转内部页面',
        description: '点击组件时跳转到应用内部页面',
        scenario: 'click-internal',
        template: {
          event: 'click',
          responses: [
            {
              action: 'navigateToUrl',
              actionConfig: {
                url: '/dashboard/overview',
                target: '_self'
              },
              delay: 0,
              condition: null
            }
          ],
          enabled: false,
          priority: 2,
          name: '点击跳转内部页面',
          description: '点击时跳转到内部路由'
        }
      },
      {
        name: '悬停改变属性',
        description: '鼠标悬停时改变其他组件的属性',
        scenario: 'hover-modify',
        template: {
          event: 'hover',
          responses: [
            {
              action: 'updateComponentData',
              actionConfig: {
                targetComponentId: '',
                targetProperty: 'config.title',
                updateValue: '悬停时的新标题',
                updateMode: 'replace'
              },
              delay: 100,
              condition: null
            }
          ],
          enabled: false,
          priority: 3,
          name: '悬停改变属性',
          description: '鼠标悬停时修改目标组件属性'
        }
      }
    ],

    // 属性暴露配置 - 定义哪些属性可以被其他组件修改
    propertyExposure: {
      componentType: 'simple-display',
      componentName: '简单展示组件',
      description: '静态展示组件，支持标题、内容、样式等属性的动态修改',

      // 可监听/修改的属性列表
      listenableProperties: [
        {
          name: 'config.title',
          label: '标题',
          type: 'string',
          description: '组件顶部显示的标题文本',
          group: '内容',
          defaultValue: '简单展示组件',
          validation: {
            required: false,
            maxLength: 50
          }
        },
        {
          name: 'config.content',
          label: '展示内容',
          type: 'string',
          description: '组件主体显示的文本内容',
          group: '内容',
          defaultValue: '这是一个静态展示组件，不需要数据源',
          validation: {
            required: false,
            maxLength: 200
          }
        },
        {
          name: 'config.themeColor',
          label: '主题颜色',
          type: 'color',
          description: '组件的主题色，影响边框和图标颜色',
          group: '样式',
          defaultValue: '#2080f0',
          validation: {
            required: false,
            pattern: '^#[0-9A-Fa-f]{6}$'
          }
        },
        {
          name: 'config.fontSize',
          label: '字体大小',
          type: 'number',
          description: '组件文字的字体大小（像素）',
          group: '样式',
          defaultValue: 16,
          validation: {
            required: false,
            min: 12,
            max: 24
          }
        },
        {
          name: 'config.showIcon',
          label: '显示图标',
          type: 'boolean',
          description: '是否显示组件图标',
          group: '显示',
          defaultValue: true
        },
        {
          name: 'config.iconName',
          label: '图标名称',
          type: 'string',
          description: '显示的图标符号',
          group: '显示',
          defaultValue: '📊',
          validation: {
            required: false,
            maxLength: 10
          }
        }
      ],

      // 组件状态属性
      stateProperties: [
        {
          name: 'componentState.isActive',
          label: '激活状态',
          type: 'boolean',
          description: '组件是否处于激活状态',
          readonly: false,
          defaultValue: true
        },
        {
          name: 'componentState.clickCount',
          label: '点击次数',
          type: 'number',
          description: '组件被点击的总次数',
          readonly: true,
          defaultValue: 0
        }
      ],

      // 交互状态属性
      interactionProperties: [
        {
          name: 'interactionState.lastInteractionTime',
          label: '最后交互时间',
          type: 'string',
          description: '最后一次交互发生的时间戳',
          readonly: true
        },
        {
          name: 'interactionState.interactionCount',
          label: '交互次数',
          type: 'number',
          description: '总交互次数统计',
          readonly: true,
          defaultValue: 0
        }
      ]
    }
  }
}

export default simpleDisplayDefinition
