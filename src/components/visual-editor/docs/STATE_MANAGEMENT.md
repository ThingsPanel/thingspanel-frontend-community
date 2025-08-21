# Visual Editor 状态管理

## 1. 概述

Visual Editor 采用 [Pinia](https://pinia.vuejs.org/) 作为其状态管理解决方案。状态被划分为两个独立的、职责明确的 Store：`useEditorStore` 和 `useWidgetStore`。这种划分使得状态管理更加清晰和易于维护。

## 2. `useEditorStore` (`store/editor.ts`)

`useEditorStore` 是编辑器的核心状态管理器，负责画布本身的状态。它管理着所有与画布布局和内容相关的数据。

### 2.1. State

- `nodes: GraphData[]`: 存储在画布上显示的所有组件实例。每个 `GraphData` 对象代表一个独立的组件，包含其位置、大小、配置和元数据。
- `viewport: Viewport`: 记录画布的当前视口状态，包括 `x`、`y` 坐标和 `zoom` 缩放级别。这允许保存和恢复用户的视图。
- `mode: EditorMode`: 定义编辑器的当前模式，通常是 `'design'`（设计模式）或 `'preview'`（预览模式）。

### 2.2. Actions

- `addNode / removeNode / updateNode`: 对画布上的组件进行基本的增删改查操作。
- `setMode`: 切换编辑器的模式。
- `updateViewport`: 更新画布的视口状态。
- `reset`: 将编辑器的所有状态重置为初始值。

## 3. `useWidgetStore` (`store/widget.ts`)

`useWidgetStore` 负责管理所有**可用**的组件（Widgets）以及当前在画布上被**选中**的组件。

### 3.1. State

- `widgetRegistry: Map<WidgetType, WidgetDefinition>`: 一个 `Map` 结构，用作组件注册表。它存储了所有可以通过编辑器使用的组件的定义。`key` 是组件的唯一类型标识 (`WidgetType`)，`value` 是包含其元数据（名称、图标、默认属性等）的 `WidgetDefinition` 对象。
- `selectedIds: string[]`: 一个字符串数组，存储当前在画布上被选中的一个或多个组件的 ID。

### 3.2. Getters

- `selectedNodes`: 一个计算属性，它从 `useEditorStore` 的 `nodes` 列表中筛选出当前被选中的组件，返回完整的 `GraphData` 对象数组。
- `getWidget / getAllWidgets`: 提供方便的方法来从组件注册表中检索单个或全部组件的定义。

### 3.3. Actions

- `register / unregister`: 动态地向组件注册表中添加或移除一个组件定义。这使得编辑器可以支持插件化的组件加载。
- `selectNodes / clearSelection`: 管理 `selectedIds` 数组，用于更新用户的选择状态。

## 4. 状态交互流程

1.  **初始化**: 应用启动时，`useWidgetStore` 的 `register` action 会被调用，将所有预定义的组件注册到 `widgetRegistry` 中。
2.  **添加组件**: 当用户从组件库中拖动一个新组件到画布上时：
    a.  `useEditorStore` 的 `addNode` action 被调用，在 `nodes` 数组中创建一个新的组件实例。
    b.  紧接着，`useWidgetStore` 的 `selectNodes` action 会被调用，将这个新添加的组件设置为当前选中项。
3.  **修改属性**: 当用户选中一个组件并修改其属性时：
    a.  `useWidgetStore` 的 `selectedNodes` getter 提供了对当前选中组件数据的访问。
    b.  属性的更改会通过 `useEditorStore` 的 `updateNode` action 被保存到对应的 `GraphData` 对象中。

通过这种方式，`visual-editor` 将画布的宏观状态与组件的管理和选择状态分离开来，实现了清晰、可预测的状态管理模式。