/**
 * 懒加载相关类型定义
 */

import type { Component } from 'vue'
import type { GridPlusItem } from './gridplus-types'

/**
 * 懒加载状态枚举
 */
export enum LazyLoadState {
  /** 未初始化状态 */
  IDLE = 'idle',
  /** 等待加载状态 */
  PENDING = 'pending',
  /** 显示骨架屏状态 */
  SKELETON = 'skeleton',
  /** 正在加载状态 */
  LOADING = 'loading',
  /** 加载成功状态 */
  LOADED = 'loaded',
  /** 加载失败状态 */
  ERROR = 'error',
  /** 加载超时状态 */
  TIMEOUT = 'timeout',
  /** 已取消状态 */
  CANCELLED = 'cancelled'
}

/**
 * 懒加载配置接口
 */
export interface LazyLoadConfig {
  /** 是否启用懒加载 */
  enabled: boolean
  /** 根元素选择器，用于Intersection Observer */
  root?: Element | null
  /** 触发加载的距离阈值（像素） */
  threshold: number
  /** 根边距，扩展或收缩根的边界框 */
  rootMargin: string
  /** 预加载策略 */
  preloadStrategy: PreloadStrategy
  /** 重试配置 */
  retryConfig: RetryConfig
  /** 超时时间（毫秒） */
  timeout: number
  /** 并发加载数量限制 */
  concurrentLimit: number
  /** 是否启用优先级加载 */
  enablePriorityLoading: boolean
  /** 缓存策略 */
  cacheStrategy: CacheStrategy
}

/**
 * 预加载策略
 */
export enum PreloadStrategy {
  /** 不预加载 */
  NONE = 'none',
  /** 预加载下一个 */
  NEXT = 'next',
  /** 预加载相邻项目 */
  ADJACENT = 'adjacent',
  /** 智能预加载（基于滚动方向和速度） */
  SMART = 'smart'
}

/**
 * 重试配置
 */
export interface RetryConfig {
  /** 最大重试次数 */
  maxRetries: number
  /** 重试延迟（毫秒） */
  retryDelay: number
  /** 重试延迟递增策略 */
  backoffStrategy: 'linear' | 'exponential'
  /** 最大重试延迟（毫秒） */
  maxRetryDelay: number
}

/**
 * 缓存策略
 */
export enum CacheStrategy {
  /** 不缓存 */
  NONE = 'none',
  /** 内存缓存 */
  MEMORY = 'memory',
  /** 本地存储缓存 */
  LOCALSTORAGE = 'localStorage',
  /** 会话存储缓存 */
  SESSIONSTORAGE = 'sessionStorage',
  /** 索引数据库缓存 */
  INDEXEDDB = 'indexedDB'
}

/**
 * 懒加载项目数据
 */
export interface LazyLoadItemData {
  /** 项目ID */
  id: string
  /** 当前状态 */
  state: LazyLoadState
  /** 加载优先级（1-10，数字越小优先级越高） */
  priority: number
  /** 重试次数 */
  retryCount: number
  /** 加载开始时间 */
  loadStartTime?: number
  /** 加载结束时间 */
  loadEndTime?: number
  /** 错误信息 */
  error?: Error
  /** 加载的数据 */
  loadedData?: any
  /** 是否在视口中 */
  inViewport: boolean
  /** Intersection Observer 条目 */
  observerEntry?: IntersectionObserverEntry
}

/**
 * 懒加载内容提供者接口
 */
export interface LazyLoadContentProvider {
  /** 加载内容的异步函数 */
  loadContent: (item: GridPlusItem) => Promise<any>
  /** 预加载内容的异步函数 */
  preloadContent?: (item: GridPlusItem) => Promise<any>
  /** 取消加载的函数 */
  cancelLoad?: (item: GridPlusItem) => void
  /** 清理资源的函数 */
  cleanup?: (item: GridPlusItem) => void
}

/**
 * 骨架屏配置
 */
export interface SkeletonConfig {
  /** 是否启用骨架屏 */
  enabled: boolean
  /** 骨架屏类型 */
  type: SkeletonType
  /** 动画类型 */
  animation: SkeletonAnimation
  /** 骨架屏颜色配置 */
  colors: SkeletonColors
  /** 自定义骨架屏组件 */
  customComponent?: Component
  /** 骨架屏最小显示时间（毫秒） */
  minDisplayTime: number
  /** 骨架屏形状配置 */
  shapes: SkeletonShape[]
  /** 是否自适应内容 */
  adaptive: boolean
}

/**
 * 骨架屏类型
 */
export enum SkeletonType {
  /** 默认类型 */
  DEFAULT = 'default',
  /** 卡片类型 */
  CARD = 'card',
  /** 列表类型 */
  LIST = 'list',
  /** 图像类型 */
  IMAGE = 'image',
  /** 文本类型 */
  TEXT = 'text',
  /** 自定义类型 */
  CUSTOM = 'custom'
}

/**
 * 骨架屏动画类型
 */
