# 可视化编辑器目录结构设计

## 1. 核心原则

本目录结构设计基于实际项目架构，遵循以下核心原则：

- **分层架构**: 严格按照展示层、组件层、服务层进行分离
- **按功能组织 (Feature-Based)**: 将实现同一功能的所有相关代码放在同一个目录下
- **组件化与单一职责**: 每个文件或模块只做一件事，并做得很好
- **逻辑与渲染分离**: 核心业务逻辑与具体UI渲染实现解耦
- **黑盒设计**: 组件库和数据服务层设计为独立的黑盒模块
- **明确的类型定义**: 所有模块、Props 和 API 都应有严格的 TypeScript 类型定义

## 2. 项目整体目录结构

基于实际项目结构，可视化编辑器相关的目录分布如下：

```
src/
├── views/                          # 展示层 - 页面级组件
│   └── visualization/              # 可视化相关页面
│       ├── kanban/                 # 看板页面
│       ├── panel-preview/          # 面板预览页面
│       └── examples/               # 示例页面
├── components/                     # 组件层 - 可复用组件
│   ├── visual-editor/              # 可视化编辑器组件（黑盒）
│   ├── panel/                      # 旧版面板组件
│   └── common/                     # 通用UI组件
├── service/                        # 数据服务层（黑盒）
│   └── api/                        # API调用服务
├── store/                          # 状态管理层
├── typings/                        # 全局类型定义
└── utils/                          # 工具函数层
```

## 3. 可视化编辑器组件详细结构

编辑器组件位于 `src/components/visual-editor/`，采用黑盒设计：

```
src/components/visual-editor/       # 可视化编辑器组件（黑盒模块）
├── index.ts                        # 对外暴露的主入口
├── PanelEditor.vue                 # 编辑器主组件
├── README.md                       # 组件使用文档
│
├── core/                           # 核心引擎层
│   ├── index.ts                    # 核心模块导出
│   ├── engine.ts                   # 主引擎，管理渲染器切换和生命周期
│   ├── state-manager.ts            # 状态管理器
│   ├── event-bus.ts                # 事件总线
│   ├── resource-pool.ts            # 资源池管理
│   └── history.ts                  # 历史记录/撤销重做
│
├── renderers/                      # 渲染器层（可插拔）
│   ├── index.ts                    # 渲染器注册和导出
│   ├── base-renderer.ts            # 渲染器基类/接口
│   ├── kanban/                     # 看板渲染器
│   │   ├── index.ts
│   │   ├── KanbanRenderer.vue
│   │   ├── components/             # 看板专用组件
│   │   └── types.ts                # 看板类型定义
│   ├── dashboard/                  # 大屏渲染器
│   │   ├── index.ts
│   │   ├── DashboardRenderer.vue
│   │   ├── components/
│   │   └── types.ts
│   ├── report/                     # 报表渲染器
│   │   ├── index.ts
│   │   ├── ReportRenderer.vue
│   │   ├── components/
│   │   └── types.ts
│   └── three-d/                    # 3D渲染器
│       ├── index.ts
│       ├── ThreeDRenderer.vue
│       ├── components/
│       └── types.ts
│
├── components/                     # 编辑器内部UI组件
│   ├── Layout/                     # 布局组件
│   │   ├── index.ts
│   │   ├── EditorLayout.vue        # 编辑器主布局组件
│   │   └── README.md               # 布局组件使用说明
│   ├── Toolbar/                    # 工具栏组件
│   │   ├── index.ts
│   │   ├── Toolbar.vue
│   │   └── components/
│   ├── Canvas/                     # 画布组件
│   │   ├── index.ts
│   │   ├── Canvas.vue
│   │   └── components/
│   ├── PropertyPanel/              # 属性面板
│   │   ├── index.ts
│   │   ├── PropertyPanel.vue
│   │   └── components/
│   └── WidgetLibrary/              # 组件库面板
│       ├── index.ts
│       ├── WidgetLibrary.vue
│       └── components/
│
├── widgets/                        # 可视化组件库（黑盒）
│   ├── index.ts                    # 组件注册和导出
│   ├── base-widget.ts              # 组件基类
│   ├── charts/                     # 图表组件
│   │   ├── BarChart/
│   │   ├── LineChart/
│   │   ├── PieChart/
│   │   └── index.ts
│   ├── tables/                     # 表格组件
│   │   ├── DataTable/
│   │   ├── StatTable/
│   │   └── index.ts
│   └── custom/                     # 自定义组件
│       ├── TextWidget/
│       ├── ImageWidget/
│       └── index.ts
│
├── features/                       # 编辑器功能模块
│   ├── selection/                  # 选择功能
│   │   ├── index.ts
│   │   ├── SelectionBox.vue
│   │   └── useSelection.ts
│   ├── alignment/                  # 对齐功能
│   │   ├── index.ts
│   │   ├── AlignmentGuide.vue
│   │   └── useAlignment.ts
│   ├── drag-drop/                  # 拖拽功能
│   │   ├── index.ts
│   │   ├── DragDropHandler.vue
│   │   └── useDragDrop.ts
│   └── resize/                     # 缩放功能
│       ├── index.ts
│       ├── ResizeHandle.vue
│       └── useResize.ts
│
├── plugins/                        # 插件系统
│   ├── index.ts                    # 插件管理器
│   ├── plugin-manager.ts           # 插件注册和生命周期
│   ├── built-in/                   # 内置插件
│   │   ├── logger.ts               # 日志插件
│   │   ├── snapshot.ts             # 快照插件
│   │   └── collaboration.ts        # 协同编辑插件
│   └── types.ts                    # 插件类型定义
│
├── hooks/                          # 自定义Hooks
│   ├── useEditor.ts                # 编辑器主Hook
│   ├── useRenderer.ts              # 渲染器Hook
│   ├── useDataBinding.ts           # 数据绑定Hook
│   └── usePlugins.ts               # 插件Hook
│
├── types/                          # TypeScript类型定义
│   ├── index.ts                    # 类型导出
│   ├── base-types.ts               # 基础类型（GraphData等）
│   ├── editor.ts                   # 编辑器相关类型
│   ├── renderer.ts                 # 渲染器类型
│   ├── widget.ts                   # 组件类型
│   └── plugin.ts                   # 插件类型
│
├── utils/                          # 工具函数
│   ├── index.ts
│   ├── data-transform.ts           # 数据转换工具
│   ├── geometry.ts                 # 几何计算工具
│   └── validation.ts               # 数据验证工具
│
└── docs/                           # 组件文档
    ├── architecture-design.md      # 架构设计文档
    ├── directory-structure.md      # 目录结构文档
    ├── api-reference.md            # API参考文档
    └── development-guide.md        # 开发指南
```

