# Grid Layout Plus 组件使用指南

基于 [Grid Layout Plus](https://grid-layout-plus.netlify.app/) 的现代化网格布局组件，提供更好的性能和用户体验。

## 🎯 为什么选择 Grid Layout Plus？

相比原有的 DraggableResizableGrid，Grid Layout Plus 具有以下优势：

### ✅ 技术优势
- **成熟稳定** - 基于经过验证的 grid-layout-plus 库
- **性能优越** - 更好的拖拽性能和流畅度
- **响应式设计** - 内置断点支持，自适应不同屏幕
- **现代化API** - 更直观的配置和事件系统
- **广泛兼容** - 更好的浏览器兼容性

### ✅ 功能特性
- **完整的TypeScript支持** - 类型安全，开发体验好
- **丰富的配置选项** - 灵活的布局控制
- **强大的事件系统** - 完整的生命周期回调
- **主题支持** - 内置明暗主题切换
- **历史记录** - 撤销重做功能
- **导入导出** - 布局数据的持久化

## 📦 安装

项目已包含 `grid-layout-plus` 依赖，无需额外安装。

## 🚀 快速开始

### 基础用法

```vue
<template>
  <GridLayoutPlus
    v-model:layout="layout"
    :config="gridConfig"
    @layout-change="handleLayoutChange"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { GridLayoutPlus, type GridLayoutPlusItem } from '@/components/common/grid'

const layout = ref<GridLayoutPlusItem[]>([
  {
    i: 'item-1',
    x: 0,
    y: 0,
    w: 3,
    h: 2,
    type: 'chart',
    title: '图表组件'
  },
  {
    i: 'item-2',
    x: 3,
    y: 0,
    w: 2,
    h: 1,
    type: 'text',
    title: '文本组件'
  }
])

const gridConfig = {
  colNum: 12,
  rowHeight: 80,
  margin: [10, 10],
  isDraggable: true,
  isResizable: true
}

const handleLayoutChange = (newLayout: GridLayoutPlusItem[]) => {
  console.log('布局变化:', newLayout)
}
</script>
```

### 使用 Hook 进行状态管理

```vue
<template>
  <div class="grid-container">
    <div class="toolbar">
      <button @click="addItem('chart')">添加图表</button>
      <button @click="compactLayout">紧凑布局</button>
      <button @click="undo" :disabled="!canUndo">撤销</button>
      <button @click="redo" :disabled="!canRedo">重做</button>
    </div>
    
    <GridLayoutPlus
      v-model:layout="layout"
      :config="gridConfig"
      @item-edit="handleItemEdit"
    />
    
    <div class="stats">
      <span>项目数量: {{ layoutStats.totalItems }}</span>
      <span>利用率: {{ layoutStats.utilization.toFixed(1) }}%</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { GridLayoutPlus, useGridLayoutPlus } from '@/components/common/grid'

const {
  layout,
  layoutStats,
  canUndo,
  canRedo,
  addItem,
  compactCurrentLayout,
  undo,
  redo
} = useGridLayoutPlus({
  initialLayout: [],
  enableHistory: true,
  autoSave: true,
  onSave: (layout) => {
    // 自动保存到后端
    localStorage.setItem('grid-layout', JSON.stringify(layout))
  }
})

const gridConfig = {
  colNum: 12,
  rowHeight: 100,
  margin: [10, 10]
}

const compactLayout = () => {
  compactCurrentLayout()
}

const handleItemEdit = (item) => {
  // 处理项目编辑
  console.log('编辑项目:', item)
}
</script>
```

## 🔧 配置选项

### GridLayoutPlusConfig

```typescript
interface GridLayoutPlusConfig {
  // 基础配置
  colNum: number              // 列数，默认 12
  rowHeight: number           // 行高，默认 100
  margin: [number, number]    // 边距 [x, y]，默认 [10, 10]
  
  // 交互配置
  isDraggable: boolean        // 是否可拖拽，默认 true
  isResizable: boolean        // 是否可调整大小，默认 true
  preventCollision: boolean   // 是否防止碰撞，默认 false
  
  // 布局配置
  isMirrored: boolean         // 是否镜像，默认 false
  autoSize: boolean           // 是否自动调整大小，默认 true
  verticalCompact: boolean    // 是否垂直紧凑，默认 true
  useCssTransforms: boolean   // 是否使用CSS变换，默认 true
  
  // 响应式配置
  responsive: boolean         // 是否响应式，默认 false
  breakpoints: Record<string, number>  // 断点配置
  cols: Record<string, number>         // 不同断点的列数
  
  // 其他配置
  useStyleCursor: boolean     // 是否使用样式光标，默认 true
  restoreOnDrag: boolean      // 拖拽时是否恢复，默认 false
}
```

### GridLayoutPlusItem

```typescript
interface GridLayoutPlusItem {
  // 必需字段
  i: string                   // 唯一标识符
  x: number                   // X轴位置
  y: number                   // Y轴位置
  w: number                   // 宽度
  h: number                   // 高度
  
  // 约束配置
  minW?: number               // 最小宽度
  minH?: number               // 最小高度
  maxW?: number               // 最大宽度
  maxH?: number               // 最大高度
  
  // 行为配置
  isDraggable?: boolean       // 是否可拖拽
  isResizable?: boolean       // 是否可调整大小
  static?: boolean            // 是否为静态项目
  
  // 业务数据
  type?: string               // 组件类型
  title?: string              // 组件标题
  component?: Component       // 渲染的组件
  props?: Record<string, any> // 组件属性
  data?: Record<string, any>  // 组件数据
  style?: Record<string, string | number>  // 自定义样式
  className?: string          // 自定义类名
  metadata?: Record<string, any>           // 项目元数据
}
```

## 📡 事件系统

### 布局事件

```vue
<GridLayoutPlus
  @layout-created="handleLayoutCreated"
  @layout-mounted="handleLayoutMounted"
  @layout-updated="handleLayoutUpdated"
  @layout-ready="handleLayoutReady"
  @layout-change="handleLayoutChange"
  @breakpoint-changed="handleBreakpointChange"
/>
```

### 项目事件

```vue
<GridLayoutPlus
  @item-add="handleItemAdd"
  @item-delete="handleItemDelete"
  @item-update="handleItemUpdate"
  @item-edit="handleItemEdit"
  @item-move="handleItemMove"
  @item-resize="handleItemResize"
  @item-data-update="handleItemDataUpdate"
/>
```

## 🎨 自定义样式

### CSS 变量

```css
.grid-layout-plus-wrapper {
  /* 主题颜色 */
  --bg-color: #f8f9fa;
  --bg-color-dark: #1a1a1a;
  --border-color: #e1e5e9;
  --border-color-dark: #404040;
  --text-color: #495057;
  --text-color-dark: #ffffff;
  
  /* 项目样式 */
  --item-bg: white;
  --item-border: #e1e5e9;
  --item-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  --item-hover-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  
  /* 拖拽提示 */
  --drag-hint-color: #007bff;
}
```

### 自定义项目内容

```vue
<GridLayoutPlus v-model:layout="layout">
  <template #default="{ item, readonly }">
    <div class="custom-item">
      <div class="item-header">
        <h3>{{ item.title }}</h3>
        <div v-if="!readonly" class="item-actions">
          <button @click="editItem(item)">编辑</button>
          <button @click="deleteItem(item)">删除</button>
        </div>
      </div>
      
      <div class="item-content">
        <!-- 根据 item.type 渲染不同内容 -->
        <component 
          v-if="item.component"
          :is="item.component"
          v-bind="item.props"
        />
        <div v-else>{{ item.type }} 组件</div>
      </div>
    </div>
  </template>
</GridLayoutPlus>
```

## 🚀 高级用法

### 响应式布局

```typescript
const gridConfig = {
  responsive: true,
  breakpoints: { 
    lg: 1200, 
    md: 996, 
    sm: 768, 
    xs: 480, 
    xxs: 0 
  },
  cols: { 
    lg: 12, 
    md: 10, 
    sm: 6, 
    xs: 4, 
    xxs: 2 
  }
}
```

### 防止碰撞

```typescript
const gridConfig = {
  preventCollision: true  // 防止项目重叠
}
```

### 项目约束

```typescript
const item: GridLayoutPlusItem = {
  i: 'constrained-item',
  x: 0,
  y: 0,
  w: 3,
  h: 2,
  minW: 2,     // 最小宽度
  maxW: 6,     // 最大宽度
  minH: 1,     // 最小高度
  maxH: 4,     // 最大高度
  static: false, // 是否静态（不可移动/调整）
}
```

### 拖拽控制

```typescript
const item: GridLayoutPlusItem = {
  i: 'drag-controlled',
  x: 0,
  y: 0,
  w: 2,
  h: 2,
  dragIgnoreFrom: '.no-drag',      // 忽略拖拽的选择器
  dragAllowFrom: '.drag-handle',   // 允许拖拽的选择器
  resizeIgnoreFrom: '.no-resize',  // 忽略调整大小的选择器
}
```

## 📱 移动端支持

组件自动支持触摸设备：

```typescript
const gridConfig = {
  colNum: 6,        // 移动端使用更少的列数
  rowHeight: 60,    // 更小的行高
  margin: [5, 5],   // 更小的边距
}
```

## 🔄 迁移指南

从 DraggableResizableGrid 迁移到 GridLayoutPlus：

### 1. 导入更改

```typescript
// 旧版本
import { DraggableResizableGrid } from '@/components/common/grid'

// 新版本
import { GridLayoutPlus } from '@/components/common/grid'
```

### 2. 属性映射

| DraggableResizableGrid | GridLayoutPlus | 说明 |
|----------------------|----------------|------|
| `items` | `layout` | 数据属性名变更 |
| `config.columns` | `config.colNum` | 列数配置 |
| `config.rowHeight` | `config.rowHeight` | 行高配置（相同） |
| `config.gap` | `config.margin` | 间距配置（格式变更） |
| `config.readonly` | `readonly` | 只读模式提升为顶级属性 |

### 3. 事件映射

| DraggableResizableGrid | GridLayoutPlus | 说明 |
|----------------------|----------------|------|
| `@layout-change` | `@layout-change` | 相同 |
| `@item-click` | `@item-edit` | 点击事件重命名 |
| `@item-add` | `@item-add` | 相同 |
| `@item-remove` | `@item-delete` | 重命名 |

## 📚 示例项目

查看完整示例：`src/components/common/grid/examples/GridLayoutPlusExample.vue`

运行示例：
```bash
# 在开发环境中访问示例页面
http://localhost:3000/grid-layout-plus-example
```

## 🆘 常见问题

### Q: 如何设置项目的最小/最大尺寸？
A: 在 GridLayoutPlusItem 中设置 `minW`, `maxW`, `minH`, `maxH` 属性。

### Q: 如何禁用某个项目的拖拽或调整大小？
A: 设置项目的 `isDraggable: false` 或 `isResizable: false`。

### Q: 如何实现项目的自定义拖拽把手？
A: 使用 `dragAllowFrom` 属性指定拖拽把手的选择器。

### Q: 如何处理项目的数据更新？
A: 监听 `@item-data-update` 事件或使用 Hook 的数据管理方法。

### Q: 如何保存和恢复布局？
A: 使用 Hook 的 `exportCurrentLayout()` 和 `importLayout()` 方法。

## 🔗 相关链接

- [Grid Layout Plus 官方文档](https://grid-layout-plus.netlify.app/)
- [Vue 3 文档](https://vuejs.org/)
- [TypeScript 文档](https://www.typescriptlang.org/)

---

**推荐在新项目中使用 GridLayoutPlus，它提供了更好的性能和用户体验！** 🚀