/**
 * @file 卡片组件的核心类型定义
 */

/**
 * 组件的元信息
 */
export interface IComponentMeta {
  // 组件名称
  name: string
  // 组件标题
  title: string
  // 组件描述
  description?: string
  // 组件分类
  category: 'chart' | 'control' | 'display' | 'media' | 'other'
  // 组件图标
  icon?: string
  // 组件版本
  version?: string
  // 作者
  author?: string
  // 标签
  tags?: string[]
}

/**
 * 属性定义
 */
export interface IPropertyDefinition {
  type: 'string' | 'number' | 'boolean' | 'object' | 'array' | 'color' | 'icon' | 'custom'
  label: string
  default?: any
  description?: string
  required?: boolean
  // 对于 number 类型
  min?: number
  max?: number
  step?: number
  // 对于 string 类型
  maxLength?: number
  minLength?: number
  pattern?: RegExp
  // 对于选择类型
  options?: Array<{ label: string; value: any }>
  // 自定义验证
  validator?: (value: any) => boolean | string
}

/**
 * 组件配置组件定义
 */
export interface IConfigComponent {
  // 配置组件实现
  component: any // Vue component
  // 是否替换默认的属性面板
  replaceDefault?: boolean
  // 额外的配置键（不在 properties 中的）
  extraConfigKeys?: string[]
}

/**
 * 尺寸定义
 */
export interface ISizeDefinition {
  width: number
  height: number
}

/**
 * 组件的定义
 */
export interface IComponentDefinition<P = any> {
  // 组件唯一标识
  id: string
  // 组件实现
  component: any // Vue component
  // 组件元信息
  meta: IComponentMeta
  // 属性定义（用于自动生成配置表单）
  properties?: Record<string, IPropertyDefinition>
  // 自定义配置组件（替代或补充属性表单）
  configComponent?: IConfigComponent
  // 默认尺寸
  defaultSize?: ISizeDefinition
  // 最小尺寸
  minSize?: ISizeDefinition
  // 最大尺寸
  maxSize?: ISizeDefinition
  // 数据源配置
  dataSource?: any
}
