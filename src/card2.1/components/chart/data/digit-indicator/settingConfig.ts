/**
 * 数字指示器组件配置定义
 * 优化后的配置结构，支持详细的样式自定义
 */

import type { SettingConfig } from '@/card2.1/types/setting-config'

/**
 * 数字指示器自定义配置接口
 * 专注于样式配置，业务数据由数据源提供
 */
export interface DigitIndicatorCustomize {
  // 图标样式配置
  /** 图标名称 */
  iconName: string
  /** 图标颜色 */
  iconColor: string
  /** 图标大小 */
  iconSize: number

  // 数值样式配置
  /** 数值颜色 */
  valueColor: string
  /** 数值字体大小 */
  valueSize: number
  /** 数值字体粗细 */
  valueFontWeight: number

  // 单位样式配置
  /** 单位颜色 */
  unitColor: string
  /** 单位字体大小 */
  unitSize: number

  // 标题样式配置
  /** 标题颜色 */
  titleColor: string
  /** 标题字体大小 */
  titleSize: number

  // 布局样式配置
  /** 组件内边距 */
  padding: number
  /** 背景颜色 */
  backgroundColor?: string
  /** 是否显示背景渐变 */
  showGradient: boolean
  /** 是否启用hover效果 */
  enableHover: boolean
}

/**
 * 数字指示器完整配置接口
 */
export interface DigitIndicatorConfig {
  type: 'digit-indicator'
  root: {
    transform: {
      rotate: number
      scale: number
    }
  }
  customize: DigitIndicatorCustomize
}

/**
 * 默认样式配置（不包含业务数据）
 */
export const customConfig: DigitIndicatorCustomize = {
  // 图标样式配置
  iconName: 'Water',
  iconColor: '#1890ff',
  iconSize: 48,

  // 数值样式配置
  valueColor: 'var(--text-color)',
  valueSize: 32,
  valueFontWeight: 700,

  // 单位样式配置
  unitColor: 'var(--text-color-2)',
  unitSize: 16,

  // 标题样式配置
  titleColor: 'var(--text-color-2)',
  titleSize: 14,

  // 布局样式配置
  padding: 16,
  backgroundColor: '',
  showGradient: true,
  enableHover: true
}

/**
 * 数字指示器设置配置
 */
export const digitIndicatorSettingConfig: SettingConfig<DigitIndicatorCustomize> = [
  {
    group: '图标样式',
    items: [
      {
        key: 'iconName',
        label: '图标名称',
        type: 'input',
        defaultValue: 'Water',
        placeholder: '输入图标名称（如：Water、Fire等）',
        help: '图标名称来自图标库，可在组件设置面板中选择'
      },
      {
        key: 'iconColor',
        label: '图标颜色',
        type: 'color',
        defaultValue: '#1890ff',
        help: '设置图标的颜色'
      },
      {
        key: 'iconSize',
        label: '图标大小',
        type: 'number',
        defaultValue: 48,
        min: 24,
        max: 96,
        step: 4,
        help: '图标的像素大小'
      }
    ]
  },
  {
    group: '数值样式',
    items: [
      {
        key: 'valueColor',
        label: '数值颜色',
        type: 'color',
        defaultValue: 'var(--text-color)',
        help: '设置数值的颜色'
      },
      {
        key: 'valueSize',
        label: '数值字体大小',
        type: 'number',
        defaultValue: 32,
        min: 16,
        max: 64,
        step: 2,
        help: '数值文字的像素大小'
      },
      {
        key: 'valueFontWeight',
        label: '数值字体粗细',
        type: 'select',
        defaultValue: 700,
        options: [
          { label: '细体', value: 300 },
          { label: '正常', value: 400 },
          { label: '中等', value: 500 },
          { label: '半粗', value: 600 },
          { label: '粗体', value: 700 },
          { label: '特粗', value: 800 }
        ],
        help: '数值文字的粗细程度'
      }
    ]
  },
  {
    group: '单位样式',
    items: [
      {
        key: 'unitColor',
        label: '单位颜色',
        type: 'color',
        defaultValue: 'var(--text-color-2)',
        help: '设置单位的颜色'
      },
      {
        key: 'unitSize',
        label: '单位字体大小',
        type: 'number',
        defaultValue: 16,
        min: 10,
        max: 32,
        step: 1,
        help: '单位文字的像素大小'
      }
    ]
  },
  {
    group: '标题样式',
    items: [
      {
        key: 'titleColor',
        label: '标题颜色',
        type: 'color',
        defaultValue: 'var(--text-color-2)',
        help: '设置标题的颜色'
      },
      {
        key: 'titleSize',
        label: '标题字体大小',
        type: 'number',
        defaultValue: 14,
        min: 10,
        max: 24,
        step: 1,
        help: '标题文字的像素大小'
      }
    ]
  },
  {
    group: '布局样式',
    items: [
      {
        key: 'padding',
        label: '内边距',
        type: 'number',
        defaultValue: 16,
        min: 8,
        max: 32,
        step: 2,
        help: '组件内容的边距'
      },
      {
        key: 'backgroundColor',
        label: '背景颜色',
        type: 'color',
        defaultValue: '',
        help: '留空则使用默认背景，填写则覆盖默认背景'
      },
      {
        key: 'showGradient',
        label: '渐变背景',
        type: 'switch',
        defaultValue: true,
        help: '是否显示轻微的渐变背景效果'
      },
      {
        key: 'enableHover',
        label: 'Hover效果',
        type: 'switch',
        defaultValue: true,
        help: '是否启用鼠标悬停时的交互效果'
      }
    ]
  }
]