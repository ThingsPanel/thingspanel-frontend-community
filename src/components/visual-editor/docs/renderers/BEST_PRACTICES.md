# 渲染器开发最佳实践和常见问题

本文档汇总了渲染器开发过程中的最佳实践、性能优化技巧和常见问题解决方案。

## 📋 目录

- [架构设计最佳实践](#架构设计最佳实践)
- [性能优化指南](#性能优化指南)
- [状态管理规范](#状态管理规范)
- [样式和主题](#样式和主题)
- [错误处理和调试](#错误处理和调试)
- [常见问题解答](#常见问题解答)
- [代码审查清单](#代码审查清单)

## 🏗️ 架构设计最佳实践

### 1. 组件结构规范

✅ **推荐结构**:
```
your-renderer/
├── YourRenderer.vue      # 主渲染器组件
├── components/           # 子组件
│   ├── YourNode.vue     # 节点组件
│   ├── YourToolbar.vue  # 工具栏组件
│   └── YourModal.vue    # 弹窗组件
├── composables/         # 组合式函数
│   ├── useLayout.ts     # 布局逻辑
│   ├── useInteraction.ts # 交互逻辑
│   └── useAnimation.ts  # 动画逻辑
├── types.ts            # 类型定义
├── utils.ts            # 工具函数
└── index.ts            # 导出文件
```

### 2. 组件命名规范

```typescript
// ✅ 推荐：清晰的组件命名
export { CanvasRenderer } from './canvas'
export { GridStackRenderer } from './gridstack'
export { KanbanRenderer } from './kanban'

// ❌ 避免：模糊的命名
export { Renderer1 } from './r1'
export { MyComp } from './mc'
```

### 3. 接口设计原则

```typescript
// ✅ 推荐：统一的接口设计
interface RendererProps {
  readonly?: boolean          // 所有渲染器都应支持
  config?: RendererConfig    // 渲染器特定配置
  showWidgetTitles?: boolean // 可选的UI配置
}

interface RendererConfig {
  // 基础配置
  showGrid?: boolean
  theme?: 'light' | 'dark'
  
  // 渲染器特定配置
  [key: string]: any
}

// ❌ 避免：不一致的接口
interface BadProps {
  isReadOnly?: boolean    // 与其他渲染器不一致
  options?: any          // 类型不明确
}
```

## ⚡ 性能优化指南

### 1. 响应式数据优化

```typescript
// ✅ 推荐：使用 shallowRef 处理大量数据
import { shallowRef, computed } from 'vue'

const layout = shallowRef<LayoutItem[]>([])
const nodes = shallowRef<NodeData[]>([])

// ✅ 推荐：计算属性缓存复杂计算
const sortedNodes = computed(() => 
  nodes.value
    .filter(node => node.visible)
    .sort((a, b) => a.zIndex - b.zIndex)
)

// ❌ 避免：频繁的深度响应式操作
const badNodes = reactive([...largeArray]) // 大数组的深度响应式
```

### 2. 虚拟化处理

```typescript
// ✅ 推荐：大量节点时使用虚拟化
import { useVirtualList } from '@vueuse/core'

const { list, containerProps, wrapperProps } = useVirtualList(
  nodes,
  {
    itemHeight: (index) => nodeHeights.value[index] || 100,
    overscan: 5, // 预渲染项目数
  }
)

// 只渲染可见项目
const visibleNodes = computed(() => list.value.map(item => item.data))
```

### 3. 事件处理优化

```typescript
// ✅ 推荐：防抖和节流
import { debounce, throttle } from 'lodash-es'

const handleResize = debounce((event: Event) => {
  recalculateLayout()
}, 300)

const handleScroll = throttle((event: Event) => {
  updateViewport()
}, 16) // 60fps

// ✅ 推荐：事件委托
const handleNodeClick = (event: MouseEvent) => {
  const nodeId = (event.target as HTMLElement).dataset.nodeId
  if (nodeId) {
    selectNode(nodeId)
  }
}
```

### 4. 渲染优化

```vue
<template>
  <!-- ✅ 推荐：使用 v-memo 缓存复杂子组件 -->
  <div 
    v-for="node in nodes"
    :key="node.id"
    v-memo="[node.id, node.x, node.y, node.width, node.height, selectedIds.includes(node.id)]"
  >
    <NodeComponent :node="node" />
  </div>

  <!-- ✅ 推荐：条件渲染避免不必要的组件创建 -->
  <ExpensiveComponent v-if="showExpensiveFeature" />
</template>
```

## 📊 状态管理规范

### 1. 使用编辑器状态

```typescript
// ✅ 推荐：使用全局状态管理
import { useEditor } from '../../hooks/useEditor'

const { stateManager, selectNode, updateNode } = useEditor()

// 响应式访问状态
const nodes = computed(() => stateManager.canvasState.value.nodes)
const selectedIds = computed(() => stateManager.canvasState.value.selectedIds)

// ❌ 避免：创建独立的状态副本
const localNodes = ref([...nodes.value]) // 状态不同步
```

### 2. 状态更新模式

```typescript
// ✅ 推荐：通过编辑器钩子更新状态
const handleNodeMove = (nodeId: string, newPosition: { x: number, y: number }) => {
  updateNode(nodeId, newPosition)
}

// ✅ 推荐：批量更新
const handleBatchUpdate = (updates: Array<{ id: string, changes: any }>) => {
  stateManager.batchUpdate(updates)
}

// ❌ 避免：直接修改响应式对象
nodes.value[0].x = 100 // 可能导致状态不一致
```

### 3. 预览模式支持

```typescript
// ✅ 推荐：正确响应预览模式
import { globalPreviewMode } from '../../hooks/usePreviewMode'

const { isPreviewMode } = globalPreviewMode

const handleInteraction = (nodeId: string) => {
  if (isPreviewMode.value) {
    // 预览模式：触发交互逻辑
    triggerNodeInteraction(nodeId)
  } else {
    // 编辑模式：选择节点
    selectNode(nodeId)
  }
}
```

## 🎨 样式和主题

### 1. 使用统一的栅格系统

```vue
<template>
  <!-- ✅ 推荐：使用统一的栅格背景类 -->
  <div 
    class="your-renderer grid-background-base"
    :class="{
      'show-grid': config.showGrid && !readonly,
      'preview-mode': isPreviewMode.value
    }"
  >
</template>

<style scoped>
/* ❌ 避免：重复实现栅格样式 */
.your-renderer {
  background-image: linear-gradient(...); /* 不要这样做 */
}
</style>
```

### 2. 主题适配

```typescript
// ✅ 推荐：使用主题系统
import { useThemeStore } from '@/store/modules/theme'

const themeStore = useThemeStore()
const isDark = computed(() => themeStore.darkMode)
```

```css
/* ✅ 推荐：使用 CSS 变量 */
.your-renderer {
  background-color: var(--n-body-color);
  color: var(--n-text-color);
  border-color: var(--n-border-color);
}

/* ❌ 避免：硬编码颜色 */
.bad-renderer {
  background-color: #ffffff; /* 不支持主题切换 */
  color: #000000;
}
```

### 3. 响应式设计

```css
/* ✅ 推荐：移动端适配 */
@media (max-width: 768px) {
  .your-renderer {
    padding: 10px;
    min-height: 400px;
  }
  
  .renderer-node {
    min-width: 280px;
    font-size: 14px;
  }
}

/* ✅ 推荐：高 DPI 屏幕适配 */
@media (min-resolution: 2dppx) {
  .renderer-icon {
    transform: scale(0.5);
  }
}
```

## 🛠️ 错误处理和调试

### 1. 错误边界和处理

```typescript
// ✅ 推荐：完善的错误处理
const handleError = (error: Error, context: string) => {
  console.error(`[YourRenderer] ${context}:`, error)
  
  // 上报错误
  emit('error', error)
  
  // 错误恢复
  if (context === 'layout') {
    fallbackToDefaultLayout()
  }
}

// ✅ 推荐：防御性编程
const safeUpdateNode = (nodeId: string, updates: any) => {
  try {
    const node = nodes.value.find(n => n.id === nodeId)
    if (!node) {
      throw new Error(`Node not found: ${nodeId}`)
    }
    
    updateNode(nodeId, updates)
  } catch (error) {
    handleError(error as Error, 'node-update')
  }
}
```

### 2. 调试工具

```typescript
// ✅ 推荐：开发环境调试
if (import.meta.env.DEV) {
  // 全局暴露调试方法
  ;(window as any).__debugRenderer = {
    getNodes: () => nodes.value,
    getState: () => stateManager.canvasState.value,
    selectNode,
    clearSelection: () => stateManager.clearSelection()
  }
  
  // 详细日志
  watch(nodes, (newNodes) => {
    console.log('[YourRenderer] Nodes updated:', newNodes.length)
  }, { immediate: true })
}
```

### 3. 性能监控

```typescript
// ✅ 推荐：性能监控
const performanceMonitor = {
  start: (operation: string) => {
    performance.mark(`${operation}-start`)
  },
  
  end: (operation: string) => {
    performance.mark(`${operation}-end`)
    performance.measure(operation, `${operation}-start`, `${operation}-end`)
    
    const measure = performance.getEntriesByName(operation)[0]
    if (measure.duration > 16) { // 超过一帧的时间
      console.warn(`[Performance] ${operation} took ${measure.duration}ms`)
    }
  }
}

// 使用示例
const updateLayout = () => {
  performanceMonitor.start('layout-update')
  // 布局更新逻辑
  performanceMonitor.end('layout-update')
}
```

## ❓ 常见问题解答

### Q1: 如何处理大量节点的性能问题？

**A**: 使用以下策略：

1. **虚拟滚动**: 只渲染可见区域的节点
2. **分层渲染**: 将节点分组，按需加载
3. **简化DOM**: 减少每个节点的DOM复杂度
4. **使用 Web Workers**: 在后台线程进行复杂计算

```typescript
// 示例：分层渲染
const visibleNodes = computed(() => {
  const viewport = getCurrentViewport()
  return nodes.value.filter(node => isInViewport(node, viewport))
})
```

### Q2: 如何实现自定义拖拽功能？

**A**: 参考以下实现：

```typescript
const useDragAndDrop = () => {
  const isDragging = ref(false)
  const dragOffset = ref({ x: 0, y: 0 })
  
  const handleMouseDown = (event: MouseEvent, nodeId: string) => {
    const node = getNode(nodeId)
    dragOffset.value = {
      x: event.clientX - node.x,
      y: event.clientY - node.y
    }
    
    isDragging.value = true
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }
  
  const handleMouseMove = (event: MouseEvent) => {
    if (!isDragging.value) return
    
    const newX = event.clientX - dragOffset.value.x
    const newY = event.clientY - dragOffset.value.y
    
    updateNodePosition(draggedNodeId.value, { x: newX, y: newY })
  }
  
  const handleMouseUp = () => {
    isDragging.value = false
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)
  }
  
  return { isDragging, handleMouseDown }
}
```

### Q3: 如何支持撤销/重做功能？

**A**: 使用编辑器的历史管理：

```typescript
import { useEditor } from '../../hooks/useEditor'

const { stateManager } = useEditor()

// 自动记录历史的操作
const moveNode = (nodeId: string, position: { x: number, y: number }) => {
  // 这些操作会自动记录到历史中
  updateNode(nodeId, position)
}

// 手动保存快照
const saveSnapshot = () => {
  stateManager.saveSnapshot('Custom operation')
}

// 撤销/重做
const undo = () => stateManager.undo()
const redo = () => stateManager.redo()
```

### Q4: 如何添加键盘快捷键？

**A**: 在渲染器中添加键盘事件监听：

```typescript
import { useEventListener } from '@vueuse/core'

const setupKeyboardShortcuts = () => {
  useEventListener('keydown', (event: KeyboardEvent) => {
    if (event.ctrlKey || event.metaKey) {
      switch (event.key) {
        case 'a':
          event.preventDefault()
          selectAllNodes()
          break
        case 'c':
          event.preventDefault()
          copySelectedNodes()
          break
        case 'v':
          event.preventDefault()
          pasteNodes()
          break
        case 'z':
          event.preventDefault()
          if (event.shiftKey) {
            redo()
          } else {
            undo()
          }
          break
      }
    } else {
      switch (event.key) {
        case 'Delete':
          deleteSelectedNodes()
          break
        case 'Escape':
          clearSelection()
          break
      }
    }
  })
}
```

### Q5: 如何优化渲染性能？

**A**: 采用以下优化策略：

```typescript
// 1. 使用计算属性缓存
const expensiveComputation = computed(() => {
  return nodes.value.map(node => complexCalculation(node))
})

// 2. 使用 v-memo 缓存模板
// 在模板中：v-memo="[node.id, node.x, node.y, node.selected]"

// 3. 避免不必要的重新渲染
const stableConfig = readonly(props.config)

// 4. 使用 shallowRef 减少响应式开销
const layout = shallowRef<LayoutItem[]>([])

// 5. 批量DOM更新
const batchUpdateDOM = (updates: Array<() => void>) => {
  requestAnimationFrame(() => {
    updates.forEach(update => update())
  })
}
```

## ✅ 代码审查清单

### 基础要求
- [ ] 继承自 BaseRendererComponent
- [ ] 实现所有必需的 Props 和 Emits
- [ ] 使用 useEditor 钩子管理状态
- [ ] 支持预览模式和只读模式
- [ ] 使用统一的栅格背景系统

### 性能要求
- [ ] 大量数据使用 shallowRef
- [ ] 复杂计算使用计算属性缓存
- [ ] 事件处理使用防抖/节流
- [ ] 避免不必要的DOM操作

### 用户体验
- [ ] 响应式设计，支持移动端
- [ ] 支持键盘操作
- [ ] 提供视觉反馈（hover、选中状态）
- [ ] 错误状态有友好提示

### 代码质量
- [ ] TypeScript 类型定义完整
- [ ] 错误处理完善
- [ ] 代码注释清晰
- [ ] 遵循命名规范

### 可维护性
- [ ] 组件结构清晰
- [ ] 配置项文档化
- [ ] 提供使用示例
- [ ] 单元测试覆盖

---

**遵循这些最佳实践，您的渲染器将具有良好的性能、用户体验和可维护性！** ✨