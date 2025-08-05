# Visual Editor 组件文档

## 概述

Visual Editor 是一个功能强大的可视化面板编辑器，支持拖拽式组件配置、数据源管理和实时预览。该组件集成了 Card 2.1 架构，提供了完整的可视化编辑体验。

## 架构设计

### 核心模块

```
visual-editor/
├── core/                    # 核心逻辑层
│   ├── state-manager.ts     # 状态管理
│   ├── widget-registry.ts   # 组件注册表
│   ├── data-source-manager.ts # 数据源管理
│   └── component-api-config.ts # 组件API配置
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
用户操作 → UI组件 → Hooks → 核心模块 → 状态更新 → 视图渲染
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
- 组件注册和发现
- 拖拽式组件添加
- 组件属性编辑
- 组件删除

### 2. 数据源管理
- 支持多种数据源类型（设备、HTTP、静态等）
- 数据映射配置
- 实时数据订阅
- 数据转换和过滤

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
2. 实现组件接口
3. 注册到组件注册表
4. 配置组件元信息

### 添加新数据源
1. 实现数据源接口
2. 注册到数据源管理器
3. 配置数据源UI

### 添加新渲染器
1. 实现渲染器接口
2. 注册到渲染器系统
3. 配置渲染器选项

## 注意事项

1. **数据源订阅**: 组件销毁时需要取消数据源订阅
2. **内存泄漏**: 及时清理事件监听器和定时器
3. **性能监控**: 大量组件时注意性能影响
4. **错误处理**: 数据源连接失败时的降级处理 