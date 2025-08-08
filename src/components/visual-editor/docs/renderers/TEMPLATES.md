# 渲染器模板使用指南

本目录包含了多种渲染器模板，帮助您快速开发自定义渲染器。每个模板都针对不同的使用场景进行了优化。

## 📁 模板说明

### 1. BasicRenderer.vue
**适用场景**: 基础的自由布局需求
- ✅ 简单易懂，适合初学者
- ✅ 支持绝对定位布局
- ✅ 完整的事件处理和错误处理
- ✅ 预览模式和只读模式支持

**使用方法**:
```bash
# 复制模板
cp templates/BasicRenderer.vue your-renderer/YourRenderer.vue

# 修改以下内容：
# 1. 组件名称和类名
# 2. 配置接口 Props.config
# 3. getNodeStyle() 方法中的布局逻辑
# 4. 添加自定义样式
```

### 2. FlowRenderer.vue
**适用场景**: 流式布局，组件自动排列
- ✅ Flexbox 布局
- ✅ 支持多种对齐方式
- ✅ 响应式自适应
- ✅ 可配置间距和尺寸

**使用方法**:
```bash
# 复制模板
cp templates/FlowRenderer.vue your-renderer/FlowRenderer.vue

# 配置选项：
# - direction: 'row' | 'column'
# - wrap: boolean
# - gap: number
# - alignItems, justifyContent
# - itemWidth, itemHeight
```

### 3. CustomGridRenderer.vue
**适用场景**: 固定网格布局
- ✅ CSS Grid 布局
- ✅ 固定行列数
- ✅ 支持网格合并
- ✅ 空单元格交互

**使用方法**:
```bash
# 复制模板
cp templates/CustomGridRenderer.vue your-renderer/GridRenderer.vue

# 配置网格：
# - rows: 行数
# - columns: 列数
# - gap: 间距
# - cellAspectRatio: 单元格宽高比
```

## 🚀 快速开始

### 步骤 1: 选择模板
根据您的需求选择合适的模板：

- **自由布局** → `BasicRenderer.vue`
- **流式布局** → `FlowRenderer.vue`  
- **网格布局** → `CustomGridRenderer.vue`

### 步骤 2: 复制和重命名
```bash
# 创建您的渲染器目录
mkdir src/components/visual-editor/renderers/my-renderer

# 复制选择的模板
cp templates/BasicRenderer.vue my-renderer/MyRenderer.vue
```

### 步骤 3: 自定义配置
修改配置接口以适应您的需求：

```typescript
interface Props {
  readonly?: boolean
  config?: {
    // 添加您的配置选项
    showGrid?: boolean
    customOption1?: string
    customOption2?: number
  }
  showWidgetTitles?: boolean
}
```

### 步骤 4: 实现布局逻辑
修改 `getNodeStyle()` 或相关的布局方法：

```typescript
const getNodeStyle = (node: any) => {
  // 实现您的布局算法
  return {
    position: 'absolute',
    left: `${calculateX(node)}px`,
    top: `${calculateY(node)}px`,
    width: `${calculateWidth(node)}px`,
    height: `${calculateHeight(node)}px`
  }
}
```

### 步骤 5: 添加样式
在 `<style scoped>` 中添加您的自定义样式：

```css
.my-renderer {
  /* 添加您的样式 */
}

.my-renderer-node {
  /* 节点样式 */
}
```

### 步骤 6: 注册渲染器
在 `renderers/index.ts` 中导出您的渲染器：

```typescript
export { MyRenderer } from './my-renderer'
```

## 🎨 自定义指南

### 布局算法示例

#### 1. 瀑布流布局
```typescript
const calculateWaterfallLayout = (nodes: any[]) => {
  const columns = 3
  const columnHeights = new Array(columns).fill(0)
  
  return nodes.map(node => {
    const shortestCol = columnHeights.indexOf(Math.min(...columnHeights))
    const x = shortestCol * (containerWidth / columns)
    const y = columnHeights[shortestCol]
    
    columnHeights[shortestCol] += node.height + gap
    
    return { ...node, x, y }
  })
}
```

