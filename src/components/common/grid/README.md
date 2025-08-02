# DraggableResizableGrid 通用栅格组件

一个基于Vue 3的高性能、可拖拽、可调整大小的栅格布局组件。

## 🚀 特性

- ✅ **Vue 3 + TypeScript** - 完整的类型支持
- ✅ **拖拽功能** - 基于vue-draggable-resizable
- ✅ **调整大小** - 支持各方向调整
- ✅ **栅格吸附** - 智能网格对齐
- ✅ **碰撞检测** - 多种碰撞策略
- ✅ **边界限制** - 防止超出容器
- ✅ **响应式设计** - 自适应不同屏幕
- ✅ **主题支持** - 支持亮色/暗色主题
- ✅ **高度可配置** - 丰富的配置选项

## 📦 安装

确保已安装依赖：

```bash
pnpm add vue-draggable-resizable
```

## 🎯 基础用法

```vue
<template>
  <DraggableResizableGrid
    :items="gridItems"
    :config="gridConfig"
    @layout-change="handleLayoutChange"
    @item-click="handleItemClick"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { DraggableResizableGrid } from '@/components/common/grid'
import type { GridItem, GridConfig } from '@/components/common/grid'

// 网格配置
const gridConfig: Partial<GridConfig> = {
  columns: 12,
  rowHeight: 100,
  gap: 10,
  showGrid: true,
  collision: 'block'
}

// 网格项数据
const gridItems = ref<GridItem[]>([
  {
    id: 'item-1',
    gridCol: 1,
    gridRow: 1,
    gridColSpan: 4,
    gridRowSpan: 2,
    component: 'MyWidget',
    props: { title: '组件1' }
  },
  {
    id: 'item-2',
    gridCol: 5,
    gridRow: 1,
    gridColSpan: 3,
    gridRowSpan: 3,
    component: 'MyChart',
    props: { type: 'bar' }
  }
])

// 事件处理
const handleLayoutChange = (items: GridItem[]) => {
  console.log('布局变化:', items)
}

const handleItemClick = (item: GridItem, event: MouseEvent) => {
  console.log('点击项目:', item.id)
}
</script>
```

## 🔧 配置选项

### GridConfig 网格配置

```typescript
interface GridConfig {
  columns: number           // 栅格列数，默认12
  rowHeight: number        // 行高(px)，默认100
  gap: number             // 间距(px)，默认10
  minRows?: number        // 最小行数，默认3
  maxRows?: number        // 最大行数
  readonly?: boolean      // 只读模式，默认false
  showGrid?: boolean      // 显示网格背景，默认true
  collision?: CollisionStrategy  // 碰撞策略，默认'block'
  bounds?: BoundsType     // 边界限制，默认'parent'
  minHeight?: number      // 最小高度(px)，默认400
}
```

### GridItem 网格项配置

```typescript
interface GridItem {
  id: string              // 唯一标识符
  gridCol: number         // 起始列(1-based)
  gridRow: number         // 起始行(1-based)
  gridColSpan: number     // 列跨度
  gridRowSpan: number     // 行跨度
  component?: Component   // 渲染组件
  props?: any            // 组件属性
  minColSpan?: number    // 最小列跨度
  minRowSpan?: number    // 最小行跨度
  maxColSpan?: number    // 最大列跨度
  maxRowSpan?: number    // 最大行跨度
  resizable?: boolean    // 可调整大小，默认true
  draggable?: boolean    // 可拖拽，默认true
  locked?: boolean       // 锁定位置，默认false
  style?: object         // 自定义样式
  className?: string     // 自定义类名
  zIndex?: number        // 层级，默认1
}
```

## 🎨 碰撞策略

- `'block'` - 阻止重叠(默认)
- `'push'` - 推挤其他元素
- `'swap'` - 交换位置
- `'allow'` - 允许重叠

## 📡 事件

