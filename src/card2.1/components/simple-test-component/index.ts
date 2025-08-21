import type { ComponentDefinition } from '../../core/types'
import type {
  ComponentInteractionDefinition,
  InteractionEventType,
  InteractionActionType,
  JumpConfig,
  ModifyConfig
} from '../../core/interaction-types'
import SimpleTestComponent from './SimpleTestComponent.vue'
import SimpleTestConfig from './config/SimpleTestConfig.vue'

const simpleTestComponentDefinition: ComponentDefinition = {
  type: 'simple-test-component',
  name: '简单测试组件',
  description: '用于测试组件配置、交互和属性暴露的基础组件',
  category: 'test',
  mainCategory: '测试',
  subCategory: '基础',
  author: 'ThingsPanel Team',
  permission: '不限',
  icon: 'cube-outline',
  version: '2.1.0',
  tags: ['测试', '示例', '基础', 'Card2.1'],

  // 组件状态
  isRegistered: true,

  // 数据源支持
  supportedDataSources: ['static', 'api', 'websocket'],

  // 组件引用
  component: SimpleTestComponent,
  configComponent: SimpleTestConfig,

  // 默认布局配置（用于编辑器）
  defaultLayout: {
    canvas: {
      width: 300,
      height: 200,
      x: 0,
      y: 0
    },
    gridstack: {
      w: 3, // 栅格宽度
      h: 2, // 栅格高度
      minW: 2,
      minH: 2,
      maxW: 8,
      maxH: 6
    }
  },

  // ============ 编辑器集成配置 ============

  // 组件尺寸规范
  defaultSize: {
    width: 300,
    height: 200
  },
  minSize: {
    width: 200,
    height: 150
  },

  // 示例配置（编辑器预览用）
  examples: [
    {
      name: '基础示例',
      description: '显示标题和按钮的基本配置',
      config: {
        title: '测试组件示例',
        content: '这是一个基础的测试组件',
        showButton: true,
        buttonText: '点击测试',
        buttonType: 'primary'
      }
    },
    {
      name: '样式定制',
      description: '自定义颜色和样式的配置',
      config: {
        title: '定制样式组件',
        content: '展示自定义样式效果',
        backgroundColor: 'var(--success-color)',
        textColor: 'var(--card-color)',
        borderRadius: 12,
        padding: 20
      }
    }
  ],

  // 属性定义（供编辑器使用）
  properties: {
    title: {
      type: 'string',
      default: '简单测试组件',
      description: '组件标题文字',
      label: '标题',
      placeholder: '请输入组件标题'
    },
    content: {
      type: 'string',
      default: '这是一个用于测试的基础组件',
      description: '组件内容文字',
      label: '内容',
      placeholder: '请输入组件内容'
    },
    showButton: {
      type: 'boolean',
      default: true,
      description: '是否显示测试按钮',
      label: '显示按钮'
    },
    buttonType: {
      type: 'string',
      default: 'primary',
      description: '按钮样式类型',
      label: '按钮类型',
      options: [
        { label: '主要', value: 'primary' },
        { label: '成功', value: 'success' },
        { label: '警告', value: 'warning' },
        { label: '危险', value: 'danger' }
      ]
    }
  },

  // 组件默认属性配置
  config: {
    // === 内容配置 ===
    title: '简单测试组件',
    content: '这是一个用于测试的基础组件',
    showTitle: true,
    showContent: true,

    // === 按钮配置 ===
    showButton: true,
    buttonText: '测试按钮',
    buttonType: 'primary', // primary | info | success | warning | error
    buttonSize: 'medium', // small | medium | large
    buttonDisabled: false,

    // === 样式配置 ===
    backgroundColor: 'var(--card-color)',
    borderColor: 'var(--border-color)',
    borderWidth: 1,
    borderRadius: 8,
    textColor: 'var(--text-color)',
    titleColor: 'var(--text-color)',
    fontSize: 14,
    padding: 16,

    // === 布局配置 ===
    textAlign: 'left', // left | center | right
    spacing: 12,

    // === 交互配置 ===
    clickable: true,
    hoverEffect: true,

    // === 状态配置 ===
    status: 'normal', // normal | loading | error | success
    statusMessage: '',
    showStatus: false
  },

  // ============ 交互系统配置 ============
  interaction: {
    // 交互能力声明
    capability: {
      supportedEvents: ['click', 'hover', 'dataChange'] as InteractionEventType[],
      supportedActions: ['jump', 'modify'] as InteractionActionType[],
      defaultPermissions: {
        allowExternalControl: true,
        requirePermissionCheck: false
      },
      listenableProperties: [
        'title',
        'content',
        'status',
        'backgroundColor',
        'textColor',
        'showButton',
        'buttonText',
        'buttonType',
        'visibility'
      ]
    },

    // 交互示例配置
    examples: [
      {
        name: '点击跳转外部链接',
        description: '点击组件时跳转到外部网站',
        scenario: 'click-jump' as const,
        config: {
          event: 'click' as InteractionEventType,
          responses: [
            {
              action: 'jump' as InteractionActionType,
              jumpConfig: {
                jumpType: 'external',
                url: 'https://www.example.com',
                target: '_blank'
              } as JumpConfig
            }
          ],
          enabled: true,
          name: '跳转示例'
        }
      },
      {
        name: '点击跳转内部菜单',
        description: '点击组件时跳转到系统内部页面',
        scenario: 'click-jump' as const,
        config: {
          event: 'click' as InteractionEventType,
          responses: [
            {
              action: 'jump' as InteractionActionType,
              jumpConfig: {
                jumpType: 'internal',
                internalPath: '/device/manage',
                target: '_self'
              } as JumpConfig
            }
          ],
          enabled: true,
          name: '内部跳转示例'
        }
      },
      {
        name: '悬停修改目标组件',
        description: '悬停时修改其他组件的背景色',
        scenario: 'hover-modify' as const,
        config: {
          event: 'hover' as InteractionEventType,
          responses: [
            {
              action: 'modify' as InteractionActionType,
              modifyConfig: {
                targetComponentId: 'target-component-id',
                targetProperty: 'backgroundColor',
                updateValue: '#ff6b6b',
                updateMode: 'replace'
              } as ModifyConfig
            }
          ],
          enabled: true,
          name: '悬停修改示例'
        }
      },
      {
        name: '标题变化触发动作',
        description: '当标题内容变化时触发其他组件的属性修改',
        scenario: 'data-change-action' as const,
        config: {
          event: 'dataChange' as InteractionEventType,
          watchedProperty: 'title',
          condition: {
            operator: 'contains',
            value: '警告'
          },
          responses: [
            {
              action: 'modify' as InteractionActionType,
              modifyConfig: {
                targetComponentId: 'alert-component-id',
                targetProperty: 'visibility',
                updateValue: 'visible',
                updateMode: 'replace'
              } as ModifyConfig
            }
          ],
          enabled: true,
          name: '数据变化示例'
        }
      }
    ],

    // 属性暴露配置
    propertyExposure: {
      componentType: 'simple-test-component',
      componentName: '简单测试组件',
      listenableProperties: [
        {
          name: 'title',
          label: '标题',
          type: 'string',
          description: '组件显示的标题文字',
          group: '内容'
        },
        {
          name: 'content',
          label: '内容',
          type: 'string',
          description: '组件显示的主要内容',
          group: '内容'
        },
        {
          name: 'status',
          label: '状态',
          type: 'string',
          description: '组件当前状态：normal、loading、error、success',
          group: '状态'
        },
        {
          name: 'backgroundColor',
          label: '背景颜色',
          type: 'string',
          description: '组件的背景颜色',
          group: '样式'
        },
        {
          name: 'textColor',
          label: '文字颜色',
          type: 'string',
          description: '组件的文字颜色',
          group: '样式'
        },
        {
          name: 'showButton',
          label: '显示按钮',
          type: 'boolean',
          description: '是否显示操作按钮',
          group: '按钮'
        },
        {
          name: 'buttonText',
          label: '按钮文字',
          type: 'string',
          description: '按钮显示的文字',
          group: '按钮'
        },
        {
          name: 'buttonType',
          label: '按钮类型',
          type: 'string',
          description: '按钮的样式类型：primary、success、warning、danger',
          group: '按钮'
        },
        {
          name: 'visibility',
          label: '可见性',
          type: 'string',
          description: '组件的显示状态：visible、hidden',
          group: '样式'
        }
      ]
    }
  } as ComponentInteractionDefinition
}

export default simpleTestComponentDefinition
