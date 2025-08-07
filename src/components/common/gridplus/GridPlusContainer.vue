<!--
  GridPlus 高性能网格容器组件
  支持虚拟滚动、懒加载、骨架屏等高级功能
  完全兼容 GridLayoutPlus 的所有 Props 和 Events
-->
<template>
  <div
    ref="containerRef"
    class="gridplus-container"
    :class="{
      'gridplus--readonly': readonly,
      'gridplus--dark': isDarkTheme,
      'gridplus--virtual-scroll': enableVirtualScroll,
      'gridplus--lazy-load': enableLazyLoad,
      'gridplus--dragging': isDragging,
      'gridplus--performance-monitoring': performanceMonitoringEnabled
    }"
    :style="containerStyle"
  >
    <!-- 性能监控面板 (开发模式) -->
    <div v-if="showPerformancePanel" class="gridplus-performance-panel">
      <div class="performance-metrics">
        <div class="metric">
          <span class="label">FPS:</span>
          <span class="value" :class="{ warning: performanceMetrics.fps < 30 }">
            {{ performanceMetrics.fps }}
          </span>
        </div>
        <div class="metric">
          <span class="label">内存:</span>
          <span class="value">{{ performanceMetrics.memoryUsage.toFixed(1) }}MB</span>
        </div>
        <div class="metric">
          <span class="label">渲染:</span>
          <span class="value">{{ performanceMetrics.renderTime.toFixed(1) }}ms</span>
        </div>
        <div class="metric">
          <span class="label">项目:</span>
          <span class="value">{{ performanceMetrics.visibleItemCount }}/{{ performanceMetrics.totalItemCount }}</span>
        </div>
      </div>
    </div>

    <!-- 虚拟滚动容器 -->
    <div v-if="enableVirtualScroll" class="gridplus-virtual-container" :style="virtualContainerStyle">
      <!-- 虚拟滚动项目 -->
      <GridPlusItem
        v-for="(item, index) in renderItems"
        :key="item.i"
        :item="item"
        :index="virtualState.renderStartIndex + index"
        :readonly="readonly"
        :enable-lazy-load="enableLazyLoad"
        :skeleton-config="skeletonConfig"
        :style="getItemStyle(item, virtualState.renderStartIndex + index)"
        :data-virtual-index="virtualState.renderStartIndex + index"
        :data-item-id="item.i"
        @resize="handleItemResize"
        @move="handleItemMove"
        @lazy-load-state-change="handleLazyLoadStateChange"
      >
        <slot :item="item" :index="virtualState.renderStartIndex + index">
          <!-- 默认内容 -->
          <div class="default-item-content">
            <div class="item-type">{{ item.type || $t('common.component') }}</div>
            <div class="item-id">{{ item.i }}</div>
          </div>
        </slot>
      </GridPlusItem>
    </div>

    <!-- 常规网格容器 -->
    <div v-else class="gridplus-grid-container" :style="gridContainerStyle">
      <GridPlusItem
        v-for="item in internalLayout"
        :key="item.i"
        :item="item"
        :readonly="readonly"
        :enable-lazy-load="enableLazyLoad"
        :skeleton-config="skeletonConfig"
        :style="getItemStyle(item)"
        :data-item-id="item.i"
        @resize="handleItemResize"
        @move="handleItemMove"
        @lazy-load-state-change="handleLazyLoadStateChange"
      >
        <slot :item="item">
          <!-- 默认内容 -->
          <div class="default-item-content">
            <div class="item-type">{{ item.type || $t('common.component') }}</div>
            <div class="item-id">{{ item.i }}</div>
          </div>
        </slot>
      </GridPlusItem>
    </div>

    <!-- 拖拽指示器 -->
    <div v-if="!readonly && isDragging" class="gridplus-drag-indicator" :style="dragIndicatorStyle" />

    <!-- 性能警告提示 -->
    <n-alert
      v-if="performanceWarning"
      type="warning"
      class="gridplus-performance-warning"
      :title="performanceWarning.message"
      closable
      @close="performanceWarning = null"
    >
      {{ performanceWarning.suggestion }}
    </n-alert>
  </div>
