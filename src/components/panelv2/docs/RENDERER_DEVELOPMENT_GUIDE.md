# 渲染器开发规范文档

## 概述

本文档为ThingsPanel PanelV2多渲染器架构的开发指南，提供了创建高性能、可扩展渲染器的完整规范和最佳实践。

## 架构概述

### 多渲染器架构核心理念

PanelV2采用多渲染器架构，允许不同的渲染器处理不同的可视化需求：
- **KanbanRenderer**: 基于网格的看板布局（已完成）
- **GridProRenderer**: 高性能自研网格渲染器（开发中）
- **VisualizationRenderer**: 自由画布大屏可视化（规划中）

### 核心组件关系

```
┌─────────────────────────────────────────────────────┐
│                    PanelV2.vue                      │
│  ┌─────────────────┬─────────────────┬─────────────┐ │
│  │  ComponentPanel │   Main Canvas   │ PropertyPanel│ │
│  │     (左侧)       │     (中间)      │    (右侧)     │ │
│  │   组件拖拽源     │   渲染器容器     │   卡片属性配置 │ │
│  └─────────────────┴─────────────────┴─────────────┘ │
│  ┌─────────────────────────────────────────────────┐ │
│  │               MainToolbar (动态切换)             │ │
│  │  ┌──────────┬──────────┬──────────────────────┐ │ │
│  │  │ Common   │ Kanban   │ Visualization        │ │ │
│  │  │ Toolbar  │ Toolbar  │ Toolbar              │ │ │
│  │  │(基础功能) │(折叠式)   │(折叠式)               │ │ │
│  │  └──────────┴──────────┴──────────────────────┘ │ │
│  └─────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│              RendererManager                        │
│  ┌─────────────────────────────────────────────────┐ │
│  │              RendererFactory                    │ │
│  │  ┌──────────┬──────────┬──────────────────────┐ │ │
│  │  │ Kanban   │GridPro   │ Visualization        │ │ │
│  │  │Renderer  │Renderer  │ Renderer             │ │ │
│  │  │(完整实现) │(开发中)   │(占位符)               │ │ │
│  │  └──────────┴──────────┴──────────────────────┘ │ │
│  └─────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

### MainToolbar 动态切换机制

MainToolbar 采用智能的动态切换设计，根据当前渲染器类型自动显示对应的工具栏：

**设计理念：**
- **基础功能优先**：CommonToolbar 包含所有渲染器共享的基础功能
- **专用工具折叠**：渲染器专用工具采用折叠式设计，节省空间
- **配置职责分离**：右侧属性面板专注卡片配置，工具栏专注渲染器配置

**切换逻辑：**
```typescript
// 在 MainToolbar.vue 中的动态渲染逻辑
const isKanbanRenderer = computed(() => currentRenderer === 'kanban')
const isVisualizationRenderer = computed(() => currentRenderer === 'visualization')

// 根据渲染器类型动态显示工具栏
<CommonToolbar />  <!-- 始终显示 -->
<KanbanToolbar v-if="isKanbanRenderer" />  <!-- 看板专用 -->
<VisualizationToolbar v-else-if="isVisualizationRenderer" />  <!-- 可视化专用 -->
```

## BaseRenderer接口详解

### 核心接口定义

每个渲染器必须实现`BaseRenderer`接口：

```typescript
interface BaseRenderer {
  // 基础属性
  readonly id: string                      // 渲染器唯一标识
  readonly name: string                    // 渲染器名称
  readonly version: string                 // 版本号
  readonly capabilities: RendererCapabilities

  // 状态属性
  readonly state: RendererState
  readonly config: RendererConfig

  // 生命周期方法
  initialize(container: HTMLElement, config: RendererConfig): Promise<void>
  destroy(): Promise<void>
  resize(width: number, height: number): void

  // 数据管理
  setData(items: BaseCanvasItem[]): void
  getData(): BaseCanvasItem[]
  addItem(item: BaseCanvasItem): void
  removeItem(id: string): void
  updateItem(id: string, updates: Partial<BaseCanvasItem>): void

  // 渲染控制
  render(): void
  refresh(): void
  clear(): void

  // 视图操作
  setViewport(viewport: Viewport): void
  getViewport(): Viewport
  fitToContent(): void
  centerView(): void

  // 交互控制
  enableEdit(): void
  disableEdit(): void
  setReadonly(readonly: boolean): void

  // 选择操作
  selectItems(ids: string[]): void
  clearSelection(): void
  getSelection(): string[]

