/**
 * GridPro 渲染器专用类型定义
 * 基于现代Web API和Vue3最佳实践
 */

import type { BaseCanvasItem, Position, Size } from '../../../types/core'

// GridPro 配置接口
export interface GridProConfig {
  // 布局配置
  layoutMode: 'compact' | 'relaxed' | 'free'
  columns: number
  rowHeight: number
  margin: [number, number]
  gap: number
  
  // 交互配置
  enableDrag: boolean
  enableResize: boolean
  enableSnap: boolean
  snapTolerance: number
  
  // 视觉配置
  showGrid: boolean
  gridOpacity: number
  backgroundColor: string
  
  // 动画配置
  animationSpeed: 'slow' | 'normal' | 'fast'
  easing: 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'spring'
  enableTransitions: boolean
  
  // 性能配置
  virtualization: boolean
  performanceMode: 'quality' | 'performance'
  batchUpdates: boolean
  
  // 高级配置
  allowOverlap: boolean
  preventCollision: boolean
  compactType: 'vertical' | 'horizontal' | null
  maxRows: number
}

// GridPro 项目接口
export interface GridProItem {
  id: string
  x: number
  y: number
  w: number
  h: number
  minW?: number
  minH?: number
  maxW?: number
  maxH?: number
  static?: boolean
  isDraggable?: boolean
  isResizable?: boolean
  resizeHandles?: ResizeHandle[]
  data?: any
}

// 调整大小手柄位置
export type ResizeHandle = 'se' | 'sw' | 'ne' | 'nw' | 'n' | 's' | 'e' | 'w'

// 拖拽状态
export interface DragState {
  isDragging: boolean
  draggedItemId: string | null
  startPosition: Position
  currentPosition: Position
  offset: Position
  preview: boolean
}

// 调整大小状态
export interface ResizeState {
  isResizing: boolean
  resizedItemId: string | null
  handle: ResizeHandle | null
  startBounds: Rectangle
  currentBounds: Rectangle
}

// 矩形区域接口
export interface Rectangle {
  x: number
  y: number
  width: number
  height: number
}

// 碰撞检测结果
export interface CollisionResult {
  hasCollision: boolean
  collidingItems: string[]
  suggestedPosition?: Position
}

// 网格计算结果
export interface GridCalculation {
  containerWidth: number
  containerHeight: number
  cellWidth: number
  cellHeight: number
  totalRows: number
  usedCells: Set<string>
}

// 空间索引节点
export interface SpatialNode {
  bounds: Rectangle
  items: Set<string>
  children?: SpatialNode[]
}

// 动画配置
export interface AnimationConfig {
  duration: number
  easing: string
  delay?: number
  fill?: 'forwards' | 'backwards' | 'both' | 'none'
}

// 性能监控数据
export interface PerformanceMetrics {
  renderTime: number
  updateTime: number
  memoryUsage: number
  frameRate: number
  itemCount: number
  visibleItems: number
}

// 虚拟化配置
export interface VirtualizationConfig {
  enabled: boolean
  viewportBuffer: number
  itemHeight: number
  estimatedItemHeight: number
  overscan: number
}

// 手势识别数据
export interface GestureData {
  type: 'tap' | 'longpress' | 'pan' | 'pinch' | 'swipe'
  startPosition: Position
  currentPosition: Position
  deltaX: number
  deltaY: number
  scale?: number
  velocity?: Position
  direction?: 'up' | 'down' | 'left' | 'right'
}

// 键盘快捷键配置
export interface KeyboardShortcuts {
  delete: string[]
  selectAll: string[]
  copy: string[]
  paste: string[]
  undo: string[]
  redo: string[]
  duplicate: string[]
}

// GridPro 事件类型
export interface GridProEvents {
  // 布局事件
  'layout:change': (items: GridProItem[]) => void
  'layout:compact': (items: GridProItem[]) => void
  'layout:reset': () => void
  
  // 项目事件
  'item:add': (item: GridProItem) => void
  'item:remove': (itemId: string) => void
  'item:update': (itemId: string, updates: Partial<GridProItem>) => void
  'item:move': (itemId: string, position: Position) => void
  'item:resize': (itemId: string, size: Size) => void
  
