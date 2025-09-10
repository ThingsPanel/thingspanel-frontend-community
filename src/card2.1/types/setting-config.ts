/**
 * Card2.1 组件设置配置类型定义
 * 实现统一的三文件结构标准和属性绑定机制
 * 支持完整的组件配置系统，包括设置项定义、验证规则和UI渲染控制
 * 整合了原有的灵活配置系统，提供统一的配置类型架构
 */

import type { Component } from 'vue'

/**
 * 支持的控件类型枚举
 * 整合了原有的配置字段类型，提供统一的控件类型系统
 */
export enum SettingControlType {
  /** 文本输入框 */
  INPUT = 'input',
  /** 文本域 */
  TEXTAREA = 'textarea',
  /** 数字输入框 */
  INPUT_NUMBER = 'input-number',
  /** 颜色选择器 */
  COLOR_PICKER = 'color-picker',
  /** 滑块 */
  SLIDER = 'slider',
  /** 开关 */
  SWITCH = 'switch',
  /** 下拉选择 */
  SELECT = 'select',
  /** 多选框 */
  CHECKBOX = 'checkbox',
  /** 单选框组 */
  RADIO_GROUP = 'radio-group',
  /** 日期选择器 */
  DATE_PICKER = 'date-picker',
  /** 动态标签 */
  DYNAMIC_TAGS = 'dynamic-tags',
  /** Vue组件渲染器（高级功能）*/
  VUE_COMPONENT = 'vue-component'
}

/**
 * 设置项配置接口
 * 对应组件配置界面的每个设置项，用于生成动态配置表单
 * 
 * @template T - 设置项值的类型
 */
export interface Setting<T = any> {
  /** 控件类型，如 'input', 'color-picker', 'slider', 'vue-component' */
  type: string
  /** UI上显示的标签 */
  label: string
  /** 绑定的 customConfig.customize 中的属性路径 */
  field: string
  /** 设置项分组，用于将相关设置项归类显示 */
  group?: string
  /** 占位符文本 */
  placeholder?: string
  /** 默认值 */
  defaultValue?: T
  /** 最小值（数字类型） */
  min?: number
  /** 最大值（数字类型） */
  max?: number
  /** 步长（数字类型） */
  step?: number
  /** 下拉选项 */
  options?: Array<{ label: string; value: T; description?: string }>
  /** 设置项描述文本 */
  description?: string
  /** 是否必填 */
  required?: boolean
  /** 是否禁用 */
  disabled?: boolean

  // ============ Vue组件渲染扩展（从config-types.ts整合） ============
  /** Vue组件渲染器（当type为'vue-component'时使用） */
  component?: Component | string
  /** 传递给Vue组件的Props */
  componentProps?: Record<string, any>

  /** 控件的其他配置 */
  [key: string]: any
}

/**
 * 组件的默认样式、属性和初始行为
 * 对应您提供的 CustomConfig 设计
 * @template T - 组件特有的 customize 对象类型
 */
export interface CustomConfig<T = Record<string, any>> {
  /** 组件的唯一类型标识符 */
  type: string
  /** 组件根级别的通用变换属性 */
  root: {
    transform: {
      rotate: number
      scale: number
    }
  }
  /** 组件核心的、独特的自定义样式和功能属性 */
  customize: T
}

/**
 * 最终由渲染引擎使用的完整组件配置对象
 * 对应您提供的 DataConfig 设计
 * @template T - 组件特有的 customize 对象类型
 */
export interface DataConfig<T = Record<string, any>> {
  /** 组件实例的唯一ID */
  id: string
  /** 组件的显示名称 */
  name: string
  /** Vue组件名称，源字段 */
  field: string
  /** 接收联动的目标组件配置 */
  components: TargetComponent[]
  /** 组件的自定义配置 */
  customConfig: CustomConfig<T>
}

/**
 * 联动中的目标组件
 * 对应您提供的 TargetComponent 设计
 */
export interface TargetComponent {
  /** 目标组件的ID */
  id: string
  /** 接收联动数据的字段 */
  field: string
}

/**
 * 组件设置配置
 * 将 Setting 和 CustomConfig 整合，定义组件的完整配置结构
 */
export interface ComponentSettingConfig<T = Record<string, any>> {
  /** 组件类型标识符 */
  componentType: string
  /** 设置项列表 */
  settings: Setting[]
  /** 默认自定义配置 */
  customConfig: CustomConfig<T>
}

/**
 * 支持的控件类型枚举
 * 整合了原有的配置字段类型，提供统一的控件类型系统
 */
export enum SettingControlType {
  /** 文本输入框 */
  INPUT = 'input',
  /** 文本域 */
  TEXTAREA = 'textarea',
  /** 数字输入框 */
  INPUT_NUMBER = 'input-number',
  /** 颜色选择器 */
  COLOR_PICKER = 'color-picker',
  /** 滑块 */
  SLIDER = 'slider',
  /** 开关 */
  SWITCH = 'switch',
  /** 下拉选择 */
  SELECT = 'select',
  /** 多选框 */
  CHECKBOX = 'checkbox',
  /** 单选框组 */
  RADIO_GROUP = 'radio-group',
  /** 日期选择器 */
  DATE_PICKER = 'date-picker',
  /** 动态标签 */
  DYNAMIC_TAGS = 'dynamic-tags',
  /** Vue组件渲染器（高级功能）*/
  VUE_COMPONENT = 'vue-component'
}

