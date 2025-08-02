/**
 * Visual Editor Types
 * 编辑器专用类型定义，与PanelV2兼容
 */

// 支持的组件类型
export type WidgetType = 'text' | 'image'

// 组件配置接口
export interface WidgetConfig {
  [key: string]: any
}

// 文本组件配置
export interface TextWidgetConfig extends WidgetConfig {
  content: string
  fontSize: number
  color: string
  textAlign: 'left' | 'center' | 'right'
  fontWeight: 'normal' | 'bold'
}

// 图片组件配置
export interface ImageWidgetConfig extends WidgetConfig {
  src: string
  alt: string
  objectFit: 'cover' | 'contain' | 'fill' | 'scale-down' | 'none'
}

// 组件元信息
export interface WidgetMeta {
  type: WidgetType
  name: string
  icon?: string
  defaultSize: {
    width: number
    height: number
  }
  constraints: {
    minWidth: number
    minHeight: number
    maxWidth?: number
    maxHeight?: number
  }
}
