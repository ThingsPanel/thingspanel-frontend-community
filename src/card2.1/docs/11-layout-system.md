# 布局系统详解 - 响应式布局配置与多渲染器支持

本章详细介绍Card 2.1组件的布局系统，包括多渲染器支持、响应式布局和约束配置。

## 🎯 布局系统概述

Card 2.1支持多种布局渲染器，每种渲染器有不同的布局模式和配置方式：

### 支持的渲染器类型
- **Canvas渲染器** - 自由位置布局，支持像素级精确定位
- **Gridstack渲染器** - 响应式网格布局，支持拖拽调整
- **自定义渲染器** - 扩展支持更多布局方式

## 📐 Canvas渲染器布局

### 基础配置

```typescript
// definition.ts 中的Canvas布局配置
export const componentDefinition = {
  defaultLayout: {
    canvas: {
      width: 300,              // 组件宽度（像素）
      height: 200,             // 组件高度（像素）
      x: 0,                   // X坐标（像素）
      y: 0,                   // Y坐标（像素）
      rotation: 0,            // 旋转角度（度）
      zIndex: 1,              // 层级顺序
      opacity: 1              // 透明度 (0-1)
    }
  },
  
  layout: {
    defaultSize: { width: 300, height: 200 },
    minSize: { width: 100, height: 50 },      // 最小尺寸限制
    maxSize: { width: 800, height: 600 },     // 最大尺寸限制
    aspectRatio: null,                        // 宽高比约束 (可选)
    resizable: true,                          // 是否可调整大小
    draggable: true,                          // 是否可拖拽
    rotatable: false                          // 是否可旋转
  }
}
```

### 高级Canvas配置

```typescript
// 高级Canvas布局配置
interface CanvasLayoutConfig {
  // 基础位置和尺寸
  x: number
  y: number
  width: number
  height: number
  
  // 变换属性
  rotation?: number                    // 旋转角度
  scaleX?: number                     // X轴缩放
  scaleY?: number                     // Y轴缩放
  skewX?: number                      // X轴倾斜
  skewY?: number                      // Y轴倾斜
  
  // 显示属性
  opacity?: number                    // 透明度
  zIndex?: number                     // 层级
  visible?: boolean                   // 是否可见
  
  // 交互属性
  draggable?: boolean                 // 可拖拽
  resizable?: boolean                 // 可调整大小
  rotatable?: boolean                 // 可旋转
  selectable?: boolean                // 可选择
  
  // 对齐和吸附
  snapToGrid?: boolean                // 吸附到网格
  snapToObjects?: boolean             // 吸附到其他对象
  gridSize?: number                   // 网格大小
  
  // 边界约束
  constrainToCanvas?: boolean         // 限制在画布内
  lockAspectRatio?: boolean           // 锁定宽高比
  
  // 动画属性
  transition?: {
    duration: number                  // 动画持续时间
    easing: string                    // 缓动函数
    properties: string[]              // 动画属性
  }
}
```

### Canvas布局使用示例