## 4. 展示层目录结构

展示层位于 `src/views/visualization/`，包含所有页面级组件：

```
src/views/visualization/
├── kanban/                         # 看板相关页面
│   ├── index.vue                   # 看板列表页面
│   └── components/                 # 页面专用组件
│       ├── KanbanCard.vue
│       └── KanbanFilter.vue
├── kanban-editor/                  # 看板编辑器页面
│   ├── index.vue                   # 编辑器页面
│   └── components/                 # 页面专用组件
│       ├── EditorHeader.vue
│       └── SaveDialog.vue
├── panel-preview/                  # 面板预览页面
│   ├── index.vue                   # 预览页面
│   └── components/
│       ├── PreviewToolbar.vue
│       └── FullscreenMode.vue
├── dashboard-editor/               # 大屏编辑器页面
│   ├── index.vue
│   └── components/
├── report-editor/                  # 报表编辑器页面
│   ├── index.vue
│   └── components/
└── examples/                       # 示例和演示页面
    ├── basic-usage/                # 基础使用示例
    │   └── index.vue
    ├── advanced-features/          # 高级功能示例
    │   └── index.vue
    └── integration-demo/           # 集成演示
        └── index.vue
```

## 5. 数据服务层目录结构

数据服务层位于 `src/service/`，采用黑盒设计：

