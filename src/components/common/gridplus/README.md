# GridPlus 组件 - 基于 GridStack.js 的现代化网格布局组件

GridPlus 是一个基于 GridStack.js 的 Vue 3 网格布局组件，提供强大的拖拽、调整大小、响应式布局等功能。

## ✨ 特性

### 🚀 核心功能
- **基于 GridStack.js**: 使用成熟的 GridStack.js 库，稳定可靠
- **现代化设计**: 简洁美观的卡片设计，支持深色/浅色主题
- **高性能**: GridStack.js 原生性能优化，流畅的拖拽体验
- **类型安全**: 完整的 TypeScript 类型支持
- **响应式**: 支持响应式布局和断点配置
- **自动布局**: 智能自动布局和紧凑算法

### 🎯 交互功能
- **拖拽排序**: 支持拖拽重新排序，流畅的拖拽体验
- **调整大小**: 支持多方向调整大小，8个方向的手柄
- **网格对齐**: 智能网格对齐，精确定位
- **紧凑布局**: 自动紧凑布局算法
- **碰撞检测**: 实时碰撞检测和预防
- **锁定项目**: 支持锁定特定项目

### 🎨 界面特性
- **网格线显示**: 可选的网格线显示
- **拖拽预览**: 拖拽时的预览效果
- **调整手柄**: 八个方向的调整大小手柄
- **状态反馈**: 丰富的视觉状态反馈
- **主题系统**: 支持深色/浅色主题切换

## 🚀 快速开始

### 安装和使用

```vue
<template>
  <GridPlus
    v-model:items="items"
    :show-grid="true"
    :readonly="false"
    :config="gridConfig"
    @layout-change="handleLayoutChange"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { GridPlus } from '@/components/common/gridplus'
import type { GridItem } from '@/components/common/gridplus'

const items = ref<GridItem[]>([
  {
    id: 'card-1',
    x: 0,
    y: 0,
    w: 4,
    h: 3,
    title: '卡片 1',
    component: YourComponent
  }
])

const gridConfig = {
  column: 12,
  cellHeight: 100,
  margin: '10px',
  responsive: true,
  auto: true,
  animate: true
}

const handleLayoutChange = (newItems: GridItem[]) => {
  console.log('布局变化:', newItems)
}
</script>
```

## 📖 API 文档

### Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| items | `GridItem[]` | `[]` | 布局数据 |
| readonly | `boolean` | `false` | 是否只读 |
| showGrid | `boolean` | `false` | 是否显示网格线 |
| showTitle | `boolean` | `true` | 是否显示标题栏 |
| config | `Partial<GridConfig>` | `{}` | 网格配置 |
| containerStyle | `Record<string, string \| number>` | `{}` | 容器样式 |
| containerClass | `string` | `''` | 容器类名 |
| theme | `'light' \| 'dark' \| 'auto'` | `'auto'` | 主题 |

### Events

| 事件名 | 参数 | 说明 |
|--------|------|------|
| layout-change | `(items: GridItem[])` | 布局变化时触发 |
| update:items | `(items: GridItem[])` | 布局更新时触发 |
| item-add | `(item: GridItem)` | 添加项目时触发 |
| item-delete | `(itemId: string)` | 删除项目时触发 |
| item-update | `(itemId: string, updates: Partial<GridItem>)` | 更新项目时触发 |
| drag-start | `(itemId: string)` | 拖拽开始时触发 |
| drag-end | `(itemId: string)` | 拖拽结束时触发 |
| resize-start | `(itemId: string)` | 调整大小开始时触发 |
| resize-end | `(itemId: string)` | 调整大小结束时触发 |

### 配置选项

