/**
 * 组件类型定义
 */

// 组件类型
export type WidgetType = 'text' | 'image' | 'barchart' | 'linechart' | 'piechart'

// 组件配置基类
export interface WidgetConfig {
  [key: string]: any
}

// 文本组件配置
export interface TextWidgetConfig extends WidgetConfig {
  content: string
  fontSize: number
  color: string
  textAlign: 'left' | 'center' | 'right'
}

// 图片组件配置
export interface ImageWidgetConfig extends WidgetConfig {
  src: string
  alt: string
  objectFit: 'cover' | 'contain' | 'fill'
}