</template>

<script setup lang="ts">
/**
 * GridPlus 主容器组件
 * 整合虚拟滚动、懒加载、性能监控等功能
 */
import { ref, computed, watch, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { NAlert } from 'naive-ui'

// 类型导入
import type { GridPlusProps, GridPlusEmits, PerformanceMetrics, PerformanceWarning } from './types/gridplus-types'

// Composables 导入
import { useGridPlusCore } from './composables/useGridPlusCore'
import { useVirtualScroll } from './composables/useVirtualScroll'
import { useLazyLoad } from './composables/useLazyLoad'

// 组件导入
import GridPlusItem from './components/GridPlusItem.vue'

// Props 定义
interface Props extends GridPlusProps {}

const props = withDefaults(defineProps<Props>(), {
  layout: () => [],
  readonly: false,
  showGrid: true,
  showDropZone: false,
  showTitle: false,
  config: () => ({}),
  enableVirtualScroll: false,
  enableLazyLoad: false,
  enablePerformanceMonitoring: false
})

// Events 定义
interface Emits extends GridPlusEmits {}
const emit = defineEmits<Emits>()

// 国际化
const { t } = useI18n()

// ============= Composables 初始化 =============

// 核心功能
const {
  internalLayout,
  containerSize,
  isDragging,
  isResizing,
  themeStore,
  gridConfig,
  calculator,
  performanceMonitor,
  computed: coreComputed,
  addItem,
  removeItem,
  updateItem,
  clearLayout,
  getItem,
  getAllItems,
  compactLayout,
  adjustToContainer,
  validateLayout
} = useGridPlusCore(props, emit)

// 虚拟滚动
const {
  virtualState,
  visibleItems,
  renderItems,
  containerRef: virtualContainerRef,
  enabled: virtualScrollEnabled,
  scrollToIndex,
  scrollToItem,
  updateItemHeight,
  refresh: refreshVirtualScroll
} = useVirtualScroll(internalLayout, gridConfig, emit)

// 懒加载
const {
  lazyLoadItems,
  enabled: lazyLoadEnabled,
  stats: lazyLoadStats,
  containerRef: lazyLoadContainerRef,
  loadItem,
  preloadItem,
  getItemState,
  setItemState
} = useLazyLoad(internalLayout, gridConfig, emit)

// ============= 状态管理 =============

/** 容器引用 - 统一管理 */
const containerRef = ref<HTMLElement | null>(null)

/** 性能指标 */
const performanceMetrics = ref<PerformanceMetrics>({
  fps: 60,
  memoryUsage: 0,
  renderTime: 0,
  layoutTime: 0,
  domNodeCount: 0,
  visibleItemCount: 0,
  totalItemCount: 0,
  timestamp: Date.now()
})

/** 性能警告 */
const performanceWarning = ref<PerformanceWarning | null>(null)

// ============= 计算属性 =============

/** 是否为暗色主题 */
const isDarkTheme = coreComputed.isDarkTheme

/** 是否启用虚拟滚动 */
const enableVirtualScroll = computed(() => props.enableVirtualScroll || gridConfig.value.enableVirtualScroll || false)

/** 是否启用懒加载 */
const enableLazyLoad = computed(() => props.enableLazyLoad || gridConfig.value.enableLazyLoad || false)

/** 是否启用性能监控 */
const performanceMonitoringEnabled = computed(
  () => props.enablePerformanceMonitoring || gridConfig.value.enablePerformanceMonitoring || false
)

/** 是否显示性能面板 */
const showPerformancePanel = computed(() => import.meta.env.DEV && performanceMonitoringEnabled.value)

/** 容器样式 */
const containerStyle = computed(() => ({
  ...coreComputed.containerStyle.value,
  position: 'relative',
  width: '100%',
  minHeight: enableVirtualScroll.value ? '400px' : 'auto'
}))

/** 虚拟滚动容器样式 */
const virtualContainerStyle = computed(() => {
  if (!enableVirtualScroll.value) return {}

  return {
    height: `${virtualState.value.totalHeight}px`,
    position: 'relative'
  }
})

/** 常规网格容器样式 */
const gridContainerStyle = computed(() => {
  if (enableVirtualScroll.value) return {}

  return {
    height: `${coreComputed.gridHeight.value}px`,
    position: 'relative'
  }
})

/** 拖拽指示器样式 */
const dragIndicatorStyle = computed(() => {
  // TODO: 实现拖拽指示器样式逻辑
  return {
    position: 'absolute',
    border: '2px dashed var(--primary-color)',
    backgroundColor: 'var(--primary-color-opacity)',
    pointerEvents: 'none',
    zIndex: 1000
  }
})

// ============= 方法实现 =============

/**
 * 获取项目样式
 */
const getItemStyle = (item: any, virtualIndex?: number) => {
  const rect = calculator.value.calcItemPixelPosition(item)

  const style: Record<string, string> = {
    position: 'absolute',
    left: `${rect.x}px`,
    top: `${rect.y}px`,
    width: `${rect.width}px`,
    height: `${rect.height}px`,
    transform: 'translate3d(0, 0, 0)', // 启用GPU加速
    willChange: isDragging.value ? 'transform' : 'auto'
  }

  // 如果启用虚拟滚动，需要调整位置
  if (enableVirtualScroll.value && virtualIndex !== undefined) {
    // 虚拟滚动的位置计算逻辑
    style.transform = `translate3d(0, ${rect.y}px, 0)`
  }

  return style
}

/**
 * 处理项目大小调整
 */
const handleItemResize = (itemId: string, newWidth: number, newHeight: number) => {
  // 更新项目尺寸
  const item = getItem(itemId)
  if (item) {
    // 将像素尺寸转换为网格单位
    const colWidth = calculator.value.getColWidth()
    const rowHeight = gridConfig.value.rowHeight

    const newW = Math.max(1, Math.round(newWidth / colWidth))
    const newH = Math.max(1, Math.round(newHeight / rowHeight))

    updateItem(itemId, { w: newW, h: newH })

    // 如果启用虚拟滚动，更新项目高度缓存
    if (enableVirtualScroll.value) {
      const itemIndex = internalLayout.value.findIndex(i => i.i === itemId)
      if (itemIndex !== -1) {
        updateItemHeight(itemIndex, newHeight)
      }
    }
  }

  // 触发事件
  emit('item-resized', itemId, newHeight, newWidth, newHeight, newWidth)
}

/**
 * 处理项目移动
 */
const handleItemMove = (itemId: string, newX: number, newY: number) => {
  // 更新项目位置
  updateItem(itemId, { x: newX, y: newY })

  // 触发事件
  emit('item-moved', itemId, newX, newY)
}

/**
 * 处理懒加载状态变化
 */
const handleLazyLoadStateChange = (itemId: string, state: any) => {
  setItemState(itemId, state)
}

/**
 * 初始化容器
 */
const initializeContainer = () => {
  if (!containerRef.value) return

  // 统一设置容器引用
  if (virtualContainerRef) {
    virtualContainerRef.value = containerRef.value
  }
  if (lazyLoadContainerRef) {
    lazyLoadContainerRef.value = containerRef.value
  }

  // 获取容器尺寸
  const rect = containerRef.value.getBoundingClientRect()
  adjustToContainer({
    width: rect.width,
    height: rect.height
  })

  if (import.meta.env.DEV) {
    console.log('🏗️ GridPlus - 容器初始化:', {
      size: { width: rect.width, height: rect.height },
      virtualScroll: enableVirtualScroll.value,
      lazyLoad: enableLazyLoad.value,
      itemCount: internalLayout.value.length
    })
  }
}

// ============= 生命周期和监听器 =============

/** 监听容器引用变化 */
watch(containerRef, newContainer => {
  if (newContainer) {
    nextTick(() => {
      initializeContainer()
    })
  }
})

/** 监听性能监控状态 */
watch(performanceMonitoringEnabled, enabled => {
  if (enabled && performanceMonitor) {
    performanceMonitor.on('update', (metrics: PerformanceMetrics) => {
      performanceMetrics.value = metrics
      emit('performance-metrics', metrics)
    })

    performanceMonitor.on('warning', (warning: PerformanceWarning) => {
      performanceWarning.value = warning
      emit('performance-warning', warning)
    })
  }
})

// ============= 暴露的方法 =============
defineExpose({
  // 核心方法
  addItem,
  removeItem,
  updateItem,
  clearLayout,
  getItem,
  getAllItems,
  getLayout: () => internalLayout.value,
  compactLayout,
  validateLayout,

  // 虚拟滚动方法
  scrollToIndex,
  scrollToItem,
  refreshVirtualScroll,

  // 懒加载方法
  loadItem,
  preloadItem,
  getItemState,

  // 工具方法
  adjustToContainer,

  // 状态访问
  getVirtualState: () => virtualState.value,
  getLazyLoadStats: () => lazyLoadStats.value,
  getPerformanceMetrics: () => performanceMetrics.value
})
</script>

<style scoped>
.gridplus-container {
  position: relative;
  width: 100%;
  background: var(--body-color);
  transition: all 0.2s ease;
}

.gridplus-container.gridplus--readonly {
  pointer-events: none;
}

.gridplus-container.gridplus--dragging {
  cursor: grabbing;
  user-select: none;
}

/* 虚拟滚动容器样式 */
.gridplus-virtual-container {
  position: relative;
  overflow-y: auto;
  overflow-x: hidden;
}

/* 常规网格容器样式 */
.gridplus-grid-container {
  position: relative;
}

/* 性能监控面板样式 */
.gridplus-performance-panel {
  position: fixed;
  top: 10px;
  right: 10px;
  background: var(--card-color);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 12px;
  box-shadow: var(--box-shadow);
  z-index: 9999;
  font-size: 12px;
  min-width: 200px;
}

.performance-metrics {
  display: grid;
  gap: 8px;
}

.metric {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.metric .label {
  color: var(--text-color-2);
  font-weight: 500;
}

.metric .value {
  color: var(--text-color);
  font-weight: bold;
  font-family: 'Courier New', monospace;
}

.metric .value.warning {
  color: var(--warning-color);
}

/* 拖拽指示器样式 */
.gridplus-drag-indicator {
  border-radius: 4px;
  opacity: 0.6;
  transition: all 0.2s ease;
}

/* 性能警告样式 */
.gridplus-performance-warning {
  position: fixed;
  top: 60px;
  right: 10px;
  max-width: 300px;
  z-index: 9998;
}

/* 默认项目内容样式 */
.default-item-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 16px;
  color: var(--text-color-2);
  text-align: center;
  background: var(--card-color);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  box-shadow: var(--box-shadow);
}

.item-type {
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 8px;
}

.item-id {
  font-size: 12px;
  opacity: 0.7;
  font-family: 'Courier New', monospace;
}

/* 暗色主题适配 */
.gridplus--dark .default-item-content {
  background: var(--card-color);
  border-color: var(--border-color);
  color: var(--text-color);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .gridplus-performance-panel {
    top: 5px;
    right: 5px;
    padding: 8px;
    font-size: 11px;
    min-width: 150px;
  }

  .gridplus-performance-warning {
    top: 50px;
    right: 5px;
    max-width: 250px;
  }
}
</style>
