# PanelLayout 组件

> 一个极简的面板布局组件，专为 PanelV2 设计，提供灵活的四区域布局和插槽机制。

## 设计理念

- **按需渲染**: 没有插槽内容的区域不会渲染DOM结构
- **状态传递**: 自动将状态传递给插槽，减少重复传参
- **API暴露**: 提供方法接口供外部控制，而非内置UI交互
- **极简设计**: 专注布局职责，不包含复杂的业务逻辑

## 基础使用

```vue
<template>
  <PanelLayout 
    :mode="isEditing ? 'edit' : 'preview'"
    v-model:left-collapsed="leftCollapsed"
    v-model:right-collapsed="rightCollapsed"
  >
    <template #toolbar>
      <div>工具栏内容</div>
    </template>
    
    <template #left>
      <div>左侧组件列表</div>
    </template>
    
    <template #main="{ mode, isEditMode }">
      <div>
        看板内容 - 当前模式: {{ mode }}
        <div v-if="isEditMode">编辑模式特有内容</div>
      </div>
    </template>
    
    <template #right>
      <div>右侧配置面板</div>  
    </template>
  </PanelLayout>
</template>

<script setup>
import PanelLayout from '@/components/panelv2/layout/PanelLayout.vue'

const isEditing = ref(true)
const leftCollapsed = ref(false)
const rightCollapsed = ref(false)
</script>
```

## 插槽参数

所有插槽都会接收以下参数：

| 参数 | 类型 | 说明 |
|------|------|------|
| mode | `'edit' \| 'preview'` | 当前模式 |
| isEditMode | `boolean` | 是否为编辑模式 |

### 使用插槽参数

```vue
<template #main="{ mode, isEditMode }">
  <div v-if="isEditMode">编辑模式内容</div>
  <div v-else>预览模式内容</div>
</template>
```

## API 参考

### Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| mode | `'edit' \| 'preview'` | `'edit'` | 显示模式 |
| leftCollapsed | `boolean` | `false` | 左侧区域是否收起 |
| rightCollapsed | `boolean` | `false` | 右侧区域是否收起 |
| leftWidth | `number` | `280` | 左侧区域宽度(px) |
| rightWidth | `number` | `320` | 右侧区域宽度(px) |

### Events

| 事件 | 参数 | 说明 |
|------|------|------|
| update:leftCollapsed | `boolean` | 左侧收起状态变化 |
| update:rightCollapsed | `boolean` | 右侧收起状态变化 |

### Methods (通过 ref 调用)

| 方法 | 参数 | 说明 |
|------|------|------|
| toggleLeft | - | 切换左侧区域显示/隐藏 |
| toggleRight | - | 切换右侧区域显示/隐藏 |

#### 方法调用示例

```vue
<template>
  <div>
    <button @click="handleToggleLeft">切换左侧</button>
    <PanelLayout ref="layoutRef" />
  </div>
</template>

<script setup>
const layoutRef = ref()

const handleToggleLeft = () => {
  layoutRef.value?.toggleLeft()
}
</script>
```

### Exposed Properties

通过 `ref` 还可以访问以下只读属性：

| 属性 | 类型 | 说明 |
|------|------|------|
| isEditMode | `boolean` | 当前是否为编辑模式 |
| hasToolbar | `boolean` | 是否有工具栏插槽内容 |
| hasLeft | `boolean` | 是否有左侧插槽内容 |
| hasRight | `boolean` | 是否有右侧插槽内容 |

## 插槽说明

### #toolbar
- **显示条件**: 编辑模式 + 有插槽内容
- **位置**: 顶部固定
- **高度**: 48px (3rem)

### #left
- **显示条件**: 编辑模式 + 有插槽内容 + 未收起
- **位置**: 左侧固定
- **宽度**: 可通过 `leftWidth` prop 控制
- **默认宽度**: 280px

### #main
- **显示条件**: 始终显示
- **位置**: 中央自适应
- **特点**: 会接收 `mode` 和 `isEditMode` 参数

### #right
- **显示条件**: 编辑模式 + 有插槽内容 + 未收起
- **位置**: 右侧固定
- **宽度**: 可通过 `rightWidth` prop 控制
- **默认宽度**: 320px

## 使用场景

### 1. 简单预览模式
```vue
<PanelLayout mode="preview">
  <template #main>
    <div>只有看板内容</div>
  </template>
</PanelLayout>
```

### 2. 完整编辑模式
```vue
<PanelLayout mode="edit">
  <template #toolbar>工具栏</template>
  <template #left>组件库</template>
  <template #main>画布</template>
  <template #right>属性面板</template>
</PanelLayout>
```

### 3. 部分区域布局
```vue
<PanelLayout mode="edit">
  <template #main>画布</template>
  <template #right>配置面板</template>
  <!-- 没有 toolbar 和 left，对应DOM不会渲染 -->
</PanelLayout>
```

### 4. 外部控制收起
```vue
<template>
  <div>
    <button @click="toggleSidebar">切换侧边栏</button>
    <PanelLayout ref="layout" v-model:left-collapsed="collapsed">
      <!-- 插槽内容 -->
    </PanelLayout>
  </div>
</template>

<script setup>
const layout = ref()
const collapsed = ref(false)

const toggleSidebar = () => {
  // 方式1: 直接修改状态
  collapsed.value = !collapsed.value
  
  // 方式2: 调用组件方法
  // layout.value?.toggleLeft()
}
</script>
```

## 注意事项

1. **条件渲染**: 没有提供插槽内容的区域不会渲染任何DOM结构
2. **预览模式**: 只显示 `#main` 插槽内容，其他区域完全隐藏
3. **状态同步**: 使用 `v-model` 绑定收起状态，保持父子组件状态同步
4. **方法调用**: 通过 `ref` 调用 `toggleLeft/toggleRight` 方法来控制显示状态
5. **插槽参数**: 所有插槽都会接收到当前的 `mode` 和 `isEditMode` 状态

## 样式说明

组件使用 UnoCSS 和 Tailwind CSS 类，包含：
- 响应式 Flex 布局
- 暗黑主题支持 (`dark:` 前缀)
- 平滑过渡动画 (`transition-all duration-300`)
- 滚动区域优化
- 边框和阴影效果

组件本身不包含过多的视觉样式，主要专注于布局功能，具体的视觉效果由插槽内容决定。