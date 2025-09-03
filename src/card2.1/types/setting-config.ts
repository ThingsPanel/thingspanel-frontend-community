/**
 * Card2.1 组件设置配置类型定义
 * 实现统一的三文件结构标准和属性绑定机制
 */

/**
 * 设置项配置接口
 * 对应您提供的 Setting 设计，用于定义组件配置界面的每个设置项
 */
export interface Setting {
  /** 控件类型，如 'input', 'color-picker', 'slider' */
  type: string
  /** UI上显示的标签 */
  label: string
  /** 绑定的 customConfig.customize 中的属性路径 */
  field: string
  /** 设置项分组 */
  group?: string
  /** 占位符文本 */
  placeholder?: string
  /** 默认值 */
  defaultValue?: any
  /** 最小值（数字类型） */
  min?: number
  /** 最大值（数字类型） */
  max?: number
  /** 步长（数字类型） */
  step?: number
  /** 下拉选项 */
  options?: Array<{ label: string; value: any; description?: string }>
  /** 控件的其他配置，如 placeholder, options 等 */
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
  DATE_PICKER = 'date-picker'
}

/**
 * 属性数据类型映射
 */
export type PropertyDataTypeFromSetting =
  | 'string' // input, textarea, select, radio-group
  | 'number' // input-number, slider
  | 'boolean' // switch, checkbox
  | 'color' // color-picker
  | 'date' // date-picker

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
 */
export function createCustomConfig<T>(
  type: string,
  customize: T,
  transform: { rotate: number; scale: number } = { rotate: 0, scale: 1 }
): CustomConfig<T> {
  return {
    type,
    root: { transform },
    customize
  }
}
