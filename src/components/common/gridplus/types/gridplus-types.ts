/**
 * GridPlus 高性能网格组件类型定义
 * 继承并扩展 GridLayoutPlus 的所有类型
 */

import type { Component } from 'vue'
import type {
  GridLayoutPlusItem,
  GridLayoutPlusConfig,
  GridLayoutPlusProps,
  GridLayoutPlusEmits
} from '@/components/common/grid/gridLayoutPlusTypes'

// ============= 核心扩展类型 =============

/**
 * GridPlus 项目接口 - 继承并扩展 GridLayoutPlus 项目
 */
export interface GridPlusItem extends GridLayoutPlusItem {
  // 懒加载相关
  /** 是否启用懒加载 */
  lazyLoad?: boolean
  /** 懒加载状态 */
  lazyLoadState?: LazyLoadState
  /** 预加载优先级 (1-10, 数字越小优先级越高) */
  priority?: number

  // 虚拟滚动相关
  /** 是否在虚拟滚动中可见 */
  isVisible?: boolean
  /** 项目在虚拟列表中的索引 */
  virtualIndex?: number
  /** 缓存的渲染高度 */
  cachedHeight?: number

  // 性能优化相关
  /** 是否跳过动画 */
  skipAnimation?: boolean
  /** 自定义渲染器 */
  customRenderer?: Component
  /** 数据预加载函数 */
  preloadData?: () => Promise<any>
}

/**
 * GridPlus 配置接口 - 继承并扩展 GridLayoutPlus 配置
 */
export interface GridPlusConfig extends GridLayoutPlusConfig {
  // 虚拟滚动配置
  /** 是否启用虚拟滚动 */
  enableVirtualScroll?: boolean
  /** 虚拟滚动缓冲区大小 */
  virtualScrollBuffer?: number
  /** 虚拟滚动项目高度估算 */
  estimatedItemHeight?: number

  // 懒加载配置
  /** 是否启用懒加载 */
  enableLazyLoad?: boolean
  /** 懒加载触发距离 */
  lazyLoadThreshold?: number
  /** 懒加载根边距 */
  lazyLoadRootMargin?: string

  // 性能优化配置
  /** 渲染性能级别 */
  performanceLevel?: PerformanceLevel
  /** 是否启用性能监控 */
  enablePerformanceMonitoring?: boolean
  /** 批量渲染大小 */
  batchRenderSize?: number
  /** 防抖延迟 (毫秒) */
  debounceDelay?: number
  /** 节流延迟 (毫秒) */
  throttleDelay?: number
}

/**
 * GridPlus 组件 Props - 继承并扩展 GridLayoutPlus Props
 */
export interface GridPlusProps extends GridLayoutPlusProps {
  /** 布局数据 - 使用扩展的 GridPlusItem */
  layout: GridPlusItem[]
  /** GridPlus 特定配置 */
  config?: Partial<GridPlusConfig>

  // 新增功能开关
  /** 启用虚拟滚动 */
  enableVirtualScroll?: boolean
  /** 启用懒加载 */
  enableLazyLoad?: boolean
  /** 启用性能监控 */
  enablePerformanceMonitoring?: boolean

  // 高级配置
  /** 骨架屏配置 */
  skeletonConfig?: SkeletonConfig
  /** 性能配置 */
  performanceConfig?: PerformanceConfig
}

/**
 * GridPlus 组件事件 - 继承并扩展 GridLayoutPlus 事件
 */
export interface GridPlusEmits extends GridLayoutPlusEmits {
  // 虚拟滚动事件
  /** 可见区域变化 */
  (e: 'virtual-scroll-change', visibleRange: VisibleRange): void
  /** 虚拟滚动状态变化 */
  (e: 'virtual-scroll-state-change', state: VirtualScrollState): void

