<!--
  @file PureLayoutManager.vue
  @description 纯净布局管理器组件 - 第一层编辑器底座核心组件
  只负责UI布局管理和数据传递，绝不涉及业务逻辑、渲染实现、配置细节
  
  职责：
  - 管理toolbar/sidebar/canvas/inspector四大区域布局
  - 响应式断点和自适应布局
  - 区域大小调整和可见性控制
  - 布局状态管理和事件发射
  
  设计原则：
  - 纯净：只做布局，不做业务
  - 可插拔：通过slot提供内容区域
  - 响应式：支持多种屏幕尺寸
  - 事件驱动：通过事件与外部通信
-->

<template>
  <div 
    ref="containerRef"
    class="pure-layout-manager" 
    :class="layoutClasses"
    :style="containerStyles"
  >
    <!-- 工具栏区域 -->
    <div 
      v-if="config.toolbar.visible" 
      class="layout-region layout-toolbar"
      :style="toolbarStyles"
    >
      <slot 
        name="toolbar" 
        :region="regions.toolbar"
        :config="config.toolbar"
      />
    </div>
    
    <!-- 主内容区域 -->
    <div class="layout-main" :style="mainStyles">
      <!-- 左侧边栏 -->
      <div 
        v-if="config.sidebar.visible" 
        class="layout-region layout-sidebar"
        :class="{ 'collapsed': regions.sidebar.collapsed }"
        :style="sidebarStyles"
      >
        <!-- 侧边栏调整手柄 -->
        <div 
          v-if="config.sidebar.resizable"
          class="resize-handle resize-handle-right"
          @mousedown="startResize('sidebar', 'horizontal')"
        />
        
        <slot 
          name="sidebar" 
          :region="regions.sidebar"
          :config="config.sidebar"
        />
        
        <!-- 折叠按钮 -->
        <button
          v-if="config.sidebar.collapsible"
          class="collapse-button sidebar-collapse"
          @click="toggleRegionVisibility('sidebar')"
        >
          {{ regions.sidebar.collapsed ? '→' : '←' }}
        </button>
      </div>
      
      <!-- 画布区域 -->
      <div 
        class="layout-region layout-canvas"
        :style="canvasStyles"
      >
        <slot 
          name="canvas" 
          :region="regions.canvas"
          :config="config.canvas"
        />
      </div>
      
      <!-- 右侧检查器 -->
      <div 
        v-if="config.inspector.visible" 
        class="layout-region layout-inspector"
        :class="{ 'collapsed': regions.inspector.collapsed }"
        :style="inspectorStyles"
      >
        <!-- 检查器调整手柄 -->
        <div 
          v-if="config.inspector.resizable"
          class="resize-handle resize-handle-left"
          @mousedown="startResize('inspector', 'horizontal')"
        />
        
        <slot 
          name="inspector" 
          :region="regions.inspector"
          :config="config.inspector"
        />
        
        <!-- 折叠按钮 -->
        <button
          v-if="config.inspector.collapsible"
          class="collapse-button inspector-collapse"
          @click="toggleRegionVisibility('inspector')"
        >
          {{ regions.inspector.collapsed ? '←' : '→' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import type { 
  PureLayoutConfig, 
  PureLayoutState, 
  LayoutEvents,
  LayoutRegionState 
} from './interfaces/PureLayout'

/**
 * 组件属性定义
 */
interface Props {
  /** 布局配置 */
  config?: Partial<PureLayoutConfig>
  /** 是否启用响应式 */
  responsive?: boolean
  /** 是否启用动画 */
  animated?: boolean
  /** 动画持续时间（毫秒） */
  animationDuration?: number
}

/**
 * 组件事件定义
 */
interface Emits {
  (event: 'region-resize', payload: LayoutEvents['region-resize']): void
  (event: 'region-visibility-change', payload: LayoutEvents['region-visibility-change']): void
  (event: 'breakpoint-change', payload: LayoutEvents['breakpoint-change']): void
  (event: 'layout-config-change', payload: LayoutEvents['layout-config-change']): void
}

// 组件属性和事件
const props = withDefaults(defineProps<Props>(), {
  responsive: true,
  animated: true,
  animationDuration: 200
})

const emit = defineEmits<Emits>()

// DOM引用
const containerRef = ref<HTMLElement>()

/**
 * 默认布局配置
 */
const getDefaultConfig = (): PureLayoutConfig => ({
  toolbar: {
    visible: true,
    height: 48,
    size: 48,
    position: 'top',
    resizable: false,
    collapsible: false,
    minSize: 40,
    maxSize: 80
  },
  sidebar: {
    visible: true,
    width: 280,
    size: 280,
    position: 'left',
    resizable: true,
    collapsible: true,
    minSize: 200,
    maxSize: 400
  },
  canvas: {
    padding: 16,
    background: 'transparent',
    flex: 1
  },
  inspector: {
    visible: true,
    width: 320,
    size: 320,
    position: 'right',
    resizable: true,
    collapsible: true,
    minSize: 250,
    maxSize: 500
  },
  breakpoints: {
    mobile: 768,
    tablet: 1024,
    desktop: 1440,
    ultrawide: 1920
  },
  responsive: {
    autoCollapse: true,
    stackOnMobile: true,
    minCanvasWidth: 400
  }
})

// 合并后的配置
const config = computed((): PureLayoutConfig => {
  const defaultConfig = getDefaultConfig()
  return {
    ...defaultConfig,
    ...props.config,
    toolbar: { ...defaultConfig.toolbar, ...props.config?.toolbar },
    sidebar: { ...defaultConfig.sidebar, ...props.config?.sidebar },
    canvas: { ...defaultConfig.canvas, ...props.config?.canvas },
    inspector: { ...defaultConfig.inspector, ...props.config?.inspector },
    breakpoints: { ...defaultConfig.breakpoints, ...props.config?.breakpoints },
    responsive: { ...defaultConfig.responsive, ...props.config?.responsive }
  }
})

/**
 * 响应式状态管理
 */
const state = reactive<PureLayoutState>({
  regions: {
    toolbar: {
      actualSize: { width: 0, height: 48 },
      collapsed: false,
      resizing: false
    },
    sidebar: {
      actualSize: { width: 280, height: 0 },
      collapsed: false,
      resizing: false
    },
    canvas: {
      actualSize: { width: 0, height: 0 },
      collapsed: false,
      resizing: false
    },
    inspector: {
      actualSize: { width: 320, height: 0 },
      collapsed: false,
      resizing: false
    }
  },
  currentBreakpoint: 'desktop',
  containerSize: { width: 0, height: 0 }
})

// 使用别名方便访问
const regions = state.regions

/**
 * 计算样式
 */
const layoutClasses = computed(() => [
  `breakpoint-${state.currentBreakpoint}`,
  {
    'animated': props.animated,
    'responsive': props.responsive,
    'sidebar-collapsed': regions.sidebar.collapsed,
    'inspector-collapsed': regions.inspector.collapsed
  }
])

const containerStyles = computed(() => ({
  '--animation-duration': `${props.animationDuration}ms`,
  '--toolbar-height': `${regions.toolbar.actualSize.height}px`,
  '--sidebar-width': `${regions.sidebar.collapsed ? 0 : regions.sidebar.actualSize.width}px`,
  '--inspector-width': `${regions.inspector.collapsed ? 0 : regions.inspector.actualSize.width}px`,
  '--canvas-padding': `${config.value.canvas.padding}px`
}))

const toolbarStyles = computed(() => ({
  height: `${regions.toolbar.actualSize.height}px`,
  minHeight: `${config.value.toolbar.minSize}px`,
  maxHeight: `${config.value.toolbar.maxSize}px`
}))

const mainStyles = computed(() => ({
  height: `calc(100% - ${regions.toolbar.actualSize.height}px)`
}))

const sidebarStyles = computed(() => ({
  width: regions.sidebar.collapsed ? '0px' : `${regions.sidebar.actualSize.width}px`,
  minWidth: regions.sidebar.collapsed ? '0px' : `${config.value.sidebar.minSize}px`,
  maxWidth: `${config.value.sidebar.maxSize}px`
}))

const canvasStyles = computed(() => ({
  flex: config.value.canvas.flex,
  padding: `${config.value.canvas.padding}px`,
  background: config.value.canvas.background
}))

const inspectorStyles = computed(() => ({
  width: regions.inspector.collapsed ? '0px' : `${regions.inspector.actualSize.width}px`,
  minWidth: regions.inspector.collapsed ? '0px' : `${config.value.inspector.minSize}px`,
  maxWidth: `${config.value.inspector.maxSize}px`
}))

/**
 * 断点检测
 */
const getCurrentBreakpoint = (width: number): PureLayoutState['currentBreakpoint'] => {
  const bp = config.value.breakpoints
  if (width < bp.mobile) return 'mobile'
  if (width < bp.tablet) return 'tablet'
  if (width < bp.desktop) return 'desktop'
  return 'ultrawide'
}

/**
 * 更新容器尺寸和断点
 */
const updateContainerSize = () => {
  if (!containerRef.value) return
  
  const rect = containerRef.value.getBoundingClientRect()
  const newSize = { width: rect.width, height: rect.height }
  const oldBreakpoint = state.currentBreakpoint
  const newBreakpoint = getCurrentBreakpoint(newSize.width)
  
  state.containerSize = newSize
  
  // 断点变化处理
  if (newBreakpoint !== oldBreakpoint) {
    state.currentBreakpoint = newBreakpoint
    
    // 响应式行为处理
    if (config.value.responsive.autoCollapse) {
      if (newBreakpoint === 'mobile') {
        // 移动端自动折叠侧边栏和检查器
        regions.sidebar.collapsed = true
        regions.inspector.collapsed = true
      } else if (oldBreakpoint === 'mobile' && newBreakpoint !== 'mobile') {
        // 从移动端恢复时展开侧边栏
        regions.sidebar.collapsed = false
        regions.inspector.collapsed = false
      }
    }
    
    emit('breakpoint-change', {
      from: oldBreakpoint,
      to: newBreakpoint,
      containerSize: newSize
    })
  }
  
  // 更新各区域尺寸
  updateRegionSizes()
}

/**
 * 更新区域实际尺寸
 */
const updateRegionSizes = () => {
  regions.toolbar.actualSize.width = state.containerSize.width
  regions.sidebar.actualSize.height = state.containerSize.height - regions.toolbar.actualSize.height
  regions.canvas.actualSize.height = regions.sidebar.actualSize.height
  regions.inspector.actualSize.height = regions.sidebar.actualSize.height
  
  // 计算画布可用宽度
  const availableWidth = state.containerSize.width 
    - (regions.sidebar.collapsed ? 0 : regions.sidebar.actualSize.width)
    - (regions.inspector.collapsed ? 0 : regions.inspector.actualSize.width)
  regions.canvas.actualSize.width = Math.max(availableWidth, config.value.responsive.minCanvasWidth)
}

/**
 * 切换区域可见性
 */
const toggleRegionVisibility = (regionName: keyof PureLayoutState['regions']) => {
  const region = regions[regionName]
  const wasVisible = !region.collapsed
  region.collapsed = !region.collapsed
  
  nextTick(() => {
    updateRegionSizes()
    emit('region-visibility-change', {
      region: regionName,
      visible: !region.collapsed
    })
  })
}

/**
 * 拖拽调整大小相关状态
 */
const resizeState = reactive({
  isResizing: false,
  regionName: '' as keyof PureLayoutState['regions'],
  direction: '' as 'horizontal' | 'vertical',
  startPos: 0,
  startSize: 0
})

/**
 * 开始调整大小
 */
const startResize = (regionName: keyof PureLayoutState['regions'], direction: 'horizontal' | 'vertical') => {
  const region = regions[regionName]
  region.resizing = true
  
  resizeState.isResizing = true
  resizeState.regionName = regionName
  resizeState.direction = direction
  resizeState.startPos = direction === 'horizontal' ? 0 : 0 // 将在mousemove中设置
  resizeState.startSize = direction === 'horizontal' 
    ? region.actualSize.width 
    : region.actualSize.height
  
  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('mouseup', stopResize)
  document.body.style.cursor = direction === 'horizontal' ? 'col-resize' : 'row-resize'
  document.body.style.userSelect = 'none'
}

/**
 * 处理鼠标移动
 */
const handleMouseMove = (event: MouseEvent) => {
  if (!resizeState.isResizing) return
  
  const region = regions[resizeState.regionName]
  if (!region) return
  
  const currentPos = resizeState.direction === 'horizontal' ? event.clientX : event.clientY
  
  // 第一次移动时记录起始位置
  if (resizeState.startPos === 0) {
    resizeState.startPos = currentPos
    return
  }
  
  const delta = currentPos - resizeState.startPos
  let newSize = resizeState.startSize
  
  // 根据区域和方向计算新尺寸
  if (resizeState.regionName === 'sidebar') {
    newSize += delta
  } else if (resizeState.regionName === 'inspector') {
    newSize -= delta // 检查器从右边调整，所以方向相反
  } else if (resizeState.regionName === 'toolbar') {
    newSize += delta
  }
  
  // 应用尺寸限制
  const regionConfig = config.value[resizeState.regionName]
  if ('minSize' in regionConfig && regionConfig.minSize) {
    newSize = Math.max(newSize, regionConfig.minSize)
  }
  if ('maxSize' in regionConfig && regionConfig.maxSize) {
    newSize = Math.min(newSize, regionConfig.maxSize)
  }
  
  // 更新区域尺寸
  if (resizeState.direction === 'horizontal') {
    region.actualSize.width = newSize
  } else {
    region.actualSize.height = newSize
  }
  
  updateRegionSizes()
}

/**
 * 停止调整大小
 */
const stopResize = () => {
  if (!resizeState.isResizing) return
  
  const region = regions[resizeState.regionName]
  const oldSize = resizeState.startSize
  const newSize = resizeState.direction === 'horizontal' 
    ? region.actualSize.width 
    : region.actualSize.height
  
  region.resizing = false
  resizeState.isResizing = false
  
  document.removeEventListener('mousemove', handleMouseMove)
  document.removeEventListener('mouseup', stopResize)
  document.body.style.cursor = ''
  document.body.style.userSelect = ''
  
  // 发射调整大小事件
  if (Math.abs(newSize - oldSize) > 1) { // 避免微小变化触发事件
    emit('region-resize', {
      region: resizeState.regionName,
      oldSize,
      newSize
    })
  }
  
  // 重置状态
  resizeState.regionName = '' as any
  resizeState.direction = '' as any
  resizeState.startPos = 0
  resizeState.startSize = 0
}

/**
 * ResizeObserver监听容器尺寸变化
 */
let resizeObserver: ResizeObserver | null = null

/**
 * 组件挂载
 */
onMounted(() => {
  // 初始化尺寸
  updateContainerSize()
  
  // 设置ResizeObserver监听容器尺寸变化
  if (containerRef.value && window.ResizeObserver) {
    resizeObserver = new ResizeObserver(() => {
      updateContainerSize()
    })
    resizeObserver.observe(containerRef.value)
  } else {
    // 降级到window resize监听
    window.addEventListener('resize', updateContainerSize)
  }
})

/**
 * 组件卸载
 */
onUnmounted(() => {
  // 清理ResizeObserver
  if (resizeObserver) {
    resizeObserver.disconnect()
    resizeObserver = null
  } else {
    window.removeEventListener('resize', updateContainerSize)
  }
  
  // 清理拖拽事件监听器
  document.removeEventListener('mousemove', handleMouseMove)
  document.removeEventListener('mouseup', stopResize)
})

/**
 * 监听配置变化
 */
watch(() => props.config, (newConfig) => {
  if (newConfig) {
    emit('layout-config-change', { config: config.value })
    nextTick(() => {
      updateContainerSize()
    })
  }
}, { deep: true })

/**
 * 暴露给父组件的方法和状态
 */
defineExpose({
  config,
  state,
  regions,
  updateContainerSize,
  toggleRegionVisibility,
  getCurrentBreakpoint
})
</script>

<style scoped>
/* 纯净布局管理器基础样式 */
.pure-layout-manager {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
  
  /* CSS变量用于动态计算 */
  --animation-duration: 200ms;
  --toolbar-height: 48px;
  --sidebar-width: 280px;
  --inspector-width: 320px;
  --canvas-padding: 16px;
}

/* 动画支持 */
.pure-layout-manager.animated * {
  transition: all var(--animation-duration) ease-in-out;
}

/* 布局区域基础样式 */
.layout-region {
  position: relative;
  overflow: hidden;
}

/* 工具栏样式 */
.layout-toolbar {
  flex-shrink: 0;
  border-bottom: 1px solid var(--border-color, #e8e8e8);
  background: var(--toolbar-bg, #ffffff);
  z-index: 100;
}

/* 主内容区域 */
.layout-main {
  flex: 1;
  display: flex;
  overflow: hidden;
}

/* 侧边栏样式 */
.layout-sidebar {
  flex-shrink: 0;
  border-right: 1px solid var(--border-color, #e8e8e8);
  background: var(--sidebar-bg, #fafafa);
  overflow-y: auto;
  overflow-x: hidden;
}

.layout-sidebar.collapsed {
  width: 0 !important;
  min-width: 0 !important;
  border-right: none;
  overflow: hidden;
}

/* 画布样式 */
.layout-canvas {
  background: var(--canvas-bg, #f5f5f5);
  overflow: auto;
  position: relative;
}

/* 检查器样式 */
.layout-inspector {
  flex-shrink: 0;
  border-left: 1px solid var(--border-color, #e8e8e8);
  background: var(--inspector-bg, #fafafa);
  overflow-y: auto;
  overflow-x: hidden;
}

.layout-inspector.collapsed {
  width: 0 !important;
  min-width: 0 !important;
  border-left: none;
  overflow: hidden;
}

/* 调整大小手柄 */
.resize-handle {
  position: absolute;
  background: transparent;
  z-index: 200;
}

.resize-handle-right {
  top: 0;
  right: 0;
  width: 4px;
  height: 100%;
  cursor: col-resize;
}

.resize-handle-left {
  top: 0;
  left: 0;
  width: 4px;
  height: 100%;
  cursor: col-resize;
}

.resize-handle:hover {
  background: var(--primary-color, #1890ff);
}

/* 折叠按钮 */
.collapse-button {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 20px;
  height: 20px;
  border: 1px solid var(--border-color, #e8e8e8);
  background: var(--button-bg, #ffffff);
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  color: var(--text-color, #666);
  z-index: 300;
}

.sidebar-collapse {
  right: -10px;
}

.inspector-collapse {
  left: -10px;
}

.collapse-button:hover {
  background: var(--button-hover-bg, #f0f0f0);
  border-color: var(--primary-color, #1890ff);
  color: var(--primary-color, #1890ff);
}

/* 响应式断点样式 */
.breakpoint-mobile .layout-main {
  flex-direction: column;
}

.breakpoint-mobile .layout-sidebar,
.breakpoint-mobile .layout-inspector {
  width: 100% !important;
  max-width: none !important;
  border: none;
  border-bottom: 1px solid var(--border-color, #e8e8e8);
}

.breakpoint-mobile .layout-canvas {
  order: 1;
}

.breakpoint-mobile .layout-sidebar {
  order: 0;
  max-height: 200px;
}

.breakpoint-mobile .layout-inspector {
  order: 2;
  max-height: 300px;
}

/* 拖拽状态样式 */
.layout-region.resizing {
  pointer-events: none;
  user-select: none;
}

/* 滚动条样式 */
.layout-sidebar::-webkit-scrollbar,
.layout-inspector::-webkit-scrollbar {
  width: 6px;
}

.layout-sidebar::-webkit-scrollbar-track,
.layout-inspector::-webkit-scrollbar-track {
  background: transparent;
}

.layout-sidebar::-webkit-scrollbar-thumb,
.layout-inspector::-webkit-scrollbar-thumb {
  background: var(--scrollbar-color, #c0c0c0);
  border-radius: 3px;
}

.layout-sidebar::-webkit-scrollbar-thumb:hover,
.layout-inspector::-webkit-scrollbar-thumb:hover {
  background: var(--scrollbar-hover-color, #a0a0a0);
}
</style>