<template>
  <div
    class="gridplus-item"
    :class="itemClasses"
    :style="itemStyles"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
  >
    <!-- 骨架屏状态 -->
    <div
      v-if="showSkeleton"
      class="gridplus-item__skeleton"
      :class="skeletonClasses"
    >
      <div class="skeleton-content">
        <div class="skeleton-header" />
        <div class="skeleton-body">
          <div class="skeleton-line" />
          <div class="skeleton-line short" />
          <div class="skeleton-line" />
        </div>
      </div>
    </div>

    <!-- 加载中状态 -->
    <div
      v-else-if="isLoading"
      class="gridplus-item__loading"
    >
      <n-spin size="small" />
      <n-text depth="2" style="margin-top: 8px">{{ $t('common.loading') }}</n-text>
    </div>

    <!-- 错误状态 -->
    <div
      v-else-if="isError"
      class="gridplus-item__error"
    >
      <n-icon size="24" color="var(--error-color)" :component="WarningOutline" />
      <n-text depth="2" style="margin-top: 8px">{{ $t('common.loadFailed') }}</n-text>
      <n-button size="tiny" type="primary" @click="retryLoad">
        {{ $t('common.retry') }}
      </n-button>
    </div>

    <!-- 正常内容 -->
    <div
      v-else
      ref="contentRef"
      class="gridplus-item__content"
    >
      <slot />
    </div>

    <!-- 调整大小手柄 -->
    <div
      v-if="!readonly && isResizable"
      class="gridplus-item__resize-handle"
      @mousedown="handleResizeStart"
      @touchstart="handleResizeStart"
    >
      <n-icon size="12" :component="ResizeOutline" />
    </div>

    <!-- 拖拽手柄 -->
    <div
      v-if="!readonly && isDraggable && showDragHandle"
      class="gridplus-item__drag-handle"
      @mousedown="handleDragStart"
      @touchstart="handleDragStart"
    >
      <n-icon size="14" :component="MoveOutline" />
    </div>

    <!-- 开发模式信息 -->
    <div
      v-if="showDebugInfo"
      class="gridplus-item__debug"
    >
      <div class="debug-info">
        <div>ID: {{ item.i }}</div>
        <div>位置: ({{ item.x }}, {{ item.y }})</div>
        <div>尺寸: {{ item.w }}×{{ item.h }}</div>
        <div v-if="enableLazyLoad">状态: {{ lazyLoadState }}</div>
        <div v-if="index !== undefined">索引: {{ index }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * GridPlus 网格项组件
 * 提供拖拽、调整大小、懒加载等功能
 */
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { NSpin, NText, NButton, NIcon } from 'naive-ui'
import { WarningOutline, ResizeOutline, MoveOutline } from '@vicons/ionicons5'
import { useI18n } from 'vue-i18n'

import type { 
  GridPlusItem,
  SkeletonConfig
} from '../types/gridplus-types'
import type { LazyLoadState } from '../types/lazy-load-types'

// Props 定义
interface Props {
  /** 网格项数据 */
  item: GridPlusItem
  /** 是否只读模式 */
  readonly?: boolean
  /** 虚拟滚动索引 */
  index?: number
  /** 是否启用懒加载 */
  enableLazyLoad?: boolean
  /** 骨架屏配置 */
  skeletonConfig?: SkeletonConfig
  /** 是否显示拖拽手柄 */
  showDragHandle?: boolean
  /** 是否显示调试信息 */
  showDebugInfo?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  readonly: false,
  enableLazyLoad: false,
  showDragHandle: false,
  showDebugInfo: false
})

// Events 定义
interface Emits {
  (e: 'resize', itemId: string, width: number, height: number): void
  (e: 'move', itemId: string, x: number, y: number): void
  (e: 'lazy-load-state-change', itemId: string, state: LazyLoadState): void
  (e: 'mouse-enter', item: GridPlusItem): void
  (e: 'mouse-leave', item: GridPlusItem): void
}

const emit = defineEmits<Emits>()

// 国际化
const { t } = useI18n()

// ============= 响应式数据 =============

/** 内容引用 */
const contentRef = ref<HTMLElement | null>(null)

/** 是否悬停 */
const isHovering = ref(false)

/** 懒加载状态 */
const lazyLoadState = ref<LazyLoadState>(
  props.item.lazyLoadState || 'idle'
)

/** 是否正在拖拽 */
const isDragging = ref(false)

