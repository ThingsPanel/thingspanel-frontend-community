// src/components/visual-editor/settings/types.ts

/**
 * 代表一个设置表单组件。
 */
export type SettingFormComponent = any // 后续可以替换为更具体的组件类型, 如 DefineComponent

/**
 * 组件的专有属性配置
 */
export interface ComponentPropsSchema {
  // 定义组件特有的属性, e.g., 'text', 'color', 'fontSize'
  [key: string]: any
}

/**
 * 基础配置
 */
export interface BaseSettingsSchema {
  // e.g., name, width, height, position
  name: string
  w: number
  h: number
  x: number
  y: number
}

/**
 * 交互配置
 */
export interface InteractionSettingsSchema {
  // e.g., onClick, onHover
  onClick?: {
    type: 'none' | 'event' | 'link'
    payload?: any
  }
  onHover?: {
    type: 'none' | 'tooltip'
    payload?: any
  }
}

/**
 * 数据源配置
 */
export type DataSourceSchema = JsonDataSourceSchema | DeviceDataSourceSchema

/**
 * JSON 数据源
 */
export interface JsonDataSourceSchema {
  type: 'json'
  data: any
}

/**
 * 设备数据源
 */
export interface DeviceDataSourceSchema {
  type: 'device'
  deviceId: string
  // ... 其他设备相关的配置
}

/**
 * 整个组件的配置
 */
export interface WidgetConfig {
  props: ComponentPropsSchema
  base: BaseSettingsSchema
  interaction: InteractionSettingsSchema
  dataSource: DataSourceSchema
}

/**
 * 设置面板的注册信息
 */
export interface SettingPanelRegistration {
  /**
   * 组件类型
   */
  type: string
  /**
   * 组件专有属性配置面板
   */
  props: SettingFormComponent
  /**
   * 基础配置面板
   */
  base: SettingFormComponent
  /**
   * 交互配置面板
   */
  interaction: SettingFormComponent
  /**
   * 数据源选择器
   */
  dataSource: SettingFormComponent
}
