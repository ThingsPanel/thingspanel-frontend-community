/**
 * Fabric 渲染器类型定义
 * 为 Fabric.js 6.7.1 渲染器提供 TypeScript 类型支持
 */

import type { FabricObject } from 'fabric'
import type { VisualEditorWidget } from '@/components/visual-editor/types'

/**
 * Fabric 渲染器事件类型
 */
export interface FabricRendererEvents {
  'node-select': (nodeId: string) => void
  'node-move': (nodeId: string, x: number, y: number) => void
  'canvas-click': (event: MouseEvent) => void
  'node-context-menu': (nodeId: string, event: MouseEvent) => void
}

/**
 * Fabric 对象布局信息
 */
export interface FabricLayout {
  x: number
  y: number
  width: number
  height: number
  rotation?: number
  scaleX?: number
  scaleY?: number
}

/**
 * 扩展的节点数据，包含 Fabric 特定信息
 */
export interface FabricWidgetNode extends VisualEditorWidget {
  layout: VisualEditorWidget['layout'] & {
    canvas?: FabricLayout
  }
  fabricProperties?: {
    zIndex?: number
    locked?: boolean
    visible?: boolean
    opacity?: number
  }
}

/**
 * Fabric 渲染器选项
 */
export interface FabricRendererOptions {
  enableSnapping?: boolean
  snapThreshold?: number
  enableGuides?: boolean
  showRulers?: boolean
  enableZoom?: boolean
  minZoom?: number
  maxZoom?: number
}

/**
 * Fabric 工具类型
 */
export type FabricTool =
  | 'select'      // 选择工具
  | 'move'        // 移动工具
  | 'resize'      // 缩放工具
  | 'rotate'      // 旋转工具
  | 'draw'        // 绘制工具
  | 'text'        // 文本工具
  | 'shape'       // 形状工具

/**
 * Fabric 对象创建工厂函数类型
 */
export type FabricObjectFactory = (node: FabricWidgetNode) => Promise<FabricObject | null>

/**
 * Fabric 渲染器状态
 */
export interface FabricRendererState {
  isInitialized: boolean
  currentTool: FabricTool
  selectedNodeIds: string[]
  zoom: number
  pan: { x: number; y: number }
  canvasSize: { width: number; height: number }
}

/**
 * Fabric 对象更新选项
 */
export interface FabricObjectUpdateOptions {
  position?: { x: number; y: number }
  size?: { width: number; height: number }
  style?: Record<string, any>
  properties?: Record<string, any>
  animate?: boolean
  duration?: number
}

/**
 * Fabric 渲染器插件接口
 */
export interface FabricRendererPlugin {
  name: string
  version: string
  install: (renderer: any) => void
  uninstall: (renderer: any) => void
}

export default {}