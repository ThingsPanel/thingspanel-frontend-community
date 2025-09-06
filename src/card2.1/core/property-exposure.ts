/**
 * 组件属性暴露系统
 * 让组件开发者可以声明哪些属性可以被监听，供交互配置使用
 * 支持从 settingConfig 自动注册可绑定属性
 */

import type { ComponentSettingConfig } from '../types/setting-config'
import { inferPropertyDataType } from '../types/setting-config'

// 属性数据类型
export type PropertyDataType =
  | 'string' // 字符串
  | 'number' // 数字
  | 'boolean' // 布尔值
  | 'object' // 对象
  | 'array' // 数组
  | 'date' // 日期
  | 'color' // 颜色
  | 'url' // URL链接

// 可监听属性定义
export interface ListenableProperty {
  /** 属性名称（用于程序访问） */
  name: string
  /** 显示标签（用于用户界面） */
  label: string
  /** 属性描述 */
  description?: string
  /** 数据类型 */
  type: PropertyDataType
  /** 默认值 */
  defaultValue?: any
  /** 是否是核心属性（优先显示） */
  isCore?: boolean
  /** 属性分组 */
  group?: string
  /** 示例值 */
  example?: any
  /** 可能的枚举值 */
  enum?: { label: string; value: any }[]
}

// 组件属性暴露配置
export interface ComponentPropertyExposure {
  /** 组件类型标识 */
  componentType: string
  /** 组件显示名称 */
  componentName: string
  /** 可监听的属性列表 */
  listenableProperties: ListenableProperty[]
  /** 组件版本 */
  version?: string
  /** 更新时间 */
  lastUpdated?: Date
}

// 全局属性暴露注册表
class PropertyExposureRegistry {
  private registrations = new Map<string, ComponentPropertyExposure>()

  /**
   * 注册组件的属性暴露配置
   */
  register(config: ComponentPropertyExposure) {
    const finalConfig = {
      ...config,
      lastUpdated: new Date()
    }
    this.registrations.set(config.componentType, finalConfig)
  }

  /**
   * 获取组件的可监听属性
   */
  getListenableProperties(componentType: string): ListenableProperty[] {
    const config = this.registrations.get(componentType)
    return config?.listenableProperties || []
  }

  /**
   * 获取组件的属性暴露配置
   */
  getComponentExposure(componentType: string): ComponentPropertyExposure | undefined {
    return this.registrations.get(componentType)
  }

  /**
   * 获取所有注册的组件类型
   */
  getAllComponentTypes(): string[] {
    return Array.from(this.registrations.keys())
  }

  /**
   * 获取属性的显示信息
   */
  getPropertyDisplayInfo(componentType: string, propertyName: string) {
    const config = this.registrations.get(componentType)
    const property = config?.listenableProperties.find(p => p.name === propertyName)

    if (!property) return null

    return {
      label: property.label,
      description: property.description,
      type: property.type,
      example: property.example,
      fullPath: `${componentType}.${propertyName}`
    }
  }

  /**
   * 按分组获取属性
   */
  getPropertiesByGroup(componentType: string): Record<string, ListenableProperty[]> {
    const properties = this.getListenableProperties(componentType)
    const grouped: Record<string, ListenableProperty[]> = {}

    properties.forEach(prop => {
      const group = prop.group || '基础属性'
      if (!grouped[group]) {
        grouped[group] = []
      }
      grouped[group].push(prop)
    })

    return grouped
  }
}

// 全局单例
export const propertyExposureRegistry = new PropertyExposureRegistry()

/**
 * 组件属性暴露装饰器
 * 组件开发者可以使用这个函数来声明可监听的属性
 */
export function exposeProperties(config: Omit<ComponentPropertyExposure, 'lastUpdated'>) {
  return function (target: any) {
    // 在组件加载时自动注册
    propertyExposureRegistry.register(config)
    return target
  }
}

