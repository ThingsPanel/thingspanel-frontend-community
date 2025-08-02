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
 * 组件的定义
 */
export interface IComponentDefinition<P = any> {
  // 组件唯一标识
  id: string
  // 组件实现
  component: any // Vue component
  // 组件元信息
  meta: IComponentMeta
  // 默认属性
  properties?: P
  // 数据源配置
  dataSource?: any
}
