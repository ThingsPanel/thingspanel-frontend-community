/**
 * 虚拟滚动相关类型定义
 */

import type { GridPlusItem } from './gridplus-types'

/**
 * 虚拟滚动配置接口
 */
export interface VirtualScrollConfig {
  /** 是否启用虚拟滚动 */
  enabled: boolean
  /** 容器高度 */
  containerHeight: number
  /** 项目高度估算函数 */
  estimateItemHeight?: (item: GridPlusItem, index: number) => number
  /** 默认项目高度 */
  defaultItemHeight: number
  /** 缓冲区大小（视口外预渲染的项目数量） */
  bufferSize: number
  /** 最小缓存项目数 */
  minCacheSize: number
  /** 最大缓存项目数 */
  maxCacheSize: number
  /** 是否启用平滑滚动 */
  smoothScrolling: boolean
  /** 滚动防抖延迟 */
  scrollDebounce: number
  /** 是否启用预渲染 */
  preRender: boolean
  /** 预渲染项目数 */
  preRenderCount: number
}

/**
 * 虚拟滚动项目信息
 */
export interface VirtualScrollItemData {
  /** 项目索引 */
  index: number
  /** 项目高度 */
  height: number
  /** 项目顶部偏移 */
  top: number
  /** 项目底部偏移 */
  bottom: number
  /** 是否在视口中 */
  inViewport: boolean
  /** 是否在缓冲区中 */
  inBuffer: boolean
  /** 是否已渲染 */
  rendered: boolean
  /** 原始数据 */
  data: GridPlusItem
}

/**
 * 虚拟滚动状态
 */
export interface VirtualScrollState {
  /** 是否已初始化 */
  initialized: boolean
  /** 容器滚动位置 */
  scrollTop: number
  /** 上次滚动位置 */
  lastScrollTop: number
  /** 容器高度 */
  containerHeight: number
  /** 内容总高度 */
  totalHeight: number
  /** 可见区域开始索引 */
  startIndex: number
  /** 可见区域结束索引 */
  endIndex: number
  /** 渲染区域开始索引（包含缓冲区） */
  renderStartIndex: number
  /** 渲染区域结束索引（包含缓冲区） */
  renderEndIndex: number
  /** 当前渲染的项目数量 */
  renderCount: number
  /** 滚动方向 */
  scrollDirection: 'up' | 'down' | 'none'
  /** 是否正在滚动 */
  isScrolling: boolean
  /** 滚动速度 (px/ms) */
  scrollVelocity: number
}

/**
 * 虚拟滚动视口信息
 */
export interface VirtualScrollViewport {
  /** 视口顶部位置 */
  top: number
  /** 视口底部位置 */
  bottom: number
  /** 视口高度 */
  height: number
  /** 可见项目索引范围 */
  visibleRange: {
    start: number
    end: number
  }
  /** 渲染项目索引范围（包含缓冲区） */
  renderRange: {
    start: number
    end: number
  }
}

/**
 * 虚拟滚动缓存管理器接口
 */
export interface VirtualScrollCache {
  /** 获取项目高度 */
  getItemHeight(index: number): number | undefined
  /** 设置项目高度 */
  setItemHeight(index: number, height: number): void
  /** 获取项目顶部位置 */
  getItemTop(index: number): number | undefined
  /** 计算总高度 */
  getTotalHeight(): number
  /** 清理缓存 */
  clear(): void
  /** 获取缓存大小 */
  getSize(): number
  /** 是否超出最大缓存限制 */
  isOverLimit(): boolean
}

/**
 * 虚拟滚动性能统计
 */
export interface VirtualScrollPerformance {
  /** 渲染帧率 */
  fps: number
  /** 滚动延迟 */
  scrollLatency: number
  /** 渲染时间 */
  renderTime: number
  /** 缓存命中率 */
  cacheHitRate: number
  /** 内存使用量 */
  memoryUsage: number
  /** 滚动平滑度得分 */
  smoothnessScore: number
}

/**
 * 虚拟滚动事件类型
 */
export interface VirtualScrollEvents {
  /** 滚动开始 */
  'scroll-start': (state: VirtualScrollState) => void
  /** 滚动中 */
  scroll: (state: VirtualScrollState) => void
  /** 滚动结束 */
  'scroll-end': (state: VirtualScrollState) => void
  /** 可见范围变化 */
  'visible-range-change': (range: VirtualScrollViewport) => void
  /** 项目进入视口 */
  'item-enter-viewport': (index: number, item: GridPlusItem) => void
  /** 项目离开视口 */
  'item-leave-viewport': (index: number, item: GridPlusItem) => void
  /** 性能数据更新 */
  'performance-update': (performance: VirtualScrollPerformance) => void
}

/**
 * 虚拟滚动算法选项
 */
export interface VirtualScrollAlgorithm {
  /** 算法类型 */
  type: 'fixed' | 'dynamic' | 'estimated'
  /** 高度计算策略 */
  heightStrategy: 'measured' | 'estimated' | 'cached'
  /** 位置计算策略 */
  positionStrategy: 'calculated' | 'measured'
  /** 是否启用预测渲染 */
  predictiveRendering: boolean
}

/**
 * 虚拟滚动优化选项
 */
export interface VirtualScrollOptimizations {
  /** 使用 RAF 优化渲染 */
  useRequestAnimationFrame: boolean
  /** 使用 Intersection Observer 优化 */
  useIntersectionObserver: boolean
  /** 启用惰性高度计算 */
  lazyHeightCalculation: boolean
  /** 启用批量 DOM 更新 */
  batchDOMUpdates: boolean
  /** 回收 DOM 节点 */
  recycleDOMNodes: boolean
  /** 使用 CSS transform 定位 */
  useCSSTransform: boolean
}

/**
 * 默认虚拟滚动配置
 */
export const DEFAULT_VIRTUAL_SCROLL_CONFIG: VirtualScrollConfig = {
  enabled: false,
  containerHeight: 400,
  defaultItemHeight: 100,
  bufferSize: 3,
  minCacheSize: 20,
  maxCacheSize: 200,
  smoothScrolling: true,
  scrollDebounce: 10,
  preRender: false,
  preRenderCount: 2
}

/**
 * 默认虚拟滚动算法配置
 */
export const DEFAULT_VIRTUAL_SCROLL_ALGORITHM: VirtualScrollAlgorithm = {
  type: 'dynamic',
  heightStrategy: 'measured',
  positionStrategy: 'calculated',
  predictiveRendering: true
}

/**
 * 默认虚拟滚动优化配置
 */
export const DEFAULT_VIRTUAL_SCROLL_OPTIMIZATIONS: VirtualScrollOptimizations = {
  useRequestAnimationFrame: true,
  useIntersectionObserver: true,
  lazyHeightCalculation: true,
  batchDOMUpdates: true,
  recycleDOMNodes: true,
  useCSSTransform: true
}