/**
 * 创建属性暴露配置的辅助函数
 */
export function createPropertyExposure(
  componentType: string,
  componentName: string,
  properties: ListenableProperty[]
): ComponentPropertyExposure {
  return {
    componentType,
    componentName,
    listenableProperties: properties,
    version: '1.0.0'
  }
}

/**
 * 创建属性定义的辅助函数
 */
export function createProperty(
  name: string,
  label: string,
  type: PropertyDataType,
  options: Partial<ListenableProperty> = {}
): ListenableProperty {
  return {
    name,
    label,
    type,
    isCore: false,
    group: '基础属性',
    ...options
  }
}

/**
 * 从 ComponentSettingConfig 自动注册可绑定属性
 * 核心功能：将 setting.vue 中的配置项自动转换为可绑定属性
 */
export function autoRegisterFromSettingConfig(settingConfig: ComponentSettingConfig): void {
  // 将每个 setting 转换为可监听属性
  const listenableProperties: ListenableProperty[] = settingConfig.settings.map(setting => {
    // 推断属性数据类型
    const propertyType = inferPropertyDataType(setting)

    return {
      name: setting.field,
      label: setting.label,
      type: propertyType,
      description: `通过设置面板配置的 ${setting.label} 属性`,
      group: setting.group || '设置属性',
      defaultValue: setting.defaultValue,
      isCore: true, // 设置项都是核心属性
      example: setting.defaultValue,
      // 如果是下拉选择，添加枚举值
      enum: setting.options?.map(opt => ({
        label: opt.label,
        value: opt.value
      }))
    }
  })

  // 注册到属性暴露注册表
  propertyExposureRegistry.register({
    componentType: settingConfig.componentType,
    componentName: `${settingConfig.componentType} 组件`,
    listenableProperties,
    version: '1.0.0'
  })

  console.log(`🎯 [PropertyExposure] 自动注册属性暴露配置`, {
    componentType: settingConfig.componentType,
    propertiesCount: listenableProperties.length,
    properties: listenableProperties.map(p => p.name)
  })
}

/**
 * 🚀 优化1：自动属性检测和注册
 * 智能检测组件的可暴露属性，无需手动配置
 */
export function autoDetectComponentProperties(componentType: string, componentDefinition: any): ListenableProperty[] {
  const detectedProperties: ListenableProperty[] = []

  // 1. 从 componentDefinition.config 中检测属性
  if (componentDefinition.config) {
    Object.entries(componentDefinition.config).forEach(([key, value]) => {
      // 跳过内部属性和函数
      if (key.startsWith('_') || typeof value === 'function') return

      // 推断属性类型
      const propertyType = inferPropertyTypeFromValue(value)

      detectedProperties.push({
        name: key,
        label: generatePropertyLabel(key),
        type: propertyType,
        description: `自动检测的 ${generatePropertyLabel(key)} 属性`,
        group: '组件属性',
        defaultValue: value,
        isCore: isCoreProp(key),
        example: value
      })
    })
  }

  // 2. 从组件的 props 中检测属性（如果可用）
  if (componentDefinition.component?.props) {
    Object.entries(componentDefinition.component.props).forEach(([key, propDef]: [string, any]) => {
      // 避免重复添加
      if (detectedProperties.find(p => p.name === key)) return

      const propertyType = inferPropertyTypeFromVueProp(propDef)

      detectedProperties.push({
        name: key,
        label: generatePropertyLabel(key),
        type: propertyType,
        description: `从组件 props 检测的 ${generatePropertyLabel(key)} 属性`,
        group: 'Props',
        defaultValue: propDef.default,
        isCore: isCoreProp(key),
        example: propDef.default
      })
    })
  }

  // 3. 添加通用属性
  const commonProps = ['title', 'visibility', 'backgroundColor', 'textColor']
  commonProps.forEach(propName => {
    if (!detectedProperties.find(p => p.name === propName)) {
      const commonProp = CommonProperties[propName as keyof typeof CommonProperties]
      if (commonProp) {
        detectedProperties.push(commonProp)
      }
    }
  })

  return detectedProperties
}

