/**
 * 参数值模板管理 v2.0
 * 支持复杂组件模板：手动输入、下拉选择、属性绑定、组件模板
 */

import type { Component, AsyncComponentLoader } from 'vue'

// 模板类型枚举
export enum ParameterTemplateType {
  MANUAL = 'manual', // 手动输入
  DROPDOWN = 'dropdown', // 下拉选择
  PROPERTY = 'property', // 属性绑定（动态）
  COMPONENT = 'component' // 复杂组件模板
}

// 模板选项接口
export interface TemplateOption {
  label: string
  value: string | number | boolean
  description?: string
}

// 组件模板配置接口
export interface ComponentTemplateConfig {
  /** 组件名称字符串或组件导入函数或组件实例 */
  component: string | Component | AsyncComponentLoader<Component>
  /** 传递给组件的props */
  props?: Record<string, any>
  /** 组件事件监听器映射 */
  events?: Record<string, string>
  /** 组件插槽配置 */
  slots?: Record<string, any>
  /** 组件渲染配置 */
  renderConfig?: {
    /** 是否包装在容器中 */
    wrapped?: boolean
    /** 容器样式类 */
    containerClass?: string
    /** 最小高度 */
    minHeight?: string
  }
}

// 模板配置接口
export interface ParameterTemplate {
  id: string
  name: string
  type: ParameterTemplateType
  description: string
  // 下拉选择模板的选项
  options?: TemplateOption[]
  // 默认值
  defaultValue?: any
  // 是否支持自定义输入（针对下拉选择模板）
  allowCustom?: boolean
  // 🔥 新增：组件模板配置
  componentConfig?: ComponentTemplateConfig
}

/**
 * 内置模板列表
 */
export const PARAMETER_TEMPLATES: ParameterTemplate[] = [
  {
    id: 'manual',
    name: '手动输入',
    type: ParameterTemplateType.MANUAL,
    description: '直接输入固定值',
    defaultValue: ''
  },
  {
    id: 'http-methods',
    name: 'HTTP方法',
    type: ParameterTemplateType.DROPDOWN,
    description: 'HTTP请求方法选择',
    options: [
      { label: 'GET', value: 'GET', description: '获取数据' },
      { label: 'POST', value: 'POST', description: '提交数据' },
      { label: 'PUT', value: 'PUT', description: '更新数据' },
      { label: 'DELETE', value: 'DELETE', description: '删除数据' },
      { label: 'PATCH', value: 'PATCH', description: '部分更新' }
    ],
    defaultValue: 'GET'
  },
  {
    id: 'content-types',
    name: '内容类型',
    type: ParameterTemplateType.DROPDOWN,
    description: '常用的Content-Type值',
    options: [
      { label: 'application/json', value: 'application/json' },
      { label: 'application/x-www-form-urlencoded', value: 'application/x-www-form-urlencoded' },
      { label: 'multipart/form-data', value: 'multipart/form-data' },
      { label: 'text/plain', value: 'text/plain' },
      { label: 'text/html', value: 'text/html' }
    ],
    defaultValue: 'application/json',
    allowCustom: true
  },
  {
    id: 'auth-types',
    name: '认证类型',
    type: ParameterTemplateType.DROPDOWN,
    description: '常用的Authorization类型',
    options: [
      { label: 'Bearer Token', value: 'Bearer ' },
      { label: 'Basic Auth', value: 'Basic ' },
      { label: 'API Key', value: 'ApiKey ' },
      { label: 'Custom', value: '' }
    ],
    defaultValue: 'Bearer ',
    allowCustom: true
  },
  {
    id: 'boolean-values',
    name: '布尔值',
    type: ParameterTemplateType.DROPDOWN,
    description: '真假值选择',
    options: [
      { label: '是 (true)', value: 'true' },
      { label: '否 (false)', value: 'false' },
      { label: '1', value: '1' },
      { label: '0', value: '0' }
    ],
    defaultValue: 'true'
  },
  {
    id: 'property-binding',
    name: '属性绑定',
    type: ParameterTemplateType.PROPERTY,
    description: '绑定到动态属性（运行时获取值）',
    defaultValue: ''
  },
  // 🔥 新增：组件属性绑定模板
  {
    id: 'component-property-binding',
    name: '组件属性绑定',
    type: ParameterTemplateType.COMPONENT,
    description: '绑定到编辑器中已加载组件的属性',
    defaultValue: '',
    componentConfig: {
      component: 'ComponentPropertySelector',
      props: {
        placeholder: '选择要绑定的组件属性'
      },
      events: {
        'update:selectedValue': 'handleComponentPropertyChange'
      },
      renderConfig: {
        wrapped: true,
        containerClass: 'component-property-container',
        minHeight: '400px'
      }
    }
  },
  // 🔥 新增：组件模板
  {
    id: 'device-metrics-selector',
    name: '设备指标选择器',
    type: ParameterTemplateType.COMPONENT,
    description: '选择设备和对应的指标数据',
    defaultValue: '',
    componentConfig: {
      component: 'DeviceMetricsSelector',
      props: {
        mode: 'single',
        showMetrics: true
      },
      events: {
        'update:selectedValue': 'handleDeviceMetricsChange'
      },
      renderConfig: {
        wrapped: true,
        containerClass: 'device-metrics-container',
        minHeight: '200px'
      }
    }
  },
  {
    id: 'device-dispatch-selector',
    name: '设备分发选择器',
    type: ParameterTemplateType.COMPONENT,
    description: '设备分发选择器组件',
    defaultValue: '',
    componentConfig: {
      component: 'DeviceDispatchSelector',
      props: {
        multiple: false,
        showDetails: true
      },
      events: {
        'update:selectedValue': 'handleDeviceSelectionChange'
      },
      renderConfig: {
        wrapped: true,
        containerClass: 'device-dispatch-container',
        minHeight: '150px'
      }
    }
  },
  {
    id: 'icon-selector',
    name: '图标选择器',
    type: ParameterTemplateType.COMPONENT,
    description: '图标选择器组件',
    defaultValue: '',
    componentConfig: {
      component: 'IconSelector',
      props: {
        size: 'small'
      },
      events: {
        'update:value': 'handleIconChange'
      },
      renderConfig: {
        wrapped: true,
        containerClass: 'icon-selector-container',
        minHeight: '100px'
      }
    }
  },
  {
    id: 'interface-template',
    name: '接口模板',
    type: ParameterTemplateType.DROPDOWN,
    description: '使用内部接口的常用参数模板',
    options: [
      { label: '设备ID', value: '{device_id}', description: '设备标识符' },
      { label: '用户ID', value: '{user_id}', description: '用户标识符' },
      { label: '租户ID', value: '{tenant_id}', description: '租户标识符' },
      { label: '面板ID', value: '{board_id}', description: '面板标识符' },
      { label: '分组ID', value: '{group_id}', description: '分组标识符' },
      { label: '时间戳', value: '{timestamp}', description: '当前时间戳' },
      { label: '页码', value: '1', description: '分页页码' },
      { label: '页大小', value: '10', description: '分页大小' }
    ],
    defaultValue: '{device_id}',
    allowCustom: true
  }
]