```vue
<template>
  <div 
    class="canvas-component"
    :style="canvasStyles"
    @mousedown="handleDragStart"
  >
    <!-- 组件内容 -->
    <div class="component-content">
      {{ title }}
    </div>
    
    <!-- 调整大小手柄 -->
    <div 
      v-if="resizable" 
      class="resize-handles"
    >
      <div 
        v-for="handle in resizeHandles" 
        :key="handle.position"
        :class="`resize-handle handle-${handle.position}`"
        @mousedown="handleResizeStart(handle, $event)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

interface Props {
  layout: CanvasLayoutConfig
  selected?: boolean
  resizable?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  selected: false,
  resizable: true
})

// 样式计算
const canvasStyles = computed(() => ({
  position: 'absolute',
  left: `${props.layout.x}px`,
  top: `${props.layout.y}px`,
  width: `${props.layout.width}px`,
  height: `${props.layout.height}px`,
  transform: [
    `rotate(${props.layout.rotation || 0}deg)`,
    `scale(${props.layout.scaleX || 1}, ${props.layout.scaleY || 1})`
  ].join(' '),
  opacity: props.layout.opacity || 1,
  zIndex: props.layout.zIndex || 1,
  transition: props.layout.transition ? 
    `all ${props.layout.transition.duration}ms ${props.layout.transition.easing}` : 
    'none'
}))

// 调整大小手柄定义
const resizeHandles = [
  { position: 'nw', cursor: 'nw-resize' },
  { position: 'n', cursor: 'n-resize' },
  { position: 'ne', cursor: 'ne-resize' },
  { position: 'e', cursor: 'e-resize' },
  { position: 'se', cursor: 'se-resize' },
  { position: 's', cursor: 's-resize' },
  { position: 'sw', cursor: 'sw-resize' },
  { position: 'w', cursor: 'w-resize' }
]

// 拖拽处理
const handleDragStart = (event: MouseEvent) => {
  if (!props.layout.draggable) return
  
  // 拖拽逻辑实现
  const startX = event.clientX - props.layout.x
  const startY = event.clientY - props.layout.y
  
  const handleMouseMove = (e: MouseEvent) => {
    const newX = e.clientX - startX
    const newY = e.clientY - startY
    
    emit('layoutChange', {
      ...props.layout,
      x: newX,
      y: newY
    })
  }
  
  const handleMouseUp = () => {
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)
  }
  
  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('mouseup', handleMouseUp)
}
</script>

<style scoped>
.canvas-component {
  border: 2px solid transparent;
  cursor: move;
}

.canvas-component.selected {
  border-color: var(--primary-color);
}

.resize-handles {
  position: absolute;
  inset: -4px;
  pointer-events: none;
}

.resize-handle {
  position: absolute;
  width: 8px;
  height: 8px;
  background: var(--primary-color);
  border: 1px solid #fff;
  border-radius: 2px;
  pointer-events: auto;
}

.handle-nw { top: 0; left: 0; cursor: nw-resize; }
.handle-n { top: 0; left: 50%; transform: translateX(-50%); cursor: n-resize; }
.handle-ne { top: 0; right: 0; cursor: ne-resize; }
.handle-e { top: 50%; right: 0; transform: translateY(-50%); cursor: e-resize; }
.handle-se { bottom: 0; right: 0; cursor: se-resize; }
.handle-s { bottom: 0; left: 50%; transform: translateX(-50%); cursor: s-resize; }
.handle-sw { bottom: 0; left: 0; cursor: sw-resize; }
.handle-w { top: 50%; left: 0; transform: translateY(-50%); cursor: w-resize; }
</style>
```

## 📊 Gridstack渲染器布局

### 基础配置

```typescript
// definition.ts 中的Gridstack布局配置
export const componentDefinition = {
  defaultLayout: {
    gridstack: {
      x: 0,                   // 列位置（从0开始）
      y: 0,                   // 行位置（从0开始）
      w: 4,                   // 宽度（占用列数）
      h: 3,                   // 高度（占用行数）
      minW: 2,                // 最小宽度
      minH: 1,                // 最小高度
      maxW: 12,               // 最大宽度
      maxH: 8,                // 最大高度
      autoPosition: true,     // 自动定位
      locked: false,          // 是否锁定
      noResize: false,        // 禁用调整大小
      noMove: false           // 禁用移动
    }
  }
}
```

### 响应式网格配置

```typescript
// 响应式Gridstack配置
interface GridstackLayoutConfig {
  // 基础网格位置
  x: number                         // 列位置
  y: number                         // 行位置
  w: number                         // 宽度（列数）
  h: number                         // 高度（行数）
  
  // 尺寸约束
  minW?: number                     // 最小宽度
  minH?: number                     // 最小高度
  maxW?: number                     // 最大宽度
  maxH?: number                     // 最大高度
  
  // 行为控制
  autoPosition?: boolean            // 自动定位
  locked?: boolean                  // 锁定位置
  noResize?: boolean               // 禁用调整大小
  noMove?: boolean                 // 禁用移动
  
  // 响应式断点
  breakpoints?: {
    lg: GridBreakpoint              // 大屏 (>= 1200px)
    md: GridBreakpoint              // 中屏 (>= 996px)
    sm: GridBreakpoint              // 小屏 (>= 768px)
    xs: GridBreakpoint              // 超小屏 (< 768px)
  }
  
  // 自定义属性
  id?: string                       // 组件唯一ID
  content?: string                  // 组件内容（用于SSR）
}

interface GridBreakpoint {
  w: number                         // 该断点下的宽度
  h?: number                        // 该断点下的高度
  x?: number                        // 该断点下的X位置
  y?: number                        // 该断点下的Y位置
  minW?: number                     // 最小宽度
  maxW?: number                     // 最大宽度
  minH?: number                     // 最小高度
  maxH?: number                     // 最大高度
}
```

### Gridstack布局使用示例