  // 事件系统
  on<K extends keyof RendererEvents>(event: K, handler: RendererEvents[K]): void
  off<K extends keyof RendererEvents>(event: K, handler: RendererEvents[K]): void
  emit<K extends keyof RendererEvents>(event: K, ...args: Parameters<RendererEvents[K]>): void

  // 配置更新
  updateConfig(config: Partial<RendererConfig>): void
  getConfig(): RendererConfig

  // 工具方法
  hitTest(position: Position): string | null
  getBounds(id: string): { position: Position, size: Size } | null
  isVisible(id: string): boolean
}
```

### 能力声明 (RendererCapabilities)

每个渲染器需要声明自己支持的功能：

```typescript
interface RendererCapabilities {
  supportsDrag: boolean                    // 支持拖拽
  supportsResize: boolean                  // 支持调整大小
  supportsRotate: boolean                  // 支持旋转
  supportsGrouping: boolean                // 支持分组
  supportsLayers: boolean                  // 支持图层管理
  supportsSnapping: boolean                // 支持对齐辅助
  supportsPrecisePositioning: boolean      // 支持精确定位
  supportsCustomCoordinates: boolean       // 支持自定义坐标系
  supportsZoom: boolean                    // 支持缩放
  supportsMultiSelect: boolean             // 支持多选
  supportsKeyboardShortcuts: boolean       // 支持键盘快捷键
  supportsContextMenu: boolean             // 支持右键菜单
  supportsUndo: boolean                    // 支持撤销
  supportsClipboard: boolean               // 支持剪贴板操作
}
```

## 现代Web API集成指南

### 1. Pointer Events API

用于统一处理鼠标、触摸和笔输入：

```typescript
// 推荐使用方式
const usePointerDrag = (element: Ref<HTMLElement | null>) => {
  const isDragging = ref(false)
  const startPosition = ref({ x: 0, y: 0 })
  
  const handlePointerDown = (event: PointerEvent) => {
    // 捕获指针
    element.value?.setPointerCapture(event.pointerId)
    isDragging.value = true
    startPosition.value = { x: event.clientX, y: event.clientY }
  }
  
  const handlePointerMove = (event: PointerEvent) => {
    if (!isDragging.value) return
    // 处理拖拽逻辑
  }
  
  const handlePointerUp = (event: PointerEvent) => {
    element.value?.releasePointerCapture(event.pointerId)
    isDragging.value = false
  }
  
  onMounted(() => {
    if (element.value) {
      element.value.addEventListener('pointerdown', handlePointerDown)
      element.value.addEventListener('pointermove', handlePointerMove)
      element.value.addEventListener('pointerup', handlePointerUp)
    }
  })
  
  return { isDragging, startPosition }
}
```

### 2. ResizeObserver API

用于高性能的元素尺寸监听：

```typescript
const useResizeObserver = (element: Ref<HTMLElement | null>, callback: ResizeObserverCallback) => {
  let observer: ResizeObserver | null = null
  
  onMounted(() => {
    if (element.value) {
      observer = new ResizeObserver(callback)
      observer.observe(element.value)
    }
  })
  
  onUnmounted(() => {
    observer?.disconnect()
  })
  
  return { observer }
}
```

### 3. Intersection Observer API

用于虚拟化和可视区域优化：

```typescript
const useVirtualization = (container: Ref<HTMLElement | null>) => {
  const visibleItems = ref<Set<string>>(new Set())
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      const itemId = entry.target.getAttribute('data-item-id')
      if (!itemId) return
      
      if (entry.isIntersecting) {
        visibleItems.value.add(itemId)
      } else {
        visibleItems.value.delete(itemId)
      }
    })
  }, {
    root: container.value,
    rootMargin: '50px' // 预加载边距
  })
  
  return { observer, visibleItems }
}
```

## Vue3 Composition API最佳实践

### 1. Composable组织原则

```typescript
// ✅ 好的做法：职责清晰的composable
const useGridLayout = () => {
  // 只处理网格布局逻辑
  return { layout, updateLayout, getGridPosition }
}

const useGridDrag = () => {
  // 只处理拖拽逻辑
  return { isDragging, startDrag, endDrag }
}

// ❌ 避免：功能混合的composable
const useGridEverything = () => {
  // 混合了布局、拖拽、动画等多种功能
}
```

### 2. 响应式状态管理

```typescript
// ✅ 推荐：使用shallowRef处理大型对象
const layout = shallowRef<GridItem[]>([])

// ✅ 推荐：使用computed缓存昂贵计算
const visibleItems = computed(() => {
  return layout.value.filter(item => isInViewport(item))
})