#### 2. 圆形布局
```typescript
const calculateCircularLayout = (nodes: any[], centerX: number, centerY: number, radius: number) => {
  const angleStep = (2 * Math.PI) / nodes.length
  
  return nodes.map((node, index) => {
    const angle = index * angleStep
    const x = centerX + Math.cos(angle) * radius
    const y = centerY + Math.sin(angle) * radius
    
    return { ...node, x, y }
  })
}
```

#### 3. 树形布局
```typescript
const calculateTreeLayout = (nodes: any[], rootId: string) => {
  const levels: any[][] = []
  const visited = new Set()
  
  // 构建层级结构
  const buildLevels = (nodeId: string, level: number) => {
    if (visited.has(nodeId)) return
    visited.add(nodeId)
    
    if (!levels[level]) levels[level] = []
    const node = nodes.find(n => n.id === nodeId)
    if (node) levels[level].push(node)
    
    // 递归处理子节点
    const children = nodes.filter(n => n.parentId === nodeId)
    children.forEach(child => buildLevels(child.id, level + 1))
  }
  
  buildLevels(rootId, 0)
  
  // 计算位置
  return levels.flatMap((levelNodes, levelIndex) => 
    levelNodes.map((node, nodeIndex) => ({
      ...node,
      x: (nodeIndex - levelNodes.length / 2) * 200,
      y: levelIndex * 150
    }))
  )
}
```

### 交互增强

#### 1. 拖拽排序
```typescript
import { useSortable } from '@dnd-kit/sortable'

const handleDragEnd = (event: any) => {
  const { active, over } = event
  if (active.id !== over.id) {
    // 重新排序逻辑
    reorderNodes(active.id, over.id)
  }
}
```

#### 2. 键盘导航
```typescript
const handleKeyDown = (event: KeyboardEvent) => {
  switch (event.key) {
    case 'ArrowUp':
      selectPreviousNode()
      break
    case 'ArrowDown':
      selectNextNode()
      break
    case 'Delete':
      deleteSelectedNodes()
      break
  }
}
```

#### 3. 批量操作
```typescript
const handleBatchSelect = (startId: string, endId: string) => {
  const startIndex = nodes.value.findIndex(n => n.id === startId)
  const endIndex = nodes.value.findIndex(n => n.id === endId)
  
  const [start, end] = [startIndex, endIndex].sort((a, b) => a - b)
  const selectedNodes = nodes.value.slice(start, end + 1)
  
  stateManager.selectNodes(selectedNodes.map(n => n.id))
}
```

## 🔧 进阶技巧

### 1. 虚拟化支持
对于大量节点，使用虚拟滚动：

```typescript
import { useVirtualList } from '@vueuse/core'

const { list, containerProps, wrapperProps } = useVirtualList(
  nodes,
  {
    itemHeight: 100,
    overscan: 5
  }
)
```

### 2. 动画效果
添加布局变化动画：

```css
.renderer-node {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.layout-change-enter-active,
.layout-change-leave-active {
  transition: all 0.3s ease;
}

.layout-change-enter-from {
  opacity: 0;
  transform: scale(0.8);
}

.layout-change-leave-to {
  opacity: 0;
  transform: scale(1.2);
}
```

### 3. 响应式布局
根据容器尺寸调整布局：

```typescript
import { useElementSize } from '@vueuse/core'

const containerRef = ref<HTMLElement>()
const { width, height } = useElementSize(containerRef)

const responsiveConfig = computed(() => {
  if (width.value < 768) {
    return { columns: 1, gap: 8 }
  } else if (width.value < 1200) {
    return { columns: 2, gap: 12 }
  } else {
    return { columns: 3, gap: 16 }
  }
})
```

## 📚 参考资源

- [Vue 3 组合式 API](https://v3.vuejs.org/guide/composition-api-introduction.html)
- [CSS Grid 布局](https://developer.mozilla.org/zh-CN/docs/Web/CSS/CSS_Grid_Layout)
- [Flexbox 布局](https://developer.mozilla.org/zh-CN/docs/Web/CSS/CSS_Flexible_Box_Layout)
- [VueUse 工具库](https://vueuse.org/)

## 💡 提示

1. **性能优化**: 对于复杂布局，使用 `shallowRef` 和计算属性
2. **调试友好**: 添加详细的 console.log 和错误处理
3. **测试用例**: 为您的渲染器编写单元测试
4. **文档完善**: 为配置项和方法添加详细注释

---

**开始创建您的渲染器吧！** 🎨