/** 是否正在调整大小 */
const isResizing = ref(false)

/** Intersection Observer 实例 */
let intersectionObserver: IntersectionObserver | null = null

// ============= 计算属性 =============

/** 是否可拖拽 */
const isDraggable = computed(() => 
  !props.readonly && 
  (props.item.isDraggable !== false) && 
  !props.item.static
)

/** 是否可调整大小 */
const isResizable = computed(() => 
  !props.readonly && 
  (props.item.isResizable !== false) && 
  !props.item.static
)

/** 是否显示骨架屏 */
const showSkeleton = computed(() => 
  props.enableLazyLoad && 
  props.skeletonConfig?.enabled && 
  lazyLoadState.value === 'skeleton'
)

/** 是否正在加载 */
const isLoading = computed(() => 
  props.enableLazyLoad && 
  lazyLoadState.value === 'loading'
)

/** 是否加载错误 */
const isError = computed(() => 
  props.enableLazyLoad && 
  (lazyLoadState.value === 'error' || lazyLoadState.value === 'timeout')
)

/** 项目CSS类 */
const itemClasses = computed(() => [
  'gridplus-item',
  {
    'gridplus-item--readonly': props.readonly,
    'gridplus-item--draggable': isDraggable.value,
    'gridplus-item--resizable': isResizable.value,
    'gridplus-item--dragging': isDragging.value,
    'gridplus-item--resizing': isResizing.value,
    'gridplus-item--hovering': isHovering.value,
    'gridplus-item--static': props.item.static,
    'gridplus-item--lazy-loading': props.enableLazyLoad,
    'gridplus-item--skeleton': showSkeleton.value,
    'gridplus-item--loading': isLoading.value,
    'gridplus-item--error': isError.value,
    [`gridplus-item--type-${props.item.type || 'default'}`]: true,
    [`gridplus-item--priority-${props.item.priority || 5}`]: props.item.priority
  }
])

/** 项目样式 */
const itemStyles = computed(() => {
  const styles: Record<string, string> = {
    '--item-priority': String(props.item.priority || 5),
    '--item-opacity': props.item.skipAnimation ? '1' : 'var(--item-default-opacity, 1)'
  }

  // 自定义样式
  if (props.item.style) {
    Object.assign(styles, props.item.style)
  }

  // 懒加载透明度控制
  if (props.enableLazyLoad) {
    switch (lazyLoadState.value) {
      case 'skeleton':
        styles.opacity = '0.6'
        break
      case 'loading':
        styles.opacity = '0.8'
        break
      case 'error':
        styles.opacity = '0.5'
        break
      default:
        styles.opacity = '1'
    }
  }

  return styles
})

/** 骨架屏CSS类 */
const skeletonClasses = computed(() => {
  const animation = props.skeletonConfig?.animation || 'wave'
  return [
    'skeleton',
    `skeleton--${animation}`,
    {
      'skeleton--adaptive': props.skeletonConfig?.adaptive
    }
  ]
})

// ============= 方法实现 =============

/**
 * 处理鼠标进入
 */
const handleMouseEnter = () => {
  isHovering.value = true
  emit('mouse-enter', props.item)
}

/**
 * 处理鼠标离开
 */
const handleMouseLeave = () => {
  isHovering.value = false
  emit('mouse-leave', props.item)
}

/**
 * 处理拖拽开始
 */
const handleDragStart = (event: MouseEvent | TouchEvent) => {
  if (!isDraggable.value) return
  
  event.preventDefault()
  event.stopPropagation()
  
  isDragging.value = true
  
  // TODO: 实现拖拽逻辑
  const startPos = getEventPosition(event)
  
  const handleDragMove = (e: MouseEvent | TouchEvent) => {
    if (!isDragging.value) return
    
    const currentPos = getEventPosition(e)
    const deltaX = currentPos.x - startPos.x
    const deltaY = currentPos.y - startPos.y
    
    // 计算新位置并触发移动事件
    // 这里需要根据网格大小转换像素位置到网格位置
    // emit('move', props.item.i, newX, newY)
  }
  
  const handleDragEnd = () => {
    isDragging.value = false
    document.removeEventListener('mousemove', handleDragMove as any)
    document.removeEventListener('mouseup', handleDragEnd)
    document.removeEventListener('touchmove', handleDragMove as any)
    document.removeEventListener('touchend', handleDragEnd)
  }
  
  document.addEventListener('mousemove', handleDragMove as any)
  document.addEventListener('mouseup', handleDragEnd)
  document.addEventListener('touchmove', handleDragMove as any)
  document.addEventListener('touchend', handleDragEnd)
}