```vue
<template>
  <div class="gridstack-wrapper">
    <div 
      ref="gridRef" 
      class="grid-stack"
      :class="gridClasses"
    >
      <div
        v-for="item in layoutItems"
        :key="item.id"
        class="grid-stack-item"
        :gs-x="item.layout.x"
        :gs-y="item.layout.y"
        :gs-w="item.layout.w"
        :gs-h="item.layout.h"
        :gs-min-w="item.layout.minW"
        :gs-max-w="item.layout.maxW"
        :gs-min-h="item.layout.minH"
        :gs-max-h="item.layout.maxH"
        :gs-locked="item.layout.locked"
        :gs-no-resize="item.layout.noResize"
        :gs-no-move="item.layout.noMove"
      >
        <div class="grid-stack-item-content">
          <component 
            :is="item.component"
            v-bind="item.props"
            @layout-change="handleItemLayoutChange(item.id, $event)"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { GridStack } from 'gridstack'
import 'gridstack/dist/gridstack.css'

interface Props {
  items: GridLayoutItem[]
  editable?: boolean
  responsive?: boolean
  animate?: boolean
  cellHeight?: number
  margin?: number
  maxRow?: number
}

const props = withDefaults(defineProps<Props>(), {
  editable: true,
  responsive: true,
  animate: true,
  cellHeight: 80,
  margin: 10,
  maxRow: 0
})

const emit = defineEmits<{
  layoutChange: [items: GridLayoutItem[]]
  itemAdd: [item: GridLayoutItem]
  itemRemove: [itemId: string]
}>()

const gridRef = ref<HTMLElement>()
let gridStack: GridStack | null = null

// 网格样式类
const gridClasses = computed(() => ({
  'grid-editable': props.editable,
  'grid-animated': props.animate,
  'grid-responsive': props.responsive
}))

// 初始化GridStack
onMounted(() => {
  if (gridRef.value) {
    gridStack = GridStack.init({
      cellHeight: props.cellHeight,
      margin: props.margin,
      maxRow: props.maxRow,
      animate: props.animate,
      float: true,
      disableResize: !props.editable,
      disableDrag: !props.editable,
      removable: props.editable ? '.trash' : false,
      
      // 响应式配置
      ...(props.responsive && {
        columnOpts: {
          breakpoints: [
            { w: 1200, c: 12 },
            { w: 996, c: 10 },
            { w: 768, c: 8 },
            { w: 0, c: 4 }
          ]
        }
      })
    }, gridRef.value)
    
    // 绑定事件
    setupGridEvents()
  }
})

// 设置网格事件
const setupGridEvents = () => {
  if (!gridStack) return
  
  gridStack.on('change', (event, items) => {
    const updatedItems = items.map(item => ({
      id: item.id,
      layout: {
        x: item.x!,
        y: item.y!,
        w: item.w!,
        h: item.h!
      }
    }))
    
    emit('layoutChange', updatedItems as GridLayoutItem[])
  })
  
  gridStack.on('removed', (event, items) => {
    items.forEach(item => {
      if (item.id) {
        emit('itemRemove', item.id)
      }
    })
  })
}

// 添加网格项
const addGridItem = (item: GridLayoutItem) => {
  if (!gridStack) return
  
  gridStack.addWidget({
    id: item.id,
    x: item.layout.x,
    y: item.layout.y,
    w: item.layout.w,
    h: item.layout.h,
    minW: item.layout.minW,
    maxW: item.layout.maxW,
    minH: item.layout.minH,
    maxH: item.layout.maxH,
    autoPosition: item.layout.autoPosition,
    locked: item.layout.locked,
    noResize: item.layout.noResize,
    noMove: item.layout.noMove
  })
  
  emit('itemAdd', item)
}

// 移除网格项
const removeGridItem = (itemId: string) => {
  if (!gridStack) return
  
  const element = gridRef.value?.querySelector(`[gs-id="${itemId}"]`)
  if (element) {
    gridStack.removeWidget(element as HTMLElement)
  }
}

// 更新网格项布局
const updateItemLayout = (itemId: string, layout: GridstackLayoutConfig) => {
  if (!gridStack) return
  
  const element = gridRef.value?.querySelector(`[gs-id="${itemId}"]`)
  if (element) {
    gridStack.update(element as HTMLElement, layout)
  }
}

// 监听项目变化
watch(() => props.items, (newItems, oldItems) => {
  if (!gridStack) return
  
  // 处理添加的项目
  const addedItems = newItems.filter(item => 
    !oldItems?.find(oldItem => oldItem.id === item.id)
  )
  addedItems.forEach(addGridItem)
  
  // 处理移除的项目
  const removedItems = oldItems?.filter(oldItem => 
    !newItems.find(item => item.id === oldItem.id)
  ) || []
  removedItems.forEach(item => removeGridItem(item.id))
}, { deep: true })

// 响应式处理
const handleResize = () => {
  if (gridStack && props.responsive) {
    gridStack.onParentResize()
  }
}

// 暴露方法
defineExpose({
  addItem: addGridItem,
  removeItem: removeGridItem,
  updateLayout: updateItemLayout,
  resize: handleResize
})
</script>

<style scoped>
.gridstack-wrapper {
  width: 100%;
  height: 100%;
  overflow: auto;
}

.grid-stack {
  background: var(--body-color);
}

.grid-stack-item {
  background: var(--card-color);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  overflow: hidden;
  transition: box-shadow 0.3s ease;
}

.grid-stack-item:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.grid-stack-item-content {
  width: 100%;
  height: 100%;
  padding: 8px;
}

.grid-editable .grid-stack-item {
  cursor: move;
}

.grid-animated .grid-stack-item {
  transition: all 0.3s ease;
}

/* 响应式断点样式 */
@media (max-width: 768px) {
  .grid-stack-item-content {
    padding: 4px;
  }
}

/* GridStack主题定制 */
.grid-stack > .grid-stack-item > .ui-resizable-handle {
  background: var(--primary-color);
}

.grid-stack > .grid-stack-item.ui-draggable-dragging {
  opacity: 0.8;
  z-index: 1000;
}
</style>
```

