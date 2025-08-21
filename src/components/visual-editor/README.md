# Visual Editor 组件文档

## 概述

Visual Editor 是一个功能强大的可视化面板编辑器，支持拖拽式组件配置、数据源管理和实时预览。该组件集成了 Card 2.1 架构，提供了完整的可视化编辑体验。

## 架构设计

### 核心模块

```
visual-editor/
├── core/                    # 核心逻辑层
│   ├── ConfigDiscovery.ts     # 组件自动发现服务
│   ├── component-api-config.ts # 组件API自动化配置
│   └── component-data-requirements.ts # 组件数据需求声明
├── store/                   # 状态管理 (Pinia)
│   ├── editor.ts            # 编辑器核心状态
│   └── widget.ts            # 组件注册与管理
├── components/              # UI组件层
│   ├── PanelLayout.vue      # 主布局组件
│   ├── EditorCanvas.vue     # 编辑器画布
│   ├── WidgetLibrary/       # 组件库
│   └── PropertyPanel/       # 属性面板
├── hooks/                   # 组合式函数
├── renderers/               # 渲染器
├── settings/                # 设置面板
└── types/                   # 类型定义
```

### 数据流

```
用户操作 → UI组件 → 调用 Pinia Store (useEditorStore, useWidgetStore) 的 Actions → 状态更新 → 视图根据状态自动渲染
```

## 主要组件

### 1. PanelEditor.vue (主编辑器)
- **功能**: 可视化编辑器的入口组件
- **特性**: 
  - 支持编辑/预览模式切换
  - 集成组件库和属性面板
  - 支持全屏编辑
  - 数据源配置和管理
- **大小**: 31KB, 1025行

### 2. PanelLayout.vue (布局组件)
- **功能**: 提供三栏式布局（工具栏、主内容区、侧边栏）
- **特性**:
  - 响应式布局
  - 主题适配（明暗模式）
  - 可折叠侧边栏
  - 插槽式设计
- **大小**: 4.6KB, 164行

### 3. EditorCanvas.vue (编辑器画布)
- **功能**: 组件拖拽和编辑的画布区域
- **特性**:
  - 支持多种渲染器（Canvas、Gridstack）
  - 组件拖拽放置
  - 实时预览
- **大小**: 7.8KB, 341行

### 4. WidgetLibrary (组件库)
- **功能**: 提供可拖拽的组件列表
- **特性**:
  - 分类展示组件
  - 搜索功能
  - 拖拽到画布

### 5. PropertyPanel (属性面板)
- **功能**: 编辑选中组件的属性
- **特性**:
  - 动态属性编辑
  - 数据源配置
  - 实时预览

## 核心功能

### 1. 组件管理
- 基于 Pinia store 的组件注册和管理
- 自动发现和注册 Card 2.1 组件
- 组件属性编辑和实时预览
- 组件生命周期管理

### 2. 数据源管理
- 组件数据需求声明系统
- 自动化 API 配置
- 数据映射和转换
- 实时数据订阅和更新

### 3. 渲染器系统
- 多渲染器支持（Canvas、Gridstack、Vue等）
- 渲染器切换
- 自定义渲染器扩展

### 4. 主题系统
- 明暗主题切换
- 自定义主题配置
- 响应式设计

## 使用方式

### 基本使用

```vue
<template>
  <PanelEditor :panelId="panelId" />
</template>

<script setup>
import { PanelEditor } from '@/components/visual-editor'
</script>
```

### 高级配置

```vue
<template>
  <PanelEditor 
    :panelId="panelId"
    :config="editorConfig"
    @save="handleSave"
    @change="handleChange"
  />
</template>
```

## 技术栈

- **框架**: Vue 3 + TypeScript
- **UI库**: Naive UI
- **状态管理**: Pinia
- **图表**: ECharts
- **拖拽**: Gridstack.js
- **工具库**: VueUse

## 性能优化

1. **组件懒加载**: 按需加载组件库
2. **虚拟滚动**: 大量组件时的性能优化
3. **防抖处理**: 频繁操作的数据更新
4. **内存管理**: 及时清理数据源订阅

## 扩展性

### 添加新组件
1. 在 `card2.1/components/` 下创建组件
2. 实现组件接口和数据需求声明
3. 使用 `useWidgetStore().register()` 注册组件
4. 配置组件 API 和数据映射

```typescript
// 1. 定义组件
const myWidget: WidgetDefinition = {
  type: 'my-widget',
  name: '我的组件',
  icon: MyIconOutline,
  category: 'custom',
  version: '1.0.0',
  defaultProperties: {
    title: '默认标题'
  }
}

// 2. 声明数据需求
const dataRequirements = new ComponentDataRequirementsBuilder()
  .addTimeSeriesRequirement('data')
  .build()

// 3. 注册组件
const widgetStore = useWidgetStore()
widgetStore.register(myWidget)
```

### 添加新数据源
1. 实现数据源接口
2. 在 `component-data-requirements.ts` 中添加数据源类型
3. 配置数据源 API 映射

### 添加新渲染器
1. 实现渲染器接口
2. 在 `renderers/` 目录下创建渲染器
3. 配置渲染器选项和布局系统

## 注意事项

1. **数据源订阅**: 组件销毁时需要取消数据源订阅
2. **内存泄漏**: 及时清理事件监听器和定时器
3. **性能监控**: 大量组件时注意性能影响
4. **错误处理**: 数据源连接失败时的降级处理