```typescript
interface GridConfig extends GridStackOptions {
  column: number              // 列数，默认 12
  cellHeight: number         // 行高，默认 100
  margin: string             // 边距，默认 '10px'
  float: boolean            // 是否浮动，默认 false
  animate: boolean          // 是否启用动画，默认 true
  auto: boolean             // 是否自动布局，默认 true
  disableDrag: boolean      // 是否禁用拖拽，默认 false
  disableResize: boolean    // 是否禁用调整大小，默认 false
  enable: boolean           // 是否启用，默认 true
  minRow: number           // 最小行数，默认 1
  removable: boolean       // 是否可删除，默认 false
  rtl: boolean            // 是否从右到左，默认 false
  showGridLines: boolean   // 是否显示网格线，默认 false
  showTitle: boolean       // 是否显示标题栏，默认 true
  showItemInfo: boolean    // 是否显示项目信息，默认 false
  theme: 'light' | 'dark' | 'auto' // 主题，默认 'auto'
}
```

### 网格项配置

```typescript
interface GridItem {
  id: string                   // 唯一标识符
  x: number                    // X轴位置
  y: number                    // Y轴位置
  w: number                    // 宽度
  h: number                    // 高度
  autoPosition?: boolean       // 是否自动定位
  minW?: number               // 最小宽度
  maxW?: number               // 最大宽度
  minH?: number               // 最小高度
  maxH?: number               // 最大高度
  locked?: boolean            // 是否锁定
  noResize?: boolean          // 是否不可调整大小
  noMove?: boolean            // 是否不可移动
  resizeHandles?: string      // 调整大小手柄
  static?: boolean            // 是否为静态项目
  title?: string              // 标题
  component?: Component       // Vue组件
  props?: Record<string, any> // 组件属性
  data?: Record<string, any>  // 组件数据
  style?: Record<string, string | number> // 自定义样式
  className?: string          // 自定义类名
  metadata?: Record<string, any> // 元数据
  render?: (item: GridItem) => VNode // 自定义渲染函数
  headerRender?: (item: GridItem) => VNode // 自定义头部渲染
  footerRender?: (item: GridItem) => VNode // 自定义底部渲染
}
```

## 🎯 使用示例

### 基本用法

```vue
<template>
  <div class="grid-demo">
    <GridPlus
      v-model:items="items"
      :show-grid="showGrid"
      :readonly="readonly"
      :config="gridConfig"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { GridPlus } from '@/components/common/gridplus'

const showGrid = ref(true)
const readonly = ref(false)

const gridConfig = {
  column: 12,
  cellHeight: 100,
  margin: '10px',
  responsive: true,
  auto: true,
  animate: true
}

const items = ref([
  {
    id: 'card-1',
    x: 0,
    y: 0,
    w: 4,
    h: 3,
    title: '卡片 1',
    component: {
      template: '<div>卡片内容</div>'
    }
  }
])
</script>
```

### 带控制面板的完整示例

```vue
<template>
  <div class="grid-demo">
    <div class="controls">
      <n-switch v-model:value="showGrid">显示网格线</n-switch>
      <n-switch v-model:value="readonly">只读模式</n-switch>
      <n-button @click="addCard">添加卡片</n-button>
      <n-button @click="compact">紧凑布局</n-button>
    </div>
    
    <GridPlus
      ref="gridPlusRef"
      v-model:items="items"
      :show-grid="showGrid"
      :readonly="readonly"
      :config="gridConfig"
      @layout-change="handleLayoutChange"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { GridPlus } from '@/components/common/gridplus'

const showGrid = ref(true)
const readonly = ref(false)
const items = ref([])
const gridPlusRef = ref()

const gridConfig = {
  column: 12,
  cellHeight: 100,
  margin: '10px',
  responsive: true,
  auto: true,
  animate: true
}

const addCard = () => {
  const newItem = {
    id: `card-${Date.now()}`,
    x: Math.floor(Math.random() * 8),
    y: Math.floor(Math.random() * 5),
    w: 2 + Math.floor(Math.random() * 3),
    h: 2 + Math.floor(Math.random() * 3),
    title: `卡片 ${items.value.length + 1}`,
    component: {
      template: '<div>新卡片内容</div>'
    }
  }
  items.value.push(newItem)
}

const compact = () => {
  gridPlusRef.value?.compact()
}

const handleLayoutChange = (newItems) => {
  console.log('布局变化:', newItems)
}
</script>
```

