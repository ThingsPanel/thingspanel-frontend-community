/**
 * DraggableResizableGrid 通用栅格组件导出
 */

import DraggableResizableGrid from './DraggableResizableGrid.vue'
import GridItem from './GridItem.vue'
import OptimizedDraggableResizableGrid from './OptimizedDraggableResizableGrid.vue'
import OptimizedGridItem from './OptimizedGridItem.vue'

// 导出组件
export { DraggableResizableGrid, GridItem, OptimizedDraggableResizableGrid, OptimizedGridItem }
export default DraggableResizableGrid

// 导出类型
export type * from './types'

// 导出工具函数
export * from './utils'

// 导出Hook
export * from './hooks'

// 导出默认配置
export { DEFAULT_GRID_CONFIG, DEFAULT_GRID_ITEM } from './types'