## 📱 响应式布局配置

### 断点配置
```typescript
// 响应式断点定义
export const RESPONSIVE_BREAKPOINTS = {
  xs: { minWidth: 0, maxWidth: 575.98, columns: 1 },
  sm: { minWidth: 576, maxWidth: 767.98, columns: 2 },
  md: { minWidth: 768, maxWidth: 991.98, columns: 4 },
  lg: { minWidth: 992, maxWidth: 1199.98, columns: 8 },
  xl: { minWidth: 1200, maxWidth: Infinity, columns: 12 }
}

// 组件响应式配置
export const responsiveComponentDefinition = {
  defaultLayout: {
    // Canvas响应式配置
    canvas: {
      width: 300,
      height: 200,
      responsive: {
        xs: { width: 280, height: 180 },
        sm: { width: 320, height: 200 },
        md: { width: 360, height: 220 },
        lg: { width: 400, height: 240 },
        xl: { width: 450, height: 260 }
      }
    },
    
    // Gridstack响应式配置
    gridstack: {
      w: 4, h: 3,
      responsive: {
        xs: { w: 1, h: 2 },
        sm: { w: 2, h: 2 },
        md: { w: 3, h: 3 },
        lg: { w: 4, h: 3 },
        xl: { w: 4, h: 3 }
      }
    }
  }
}
```

### 响应式Hook
```typescript
/**
 * 响应式布局Hook
 */
export function useResponsiveLayout(
  initialLayout: LayoutConfig,
  breakpoints: ResponsiveBreakpoints = RESPONSIVE_BREAKPOINTS
) {
  const currentBreakpoint = ref<string>('lg')
  const currentLayout = ref<LayoutConfig>(initialLayout)
  
  // 监听屏幕尺寸变化
  const handleResize = () => {
    const width = window.innerWidth
    let newBreakpoint = 'xs'
    
    for (const [breakpoint, config] of Object.entries(breakpoints)) {
      if (width >= config.minWidth && width <= config.maxWidth) {
        newBreakpoint = breakpoint
        break
      }
    }
    
    if (newBreakpoint !== currentBreakpoint.value) {
      currentBreakpoint.value = newBreakpoint
      updateLayout(newBreakpoint)
    }
  }
  
  // 更新布局
  const updateLayout = (breakpoint: string) => {
    const responsiveConfig = initialLayout.responsive?.[breakpoint]
    if (responsiveConfig) {
      currentLayout.value = {
        ...initialLayout,
        ...responsiveConfig
      }
    }
  }
  
  onMounted(() => {
    handleResize()
    window.addEventListener('resize', handleResize)
  })
  
  onUnmounted(() => {
    window.removeEventListener('resize', handleResize)
  })
  
  return {
    currentBreakpoint: readonly(currentBreakpoint),
    currentLayout: readonly(currentLayout),
    updateLayout
  }
}
```

## 🔧 布局约束系统