/**
 * 处理调整大小开始
 */
const handleResizeStart = (event: MouseEvent | TouchEvent) => {
  if (!isResizable.value) return
  
  event.preventDefault()
  event.stopPropagation()
  
  isResizing.value = true
  
  // TODO: 实现调整大小逻辑
  const startPos = getEventPosition(event)
  
  const handleResizeMove = (e: MouseEvent | TouchEvent) => {
    if (!isResizing.value) return
    
    const currentPos = getEventPosition(e)
    const deltaX = currentPos.x - startPos.x
    const deltaY = currentPos.y - startPos.y
    
    // 计算新尺寸并触发调整大小事件
    // emit('resize', props.item.i, newWidth, newHeight)
  }
  
  const handleResizeEnd = () => {
    isResizing.value = false
    document.removeEventListener('mousemove', handleResizeMove as any)
    document.removeEventListener('mouseup', handleResizeEnd)
    document.removeEventListener('touchmove', handleResizeMove as any)
    document.removeEventListener('touchend', handleResizeEnd)
  }
  
  document.addEventListener('mousemove', handleResizeMove as any)
  document.addEventListener('mouseup', handleResizeEnd)
  document.addEventListener('touchmove', handleResizeMove as any)
  document.addEventListener('touchend', handleResizeEnd)
}

/**
 * 获取事件位置
 */
const getEventPosition = (event: MouseEvent | TouchEvent) => {
  if ('touches' in event) {
    const touch = event.touches[0] || event.changedTouches[0]
    return { x: touch.clientX, y: touch.clientY }
  }
  return { x: event.clientX, y: event.clientY }
}

/**
 * 重试加载
 */
const retryLoad = () => {
  if (!props.enableLazyLoad) return
  
  lazyLoadState.value = 'loading'
  emit('lazy-load-state-change', props.item.i, 'loading')
  
  // 模拟重试逻辑
  setTimeout(() => {
    if (Math.random() > 0.3) { // 70% 成功率
      lazyLoadState.value = 'loaded'
    } else {
      lazyLoadState.value = 'error'
    }
    emit('lazy-load-state-change', props.item.i, lazyLoadState.value)
  }, 1000)
}

/**
 * 初始化懒加载
 */
const initializeLazyLoad = () => {
  if (!props.enableLazyLoad || !contentRef.value) return
  
  // 创建 Intersection Observer
  intersectionObserver = new IntersectionObserver(
    (entries) => {
      const entry = entries[0]
      if (entry.isIntersecting && lazyLoadState.value === 'idle') {
        // 显示骨架屏
        lazyLoadState.value = 'skeleton'
        emit('lazy-load-state-change', props.item.i, 'skeleton')
        
        // 延迟后开始加载
        setTimeout(() => {
          lazyLoadState.value = 'loading'
          emit('lazy-load-state-change', props.item.i, 'loading')
          
          // 模拟加载过程
          setTimeout(() => {
            if (Math.random() > 0.1) { // 90% 成功率
              lazyLoadState.value = 'loaded'
            } else {
              lazyLoadState.value = 'error'
            }
            emit('lazy-load-state-change', props.item.i, lazyLoadState.value)
          }, Math.random() * 2000 + 500) // 500-2500ms 加载时间
          
        }, props.skeletonConfig?.minDisplayTime || 300)
      }
    },
    {
      threshold: 0.1,
      rootMargin: '50px'
    }
  )
  
  intersectionObserver.observe(contentRef.value)
}

/**
 * 清理懒加载
 */
const cleanupLazyLoad = () => {
  if (intersectionObserver) {
    intersectionObserver.disconnect()
    intersectionObserver = null
  }
}

// ============= 生命周期 =============

/** 监听懒加载启用状态 */
watch(
  () => props.enableLazyLoad,
  (enabled) => {
    if (enabled) {
      setTimeout(() => initializeLazyLoad(), 100)
    } else {
      cleanupLazyLoad()
    }
  },
  { immediate: true }
)

/** 监听内容引用变化 */
watch(contentRef, (newRef) => {
  if (newRef && props.enableLazyLoad) {
    initializeLazyLoad()
  }
})