## 🎨 主题定制

GridPlus 支持 CSS 变量主题定制：

```css
:root {
  --grid-plus-bg-color: #f8f9fa;
  --grid-plus-item-bg-color: #fff;
  --grid-plus-item-border-color: #e1e5e9;
  --grid-plus-item-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  --grid-plus-item-hover-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  --grid-plus-item-active-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  --grid-plus-item-header-bg-color: #f8f9fa;
  --grid-plus-item-title-color: #495057;
  --grid-plus-text-color: #495057;
  --grid-plus-secondary-text-color: #6c757d;
}

/* 深色主题 */
[data-theme="dark"] {
  --grid-plus-bg-color: #1a1a1a;
  --grid-plus-item-bg-color: #2d2d2d;
  --grid-plus-item-border-color: #404040;
  --grid-plus-item-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  --grid-plus-item-hover-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
  --grid-plus-item-active-shadow: 0 8px 32px rgba(0, 0, 0, 0.6);
  --grid-plus-item-header-bg-color: #333;
  --grid-plus-item-title-color: #fff;
  --grid-plus-text-color: #fff;
  --grid-plus-secondary-text-color: #b0b0b0;
}
```

## 🔧 组件方法

GridPlus 组件暴露了以下方法：

```typescript
// 添加项目
addItem(item: GridItem): void

// 删除项目
removeItem(itemId: string): void

// 更新项目
updateItem(itemId: string, updates: Partial<GridItem>): void

// 获取当前项目
getItems(): GridItem[]

// 紧凑布局
compact(): void

// 启用拖拽和调整大小
enable(): void

// 禁用拖拽和调整大小
disable(): void
```

## 🚀 性能特性

- **GridStack.js 原生性能**: 基于成熟的 GridStack.js 库
- **流畅拖拽**: 原生拖拽实现，60fps 流畅体验
- **智能布局**: 自动布局算法，优化空间利用
- **响应式**: 支持响应式布局和断点配置
- **内存优化**: GridStack.js 内置内存管理

## 🔄 迁移指南

从原有的 grid 组件迁移到 GridPlus：

1. **导入路径更改**：
   ```typescript
   // 旧的
   import GridLayout from '@/components/common/grid'
   
   // 新的
   import { GridPlus } from '@/components/common/gridplus'
   ```

2. **组件名称更改**：
   ```vue
   <!-- 旧的 -->
   <GridLayoutPlus />
   
   <!-- 新的 -->
   <GridPlus />
   ```

3. **Props 名称更改**：
   ```vue
   <!-- 旧的 -->
   :layout="layout"
   
   <!-- 新的 -->
   :items="items"
   ```

4. **配置名称更改**：
   ```typescript
   // 旧的
   const config = {
     colNum: 12,
     rowHeight: 100,
     margin: [10, 10]
   }
   
   // 新的
   const config = {
     column: 12,
     cellHeight: 100,
     margin: '10px'
   }
   ```

## 📁 文件结构

```
src/components/common/gridplus/
├── GridPlus.vue              # 主组件
├── index.ts                  # 导出文件
├── README.md                 # 文档
└── types/
    └── index.ts             # 类型定义
```

## 🔧 兼容性

- Vue 3.0+
- GridStack.js 9.0+
- 现代浏览器（支持 Pointer Events）
- TypeScript 4.0+

## 📝 更新日志

### v2.0.0 - GridStack.js 版本
- ✅ **基于 GridStack.js**: 使用成熟的 GridStack.js 库
- ✅ **原生性能**: GridStack.js 原生拖拽和调整大小
- ✅ **完整功能**: 支持所有 GridStack.js 功能
- ✅ **类型安全**: 完整的 TypeScript 类型支持
- ✅ **响应式**: 支持响应式布局和断点配置
- ✅ **主题系统**: 支持深色/浅色主题切换
- ✅ **组件方法**: 丰富的组件方法 API

## 🤝 贡献

欢迎提交 Issue 和 Pull Request 来改进 GridPlus 组件。

## �� 许可证

MIT License