### 约束类型定义
```typescript
interface LayoutConstraints {
  // 尺寸约束
  minSize: { width: number; height: number }
  maxSize: { width: number; height: number }
  
  // 宽高比约束
  aspectRatio?: number              // 固定宽高比
  aspectRatioTolerance?: number     // 宽高比容差
  
  // 位置约束
  boundary?: {
    left: number
    top: number  
    right: number
    bottom: number
  }
  
  // 对齐约束
  snapToGrid?: {
    enabled: boolean
    gridSize: number
  }
  
  snapToObjects?: {
    enabled: boolean
    tolerance: number
  }
  
  // 层级约束
  zIndexRange?: {
    min: number
    max: number
  }
  
  // 交互约束
  interactive?: {
    draggable: boolean
    resizable: boolean
    rotatable: boolean
    selectable: boolean
  }
}
```

### 约束验证器
```typescript
/**
 * 布局约束验证器
 */
export class LayoutConstraintValidator {
  /**
   * 验证布局是否满足约束
   */
  static validate(
    layout: LayoutConfig,
    constraints: LayoutConstraints
  ): ValidationResult {
    const errors: string[] = []
    const warnings: string[] = []
    
    // 验证尺寸约束
    if (layout.width < constraints.minSize.width) {
      errors.push(`宽度 ${layout.width} 小于最小值 ${constraints.minSize.width}`)
    }
    
    if (layout.width > constraints.maxSize.width) {
      errors.push(`宽度 ${layout.width} 超过最大值 ${constraints.maxSize.width}`)
    }
    
    // 验证宽高比约束
    if (constraints.aspectRatio) {
      const currentRatio = layout.width / layout.height
      const tolerance = constraints.aspectRatioTolerance || 0.01
      
      if (Math.abs(currentRatio - constraints.aspectRatio) > tolerance) {
        warnings.push(`宽高比 ${currentRatio.toFixed(2)} 不符合约束 ${constraints.aspectRatio}`)
      }
    }
    
    // 验证边界约束
    if (constraints.boundary) {
      if (layout.x < constraints.boundary.left) {
        errors.push('组件超出左边界')
      }
      if (layout.y < constraints.boundary.top) {
        errors.push('组件超出上边界')
      }
    }
    
    return {
      valid: errors.length === 0,
      errors,
      warnings
    }
  }
  
  /**
   * 应用约束修正布局
   */
  static applyConstraints(
    layout: LayoutConfig,
    constraints: LayoutConstraints
  ): LayoutConfig {
    const correctedLayout = { ...layout }
    
    // 修正尺寸
    correctedLayout.width = Math.max(
      constraints.minSize.width,
      Math.min(constraints.maxSize.width, correctedLayout.width)
    )
    
    correctedLayout.height = Math.max(
      constraints.minSize.height,
      Math.min(constraints.maxSize.height, correctedLayout.height)
    )
    
    // 修正宽高比
    if (constraints.aspectRatio) {
      const targetRatio = constraints.aspectRatio
      const currentRatio = correctedLayout.width / correctedLayout.height
      
      if (Math.abs(currentRatio - targetRatio) > 0.01) {
        // 以宽度为准调整高度
        correctedLayout.height = correctedLayout.width / targetRatio
      }
    }
    
    // 修正边界
    if (constraints.boundary) {
      correctedLayout.x = Math.max(
        constraints.boundary.left,
        Math.min(
          constraints.boundary.right - correctedLayout.width,
          correctedLayout.x
        )
      )
      
      correctedLayout.y = Math.max(
        constraints.boundary.top,
        Math.min(
          constraints.boundary.bottom - correctedLayout.height,
          correctedLayout.y
        )
      )
    }
    
    return correctedLayout
  }
}
```

## ✅ 布局系统最佳实践

### 1. 渲染器选择原则
- **Canvas渲染器** - 适用于自由设计、精确定位的场景
- **Gridstack渲染器** - 适用于响应式布局、标准化排版的场景

### 2. 响应式设计建议
- 定义合理的断点配置
- 为不同屏幕尺寸优化布局
- 测试各种设备和分辨率

### 3. 约束配置技巧
- 设置合理的最小/最大尺寸
- 考虑用户交互的便利性
- 提供视觉反馈和引导

### 4. 性能优化
- 避免频繁的布局计算
- 使用CSS变换替代位置变更
- 合理使用动画和过渡效果

## 🔗 相关文档

- [组件定义详解](./04-component-definition.md) - 布局配置定义
- [组件架构](./03-component-architecture.md) - 布局系统架构
- [性能优化](./14-performance.md) - 布局性能优化
- [最佳实践](./17-best-practices.md) - 布局最佳实践

---

**灵活的布局系统让组件适应各种场景！** 📐