/**
 * 从值推断属性类型
 */
function inferPropertyTypeFromValue(value: any): PropertyDataType {
  if (typeof value === 'string') {
    // 检测特殊字符串类型
    if (value.startsWith('#') || value.startsWith('rgb') || value.startsWith('hsl')) {
      return 'color'
    }
    if (value.startsWith('http') || value.startsWith('https')) {
      return 'url'
    }
    return 'string'
  }
  if (typeof value === 'number') return 'number'
  if (typeof value === 'boolean') return 'boolean'
  if (Array.isArray(value)) return 'array'
  if (value instanceof Date) return 'date'
  if (typeof value === 'object') return 'object'
  return 'string'
}

/**
 * 从 Vue prop 定义推断属性类型
 */
function inferPropertyTypeFromVueProp(propDef: any): PropertyDataType {
  if (!propDef) return 'string'

  if (propDef.type === String) return 'string'
  if (propDef.type === Number) return 'number'
  if (propDef.type === Boolean) return 'boolean'
  if (propDef.type === Array) return 'array'
  if (propDef.type === Object) return 'object'
  if (propDef.type === Date) return 'date'

  return 'string'
}

/**
 * 生成友好的属性标签
 */
function generatePropertyLabel(key: string): string {
  const labelMap: Record<string, string> = {
    title: '标题',
    content: '内容',
    value: '数值',
    status: '状态',
    color: '颜色',
    backgroundColor: '背景色',
    textColor: '文字颜色',
    fontSize: '字体大小',
    fontWeight: '字体粗细',
    visibility: '可见性',
    width: '宽度',
    height: '高度',
    themeColor: '主题色',
    borderRadius: '圆角',
    padding: '内边距',
    margin: '外边距'
  }

  return labelMap[key] || key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())
}

/**
 * 判断是否为核心属性
 */
function isCoreProp(key: string): boolean {
  const coreProps = ['title', 'content', 'value', 'status', 'visibility', 'themeColor']
  return coreProps.includes(key)
}

/**
 * 🚀 增强的自动注册函数
 * 结合 settingConfig 和自动检测的双重注册
 */
export function enhancedAutoRegister(
  componentType: string,
  componentDefinition: any,
  settingConfig?: ComponentSettingConfig
): void {
  let allProperties: ListenableProperty[] = []

  // 1. 如果有 settingConfig，从中提取属性
  if (settingConfig) {
    const settingProperties = settingConfig.settings.map(setting => {
      const propertyType = inferPropertyDataType(setting)
      return {
        name: setting.field,
        label: setting.label,
        type: propertyType,
        description: `通过设置面板配置的 ${setting.label} 属性`,
        group: setting.group || '设置属性',
        defaultValue: setting.defaultValue,
        isCore: true,
        example: setting.defaultValue,
        enum: setting.options?.map(opt => ({
          label: opt.label,
          value: opt.value
        }))
      }
    })
    allProperties.push(...settingProperties)
  }

  // 2. 自动检测其他属性
  const detectedProperties = autoDetectComponentProperties(componentType, componentDefinition)

  // 3. 合并属性（settingConfig 优先级更高）
  detectedProperties.forEach(detected => {
    const existing = allProperties.find(p => p.name === detected.name)
    if (!existing) {
      allProperties.push(detected)
    }
  })

  // 4. 注册到属性暴露注册表
  propertyExposureRegistry.register({
    componentType,
    componentName: componentDefinition.name || `${componentType} 组件`,
    listenableProperties: allProperties,
    version: '1.0.0'
  })

  console.log(`🎯 [EnhancedAutoRegister] 增强属性注册完成`, {
    componentType,
    totalProperties: allProperties.length,
    settingProperties: settingConfig ? settingConfig.settings.length : 0,
    detectedProperties: detectedProperties.length,
    properties: allProperties.map(p => ({ name: p.name, group: p.group }))
  })
}

