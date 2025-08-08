# EditorLayout 编辑器布局组件

一个基于 Naive UI 的可配置编辑器布局组件，支持左右抽屉面板和主题系统。

## 特性

- 🎨 **主题系统集成**: 完全适配项目的主题系统，支持明暗模式切换
- 📱 **响应式设计**: 适配不同屏幕尺寸
- 🔧 **高度可配置**: 支持自定义抽屉宽度、标题、显示状态等
- 🎛️ **工具栏控制**: 内置工具栏提供抽屉开关按钮
- 🚀 **TypeScript 支持**: 完整的类型定义
- ✨ **动画效果**: 流畅的交互动画

## 基本用法

```vue
<template>
  <EditorLayout
    left-title="组件库"
    right-title="属性配置"
    :default-left-visible="true"
    @left-drawer-change="onLeftDrawerChange"
    @right-drawer-change="onRightDrawerChange"
  >
    <template #left>
      <!-- 左侧内容：组件库、图层等 -->
      <div>左侧面板内容</div>
    </template>
    
    <template #main>
      <!-- 中央内容：画布区域 -->
      <div>主要编辑区域</div>
    </template>
    
    <template #right>
      <!-- 右侧内容：属性配置、样式设置等 -->
      <div>右侧面板内容</div>
    </template>
  </EditorLayout>
</template>

<script setup lang="ts">
import EditorLayout from '@/components/visual-editor/components/Layout/EditorLayout.vue'

function onLeftDrawerChange(visible: boolean) {
  console.log('左侧抽屉状态:', visible)
}

function onRightDrawerChange(visible: boolean) {
  console.log('右侧抽屉状态:', visible)
}
</script>
```

## API

### Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `leftTitle` | `string` | `'左侧面板'` | 左侧抽屉标题 |
| `rightTitle` | `string` | `'右侧面板'` | 右侧抽屉标题 |
| `leftDrawerWidth` | `number \| string` | `280` | 左侧抽屉宽度 |
| `rightDrawerWidth` | `number \| string` | `320` | 右侧抽屉宽度 |
| `showToolbar` | `boolean` | `true` | 是否显示工具栏 |
| `showMask` | `boolean` | `false` | 是否显示遮罩 |
| `maskClosable` | `boolean` | `true` | 点击遮罩是否关闭抽屉 |
| `closeOnEsc` | `boolean` | `true` | 按ESC是否关闭抽屉 |
| `leftClosable` | `boolean` | `true` | 左侧抽屉是否可关闭 |
| `rightClosable` | `boolean` | `true` | 右侧抽屉是否可关闭 |
| `defaultLeftVisible` | `boolean` | `false` | 默认左侧抽屉是否显示 |
| `defaultRightVisible` | `boolean` | `false` | 默认右侧抽屉是否显示 |

### Events

| 事件名 | 参数 | 说明 |
|--------|------|------|
| `left-drawer-change` | `(visible: boolean)` | 左侧抽屉显示状态变化 |
| `right-drawer-change` | `(visible: boolean)` | 右侧抽屉显示状态变化 |

### Slots

| 插槽名 | 说明 |
|--------|------|
| `left` | 左侧抽屉内容 |
| `main` | 中央主要内容区域 |
| `right` | 右侧抽屉内容 |

### 暴露的方法

通过组件引用可以调用以下方法：

```vue
<script setup lang="ts">
import { ref } from 'vue'
import EditorLayout from '@/components/visual-editor/components/Layout/EditorLayout.vue'

const editorLayoutRef = ref<InstanceType<typeof EditorLayout>>()

// 控制抽屉显示/隐藏
function openLeftDrawer() {
  editorLayoutRef.value?.openLeftDrawer()
}

function closeLeftDrawer() {
  editorLayoutRef.value?.closeLeftDrawer()
}

function toggleLeftDrawer() {
  editorLayoutRef.value?.toggleLeftDrawer()
}

function openRightDrawer() {
  editorLayoutRef.value?.openRightDrawer()
}

function closeRightDrawer() {
  editorLayoutRef.value?.closeRightDrawer()
}

function toggleRightDrawer() {
  editorLayoutRef.value?.toggleRightDrawer()
}
</script>
```

| 方法名 | 说明 |
|--------|------|
| `openLeftDrawer()` | 打开左侧抽屉 |
| `closeLeftDrawer()` | 关闭左侧抽屉 |
| `toggleLeftDrawer()` | 切换左侧抽屉状态 |
| `openRightDrawer()` | 打开右侧抽屉 |
| `closeRightDrawer()` | 关闭右侧抽屉 |
| `toggleRightDrawer()` | 切换右侧抽屉状态 |

### 响应式属性

| 属性名 | 类型 | 说明 |
|--------|------|------|
| `leftDrawerVisible` | `Ref<boolean>` | 左侧抽屉显示状态 |
| `rightDrawerVisible` | `Ref<boolean>` | 右侧抽屉显示状态 |

## 高级用法

### 自定义工具栏

如果你想完全自定义工具栏，可以设置 `showToolbar` 为 `false`，然后在主内容区域添加自己的控制按钮：

```vue
<template>
  <EditorLayout
    ref="editorRef"
    :show-toolbar="false"
  >
    <template #main>
      <div class="custom-toolbar">
        <NButton @click="editorRef?.toggleLeftDrawer()">
          {{ editorRef?.leftDrawerVisible ? '隐藏' : '显示' }}左侧面板
        </NButton>
        <NButton @click="editorRef?.toggleRightDrawer()">
          {{ editorRef?.rightDrawerVisible ? '隐藏' : '显示' }}右侧面板
        </NButton>
      </div>
      <div class="main-content">
        <!-- 主要内容 -->
      </div>
    </template>
  </EditorLayout>
</template>
```

### 持久化抽屉状态

可以结合 localStorage 或 pinia store 来持久化抽屉的显示状态：

```vue
<script setup lang="ts">
import { ref, watch } from 'vue'
import { useLocalStorage } from '@vueuse/core'

const leftDrawerVisible = useLocalStorage('editor-left-drawer-visible', false)
const rightDrawerVisible = useLocalStorage('editor-right-drawer-visible', false)

function onLeftDrawerChange(visible: boolean) {
  leftDrawerVisible.value = visible
}

function onRightDrawerChange(visible: boolean) {
  rightDrawerVisible.value = visible
}
</script>

<template>
  <EditorLayout
    :default-left-visible="leftDrawerVisible"
    :default-right-visible="rightDrawerVisible"
    @left-drawer-change="onLeftDrawerChange"
    @right-drawer-change="onRightDrawerChange"
  >
    <!-- 内容 -->
  </EditorLayout>
</template>
```

## 主题系统集成

组件已完全集成项目的主题系统，会自动适配：

- 明暗模式切换
- 主题色变化
- Naive UI 组件主题变量
- CSS 变量系统

无需额外配置，组件会自动跟随全局主题变化。

## 注意事项

1. **性能优化**: 抽屉内容较多时，建议使用 `v-if` 控制内容渲染，而不是 `v-show`
2. **层级管理**: 抽屉的 z-index 已经设置合适的值，避免与其他浮层组件冲突
3. **移动端适配**: 在小屏幕设备上，建议设置 `showMask` 为 `true` 以提供更好的用户体验
4. **键盘导航**: 组件支持 ESC 键关闭抽屉，`autoFocus` 已设置为 `false` 避免焦点问题

## 更新日志

### v1.0.0
- 🎉 首次发布
- ✨ 支持左右抽屉布局
- 🎨 集成主题系统
- 📱 响应式设计
- 🔧 丰富的配置选项