  // 交互事件
  'drag:start': (itemId: string, position: Position) => void
  'drag:move': (itemId: string, position: Position) => void
  'drag:end': (itemId: string, position: Position) => void
  'resize:start': (itemId: string, handle: ResizeHandle) => void
  'resize:move': (itemId: string, bounds: Rectangle) => void
  'resize:end': (itemId: string, bounds: Rectangle) => void
  
  // 选择事件
  'selection:change': (selectedIds: string[]) => void
  'selection:clear': () => void
  
  // 性能事件
  'performance:update': (metrics: PerformanceMetrics) => void
  'performance:warning': (message: string) => void
}

// GridPro 工具栏配置
export interface GridProToolbarConfig extends GridProConfig {
  // 工具栏特有的配置项
  showPerformanceMonitor: boolean
  showGridControls: boolean
  showAnimationControls: boolean
  allowPresetSwitch: boolean
}

// 预设配置
export interface GridProPreset {
  id: string
  name: string
  description: string
  config: Partial<GridProConfig>
  preview?: string
}

// 内置预设
export const GRIDPRO_PRESETS: GridProPreset[] = [
  {
    id: 'performance',
    name: '性能优先',
    description: '优化性能，适合大量组件场景',
    config: {
      layoutMode: 'compact',
      animationSpeed: 'fast',
      virtualization: true,
      performanceMode: 'performance',
      enableTransitions: false
    }
  },
  {
    id: 'quality',
    name: '质量优先',
    description: '最佳视觉效果和用户体验',
    config: {
      layoutMode: 'relaxed',
      animationSpeed: 'normal',
      virtualization: false,
      performanceMode: 'quality',
      enableTransitions: true,
      easing: 'spring'
    }
  },
  {
    id: 'compact',
    name: '紧凑布局',
    description: '最大化空间利用率',
    config: {
      layoutMode: 'compact',
      compactType: 'vertical',
      gap: 4,
      margin: [4, 4]
    }
  },
  {
    id: 'free',
    name: '自由布局',
    description: '完全自由的拖拽体验',
    config: {
      layoutMode: 'free',
      allowOverlap: true,
      preventCollision: false,
      enableSnap: false
    }
  }
]

// 默认配置
export const DEFAULT_GRIDPRO_CONFIG: GridProConfig = {
  // 布局配置
  layoutMode: 'relaxed',
  columns: 12,
  rowHeight: 100,
  margin: [10, 10],
  gap: 10,
  
  // 交互配置
  enableDrag: true,
  enableResize: true,
  enableSnap: true,
  snapTolerance: 10,
  
  // 视觉配置
  showGrid: true,
  gridOpacity: 0.1,
  backgroundColor: '#f5f5f5',
  
  // 动画配置
  animationSpeed: 'normal',
  easing: 'ease-out',
  enableTransitions: true,
  
  // 性能配置
  virtualization: false,
  performanceMode: 'quality',
  batchUpdates: true,
  
  // 高级配置
  allowOverlap: false,
  preventCollision: true,
  compactType: 'vertical',
  maxRows: 50
}

// 响应式断点配置
export const RESPONSIVE_BREAKPOINTS = {
  xs: 480,   // 手机
  sm: 640,   // 大屏手机
  md: 768,   // 平板
  lg: 1024,  // 小屏桌面
  xl: 1280,  // 桌面
  '2xl': 1536 // 大屏桌面
} as const

// 响应式布局配置
export interface ResponsiveGridProConfig {
  xs?: Partial<GridProConfig>
  sm?: Partial<GridProConfig>
  md?: Partial<GridProConfig>
  lg?: Partial<GridProConfig>
  xl?: Partial<GridProConfig>
  '2xl'?: Partial<GridProConfig>
}

/**
 * 创建默认 GridPro 配置
 * 支持部分配置覆盖
 */
export function createDefaultGridProConfig(overrides?: Partial<GridProConfig>): GridProConfig {
  return {
    ...DEFAULT_GRIDPRO_CONFIG,
    ...overrides
  }
}