/**
 * 获取已注册组件的属性树结构
 * 用于在 HttpConfigForm 中显示可绑定的组件属性
 */
export function getComponentPropertyTree(): ComponentPropertyTreeNode[] {
  const componentTypes = propertyExposureRegistry.getAllComponentTypes()

  return componentTypes
    .map(componentType => {
      const exposure = propertyExposureRegistry.getComponentExposure(componentType)
      if (!exposure) return null

      const properties = exposure.listenableProperties.map(prop => ({
        key: `${componentType}.${prop.name}`,
        label: `${prop.label} (${prop.type})`,
        type: 'property' as const,
        componentId: componentType,
        propertyName: prop.name,
        propertyConfig: prop,
        isLeaf: true
      }))

      return {
        key: componentType,
        label: exposure.componentName,
        type: 'component' as const,
        children: properties,
        isLeaf: false
      }
    })
    .filter(Boolean) as ComponentPropertyTreeNode[]
}

/**
 * 组件属性树节点
 */
export interface ComponentPropertyTreeNode {
  key: string
  label: string
  type: 'component' | 'property'
  componentId?: string
  propertyName?: string
  propertyConfig?: ListenableProperty
  children?: ComponentPropertyTreeNode[]
  isLeaf: boolean
}

// 常用属性模板
export const CommonProperties = {
  // 文本相关
  title: createProperty('title', '标题', 'string', {
    description: '组件的标题文字',
    isCore: true,
    group: '内容',
    example: '设备状态'
  }),

  content: createProperty('content', '内容', 'string', {
    description: '组件的主要内容',
    isCore: true,
    group: '内容',
    example: '当前温度: 25°C'
  }),

  // 数值相关
  value: createProperty('value', '数值', 'number', {
    description: '组件的数值数据',
    isCore: true,
    group: '数据',
    example: 25.6
  }),

  count: createProperty('count', '计数', 'number', {
    description: '计数器数值',
    isCore: true,
    group: '数据',
    example: 100
  }),

  // 状态相关
  status: createProperty('status', '状态', 'string', {
    description: '组件的当前状态',
    isCore: true,
    group: '状态',
    enum: [
      { label: '正常', value: 'normal' },
      { label: '警告', value: 'warning' },
      { label: '错误', value: 'error' },
      { label: '离线', value: 'offline' }
    ],
    example: 'normal'
  }),

  isOnline: createProperty('isOnline', '在线状态', 'boolean', {
    description: '设备是否在线',
    isCore: true,
    group: '状态',
    example: true
  }),

  // 样式相关
  backgroundColor: createProperty('backgroundColor', '背景色', 'color', {
    description: '组件背景颜色',
    group: '样式',
    example: '#ffffff'
  }),

  textColor: createProperty('textColor', '文字颜色', 'color', {
    description: '文字颜色',
    group: '样式',
    example: '#333333'
  }),

  // 🔥 可见性属性 - 支持通过属性修改控制显示/隐藏
  visibility: createProperty('visibility', '可见性', 'string', {
    description: '控制组件的显示或隐藏',
    isCore: true,
    group: '样式',
    enum: [
      { label: '显示', value: 'visible' },
      { label: '隐藏', value: 'hidden' }
    ],
    example: 'visible',
    defaultValue: 'visible'
  }),

  // 时间相关
  timestamp: createProperty('timestamp', '时间戳', 'date', {
    description: '数据更新时间',
    group: '时间',
    example: new Date()
  }),

  lastUpdateTime: createProperty('lastUpdateTime', '最后更新时间', 'date', {
    description: '最后一次更新的时间',
    group: '时间',
    example: new Date()
  })
}