  // 懒加载事件
  /** 懒加载状态变化 */
  (e: 'lazy-load-state-change', itemId: string, state: LazyLoadState): void
  /** 项目进入视口 */
  (e: 'item-enter-viewport', itemId: string): void
  /** 项目离开视口 */
  (e: 'item-leave-viewport', itemId: string): void

  // 性能监控事件
  /** 性能指标更新 */
  (e: 'performance-metrics', metrics: PerformanceMetrics): void
  /** 渲染性能警告 */
  (e: 'performance-warning', warning: PerformanceWarning): void
}

// ============= 懒加载相关类型 =============

/**
 * 懒加载状态
 */
export enum LazyLoadState {
  /** 未初始化 */
  IDLE = 'idle',
  /** 显示骨架屏 */
  SKELETON = 'skeleton',
  /** 加载中 */
  LOADING = 'loading',
  /** 加载完成 */
  LOADED = 'loaded',
  /** 加载失败 */
  ERROR = 'error'
}

/**
 * 骨架屏配置
 */
export interface SkeletonConfig {
  /** 是否启用骨架屏 */
  enabled: boolean
  /** 骨架屏动画类型 */
  animation?: 'wave' | 'pulse' | 'none'
  /** 骨架屏颜色 */
  color?: string
  /** 骨架屏高亮颜色 */
  highlightColor?: string
  /** 自定义骨架屏组件 */
  customSkeleton?: Component
  /** 骨架屏显示时长 (毫秒) */
  minDisplayTime?: number
}

// ============= 虚拟滚动相关类型 =============

/**
 * 可见区域范围
 */
export interface VisibleRange {
  /** 开始索引 */
  startIndex: number
  /** 结束索引 */
  endIndex: number
  /** 可见项目数量 */
  visibleCount: number
  /** 总项目数量 */
  totalCount: number
}

/**
 * 虚拟滚动状态
 */
export interface VirtualScrollState {
  /** 是否启用虚拟滚动 */
  enabled: boolean
  /** 容器滚动位置 */
  scrollTop: number
  /** 容器高度 */
  containerHeight: number
  /** 内容总高度 */
  totalHeight: number
  /** 当前可见范围 */
  visibleRange: VisibleRange
}

/**
 * 虚拟滚动项目数据
 */
export interface VirtualScrollItem {
  /** 项目索引 */
  index: number
  /** 项目高度 */
  height: number
  /** 项目顶部位置 */
  top: number
  /** 是否在视口中 */
  inViewport: boolean
  /** 原始数据 */
  data: GridPlusItem
}

// ============= 性能相关类型 =============

/**
 * 性能级别
 */
export enum PerformanceLevel {
  /** 高性能模式 - 最佳性能，基础功能 */
  HIGH = 'high',
  /** 平衡模式 - 性能与功能平衡 */
  BALANCED = 'balanced',
  /** 功能完整模式 - 完整功能，可能影响性能 */
  FULL = 'full'
}

/**
 * 性能配置
 */
export interface PerformanceConfig {
  /** 性能级别 */
  level: PerformanceLevel
  /** 最大同时渲染项目数 */
  maxRenderItems?: number
  /** 启用 GPU 加速 */
  enableGPUAcceleration?: boolean
  /** 启用内存优化 */
  enableMemoryOptimization?: boolean
  /** 启用预渲染 */
  enablePreRendering?: boolean
  /** 使用 Web Workers */
  useWebWorkers?: boolean
}

/**
 * 性能指标
 */
export interface PerformanceMetrics {
  /** 帧率 (FPS) */
  fps: number
  /** 内存使用 (MB) */
  memoryUsage: number
  /** 渲染时间 (ms) */
  renderTime: number
  /** 布局计算时间 (ms) */
  layoutTime: number
  /** DOM 节点数量 */
  domNodeCount: number
  /** 可见项目数量 */
  visibleItemCount: number
  /** 总项目数量 */
  totalItemCount: number
  /** 最后更新时间 */
  timestamp: number
}

/**
 * 性能警告
 */
