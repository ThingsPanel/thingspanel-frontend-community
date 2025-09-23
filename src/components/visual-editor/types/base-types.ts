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
    gridstack?: {
      w: number // 网格宽度单位
      h: number // 网格高度单位
    }
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
