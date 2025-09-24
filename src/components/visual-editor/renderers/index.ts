/**
 * 渲染器统一导出
 * 所有渲染器都应该遵循相同的接口规范
 */

// Canvas渲染器 (当前主要渲染器)
export { CanvasRenderer, FabricCanvasRenderer } from '@/components/visual-editor/renderers/canvas'

// GridStack渲染器
export { GridstackRenderer } from '@/components/visual-editor/renderers/gridstack'

// 待实现的渲染器
// export { KanbanRenderer } from '@/components/visual-editor/renderers/kanban'  // 看板渲染器 (二期功能)
// export { DashboardRenderer } from '@/components/visual-editor/renderers/dashboard'
// export { ReportRenderer } from '@/components/visual-editor/renderers/report'
// export { ThreeDRenderer } from '@/components/visual-editor/renderers/three-d'

/**
 * 渲染器接口规范
 * 所有渲染器必须遵循以下接口：
 *
 * Props:
 * - readonly?: boolean
 * - config?: object (渲染器特定配置)
 *
 * Emits:
 * - ready: () => void
 * - error: (error: Error) => void
 * - node-select: (id: string) => void
 */