export interface PerformanceWarning {
  /** 警告类型 */
  type: PerformanceWarningType
  /** 警告消息 */
  message: string
  /** 建议操作 */
  suggestion: string
  /** 当前值 */
  currentValue: number
  /** 阈值 */
  threshold: number
}

/**
 * 性能警告类型
 */
export enum PerformanceWarningType {
  /** 低帧率 */
  LOW_FPS = 'low_fps',
  /** 高内存使用 */
  HIGH_MEMORY = 'high_memory',
  /** 渲染时间过长 */
  SLOW_RENDER = 'slow_render',
  /** DOM 节点过多 */
  TOO_MANY_NODES = 'too_many_nodes'
}

// ============= 工具类型 =============

/**
 * 位置信息
 */
export interface Position {
  x: number
  y: number
}

/**
 * 尺寸信息
 */
export interface Size {
  width: number
  height: number
}

/**
 * 矩形区域
 */
export interface Rect extends Position, Size {}

/**
 * 变换信息
 */
export interface Transform {
  /** 平移 */
  translate: Position
  /** 缩放 */
  scale: number
  /** 旋转角度 */
  rotate: number
}

// ============= 事件类型 =============

/**
 * 网格项目事件数据
 */
export interface GridItemEvent {
  /** 项目ID */
  itemId: string
  /** 项目数据 */
  item: GridPlusItem
  /** 事件类型 */
  eventType: string
  /** 时间戳 */
  timestamp: number
}

/**
 * 拖拽事件数据
 */
export interface DragEvent extends GridItemEvent {
  /** 拖拽开始位置 */
  startPosition: Position
  /** 当前位置 */
  currentPosition: Position
  /** 拖拽偏移 */
  offset: Position
}

/**
 * 调整大小事件数据
 */
export interface ResizeEvent extends GridItemEvent {
  /** 原始尺寸 */
  originalSize: Size
  /** 当前尺寸 */
  currentSize: Size
  /** 尺寸变化 */
  sizeChange: Size
}

// ============= 默认配置 =============

/**
 * 默认 GridPlus 配置
 */
export const DEFAULT_GRIDPLUS_CONFIG: GridPlusConfig = {
  // 继承 GridLayoutPlus 默认配置
  colNum: 12,
  rowHeight: 100,
  isDraggable: true,
  isResizable: true,
  isMirrored: false,
  autoSize: true,
  verticalCompact: true,
  margin: [10, 10],
  useCssTransforms: true,
  responsive: false,
  breakpoints: { lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 },
  cols: { lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 },
  preventCollision: false,
  useStyleCursor: true,
  restoreOnDrag: false,

  // GridPlus 扩展配置
  enableVirtualScroll: false,
  virtualScrollBuffer: 3,
  estimatedItemHeight: 200,
  enableLazyLoad: false,
  lazyLoadThreshold: 100,
  lazyLoadRootMargin: '50px',
  performanceLevel: PerformanceLevel.BALANCED,
  enablePerformanceMonitoring: false,
  batchRenderSize: 50,
  debounceDelay: 100,
  throttleDelay: 16
}

/**
 * 默认骨架屏配置
 */
export const DEFAULT_SKELETON_CONFIG: SkeletonConfig = {
  enabled: true,
  animation: 'wave',
  color: '#f0f0f0',
  highlightColor: '#f5f5f5',
  minDisplayTime: 300
}

/**
 * 默认性能配置
 */
export const DEFAULT_PERFORMANCE_CONFIG: PerformanceConfig = {
  level: PerformanceLevel.BALANCED,
  maxRenderItems: 100,
  enableGPUAcceleration: true,
  enableMemoryOptimization: true,
  enablePreRendering: false,
  useWebWorkers: false
}

// ============= 类型导出 =============

// 兼容性类型别名
export type {
  GridPlusItem as GridItem,
  GridPlusConfig as GridConfig,
  GridPlusProps as GridProps,
  GridPlusEmits as GridEmits
}