```
src/service/
├── api/                            # API调用服务
│   ├── index.ts                    # API服务导出
│   ├── visualization.ts            # 可视化相关API
│   ├── data-source.ts              # 数据源API
│   ├── dashboard.ts                # 大屏相关API
│   ├── kanban.ts                   # 看板相关API
│   └── report.ts                   # 报表相关API
├── adapters/                       # 数据适配器
│   ├── index.ts
│   ├── rest-adapter.ts             # REST API适配器
│   ├── graphql-adapter.ts          # GraphQL适配器
│   ├── websocket-adapter.ts        # WebSocket适配器
│   └── file-adapter.ts             # 文件数据适配器
├── cache/                          # 缓存服务
│   ├── index.ts
│   ├── memory-cache.ts             # 内存缓存
│   ├── local-storage-cache.ts      # 本地存储缓存
│   └── indexed-db-cache.ts         # IndexedDB缓存
└── types/                          # 服务层类型定义
    ├── index.ts
    ├── api.ts                      # API类型
    ├── data-source.ts              # 数据源类型
    └── cache.ts                    # 缓存类型
```

## 6. 黑盒设计说明

### 6.1 组件层黑盒 (`src/components/visual-editor/`)

**对外接口：**
```typescript
// src/components/visual-editor/index.ts
export { default as PanelEditor } from './PanelEditor.vue'
export type { 
  EditorConfig, 
  RendererType, 
  KanbanConfig, 
  DashboardConfig 
} from './types'
export { useEditor, useRenderer } from './hooks'
```

**使用方式：**
```vue
<!-- 在页面中使用 -->
<template>
  <PanelEditor 
    :renderer-type="'kanban'"
    :config="editorConfig"
    @save="handleSave"
  />
</template>

<script setup>
import { PanelEditor } from '@/components/visual-editor'
</script>
```

### 6.2 数据服务层黑盒 (`src/service/`)

**对外接口：**
```typescript
// src/service/api/index.ts
export { visualizationApi } from './visualization'
export { dataSourceApi } from './data-source'
export { dashboardApi } from './dashboard'
export { kanbanApi } from './kanban'
export type { ApiResponse, DataSource } from './types'
```

**使用方式：**
```typescript
// 在页面或组件中使用
import { kanbanApi } from '@/service/api'

const saveKanbanConfig = async (config) => {
  const result = await kanbanApi.saveConfig(config)
  return result
}
```

## 7. 开发规范

### 7.1 文件命名规范

- **组件文件**: 大驼峰命名 (PascalCase)，如 `PanelEditor.vue`
- **工具文件**: 小驼峰命名 (camelCase)，如 `dataTransform.ts`
- **类型文件**: 中划线命名 (kebab-case)，如 `base-types.ts`
- **目录名**: 中划线命名 (kebab-case)，如 `drag-drop/`

### 7.2 导入导出规范

```typescript
// 统一从index.ts导出
export { ComponentA } from './ComponentA'
export { ComponentB } from './ComponentB'
export type { TypeA, TypeB } from './types'

// 使用时统一从模块根目录导入
import { PanelEditor, useEditor } from '@/components/visual-editor'
import { kanbanApi } from '@/service/api'
```

### 7.3 类型定义规范

```typescript
// 接口使用 interface
interface EditorConfig {
  width: number
  height: number
}

// 联合类型使用 type
type RendererType = 'kanban' | 'dashboard' | 'report' | 'three-d'

// 泛型接口
interface GraphData<TConfig, TItem> {
  config: TConfig
  items: TItem[]
}
```

## 8. 国际化支持

### 8.1 国际化文件结构

```
src/locales/
├── index.ts                        # i18n配置
└── langs/
    ├── en/
    │   ├── common.json              # 通用翻译
    │   ├── editor.json              # 编辑器翻译
    │   └── visualization.json       # 可视化翻译
    └── zh-cn/
        ├── common.json
        ├── editor.json
        └── visualization.json
```

### 8.2 国际化文件示例

**`src/locales/langs/zh-cn/editor.json`**
```json
{
  "toolbar": {
    "undo": "撤销",
    "redo": "重做",
    "save": "保存",
    "preview": "预览"
  },
  "canvas": {
    "addWidget": "添加组件",
    "deleteWidget": "删除组件"
  }
  "propertyPanel": {
    "title": "属性设置",
    "width": "宽度",
    "height": "高度"
  }
}
```

**`src/locales/langs/en/editor.json`**
```json
{
  "toolbar": {
    "undo": "Undo",
    "redo": "Redo",
    "zoomIn": "Zoom In",
    "zoomOut": "Zoom Out"
  },
  "propertyPanel": {
    "title": "Property Settings",
    "width": "Width",
    "height": "Height"
  }
}
```