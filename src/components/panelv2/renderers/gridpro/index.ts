/**
 * GridPro 渲染器模块入口
 * 导出所有 GridPro 相关的组件、类型和工具
 */

// 内部导入
import { GridProRendererFactory } from './GridProRendererFactory'

// 主要组件
export { default as GridProRenderer } from './GridProRenderer.vue'
export { default as GridProToolbar } from './GridProToolbar.vue'
export { default as GridProContainer } from './components/GridProContainer.vue'
export { default as GridProItem } from './components/GridProItem.vue'

// 工厂和适配器
export { 
  GridProRendererFactory,
  GridProRendererImpl
} from './GridProRendererFactory'
export { GridProAdapter } from './adapters/GridProAdapter'

// 类型定义
export type {
  GridProConfig,
  GridProItem,
  GridProPreset,
  GridProMetrics,
  DragState,
  ResizeState,
  ResizeHandle,
  AnimationConfig,
  GestureData,
  KeyboardShortcuts,
  VirtualizationConfig,
  Rectangle
} from './types/gridpro'

// 核心算法和工具
export { 
  GridCalculator,
  CollisionDetector,
  LayoutCompactor
} from './utils/gridAlgorithms'

export {
  EasingUtils,
  VectorUtils,
  MathUtils,
  InterpolationUtils
} from './utils/mathUtils'

export {
  BatchUpdateManager,
  PerformanceMonitor,
  ObjectPool,
  VirtualizationHelper,
  createThrottledUpdater,
  createDebouncedUpdater,
  createBatchUpdater
} from './utils/performanceHelpers'

// Composables
export { useGridProLayout } from './composables/useGridProLayout'
export { useGridProDrag } from './composables/useGridProDrag'
export { useGridProResize } from './composables/useGridProResize'
export { useGridProAnimation } from './composables/useGridProAnimation'
export { useGridProGesture } from './composables/useGridProGesture'
export { useGridProVirtualization } from './composables/useGridProVirtualization'

// 配置和预设
export { 
  createDefaultGridProConfig,
  GRIDPRO_PRESETS,
  RESPONSIVE_BREAKPOINTS
} from './types/gridpro'

// 性能相关导出
export {
  PERFORMANCE_PRESETS,
  detectOptimalPreset,
  applyPerformancePreset,
  createAdaptivePerformanceConfig
} from './performance'

// 常量
export const GRIDPRO_VERSION = '1.0.0'
export const GRIDPRO_NAME = 'GridPro Renderer'

/**
 * GridPro 渲染器信息
 */
export const GRIDPRO_INFO = {
  name: GRIDPRO_NAME,
  version: GRIDPRO_VERSION,
  description: '高性能网格布局渲染器，支持拖拽、调整大小、虚拟化等功能',
  author: 'ThingsPanel Team',
  license: 'MIT',
  features: [
    '现代 Web API 支持 (Pointer Events, ResizeObserver, IntersectionObserver)',
    '高性能虚拟化渲染',
    '流畅的拖拽和调整大小',
    '@vueuse/motion 动画系统',
    '高级手势识别',
    '多选和批量操作',
    '键盘快捷键支持',
    '响应式设计',
    '性能监控和调试',
    '完整的 TypeScript 支持'
  ],
  dependencies: [
    '@vueuse/core',
    '@vueuse/motion', 
    '@vueuse/gesture',
    'vue (>=3.0)',
    'naive-ui'
  ]
} as const

/**
 * 快速创建 GridPro 渲染器实例
 */
export function createGridProRenderer(config?: Partial<GridProConfig>) {
  return factory.create({
    type: 'gridpro',
    gridpro: config
  })
}

/**
 * 获取 GridPro 渲染器预设配置
 */
export function getGridProPreset(presetName: keyof typeof GRIDPRO_PRESETS) {
  const factory = new GridProRendererFactory()
  const renderer = factory.create()
  const presets = renderer.getConfigPresets()
  return presets[presetName] || null
}

/**
 * 检查 GridPro 渲染器兼容性
 */
export function checkGridProCompatibility() {
  return factory.checkCompatibility()
}

/**
 * 获取性能建议
 */
export function getGridProPerformanceRecommendations(itemCount: number) {
  const renderer = new GridProRendererImpl()
  return renderer.getPerformanceRecommendations(itemCount)
}

/**
 * 验证 GridPro 配置
 */
export function validateGridProConfig(config: Partial<GridProConfig>): boolean {
  const renderer = new GridProRendererImpl()
  return renderer.validateConfig(config)
}

// 创建并导出工厂实例
const factory = new GridProRendererFactory()
export default factory