// ✅ 推荐：使用watchEffect处理副作用
watchEffect(() => {
  if (layout.value.length > 0) {
    updateGridDisplay()
  }
})
```

### 3. 内存优化

```typescript
// ✅ 推荐：及时清理事件监听器
onUnmounted(() => {
  eventBus.off('layout:change', handleLayoutChange)
  observer?.disconnect()
  animationId && cancelAnimationFrame(animationId)
})

// ✅ 推荐：使用对象池复用大型对象
const itemPool = new Map<string, GridItem>()

const getPooledItem = (id: string): GridItem => {
  return itemPool.get(id) || createNewItem(id)
}
```

## 性能优化策略

### 1. DOM操作优化

```typescript
// ✅ 推荐：批量DOM更新
const batchDOMUpdates = (updates: Array<() => void>) => {
  requestAnimationFrame(() => {
    updates.forEach(update => update())
  })
}

// ✅ 推荐：使用CSS Transform替代位置属性
const updateItemPosition = (element: HTMLElement, x: number, y: number) => {
  element.style.transform = `translate3d(${x}px, ${y}px, 0)`
}
```

### 2. 碰撞检测优化

```typescript
// ✅ 推荐：使用空间索引
class SpatialIndex {
  private grid: Map<string, Set<string>> = new Map()
  private cellSize = 100
  
  addItem(id: string, bounds: Rectangle) {
    const cells = this.getCells(bounds)
    cells.forEach(cell => {
      if (!this.grid.has(cell)) {
        this.grid.set(cell, new Set())
      }
      this.grid.get(cell)!.add(id)
    })
  }
  
  queryIntersection(bounds: Rectangle): string[] {
    const cells = this.getCells(bounds)
    const candidates = new Set<string>()
    
    cells.forEach(cell => {
      const items = this.grid.get(cell)
      items?.forEach(item => candidates.add(item))
    })
    
    return Array.from(candidates)
  }
}
```

### 3. 动画性能优化

```typescript
// ✅ 推荐：使用requestAnimationFrame的优化动画
const useOptimizedAnimation = () => {
  const animationQueue = ref<Array<() => void>>([])
  let rafId: number | null = null
  
  const scheduleAnimation = (callback: () => void) => {
    animationQueue.value.push(callback)
    
    if (!rafId) {
      rafId = requestAnimationFrame(() => {
        animationQueue.value.forEach(cb => cb())
        animationQueue.value = []
        rafId = null
      })
    }
  }
  
  return { scheduleAnimation }
}
```

## 测试规范

### 1. 单元测试

```typescript
// 示例：composable测试
import { describe, it, expect } from 'vitest'
import { useGridLayout } from '../composables/useGridLayout'

describe('useGridLayout', () => {
  it('should calculate grid position correctly', () => {
    const { getGridPosition } = useGridLayout()
    const result = getGridPosition({ x: 150, y: 250 }, { cols: 12, rowHeight: 100 })
    expect(result).toEqual({ x: 1, y: 2 })
  })
})
```

### 2. 集成测试

```typescript
// 示例：渲染器集成测试
import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import GridProRenderer from '../GridProRenderer.vue'

describe('GridProRenderer', () => {
  let wrapper: any
  
  beforeEach(() => {
    wrapper = mount(GridProRenderer, {
      props: {
        items: [],
        config: {},
        readonly: false
      }
    })
  })
  
  it('should initialize correctly', async () => {
    expect(wrapper.vm.renderer).toBeDefined()
    expect(wrapper.vm.renderer.state.initialized).toBe(true)
  })
})
```

### 3. 性能测试

```typescript
// 示例：性能基准测试
const performanceBenchmark = async () => {
  const startTime = performance.now()
  
  // 执行操作
  await renderer.setData(generateLargeDataset(1000))
  
  const endTime = performance.now()
  const duration = endTime - startTime
  
  console.log(`渲染1000个组件耗时: ${duration}ms`)
  expect(duration).toBeLessThan(100) // 期望小于100ms
}
```

## 渲染器开发完整流程

### 1. 创建渲染器基础结构

按照标准目录结构创建渲染器模块：

```
renderers/
└── your-renderer/
    ├── YourRenderer.vue          # 主渲染器组件
    ├── YourRendererFactory.ts    # 工厂类实现
    ├── adapters/                 # 数据适配器
    │   └── YourAdapter.ts
    ├── composables/              # 组合式函数
    │   ├── useYourDrag.ts
    │   └── useYourLayout.ts
    └── index.ts                  # 模块导出