/**
 * 属性数据类型映射
 * 整合了Vue组件渲染类型
 */
export type PropertyDataTypeFromSetting =
  | 'string' // input, textarea, select, radio-group
  | 'number' // input-number, slider
  | 'boolean' // switch, checkbox
  | 'color' // color-picker
  | 'date' // date-picker
  | 'array' // dynamic-tags
  | 'component' // vue-component

/**
 * 根据设置项类型推断属性数据类型
 * @param setting 设置项配置
 * @returns 属性数据类型
 */
export function inferPropertyDataType(setting: Setting): PropertyDataTypeFromSetting {
  switch (setting.type) {
    case SettingControlType.INPUT:
    case SettingControlType.TEXTAREA:
    case SettingControlType.SELECT:
    case SettingControlType.RADIO_GROUP:
      return 'string'

    case SettingControlType.INPUT_NUMBER:
    case SettingControlType.SLIDER:
      return 'number'

    case SettingControlType.SWITCH:
    case SettingControlType.CHECKBOX:
      return 'boolean'

    case SettingControlType.COLOR_PICKER:
      return 'color'

    case SettingControlType.DATE_PICKER:
      return 'date'

    case SettingControlType.DYNAMIC_TAGS:
      return 'array'

    case SettingControlType.VUE_COMPONENT:
      return 'component'

    default:
      return 'string'
  }
}

/**
 * 设置项验证规则
 */
export interface SettingValidationRule {
  /** 是否必填 */
  required?: boolean
  /** 最小长度/值 */
  min?: number
  /** 最大长度/值 */
  max?: number
  /** 正则表达式验证 */
  pattern?: string
  /** 自定义验证函数 */
  validator?: (value: any) => boolean | string
}

/**
 * 扩展的设置项配置（包含验证）
 */
export interface EnhancedSetting extends Setting {
  /** 验证规则 */
  validation?: SettingValidationRule
  /** 是否只读 */
  readonly?: boolean
  /** 是否可见 */
  visible?: boolean | ((config: any) => boolean)
  /** 帮助文本 */
  helpText?: string
}

// ============ 配置模式和分组管理（从config-types.ts整合） ============

/**
 * 配置模式类型
 * 支持不同的配置渲染方式
 */
export type ConfigMode = 'standard' | 'vue-component' | 'hybrid'

/**
 * 配置分组定义
 * 用于组织和展示配置项
 */
export interface SettingGroup {
  /** 分组名称（唯一标识） */
  name: string
  /** 分组显示标签 */
  label: string
  /** 分组描述 */
  description?: string
  /** 分组中包含的字段 */
  fields: string[]
  /** 分组是否可折叠 */
  collapsible?: boolean
  /** 分组默认是否展开 */
  defaultExpanded?: boolean
}

/**
 * TS配置定义（从原config-types.ts整合）
 * 用于纯TypeScript配置模式
 */
export interface TSConfig {
  title?: string
  description?: string
  fields: Setting[]
  groups?: SettingGroup[]
}

/**
 * 配置值类型（从原config-types.ts整合）
 */
export interface ConfigValues {
  [key: string]: any
}

/**
 * 扩展的组件设置配置
 * 整合了配置分组和模式管理
 */
export interface EnhancedComponentSettingConfig<T = Record<string, any>> extends ComponentSettingConfig<T> {
  /** 配置模式 */
  mode?: ConfigMode
  /** 配置分组定义 */
  groups?: SettingGroup[]
  /** 配置标题 */
  title?: string
  /** 配置描述 */
  description?: string
}

/**
 * 创建设置项的辅助函数
 */
export function createSetting(type: string, label: string, field: string, options: Partial<Setting> = {}): Setting {
  return {
    type,
    label,
    field,
    group: options.group || '基础设置',
    ...options
  }
}

/**
 * 创建自定义配置的辅助函数
 * 支持多种调用方式以保持向后兼容性
 * 
 * @template T - 自定义配置对象的类型
 * @param typeOrCustomize - 组件类型或自定义配置对象
 * @param customize - 自定义配置对象（当第一个参数是类型时）
 * @param transform - 变换配置（旋转和缩放）
 * @returns 完整的自定义配置对象
 */
export function createCustomConfig<T extends Record<string, any>>(
  typeOrCustomize: string | T,
  customize?: T,
  transform: { rotate: number; scale: number } = { rotate: 0, scale: 1 }
): CustomConfig<T> {
  // 支持两种调用方式：
  // 1. createCustomConfig('component-type', { prop: value })
  // 2. createCustomConfig({ type: 'component-type', prop: value })
  if (typeof typeOrCustomize === 'string') {
    // 第一种方式：类型 + 配置对象
    if (!customize) {
      throw new Error('customize 参数在指定 type 时是必需的')
    }
    return {
      type: typeOrCustomize,
      root: { transform },
      customize
    }
  } else {
    // 第二种方式：单一配置对象（向后兼容）
    const config = typeOrCustomize as T & { type?: string }
    const { type, ...customizeObj } = config
    
    if (!type) {
      throw new Error('配置对象必须包含 type 字段')
    }
    
    return {
      type,
      root: { transform: customize as any || transform },
      customize: customizeObj as T
    }
  }
}
