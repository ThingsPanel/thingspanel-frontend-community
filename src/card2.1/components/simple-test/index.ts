import Card from './SimpleTestCard.vue'
import ConfigPanel from './SimpleTestConfigPanel.vue'
import type { ComponentDefinition } from '../../core/types'

/**
 * 简单测试组件定义
 * 用于演示新配置系统的完整功能
 */
const simpleTestDefinition: ComponentDefinition = {
  type: 'simple-test',
  name: '简单测试组件',
  description: '用于测试新配置系统的演示组件，支持多种配置选项和实时预览。',
  category: '测试',
  subCategory: '配置演示',
  mainCategory: '开发工具',

  // 组件图标 - 测试图标
  icon: '<svg viewBox="0 0 1024 1024"><path d="M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64zm0 820c-205.4 0-372-166.6-372-372s166.6-372 372-372 372 166.6 372 372-166.6 372-372 372z" fill="#52c41a"/><path d="m701.2 467.5-56.1-44.1-182.2 231.8-72.1-44.1L250 650.7l82.1 50.2 56.1-44.1 72.1 44.1 182.2-231.8z" fill="#52c41a"/></svg>',

  // Vue 组件
  component: Card,

  // 配置面板组件
  configComponent: ConfigPanel,

  // 组件属性定义
  properties: {
    // 基础显示属性
    showTitle: {
      type: 'boolean',
      label: '显示标题',
      default: true,
      description: '是否显示组件标题'
    },
    title: {
      type: 'string',
      label: '标题文本',
      default: '简单测试组件',
      placeholder: '输入标题',
      description: '组件显示的标题文本'
    },
    description: {
      type: 'string',
      label: '描述文本',
      default: '这是一个用于测试新配置系统的组件，支持多种可配置属性。',
      placeholder: '输入描述',
      description: '组件的描述文本'
    },
    showDetails: {
      type: 'boolean',
      label: '显示详细信息',
      default: true,
      description: '是否显示组件的详细信息'
    },
    customMessage: {
      type: 'string',
      label: '自定义消息',
      default: '',
      placeholder: '输入自定义消息',
      description: '自定义显示消息'
    },

    // 功能配置
    showCounter: {
      type: 'boolean',
      label: '显示计数器',
      default: false,
      description: '是否显示交互式计数器'
    },
    showActions: {
      type: 'boolean',
      label: '显示操作按钮',
      default: true,
      description: '是否显示操作按钮区域'
    },
    showColorDemo: {
      type: 'boolean',
      label: '显示颜色演示',
      default: false,
      description: '是否显示颜色演示区域'
    },
    demoColor: {
      type: 'color',
      label: '演示颜色',
      default: '#e6f7ff',
      description: '颜色演示区域的背景色'
    },

    // 样式配置
    backgroundColor: {
      type: 'color',
      label: '背景颜色',
      default: '#ffffff',
      description: '组件背景颜色'
    },
    titleColor: {
      type: 'color',
      label: '标题颜色',
      default: '#1890ff',
      description: '标题文本颜色'
    },
    textColor: {
      type: 'color',
      label: '文本颜色',
      default: '#333333',
      description: '正文文本颜色'
    },
    borderStyle: {
      type: 'select',
      label: '边框样式',
      default: '1px solid #d9d9d9',
      options: [
        { label: '实线', value: '1px solid #d9d9d9' },
        { label: '虚线', value: '1px dashed #d9d9d9' },
        { label: '点线', value: '1px dotted #d9d9d9' },
        { label: '粗实线', value: '2px solid #d9d9d9' },
        { label: '无边框', value: 'none' }
      ],
      description: '组件边框样式'
    },
    borderRadius: {
      type: 'number',
      label: '圆角大小',
      default: 8,
      min: 0,
      max: 20,
      step: 1,
      description: '组件边框圆角大小（像素）'
    },
    padding: {
      type: 'number',
      label: '内边距',
      default: 16,
      min: 8,
      max: 32,
      step: 2,
      description: '组件内边距大小（像素）'
    }
  },

  // 默认配置
  config: {
    style: {
      width: 400,
      height: 300
    },
    // 默认属性值（与 properties 中的 default 保持一致）
    properties: {
      showTitle: true,
      title: '简单测试组件',
      description: '这是一个用于测试新配置系统的组件，支持多种可配置属性。',
      showDetails: true,
      customMessage: '',
      showCounter: false,
      showActions: true,
      showColorDemo: false,
      demoColor: '#e6f7ff',
      backgroundColor: '#ffffff',
      titleColor: '#1890ff',
      textColor: '#333333',
      borderStyle: '1px solid #d9d9d9',
      borderRadius: 8,
      padding: 16
    }
  },

  // 支持的数据源类型
  supportedDataSources: ['static', 'script'],

  // 组件标签
  tags: ['测试', '配置', '演示', '开发'],

  // 组件版本
  version: '2.0.0',

  // 作者信息
  author: 'Claude Code',

  // 使用示例
  examples: [
    {
      name: '默认样式',
      description: '使用默认配置的简单测试组件',
      config: {
        showTitle: true,
        title: '默认测试组件',
        showCounter: false,
        showColorDemo: false
      }
    },
    {
      name: '完整功能',
      description: '启用所有功能的测试组件',
      config: {
        showTitle: true,
        title: '完整功能演示',
        showCounter: true,
        showColorDemo: true,
        showActions: true,
        demoColor: '#87ceeb',
        backgroundColor: '#f0f9ff'
      }
    },
    {
      name: '极简风格',
      description: '极简风格的测试组件',
      config: {
        showTitle: true,
        title: '极简组件',
        showDetails: false,
        showCounter: false,
        showActions: false,
        backgroundColor: '#fafafa',
        borderStyle: 'none',
        borderRadius: 0
      }
    }
  ],

  // 组件文档
  documentation: {
    overview: '这是一个专门用于演示新配置系统功能的测试组件。它包含了多种类型的配置选项，展示了配置系统的完整能力。',
    features: [
      '支持基础显示配置（标题、描述、详细信息）',
      '支持功能开关（计数器、操作按钮、颜色演示）',
      '支持样式自定义（颜色、边框、圆角、内边距）',
      '提供配置预设和导入导出功能',
      '实时配置预览',
      '响应式设计'
    ],
    usage: {
      basic: '直接使用默认配置即可显示一个基础的测试组件',
      advanced: '通过配置面板可以自定义组件的所有外观和行为'
    }
  }
}

export default simpleTestDefinition