```

### 2. 实现渲染器组件

```typescript
// YourRenderer.vue
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import type { BaseRenderer, RendererConfig } from '../../types/renderer'
import type { BaseCanvasItem } from '../../types/core'

// 实现BaseRenderer接口的渲染器类
class YourRendererImpl implements BaseRenderer {
  readonly id = 'your-renderer'
  readonly name = 'Your Renderer'
  readonly version = '1.0.0'
  readonly capabilities = {
    supportsDrag: true,
    supportsResize: true,
    // ... 其他能力声明
  }
  
  // 实现所有BaseRenderer接口方法
  async initialize(container: HTMLElement, config: RendererConfig): Promise<void> {
    // 初始化逻辑
  }
  
  // ... 其他方法实现
}

// 创建渲染器实例
const rendererInstance = new YourRendererImpl()

// 暴露给父组件
defineExpose({
  renderer: rendererInstance
})
</script>

<template>
  <div class="your-renderer">
    <!-- 渲染器UI实现 -->
  </div>
</template>
```

### 3. 创建专用工具栏（推荐折叠式设计）

参考 KanbanToolbar 的折叠式设计，创建专用工具栏：

```typescript
// toolbar/YourToolbar.vue
<script setup lang="ts">
import { ref } from 'vue'
import { NPopover, NButton, NIcon, NTooltip } from 'naive-ui'

interface YourToolbarConfig {
  // 定义工具栏配置项
  option1: string
  option2: number
}

const showConfigPanel = ref(false)  // 控制折叠面板显示

const updateConfig = (key: keyof YourToolbarConfig, value: any) => {
  emit('config-change', { [key]: value })
}
</script>

<template>
  <div class="your-toolbar flex items-center gap-2">
    <!-- 主要配置弹出框（折叠式设计） -->
    <NPopover
      v-model:show="showConfigPanel"
      trigger="click"
      placement="bottom-start"
    >
      <template #trigger>
        <NTooltip>
          <template #trigger>
            <NButton size="small">
              <NIcon><ConfigIcon /></NIcon>
            </NButton>
          </template>
          渲染器配置
        </NTooltip>
      </template>
      
      <div class="config-panel p-4 w-80">
        <!-- 详细配置选项 -->
      </div>
    </NPopover>
    
    <!-- 快捷操作按钮 -->
    <NTooltip>
      <template #trigger>
        <NButton size="small" @click="quickAction">
          <NIcon><ActionIcon /></NIcon>
        </NButton>
      </template>
      快捷操作
    </NTooltip>
  </div>
</template>

<style scoped>
.your-toolbar {
  padding: 0 8px;
  border-left: 1px solid #e5e7eb;
}

.config-panel {
  min-width: 280px;
}
</style>
```

### 4. 注册到系统

```typescript
// 1. 在 PanelV2.vue 中注册渲染器
import { YourRendererClass } from './renderers/your-renderer/YourRendererFactory'

rendererFactory.register('your-renderer', YourRendererClass)

// 2. 更新可用渲染器列表
const availableRenderers = computed(() => [
  { value: 'kanban', label: '看板', icon: 'grid' },
  { value: 'your-renderer', label: '你的渲染器', icon: 'your-icon' },
  // ...
])

// 3. 在 MainToolbar.vue 中添加工具栏支持
const isYourRenderer = computed(() => currentRenderer === 'your-renderer')

// 模板中添加
<YourToolbar
  v-else-if="isYourRenderer"
  :config="yourConfig"
  :readonly="readonly"
  @config-change="handleYourConfigChange"
/>
```

### 5. 工具栏配置类型定义

```typescript
// toolbar/index.ts 中添加配置类型
export interface YourToolbarConfig {
  option1: string
  option2: number
  enableFeature: boolean
  // ... 其他配置项
}

// 导出工具栏组件
export { default as YourToolbar } from './YourToolbar.vue'
```

## 开发工作流

### 1. 开发环境设置

```bash
# 安装依赖
pnpm add @vueuse/core @vueuse/motion
pnpm add -D @vitest/ui happy-dom

# 运行开发服务器
pnpm dev

