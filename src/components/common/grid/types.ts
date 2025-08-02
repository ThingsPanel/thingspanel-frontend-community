/**
 * DraggableResizableGrid 通用栅格组件类型定义
 */

import type { Component } from 'vue'

// 网格项数据结构
export interface GridItem {
  /** 唯一标识符 */
  id: string
  /** 起始列位置 (1-based, 1表示第一列) */
  gridCol: number
  /** 起始行位置 (1-based, 1表示第一行) */
  gridRow: number
  /** 跨越的列数 */
  gridColSpan: number
  /** 跨越的行数 */
  gridRowSpan: number
  /** 渲染的组件 */
  component?: Component | string
  /** 组件属性 */
  props?: Record<string, any>
  /** 最小宽度约束 (栅格单位) */
  minColSpan?: number
  /** 最小高度约束 (栅格单位) */
  minRowSpan?: number
  /** 最大宽度约束 (栅格单位) */
  maxColSpan?: number
  /** 最大高度约束 (栅格单位) */
  maxRowSpan?: number
  /** 是否可调整大小 */
  resizable?: boolean
  /** 是否可拖拽 */
  draggable?: boolean
  /** 是否锁定位置 */
  locked?: boolean
  /** 自定义样式 */
  style?: Record<string, any>
  /** 自定义类名 */
  className?: string
  /** 层级 */
  zIndex?: number
}

// 网格配置
export interface GridConfig {
  /** 栅格列数 */
  columns: number
  /** 行高 (px) */
  rowHeight: number
  /** 栅格间距 (px) */
  gap: number
  /** 最小行数 */
  minRows?: number
  /** 最大行数 */
  maxRows?: number
  /** 是否只读模式 */
  readonly?: boolean
  /** 是否显示栅格背景 */
  showGrid?: boolean
  /** 碰撞策略 */
  collision?: CollisionStrategy
  /** 边界限制 */
  bounds?: BoundsType
  /** 容器最小高度 (px) */
  minHeight?: number
}

// 碰撞策略
export type CollisionStrategy =
  | 'block' // 阻止重叠
  | 'push' // 推挤其他元素
  | 'swap' // 交换位置
  | 'allow' // 允许重叠

// 边界限制类型
export type BoundsType =
  | 'parent' // 限制在父容器内
  | 'none' // 无边界限制

// 拖拽事件数据
export interface DragEvent {
  /** 拖拽的项目 */
  item: GridItem
  /** 原始位置 */
  oldPosition: GridPosition
  /** 新位置 */
  newPosition: GridPosition
  /** 原生事件 */
  event: MouseEvent | TouchEvent
}

// 调整大小事件数据
export interface ResizeEvent {
  /** 调整大小的项目 */
  item: GridItem
  /** 原始尺寸 */
  oldSize: GridSize
  /** 新尺寸 */
  newSize: GridSize
  /** 原生事件 */
  event: MouseEvent | TouchEvent
}

// 栅格位置
export interface GridPosition {
  /** 列位置 */
  col: number
  /** 行位置 */
  row: number
}

// 栅格尺寸
export interface GridSize {
  /** 列跨度 */
  colSpan: number
  /** 行跨度 */
  rowSpan: number
}

// 像素位置
export interface PixelPosition {
  /** X坐标 (px) */
  x: number
  /** Y坐标 (px) */
  y: number
}

// 像素尺寸
export interface PixelSize {
  /** 宽度 (px) */
  width: number
  /** 高度 (px) */
  height: number
}

// 网格区域
export interface GridArea {
  /** 起始列 */
  colStart: number
  /** 结束列 */
  colEnd: number
  /** 起始行 */
  rowStart: number
  /** 结束行 */
  rowEnd: number
}

// 组件Props接口
export interface DraggableResizableGridProps {
  /** 网格项数据 */
  items: GridItem[]
  /** 网格配置 */
  config?: Partial<GridConfig>
  /** 容器样式 */
  containerStyle?: Record<string, any>
  /** 容器类名 */
  containerClass?: string
}

// 组件Emits接口
export interface DraggableResizableGridEmits {
  /** 项目拖拽开始 */
  (e: 'drag-start', data: DragEvent): void
  /** 项目拖拽中 */
  (e: 'drag-move', data: DragEvent): void
  /** 项目拖拽结束 */
  (e: 'drag-end', data: DragEvent): void
  /** 项目调整大小开始 */
  (e: 'resize-start', data: ResizeEvent): void
  /** 项目调整大小中 */
  (e: 'resize-move', data: ResizeEvent): void
  /** 项目调整大小结束 */
  (e: 'resize-end', data: ResizeEvent): void
  /** 项目点击 */
  (e: 'item-click', item: GridItem, event: MouseEvent): void
  /** 项目双击 */
  (e: 'item-dblclick', item: GridItem, event: MouseEvent): void
  /** 容器点击 */
  (e: 'container-click', event: MouseEvent): void
  /** 布局变化 */
  (e: 'layout-change', items: GridItem[]): void
  /** 碰撞检测 */
  (e: 'collision', item: GridItem, collisions: GridItem[]): void
}

// 网格计算结果
export interface GridCalculation {
  /** CSS Grid样式 */
  gridStyle: Record<string, any>
  /** 网格项样式 */
  itemStyle: Record<string, any>
  /** 总行数 */
  totalRows: number
  /** 容器高度 */
  containerHeight: number
}

// 碰撞检测结果
export interface CollisionResult {
  /** 是否发生碰撞 */
  hasCollision: boolean
  /** 碰撞的项目 */
  collisions: GridItem[]
  /** 建议的新位置 */
  suggestedPosition?: GridPosition
}

// Hook返回值类型
export interface UseGridLayoutReturn {
  /** 网格配置 */
  gridConfig: Readonly<GridConfig>
  /** 网格样式计算 */
  gridCalculation: Readonly<GridCalculation>
  /** 栅格坐标转换函数 */
  gridToPixel: (gridPos: number, isCol?: boolean) => number
  /** 像素转栅格坐标函数 */
  pixelToGrid: (pixel: number, isCol?: boolean) => number
  /** 获取网格区域CSS */
  getGridArea: (item: GridItem) => string
  /** 验证位置有效性 */
  validatePosition: (position: GridPosition, size: GridSize) => boolean
  /** 计算项目像素位置 */
  getItemPixelPosition: (item: GridItem) => PixelPosition
  /** 计算项目像素尺寸 */
  getItemPixelSize: (item: GridItem) => PixelSize
}

// 默认配置
export const DEFAULT_GRID_CONFIG: GridConfig = {
  columns: 12,
  rowHeight: 100,
  gap: 10,
  minRows: 3,
  readonly: false,
  showGrid: true,
  collision: 'block',
  bounds: 'parent',
  minHeight: 400
}

// 默认网格项
export const DEFAULT_GRID_ITEM: Partial<GridItem> = {
  gridColSpan: 2,
  gridRowSpan: 2,
  minColSpan: 1,
  minRowSpan: 1,
  resizable: true,
  draggable: true,
  locked: false,
  zIndex: 1
}
