# Visual Editor Widget Registration Guide

## 1. 概述

欢迎使用可视化编辑器的动态组件注册系统！本指南将帮助您了解如何创建、定义和注册新的组件（我们称之为 "Widget"），以便它们可以被无缝地集成到编辑器左侧的组件库中，并被用户拖拽到画布上。

本系统的核心设计理念是**“约定优于配置”**和**“声明式定义”**。我们不希望将组件的逻辑硬编码在编辑器核心中，而是通过一个统一的、声明式的方式来定义组件，然后由一个中央**组件注册中心 (`WidgetRegistry`)** 来统一管理。

## 2. 核心概念

-   **WidgetDefinition**: 这是一个 TypeScript 接口，它定义了一个组件所需的所有信息，包括其类型、名称、图标、默认属性、默认布局等。所有组件都必须符合这个接口规范。
-   **WidgetRegistry**: 这是一个单例类，作为整个应用程序中唯一的组件“数据库”。它负责接收组件定义、存储它们，并提供查询接口，供编辑器其他部分（如组件库 UI）使用。
-   **组件模块 (Widget Module)**: 这是一个独立的 TypeScript 文件，其职责是定义一个或多个相关的组件，并将它们注册到 `WidgetRegistry` 中。

## 3. 如何注册一个新组件：分步指南

### 第 1 步：创建组件定义文件

在 `src/components/visual-editor/widgets/` 目录下，创建一个新的 `.ts` 文件来存放您的组件定义。例如，`my-widgets.ts`。

### 第 2 步：定义你的组件

在 `my-widgets.ts` 文件中，导入 `WidgetDefinition` 接口，并为您要创建的每个组件创建一个符合该接口的常量对象。

**示例：创建一个“视频播放器”组件**

```typescript
// src/components/visual-editor/widgets/my-widgets.ts

import { PlayerPlay } from '@vicons/fa' // 假设我们使用一个 FontAwesome 图标
import type { WidgetDefinition } from '../core/widget-registry'

// 定义视频播放器组件
export const videoPlayerWidget: WidgetDefinition = {
  // 1. 唯一标识符 (必须是唯一的)
  type: 'video-player',

  // 2. 在 UI 中显示的名称
  name: '视频播放器',

  // 3. 详细描述 (可选)
  description: '用于嵌入和播放视频。',

  // 4. 图标 (可以是 Vue 组件或字符串)
  icon: PlayerPlay,

  // 5. 所属分类 (会影响在组件库中的分组)
  category: 'media', // 'base', 'chart', 'control', 'display', 'media', 'other'

  // 6. 版本号
  version: '1.0.0',

  // 7. 拖拽到画布上时的默认属性
  defaultProperties: {
    src: 'https://www.w3schools.com/html/mov_bbb.mp4',
    autoplay: false,
    controls: true,
  },

  // 8. 默认的布局尺寸
  defaultLayout: {
    canvas: { width: 320, height: 180 }, // 像素单位
    gridstack: { w: 4, h: 4 },           // 网格单位
  },

  // 9. 额外的元数据 (可选)
  metadata: {
    author: 'Your Name',
  },
}
```

### 第 3 步：创建并导出注册函数

在同一个文件中，创建一个函数，该函数将您定义的组件注册到 `widgetRegistry` 中。

```typescript
// src/components/visual-editor/widgets/my-widgets.ts

import { widgetRegistry } from '../core/widget-registry'
import { videoPlayerWidget } from './my-widgets' // 导入上面定义的组件

// ... (WidgetDefinition 代码)

/**
 * 注册本模块中定义的所有组件。
 */
export function registerMyWidgets() {
  widgetRegistry.register(
    videoPlayerWidget
    // 如果有更多组件，可以继续在这里添加
    // anotherWidget,
    // ...
  )
}
```

### 第 4 步：在主入口处调用注册函数

最后一步，打开 `src/components/visual-editor/widgets/index.ts` 文件，导入并调用您刚刚创建的注册函数。

```typescript
// src/components/visual-editor/widgets/index.ts

import { registerBaseWidgets } from './base-widgets'
import { registerMyWidgets } from './my-widgets' // 1. 导入你的注册函数

/**
 * 注册所有在编辑器中可用的组件。
 */
export function registerAllWidgets() {
  registerBaseWidgets()
  registerMyWidgets() // 2. 在这里调用它
}
```

**完成！** 现在重新启动您的应用，新的“视频播放器”组件就会自动出现在左侧组件库的“媒体”分类下。

## 4. `WidgetDefinition` 接口详解

| 字段                | 类型                               | 描述                                                                                                      |
| ------------------- | ---------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `type`              | `string`                           | **必须唯一**。组件的内部标识符。                                                                              |
| `name`              | `string`                           | 在组件库中展示给用户的名称。                                                                              |
| `description`       | `string` (可选)                     | 组件功能的简短描述，可用作 `title` 或 `tooltip`。                                                          |
| `icon`              | `Component | string`                 | 在组件库中显示的图标。可以是导入的 Vue 组件（如 `vicons`）或一个字符串 ID（用于 `SvgIcon`）。               |
| `category`          | `string`                           | 组件所属的分类。注册中心会根据这个字段对组件进行分组。                                                    |
| `version`           | `string`                           | 组件的版本号，推荐使用语义化版本（如 "1.0.0"）。                                                          |
| `defaultProperties` | `Record<string, any>`              | 创建组件实例时赋予的默认属性。这些属性将决定组件的初始状态和外观。                                        |
| `defaultLayout`     | `object`                           | 包含 `canvas` 和 `gridstack` 两个子对象，分别定义了在不同渲染器下的默认尺寸。                            |
| `metadata`          | `Record<string, any>` (可选)        | 一个用于存储任何额外信息的通用对象，例如作者、创建日期、或者与特定渲染器相关的特殊配置等。                    |

---

通过遵循本指南，您可以轻松地为可视化编辑器贡献新的功能和组件，而无需修改任何核心代码，从而保持系统的整洁和可维护性。
