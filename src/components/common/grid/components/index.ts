/**
 * Grid 组件模块导出
 * 统一导出所有拆分后的网格组件
 */

export { default as GridCore } from './GridCore.vue'
export { default as GridItemContent } from './GridItemContent.vue'
export { default as GridDropZone } from './GridDropZone.vue'

// 组件信息
export const GRID_COMPONENTS_VERSION = '1.0.0'
export const GRID_COMPONENTS_INFO = {
  version: GRID_COMPONENTS_VERSION,
  description: '模块化的网格布局组件系统',
  components: ['GridCore - 网格核心逻辑组件', 'GridItemContent - 网格项内容渲染组件', 'GridDropZone - 拖拽区域处理组件']
}