export enum SkeletonAnimation {
  /** 无动画 */
  NONE = 'none',
  /** 波浪动画 */
  WAVE = 'wave',
  /** 脉搏动画 */
  PULSE = 'pulse',
  /** 闪烁动画 */
  BLINK = 'blink',
  /** 渐变动画 */
  GRADIENT = 'gradient'
}

/**
 * 骨架屏颜色配置
 */
export interface SkeletonColors {
  /** 基础颜色 */
  base: string
  /** 高亮颜色 */
  highlight: string
  /** 动画颜色 */
  animation?: string
}

/**
 * 骨架屏形状配置
 */
export interface SkeletonShape {
  /** 形状类型 */
  type: 'rect' | 'circle' | 'text'
  /** 宽度 */
  width: string | number
  /** 高度 */
  height: string | number
  /** 位置 */
  position?: {
    top?: string | number
    left?: string | number
    right?: string | number
    bottom?: string | number
  }
  /** 圆角 */
  borderRadius?: string | number
}

/**
 * 懒加载管理器接口
 */
export interface LazyLoadManager {
  /** 初始化懒加载 */
  initialize(items: GridPlusItem[], config: LazyLoadConfig): void
  /** 销毁懒加载 */
  destroy(): void
  /** 添加项目到懒加载队列 */
  addItem(item: GridPlusItem): void
  /** 从懒加载队列移除项目 */
  removeItem(itemId: string): void
  /** 更新项目状态 */
  updateItemState(itemId: string, state: LazyLoadState): void
  /** 触发项目加载 */
  loadItem(itemId: string): Promise<void>
  /** 预加载项目 */
  preloadItem(itemId: string): Promise<void>
  /** 取消加载 */
  cancelLoad(itemId: string): void
  /** 重试加载 */
  retryLoad(itemId: string): Promise<void>
  /** 获取项目状态 */
  getItemState(itemId: string): LazyLoadState
  /** 获取加载统计 */
  getLoadingStats(): LazyLoadStats
}

/**
 * 懒加载统计信息
 */
export interface LazyLoadStats {
  /** 总项目数 */
  totalItems: number
  /** 已加载项目数 */
  loadedItems: number
  /** 加载中项目数 */
  loadingItems: number
  /** 失败项目数 */
  errorItems: number
  /** 平均加载时间 */
  averageLoadTime: number
  /** 缓存命中率 */
  cacheHitRate: number
  /** 内存使用量 */
  memoryUsage: number
}

/**
 * 懒加载事件类型
 */
export interface LazyLoadEvents {
  /** 项目状态变化 */
  'state-change': (itemId: string, state: LazyLoadState, previousState: LazyLoadState) => void
  /** 加载开始 */
  'load-start': (itemId: string) => void
  /** 加载成功 */
  'load-success': (itemId: string, data: any, loadTime: number) => void
  /** 加载失败 */
  'load-error': (itemId: string, error: Error) => void
  /** 加载超时 */
  'load-timeout': (itemId: string) => void
  /** 项目进入视口 */
  'enter-viewport': (itemId: string) => void
  /** 项目离开视口 */
  'leave-viewport': (itemId: string) => void
  /** 统计信息更新 */
  'stats-update': (stats: LazyLoadStats) => void
}

/**
 * 懒加载优化选项
 */
export interface LazyLoadOptimizations {
  /** 使用 Intersection Observer */
  useIntersectionObserver: boolean
  /** 启用优先级队列 */
  enablePriorityQueue: boolean
  /** 批量处理大小 */
  batchSize: number
  /** 使用 Web Workers */
  useWebWorkers: boolean
  /** 启用预测预加载 */
  enablePredictivePreloading: boolean
  /** 内存压力监控 */
  memoryPressureMonitoring: boolean
}

/**
 * 默认懒加载配置
 */
export const DEFAULT_LAZY_LOAD_CONFIG: LazyLoadConfig = {
  enabled: false,
  threshold: 100,
  rootMargin: '50px',
  preloadStrategy: PreloadStrategy.ADJACENT,
  retryConfig: {
    maxRetries: 3,
    retryDelay: 1000,
    backoffStrategy: 'exponential',
    maxRetryDelay: 10000
  },
  timeout: 30000,
  concurrentLimit: 3,
  enablePriorityLoading: true,
  cacheStrategy: CacheStrategy.MEMORY
}

/**
 * 默认骨架屏配置
 */
export const DEFAULT_SKELETON_CONFIG: SkeletonConfig = {
  enabled: true,
  type: SkeletonType.DEFAULT,
  animation: SkeletonAnimation.WAVE,
  colors: {
    base: '#f0f0f0',
    highlight: '#f5f5f5'
  },
  minDisplayTime: 300,
  shapes: [
    {
      type: 'rect',
      width: '100%',
      height: '20px'
    }
  ],
  adaptive: true
}

/**
 * 默认懒加载优化配置
 */
export const DEFAULT_LAZY_LOAD_OPTIMIZATIONS: LazyLoadOptimizations = {
  useIntersectionObserver: true,
  enablePriorityQueue: true,
  batchSize: 5,
  useWebWorkers: false,
  enablePredictivePreloading: true,
  memoryPressureMonitoring: true
}