```typescript
// 拖拽事件
@drag-start="handleDragStart"    // 拖拽开始
@drag-move="handleDragMove"      // 拖拽移动
@drag-end="handleDragEnd"        // 拖拽结束

// 调整大小事件
@resize-start="handleResizeStart"  // 调整开始
@resize-move="handleResizeMove"    // 调整移动
@resize-end="handleResizeEnd"      // 调整结束

// 交互事件
@item-click="handleItemClick"      // 项目点击
@item-dblclick="handleItemDblclick" // 项目双击
@container-click="handleContainerClick" // 容器点击

// 布局事件
@layout-change="handleLayoutChange"  // 布局变化
@collision="handleCollision"         // 碰撞检测
```

## 🔌 组件方法

```typescript
// 获取组件实例
const gridRef = ref<InstanceType<typeof DraggableResizableGrid>>()

// 调用方法
gridRef.value?.addItem(newItem)        // 添加项目
gridRef.value?.removeItem('item-id')   // 移除项目
gridRef.value?.updateItem('item-id', updates) // 更新项目
gridRef.value?.getItem('item-id')      // 获取项目
gridRef.value?.getAllItems()           // 获取所有项目
gridRef.value?.clearItems()            // 清空所有项目
```

## 🎯 高级用法

### 自定义组件渲染

```vue
<template>
  <DraggableResizableGrid :items="items">
    <template #default="{ item }">
      <div class="custom-content">
        <h3>{{ item.props?.title }}</h3>
        <p>{{ item.props?.description }}</p>
      </div>
    </template>
  </DraggableResizableGrid>
</template>
```

### 动态添加项目

```typescript
const addNewItem = () => {
  const newItem: GridItem = {
    id: generateId('widget'),
    gridCol: 1,
    gridRow: 1,
    gridColSpan: 2,
    gridRowSpan: 2,
    component: 'MyWidget'
  }
  
  const addedItem = gridRef.value?.addItem(newItem)
  if (addedItem) {
    console.log('添加成功:', addedItem)
  }
}
```

### 响应式配置

```typescript
const gridConfig = computed(() => ({
  columns: isSmallScreen.value ? 6 : 12,
  rowHeight: isSmallScreen.value ? 80 : 100,
  gap: isSmallScreen.value ? 5 : 10
}))
```

## 🎨 样式自定义

### CSS变量

```css
:root {
  --grid-border-color: #e0e0e6;
  --grid-hover-color: #18a058;
  --grid-background: #ffffff;
  --grid-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}
```

### 暗色主题

组件自动支持暗色主题，会根据CSS类`.dark`自动切换样式。

## 🔍 调试技巧

### 开启网格背景

```typescript
const config = {
  showGrid: true  // 显示网格线，便于调试布局
}
```

### 监听布局变化

```typescript
const handleLayoutChange = (items: GridItem[]) => {
  console.table(items.map(item => ({
    id: item.id,
    position: `${item.gridCol},${item.gridRow}`,
    size: `${item.gridColSpan}×${item.gridRowSpan}`
  })))
}
```

## 🚀 性能优化

1. **虚拟滚动** - 大量项目时启用
2. **防抖处理** - 拖拽事件自动防抖
3. **懒加载** - 延迟渲染非可见项目
4. **内存管理** - 自动清理事件监听器

## 📱 移动端支持

组件自动支持触摸事件，在移动设备上可以正常拖拽和调整大小。

## 🔧 故障排除

### 常见问题

1. **项目不显示** - 检查gridCol/gridRow是否从1开始
2. **拖拽不工作** - 确认readonly=false且draggable=true
3. **调整大小异常** - 检查最小/最大尺寸约束
4. **样式不正确** - 确认引入了vue-draggable-resizable样式

### 开发建议

1. 始终提供唯一的id
2. 使用合理的最小/最大尺寸约束
3. 监听layout-change事件保存状态
4. 在生产环境关闭网格背景

## 📄 许可证

MIT License - 详见 LICENSE 文件