/** 组件挂载 */
onMounted(() => {
  if (props.enableLazyLoad) {
    setTimeout(() => initializeLazyLoad(), 100)
  }
})

/** 组件卸载 */
onBeforeUnmount(() => {
  cleanupLazyLoad()
})
</script>

<style scoped>
.gridplus-item {
  position: relative;
  background: var(--card-color);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  box-shadow: var(--box-shadow);
  transition: all 0.2s ease;
  cursor: default;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

/* 状态样式 */
.gridplus-item--hovering {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  transform: translateY(-1px);
}

.gridplus-item--draggable {
  cursor: move;
}

.gridplus-item--dragging {
  cursor: grabbing;
  transform: rotate(2deg) scale(1.02);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  z-index: 1000;
}

.gridplus-item--resizing {
  user-select: none;
}

.gridplus-item--static {
  opacity: 0.8;
  cursor: default;
}

.gridplus-item--readonly {
  cursor: default;
}

/* 内容区域 */
.gridplus-item__content {
  flex: 1;
  padding: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* 骨架屏样式 */
.gridplus-item__skeleton {
  flex: 1;
  padding: 16px;
}

.skeleton-content {
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.skeleton-header {
  height: 20px;
  background: var(--skeleton-base-color, #f0f0f0);
  border-radius: 4px;
}

.skeleton-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.skeleton-line {
  height: 12px;
  background: var(--skeleton-base-color, #f0f0f0);
  border-radius: 4px;
}

.skeleton-line.short {
  width: 70%;
}

/* 骨架屏动画 */
.skeleton--wave .skeleton-header,
.skeleton--wave .skeleton-line {
  position: relative;
  overflow: hidden;
}

.skeleton--wave .skeleton-header::after,
.skeleton--wave .skeleton-line::after {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    var(--skeleton-highlight-color, #f5f5f5),
    transparent
  );
  animation: skeleton-wave 1.5s infinite;
}

@keyframes skeleton-wave {
  to {
    left: 100%;
  }
}

.skeleton--pulse .skeleton-header,
.skeleton--pulse .skeleton-line {
  animation: skeleton-pulse 1.5s ease-in-out infinite;
}

@keyframes skeleton-pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.4;
  }
}

/* 加载和错误状态 */
.gridplus-item__loading,
.gridplus-item__error {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 16px;
  text-align: center;
  gap: 8px;
}

/* 调整大小手柄 */
.gridplus-item__resize-handle {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 16px;
  height: 16px;
  background: var(--primary-color);
  color: white;
  cursor: se-resize;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px 0 8px 0;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.gridplus-item:hover .gridplus-item__resize-handle {
  opacity: 1;
}

/* 拖拽手柄 */
.gridplus-item__drag-handle {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 20px;
  height: 20px;
  background: var(--card-color);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  cursor: move;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s ease;
  z-index: 10;
}

.gridplus-item:hover .gridplus-item__drag-handle {
  opacity: 1;
}

/* 调试信息 */
.gridplus-item__debug {
  position: absolute;
  top: 0;
  left: 0;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 4px 8px;
  font-size: 10px;
  font-family: 'Courier New', monospace;
  border-radius: 0 0 4px 0;
  opacity: 0.8;
  z-index: 20;
}

.debug-info > div {
  line-height: 1.2;
}

/* 项目类型样式 */
.gridplus-item--type-chart {
  border-left: 4px solid var(--info-color);
}

.gridplus-item--type-table {
  border-left: 4px solid var(--success-color);
}

.gridplus-item--type-image {
  border-left: 4px solid var(--warning-color);
}

.gridplus-item--type-text {
  border-left: 4px solid var(--primary-color);
}

/* 优先级样式 */
.gridplus-item--priority-1,
.gridplus-item--priority-2,
.gridplus-item--priority-3 {
  border-width: 2px;
  box-shadow: 0 2px 12px rgba(var(--primary-color-rgb), 0.3);
}

/* 暗色主题适配 */
[data-theme="dark"] .gridplus-item {
  background: var(--card-color);
  border-color: var(--border-color);
}

[data-theme="dark"] .gridplus-item__skeleton {
  --skeleton-base-color: #333;
  --skeleton-highlight-color: #444;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .gridplus-item__resize-handle,
  .gridplus-item__drag-handle {
    opacity: 1;
  }
  
  .gridplus-item__debug {
    font-size: 9px;
  }
}
</style>