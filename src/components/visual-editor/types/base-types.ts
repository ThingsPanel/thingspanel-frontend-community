/**
 * 基础类型定义 - 统一数据节点协议
 */

// 位置信息
export interface Position {
  x: number
  y: number
}

// 尺寸信息
export interface Size {
  width: number
  height: number
}

// 统一数据节点协议
export interface GraphData<TConfig = any, TItem = any> {
  id: string
  type: string
  x: number
  y: number
  width: number // Canvas像素宽度
  height: number // Canvas像素高度
  properties: TConfig
  renderer: string[] // 适配的渲染器

  // 不同渲染器的布局属性
  layout?: {
    canvas?: {
      width: number // 像素
      height: number // 像素
    }
    gridstack?: {
      w: number // 网格宽度单位
      h: number // 网格高度单位
    }
    kanban?: {
      // 看板特有布局属性
    }
  }

  dataBinding?: {
    sourceId: string
    transform: TransformOperation[]
  }
  metadata: {
    createdAt: number
    updatedAt: number
    version: string
  }
}

// 数据转换操作
export interface TransformOperation {
  type: 'filter' | 'aggregate' | 'sort' | 'map'
  [key: string]: any
}

// 画布状态
export interface CanvasState {
  nodes: GraphData[]
  selectedIds: string[]
  viewport: {
    zoom: number
    offsetX: number
    offsetY: number
  }
  mode: 'edit' | 'preview'
}