/**
 * 根据参数类型获取推荐模板（简化版）
 */
export function getRecommendedTemplates(parameterType: 'header' | 'query' | 'path'): ParameterTemplate[] {
  const baseTemplates = [
    PARAMETER_TEMPLATES.find(t => t.id === 'manual')!,
    PARAMETER_TEMPLATES.find(t => t.id === 'property-binding')!
  ]

  // 接口模板
  const interfaceTemplate = PARAMETER_TEMPLATES.find(t => t.id === 'interface-template')!

  // 简化的组件模板（包含组件属性绑定和设备相关的）
  const componentTemplates = [
    PARAMETER_TEMPLATES.find(t => t.id === 'component-property-binding')!,
    PARAMETER_TEMPLATES.find(t => t.id === 'device-metrics-selector')!,
    PARAMETER_TEMPLATES.find(t => t.id === 'device-dispatch-selector')!
  ]

  switch (parameterType) {
    case 'header':
      return [
        ...baseTemplates,
        PARAMETER_TEMPLATES.find(t => t.id === 'content-types')!,
        PARAMETER_TEMPLATES.find(t => t.id === 'auth-types')!,
        interfaceTemplate
      ]
    case 'query':
      return [
        ...baseTemplates,
        PARAMETER_TEMPLATES.find(t => t.id === 'boolean-values')!,
        interfaceTemplate,
        ...componentTemplates
      ]
    case 'path':
      return [...baseTemplates, interfaceTemplate, ...componentTemplates]
    default:
      return [...baseTemplates, interfaceTemplate]
  }
}

/**
 * 获取所有组件模板
 */
export function getComponentTemplates(): ParameterTemplate[] {
  return PARAMETER_TEMPLATES.filter(t => t.type === ParameterTemplateType.COMPONENT)
}

/**
 * 检查模板是否为组件类型
 */
export function isComponentTemplate(template: ParameterTemplate): boolean {
  return template.type === ParameterTemplateType.COMPONENT
}

/**
 * 获取模板by ID
 */
export function getTemplateById(id: string): ParameterTemplate | undefined {
  return PARAMETER_TEMPLATES.find(t => t.id === id)
}
