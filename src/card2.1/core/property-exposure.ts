/**
 * 组件属性暴露系统
 * 让组件开发者可以声明哪些属性可以被监听，供交互配置使用
 */

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
    console.log(`🔌 [PropertyExposure] 注册组件属性: ${config.componentType}`, config)
    this.registrations.set(config.componentType, {
      ...config,
      lastUpdated: new Date()
    })
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
