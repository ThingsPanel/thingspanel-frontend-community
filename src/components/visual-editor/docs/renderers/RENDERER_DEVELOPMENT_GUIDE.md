# Visual Editor 渲染器开发指南

本指南将帮助您快速开发新的可视化编辑器渲染器。渲染器是负责在画布上布局和展示组件的核心模块。

## 📋 目录

- [快速开始](#快速开始)
- [渲染器架构](#渲染器架构)
- [开发步骤](#开发步骤)
- [最佳实践](#最佳实践)
- [示例代码](#示例代码)
- [调试指南](#调试指南)
- [常见问题](#常见问题)

## 🚀 快速开始

### 环境要求

- Vue 3.0+
- TypeScript 4.5+
- Naive UI
- 熟悉 Vue 组合式 API

### 渲染器类型

目前支持的渲染器类型：

1. **Canvas 渲染器** - 自由布局，支持拖拽和调整大小
2. **GridStack 渲染器** - 网格布局，基于 GridLayoutPlus
3. **您的自定义渲染器** - 任何您想要的布局方式

## 🏗️ 渲染器架构

### 核心组件

```
renderers/
├── base/                    # 基础架构
│   ├── BaseRenderer.ts      # 抽象基类
│   ├── BaseRendererComponent.vue  # Vue 组件基类
│   └── RendererManager.ts   # 渲染器管理器
├── your-renderer/           # 您的渲染器
│   ├── YourRenderer.vue     # 主渲染器组件
│   ├── components/          # 子组件
│   ├── types.ts            # 类型定义
│   └── index.ts            # 导出文件
└── index.ts                # 统一导出
```

### 接口规范

每个渲染器必须遵循以下接口：

#### Props
```typescript
interface RendererProps {
  readonly?: boolean          // 只读模式
  config?: RendererConfig    // 渲染器特定配置
  showWidgetTitles?: boolean // 显示组件标题
}
```

#### Emits
```typescript
interface RendererEmits {
  (e: 'ready'): void                           // 渲染器就绪
  (e: 'error', error: Error): void             // 错误事件
  (e: 'node-select', nodeId: string): void     // 节点选择
  (e: 'canvas-click', event?: MouseEvent): void // 画布点击
}
```

## 📝 开发步骤

### 第一步：创建渲染器目录

```bash
mkdir src/components/visual-editor/renderers/your-renderer
cd src/components/visual-editor/renderers/your-renderer
```

### 第二步：创建主组件

创建 `YourRenderer.vue`：

```vue
<template>
  <BaseRendererComponent
    :readonly="readonly"
    @ready="onRendererReady"
    @error="onRendererError"
    @node-select="onNodeSelect"
    @canvas-click="onCanvasClick"
  >
    <div 
      class="your-renderer grid-background-base"
      :class="{ 
        'show-grid': config.showGrid && !readonly,
        'preview-mode': isPreviewMode
      }"
    >
      <!-- 您的布局逻辑 -->
      <div 
        v-for="node in nodes"
        :key="node.id"
        class="renderer-node"
        :style="getNodeStyle(node)"
        @click="handleNodeClick(node.id)"
      >
        <!-- 渲染节点内容 -->
        <Card2Wrapper
          v-if="isCard2Component(node.type)"
          :component-type="node.type"
          :config="node.properties"
          :data="node.metadata?.card2Data"
          :node-id="node.id"
        />
        <component 
          :is="getWidgetComponent(node.type)"
          v-else
          v-bind="node.properties"
        />
      </div>
    </div>
  </BaseRendererComponent>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useEditor } from '../../hooks/useEditor'
import { globalPreviewMode } from '../../hooks/usePreviewMode'
import BaseRendererComponent from '../base/BaseRendererComponent.vue'
import Card2Wrapper from '../canvas/Card2Wrapper.vue'

// Props 定义
interface Props {
  readonly?: boolean
  config?: {
    showGrid?: boolean
    // 添加您的配置选项
  }
  showWidgetTitles?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  readonly: false,
  config: () => ({ showGrid: true }),
  showWidgetTitles: false
})

// Emits 定义
interface Emits {
  (e: 'ready'): void
  (e: 'error', error: Error): void
  (e: 'node-select', nodeId: string): void
  (e: 'canvas-click', event?: MouseEvent): void
}

const emit = defineEmits<Emits>()

// 获取编辑器状态
const { stateManager, selectNode, isCard2Component } = useEditor()
const { isPreviewMode } = globalPreviewMode

// 计算属性
const nodes = computed(() => stateManager.canvasState.value.nodes)

// 事件处理
const onRendererReady = () => emit('ready')
const onRendererError = (error: Error) => emit('error', error)
const onNodeSelect = (nodeId: string) => emit('node-select', nodeId)
const onCanvasClick = (event?: MouseEvent) => emit('canvas-click', event)

const handleNodeClick = (nodeId: string) => {
  if (!isPreviewMode.value) {
    selectNode(nodeId)
    emit('node-select', nodeId)
  }
}

// 样式计算
const getNodeStyle = (node: any) => {
  // 根据您的布局算法计算节点样式
  return {
    position: 'absolute',
    left: `${node.x}px`,
    top: `${node.y}px`,
    width: `${node.width}px`,
    height: `${node.height}px`
  }
}

// 组件获取
const getWidgetComponent = (type: string) => {
  // 返回对应的 Widget 组件
  return null
}
</script>

<style scoped>
.your-renderer {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 600px;
  user-select: none;
}

.renderer-node {
  border: 2px solid transparent;
  transition: border-color 0.2s ease;
  cursor: pointer;
}

.renderer-node:hover:not(.readonly) {
  border-color: rgba(24, 160, 88, 0.3);
}

.renderer-node.selected {
  border-color: var(--n-primary-color);
}
</style>
```

### 第三步：创建类型定义

创建 `types.ts`：

```typescript
/**
 * 渲染器特定类型定义
 */

export interface YourRendererConfig {
  showGrid?: boolean
  gridSize?: number
  snapToGrid?: boolean
  // 添加您的配置项
}

export interface YourRendererNode {
  id: string
  type: string
  x: number
  y: number
  width: number
  height: number
  properties: Record<string, any>
  // 添加渲染器特定属性
}

export interface YourRendererState {
  nodes: YourRendererNode[]
  selectedIds: string[]
  // 添加状态属性
}
```

### 第四步：创建导出文件

创建 `index.ts`：

```typescript
/**
 * Your Renderer 渲染器导出
 */

export { default as YourRenderer } from './YourRenderer.vue'
export type { YourRendererConfig, YourRendererNode, YourRendererState } from './types'

// 如果有工厂类，也在这里导出
// export { YourRendererFactory } from './YourRendererFactory'
```

### 第五步：注册渲染器

在 `renderers/index.ts` 中添加您的渲染器：

```typescript
// 导入您的渲染器
export { YourRenderer } from './your-renderer'

// 在注释中说明用途
/**
 * Your Renderer - 您的渲染器的简短描述
 * 特点：列出主要特性
 * 适用场景：说明适合的使用场景
 */
```

## 🎯 最佳实践

### 1. 遵循统一接口

✅ **推荐做法：**
```vue
<!-- 始终使用 BaseRendererComponent 作为包装器 -->
<BaseRendererComponent
  :readonly="readonly"
  @ready="onRendererReady"
  @error="onRendererError"
  @node-select="onNodeSelect"
  @canvas-click="onCanvasClick"
>
  <!-- 您的渲染器内容 -->
</BaseRendererComponent>
```

❌ **避免做法：**
```vue
<!-- 不要直接创建根容器，绕过基础组件 -->
<div class="my-renderer">
  <!-- 内容 -->
</div>
```

### 2. 正确使用栅格背景

✅ **推荐做法：**
```vue
<div 
  class="your-renderer grid-background-base"
  :class="{ 
    'show-grid': config.showGrid && !readonly,
    'preview-mode': isPreviewMode
  }"
>
```

❌ **避免做法：**
```css
/* 不要重复实现栅格样式 */
.your-renderer {
  background-image: linear-gradient(...);
}
```

### 3. 响应式状态管理

✅ **推荐做法：**
```typescript
import { useEditor } from '../../hooks/useEditor'

const { stateManager, selectNode, updateNode } = useEditor()
const nodes = computed(() => stateManager.canvasState.value.nodes)
```

❌ **避免做法：**
```typescript
// 不要创建独立的状态管理
const nodes = ref([])
```

### 4. 预览模式支持

✅ **推荐做法：**
```typescript
import { globalPreviewMode } from '../../hooks/usePreviewMode'

const { isPreviewMode } = globalPreviewMode

const handleNodeClick = (nodeId: string) => {
  if (!isPreviewMode.value) {
    // 只在编辑模式下处理选择
    selectNode(nodeId)
  }
}
```

### 5. 错误处理

✅ **推荐做法：**
```typescript
const handleError = (error: Error) => {
  console.error('[YourRenderer] Error:', error)
  emit('error', error)
}

try {
  // 可能出错的操作
} catch (error) {
  handleError(error as Error)
}
```

### 6. 性能优化

✅ **推荐做法：**
```typescript
// 使用 shallowRef 处理大量数据
import { shallowRef, computed } from 'vue'

const layout = shallowRef<LayoutItem[]>([])

// 使用计算属性缓存复杂计算
const sortedNodes = computed(() => 
  nodes.value.sort((a, b) => a.y - b.y)
)
```

## 📖 示例代码

### 简单列表渲染器

```vue
<template>
  <BaseRendererComponent
    :readonly="readonly"
    @ready="onRendererReady"
    @error="onRendererError"
    @node-select="onNodeSelect"
    @canvas-click="onCanvasClick"
  >
    <div class="list-renderer">
      <div 
        v-for="(node, index) in sortedNodes"
        :key="node.id"
        class="list-item"
        :class="{ selected: selectedIds.includes(node.id) }"
        :style="{ top: `${index * 120}px` }"
        @click="handleNodeClick(node.id)"
      >
        <Card2Wrapper
          v-if="isCard2Component(node.type)"
          :component-type="node.type"
          :config="node.properties"
          :data="node.metadata?.card2Data"
          :node-id="node.id"
        />
      </div>
    </div>
  </BaseRendererComponent>
</template>
```

### 网格渲染器

```vue
<template>
  <BaseRendererComponent
    :readonly="readonly"
    @ready="onRendererReady"
    @error="onRendererError"
    @node-select="onNodeSelect"
    @canvas-click="onCanvasClick"
  >
    <div 
      class="grid-renderer grid-background-base"
      :class="{ 'show-grid': config.showGrid }"
      :style="{ 
        '--grid-cols': config.columns,
        '--grid-rows': config.rows 
      }"
    >
      <div 
        v-for="node in nodes"
        :key="node.id"
        class="grid-item"
        :style="getGridItemStyle(node)"
        @click="handleNodeClick(node.id)"
      >
        <!-- 节点内容 -->
      </div>
    </div>
  </BaseRendererComponent>
</template>

<script setup lang="ts">
const getGridItemStyle = (node: any) => {
  return {
    gridColumn: `${node.gridX} / span ${node.gridW}`,
    gridRow: `${node.gridY} / span ${node.gridH}`
  }
}
</script>

<style scoped>
.grid-renderer {
  display: grid;
  grid-template-columns: repeat(var(--grid-cols, 12), 1fr);
  grid-template-rows: repeat(var(--grid-rows, auto), minmax(100px, auto));
  gap: 10px;
  padding: 10px;
}
</style>
```

## 🐛 调试指南

### 1. 启用调试日志

```typescript
// 在开发环境中启用详细日志
if (import.meta.env.DEV) {
  console.log('[YourRenderer] Nodes:', nodes.value)
  console.log('[YourRenderer] Config:', props.config)
}
```

### 2. 使用 Vue DevTools

- 安装 Vue DevTools 浏览器扩展
- 检查组件层次结构
- 观察响应式数据变化

### 3. 断点调试

```typescript
const handleNodeClick = (nodeId: string) => {
  debugger; // 在浏览器中设置断点
  if (!isPreviewMode.value) {
    selectNode(nodeId)
  }
}
```

### 4. 错误边界

```vue
<template>
  <div>
    <ErrorBoundary @error="handleComponentError">
      <YourRendererContent />
    </ErrorBoundary>
  </div>
</template>
```

## ❓ 常见问题

### Q: 如何添加新的布局算法？

A: 创建一个新的计算方法：

```typescript
const calculateLayout = (nodes: Node[], algorithm: 'flow' | 'grid' | 'auto') => {
  switch (algorithm) {
    case 'flow':
      return calculateFlowLayout(nodes)
    case 'grid':
      return calculateGridLayout(nodes)
    case 'auto':
      return calculateAutoLayout(nodes)
    default:
      return nodes
  }
}
```

### Q: 如何支持自定义主题？

A: 使用 CSS 变量和主题系统：

```typescript
import { useThemeStore } from '@/store/modules/theme'

const themeStore = useThemeStore()
const isDark = computed(() => themeStore.darkMode)
```

```css
.your-renderer {
  background-color: var(--n-body-color);
  color: var(--n-text-color);
}
```

### Q: 如何处理大量节点的性能问题？

A: 使用虚拟滚动或分页：

```typescript
import { useVirtualList } from '@vueuse/core'

const { list, containerProps, wrapperProps } = useVirtualList(
  nodes,
  {
    itemHeight: 120,
    overscan: 5
  }
)
```

### Q: 如何实现拖拽功能？

A: 参考 CanvasRenderer 的实现：

```typescript
const isDragging = ref(false)
const dragStartPos = ref({ x: 0, y: 0 })

const handleMouseDown = (event: MouseEvent) => {
  isDragging.value = true
  dragStartPos.value = { x: event.clientX, y: event.clientY }
  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('mouseup', handleMouseUp)
}
```

### Q: 如何添加右键菜单？

A: 使用 ContextMenu 组件：

```vue
<ContextMenu
  :show="contextMenu.show"
  :x="contextMenu.x"
  :y="contextMenu.y"
  :selected-widgets="selectedNodes"
  @select="handleContextMenuAction"
  @close="closeContextMenu"
/>
```

## 📚 参考资源

- [Vue 3 文档](https://v3.vuejs.org/)
- [TypeScript 文档](https://www.typescriptlang.org/docs/)
- [Naive UI 文档](https://www.naiveui.com/)
- [现有渲染器源码](./canvas/CanvasRenderer.vue)

## 🤝 贡献指南

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/your-renderer`)
3. 提交更改 (`git commit -am 'Add YourRenderer'`)
4. 推送分支 (`git push origin feature/your-renderer`)
5. 创建 Pull Request

---

**祝您开发愉快！** 🎉

如果遇到问题，请查看现有渲染器的实现或在项目中提交 Issue。