# 运行测试
pnpm test
```

### 2. 开发步骤

1. **创建项目结构**: 按照标准目录结构创建文件
2. **实现Composables**: 从底层工具函数开始
3. **开发组件**: 实现UI组件和交互逻辑
4. **集成测试**: 确保与现有系统兼容
5. **性能优化**: 进行性能基准测试和优化
6. **文档完善**: 更新API文档和使用示例

### 3. 代码规范

- 使用TypeScript严格模式
- 遵循Vue3 Composition API最佳实践
- 使用ESLint和Prettier保证代码质量
- 编写详细的JSDoc注释
- 保持测试覆盖率在90%以上

## Kanban 渲染器最佳实践案例

### 折叠式工具栏设计理念

Kanban 渲染器的工具栏设计是一个优秀的参考案例，体现了以下设计理念：

**1. 空间效率优化**
- 主要配置项收纳在弹出面板中，节省工具栏空间
- 常用操作提供快捷按钮，提高操作效率
- 通过图标和提示文字提供清晰的功能指示

**2. 配置职责分离**
```typescript
// 工具栏专注渲染器配置
interface KanbanToolbarConfig {
  columns: number        // 网格列数
  rowHeight: number      // 行高
  margin: [number, number]  // 间距
  showGrid: boolean      // 显示网格
  enableSnap: boolean    // 自动对齐
  compactType: 'vertical' | 'horizontal' | null  // 紧凑模式
}

// 右侧属性面板专注卡片配置
interface CardConfig {
  title: string          // 卡片标题
  dataConfig: object     // 数据配置
  styleConfig: object    // 样式配置
  // ... 卡片特有属性
}
```

**3. 用户体验优化**
- 弹出面板提供详细配置选项
- 快捷按钮支持一键切换常用功能
- 实时预览配置变更效果

### 数据适配器模式

Kanban 渲染器使用 `BaseCanvasKanbanAdapter` 实现数据格式转换：

```typescript
// 统一的数据转换接口
class BaseCanvasKanbanAdapter {
  // BaseCanvasItem -> GridLayoutItem
  toGridFormat(items: BaseCanvasItem[]): GridLayoutItem[]
  
  // GridLayoutItem -> BaseCanvasItem
  fromGridFormat(gridItems: GridLayoutItem[], originalItems: BaseCanvasItem[]): BaseCanvasItem[]
  
  // 位置计算和碰撞检测
  calculateNewItemPosition(existingItems: GridLayoutItem[], newItemSize: { w: number, h: number })
  isPositionAvailable(existingItems: GridLayoutItem[], testItem: Rectangle)
}
```

### 事件系统集成

Kanban 渲染器展示了完整的事件处理机制：

```typescript
// 1. 内部事件处理
const handleLayoutChange = (newLayout: GridLayoutItem[]) => {
  layout.value = newLayout
  const updatedItems = kanbanAdapter.fromGridFormat(newLayout, props.items)
  emit('layout-change', updatedItems)
  canvasStore.setItems(updatedItems)
}

// 2. 全局事件总线
eventBus.on('kanban:config-change', handleConfigChange)

// 3. 拖拽服务集成
dragDropService.registerDropZone({
  id: dropZoneId,
  accepts: ['card', 'component'],
  element: containerRef.value,
  onDrop: handleDrop
})
```

## 常见问题解答

### Q: 如何处理大量组件的性能问题？
A: 使用虚拟化技术，配合Intersection Observer API只渲染可视区域的组件。参考 GridPro 渲染器的虚拟化实现。

### Q: 如何确保跨浏览器兼容性？
A: 使用现代Web API时检查浏览器支持，提供降级方案。推荐使用 @vueuse/core 提供的兼容性工具。

### Q: 如何调试渲染器性能问题？
A: 使用浏览器开发者工具的Performance面板，配合自定义性能标记。GridPro 渲染器提供了性能监控面板。

### Q: 如何处理触摸设备的交互？
A: 使用Pointer Events API统一处理所有输入类型，避免分别处理鼠标和触摸事件。参考 useGridProGesture 的实现。

### Q: 工具栏配置和卡片配置如何分工？
A: **工具栏专注渲染器级别的配置**（如网格设置、布局模式），**右侧属性面板专注单个卡片的配置**（如数据源、样式）。这样职责清晰，用户体验更好。

### Q: 如何实现折叠式工具栏？
A: 参考 KanbanToolbar 的设计：
1. 使用 NPopover 组件创建弹出配置面板
2. 主要配置项放在弹出面板中
3. 常用操作提供快捷按钮
4. 通过图标和提示文字提供清晰指示

---

本文档将持续更新，欢迎贡献改进建议和最佳实践案例。

## 参考实现

- **完整实现**: `src/components/panelv2/renderers/kanban/` - Kanban 渲染器
- **开发中**: `src/components/panelv2/renderers/gridpro/` - GridPro 渲染器
- **工具栏设计**: `src/components/panelv2/toolbar/KanbanToolbar.vue` - 折叠式工具栏
- **数据适配**: `src/components/panelv2/renderers/kanban/adapters/BaseCanvasKanbanAdapter.ts`