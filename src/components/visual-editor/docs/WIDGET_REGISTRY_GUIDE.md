# Visual Editor 组件注册机制指南

本指南详细介绍 Visual Editor 的组件注册系统，包括组件定义、注册流程、Card 2.1 集成和最佳实践。

## 📋 目录

- [系统概述](#系统概述)
- [组件定义规范](#组件定义规范)
- [注册机制详解](#注册机制详解)
- [Card 2.1 集成](#card-21-集成)
- [开发指南](#开发指南)
- [最佳实践](#最佳实践)
- [故障排除](#故障排除)

## 🏗️ 系统概述

Visual Editor 使用 Pinia store (`useWidgetStore`) 来管理组件注册。
2. **Card 2.1 集成**: 通过 `useCard2Integration` 钩子动态加载

### 架构图

```
┌─────────────────────────────────────────────────────────┐
│                   WidgetLibrary                         │
│  ┌─────────────────┐     ┌─────────────────────────────┐ │
│  │  Editor Widgets │     │      Card 2.1 Widgets      │ │
│  │                 │     │                             │ │
│  │ useWidgetStore  │────▶│  useCard2Integration Hook   │ │
│  │   (Pinia Store) │     │       (动态加载)             │ │
│  └─────────────────┘     └─────────────────────────────┘ │
│                 │                       │                │
│                 ▼                       ▼                │
│            组件树合并 (combinedWidgetTree)                │
│                            │                             │
│                            ▼                             │
│                    分类展示界面                            │
└─────────────────────────────────────────────────────────┘
```

## 📝 组件定义规范

### WidgetDefinition 接口

```typescript
interface WidgetDefinition {
  type: string                    // 唯一标识符
  name: string                    // 显示名称
  description?: string            // 组件描述
  icon: Component | string        // 图标 (Vue组件或SVG名称)
  category: string                // 分类名称
  version: string                 // 版本号 (语义化版本)
  defaultProperties: Record<string, any>  // 默认属性
  defaultLayout: {                // 默认布局
    canvas: { width: number, height: number }
    gridstack: { w: number, h: number }
  }
  metadata?: Record<string, any>  // 扩展元数据
}
```

### 组件分类规范

内置分类映射：
```typescript
const categoryNameMap: Record<string, string> = {
  base: '基础组件',
  chart: '📊 Card 2.0 图表',
  control: '🎛️ Card 2.0 控制', 
  display: '📱 Card 2.0 显示',
  media: '🎥 Card 2.0 媒体',
  other: '🔧 Card 2.0 其他'
}
```

Card 2.1 分类映射：
```typescript
const card2CategoryMap: Record<string, string> = {
  'chart': '📊 Card 2.1 图表',
  'control': '🎛️ Card 2.1 控制',
  'display': '📱 Card 2.1 显示', 
  'media': '🎥 Card 2.1 媒体',
  'other': '🔧 Card 2.1 其他'
}
```

## 🔧 注册机制详解

### 1. `useWidgetStore` Store

**核心功能**:
- 通过 Pinia store 响应式地管理组件注册表。
- 提供 actions 来注册/注销组件。
- 提供 getters 来检索组件。

**主要属性和方法**:
```typescript
// store/widget.ts
const useWidgetStore = defineStore('widget', {
  state: () => ({
    widgetRegistry: new Map<WidgetType, WidgetDefinition>(),
    selectedIds: []
  }),
  actions: {
    register(widget: WidgetDefinition): void,
    unregister(widgetType: WidgetType): void,
    // ... selection actions
  },
  getters: {
    getWidget: (state) => (type: WidgetType) => WidgetDefinition | undefined,
    getAllWidgets: (state) => () => WidgetDefinition[],
  }
})
```

**使用示例**:
```typescript
import { useWidgetStore } from '@/components/visual-editor/store/widget'

// 在 Vue 组件或 setup 函数中
const widgetStore = useWidgetStore()

// 注册组件
widgetStore.register(textWidget)
widgetStore.register(imageWidget)

// 查询组件
const widget = widgetStore.getWidget('text')

// 获取所有组件 (getter)
const allWidgets = widgetStore.getAllWidgets()
```

### 2. 组件注册流程

#### 步骤 1: 定义组件

```typescript
// widgets/my-widgets.ts
import { MyIconOutline } from '@vicons/ionicons5'
import type { WidgetDefinition } from '../store/widget'

const myWidget: WidgetDefinition = {
  type: 'my-widget',
  name: '我的组件',
  description: '这是一个自定义组件',
  icon: MyIconOutline,
  category: 'custom',
  version: '1.0.0',
  defaultProperties: {
    title: '默认标题',
    content: '默认内容'
  },
  defaultLayout: {
    canvas: { width: 300, height: 200 },
    gridstack: { w: 3, h: 2 }
  },
  metadata: {
    author: 'Developer Name',
    tags: ['custom', 'example']
  }
}
```

#### 步骤 2: 在 Store 中注册

不再需要单独的注册函数。通常在应用初始化或特定功能模块加载时，直接调用 `useWidgetStore` 的 action 来注册组件。

```typescript
// 在某个初始化脚本或 Vue 组件中
import { useWidgetStore } from '@/components/visual-editor/store/widget'
import { myWidget } from './widgets/my-widgets' // 假设定义已导出

const widgetStore = useWidgetStore()

// 注册组件
widgetStore.register(myWidget)
console.log('✅ 自定义组件注册完成')
```

#### 步骤 3: 应用初始化

确保在应用生命周期的早期阶段（例如在根组件的 `onMounted` 钩子中，或在特定的初始化插件中）执行注册逻辑。

### 3. 组件树结构

**数据结构**:
```typescript
interface WidgetTreeNode {
  name: string                    // 分类名称
  children: WidgetDefinition[]    // 该分类下的组件列表
}
```

**生成逻辑**:
1. 按 `category` 字段分组组件
2. 使用 `categoryNameMap` 映射显示名称
3. 未知分类自动生成格式化名称

## Card 2.1 集成

Visual Editor 与 ThingsPanel 的 Card 2.1 规范深度集成，实现了组件的动态加载、配置和渲染。这种集成允许将为仪表板设计的卡片无缝地用作可视化编辑器中的小组件。

### 1. 集成架构

集成过程依赖于 `ConfigDiscovery` 服务和 `useWidgetStore` 状态管理。 `ConfigDiscovery` 负责扫描和发现在项目中定义的 Card 2.1 组件，而 `useWidgetStore` 则负责将这些组件注册到编辑器中，使其可用。

- **自动发现**: `ConfigDiscovery` 扫描指定的目录，解析组件的元数据。
- **动态注册**: 发现的组件通过 `useWidgetStore` 的 `register` action 动态添加到组件注册表中。
- **配置转换**: Card 2.1 的配置结构被适配为 Visual Editor 内部的 `WidgetDefinition` 格式。

## 🚀 开发指南

### 创建新组件

按照“组件注册流程”中的说明定义你的组件。确保 `type` 字段是唯一的，并且所有必需的属性都已提供。

### 注册组件

在适当的时候（例如，应用初始化或功能模块加载时），使用 `useWidgetStore().register()` 来添加你的组件。对于需要批量注册的场景，只需多次调用 `register` 方法即可。

## 最佳实践

### 1. 组件设计原则

- **单一职责**: 每个组件应专注于一个功能。
- **可复用性**: 设计通用组件，避免硬编码。
- **可配置性**: 通过 `defaultProperties` 提供丰富的自定义选项。

### 2. 性能优化

- **按需加载**: 结合 Vue 的异步组件特性，实现组件的按需加载。
- **合理使用状态**: 仅在 `useWidgetStore` 中存放全局共享的组件定义，避免存储大量动态数据。

### 3. 错误处理

- **注册校验**: 在 `register` action 中可以添加校验逻辑，确保注册的组件定义符合规范。
- **边界处理**: 在组件内部处理无效的 props 和异常情况。

## 🔍 故障排除

### 1. 组件未显示在库中

- **检查注册逻辑**: 确认 `useWidgetStore().register()` 是否在组件挂载或应用初始化时被调用。
- **检查 Pinia Store**: 使用 Vue Devtools 检查 `widget` store 的状态，查看 `widgetRegistry` 是否包含你的组件。
- **组件定义错误**: 检查浏览器控制台，看是否有组件定义不规范导致的错误。

### 2. 组件无法渲染

- **检查渲染器映射**: 确保你的渲染器（如 `CanvasRenderer`）中包含了对新组件的映射。
- **Props 错误**: 检查组件的 `defaultProperties` 是否正确，以及传递给组件的 props 是否符合预期。

### 3. 调试工具

- **Vue Devtools**: 检查 Pinia store 的状态和组件的 props。
- **浏览器控制台**: 查看 `useWidgetStore` 实例和相关的日志输出。

---

## 📚 相关文档

- [渲染器开发指南](./renderers/RENDERER_DEVELOPMENT_GUIDE.md)
- [组件开发最佳实践](./renderers/BEST_PRACTICES.md)
- [Card 2.1 集成文档](./CARD2_INTEGRATION.md)

**组件注册系统是 Visual Editor 的核心基础设施，正确的使用和扩展将为编辑器带来强大的功能和良好的用户体验！** 🎨