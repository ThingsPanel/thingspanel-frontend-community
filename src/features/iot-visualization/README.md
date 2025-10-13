# IOT 可视化系统 v3.0

**核心理念**：放弃迁移，拥抱新生。基于渲染器抽象、单向依赖、依赖倒置原则，从零构建面向未来的可视化生态系统。

## 🎯 架构概览

```
┌─────────────────────────────────────────────────┐
│          editor/ (编辑器应用层)                    │
│    - Editor.vue (主UI)                           │
│    - useEditorBridge (UI ↔ 核心桥梁)              │
│    - useRenderer (渲染器管理)                      │
└────────────────┬────────────────────────────────┘
                 │
┌────────────────┴────────────────────────────────┐
│      renderers/ (渲染器层 - 实现依赖倒置)          │
│    - IRenderer 接口定义                           │
│    - VueRenderer (Vue 3 实现) ✅                  │
│    - CanvasRenderer (未来) 🔮                     │
│    - WebGLRenderer (未来) 🔮                      │
└────────────────┬────────────────────────────────┘
                 │
┌────────────────┴────────────────────────────────┐
│       cartes/ (卡片框架 - 组件元数据层)            │
│    - ICardManifest (卡片清单契约)                 │
│    - Card2.1 Adapter (复用现有组件) ✅             │
│    - CardRegistry (卡片注册表)                    │
└────────────────┬────────────────────────────────┘
                 │
┌────────────────┴────────────────────────────────┐
│     noyau/ (核心引擎 - 框架无关的纯逻辑)            │
│    ├── state/ (Pinia 状态管理)                    │
│    │   - canvas.store.ts (渲染树)                │
│    │   - canvas.actions.ts (原子操作)             │
│    │   - canvas.selectors.ts (派生数据)           │
│    ├── data-sources/ (数据源引擎)                 │
│    │   - executor.ts (调度中心)                   │
│    │   - providers/ (4种数据源)                   │
│    ├── interactions/ (交互引擎)                   │
│    │   - engine.ts (交互调度)                     │
│    │   - actions/ (4种交互动作)                   │
│    └── types/ (完整类型系统)                      │
└─────────────────────────────────────────────────┘
```

## 📂 目录结构

```
src/features/iot-visualization/
│
├── noyau/                       # ✅ 核心引擎（法语：内核）
│   ├── types/                   # 类型系统
│   │   ├── canvas.types.ts      # 画布、节点、渲染树
│   │   ├── data.types.ts        # 数据源类型
│   │   └── interaction.types.ts # 交互系统类型
│   │
│   ├── state/                   # 状态管理
│   │   ├── canvas.store.ts      # Pinia Store (50+ getters/actions)
│   │   ├── canvas.actions.ts    # 原子操作函数
│   │   └── canvas.selectors.ts  # 选择器函数
│   │
│   ├── data-sources/            # 数据源引擎
│   │   ├── interface.ts         # IDataSourceProvider 契约
│   │   ├── executor.ts          # 数据源调度中心
│   │   └── providers/           # 4种内置提供者
│   │       ├── static.provider.ts
│   │       ├── http.provider.ts
│   │       ├── websocket.provider.ts
│   │       └── script.provider.ts
│   │
│   ├── interactions/            # 交互引擎
│   │   ├── interface.ts         # IInteractionActionHandler 契约
│   │   ├── engine.ts            # 交互调度引擎
│   │   └── actions/             # 4种内置动作
│   │       ├── navigateTo.action.ts
│   │       ├── updateData.action.ts
│   │       ├── changeVisibility.action.ts
│   │       └── showNotification.action.ts
│   │
│   └── index.ts                 # 统一导出
│
├── cartes/                      # ✅ 卡片框架（法语：卡片）
│   ├── interface.ts             # ICardManifest 定义
│   ├── adapter.ts               # Card2.1 → ICardManifest 适配器
│   ├── registry.ts              # 卡片注册表
│   └── index.ts
│
├── renderers/                   # ✅ 渲染器层
│   ├── interface.ts             # IRenderer 契约
│   ├── vue/                     # Vue 渲染器
│   │   ├── VueRenderer.ts       # 核心逻辑
│   │   ├── VueRendererComponent.vue  # 渲染容器
│   │   ├── VueNodeWrapper.vue   # 节点包装器
│   │   └── registry.ts          # 组件映射注册表
│   └── index.ts
│
├── editor/                      # ✅ 编辑器应用
│   ├── Editor.vue               # 主UI组件
│   ├── composables/
│   │   ├── useEditorBridge.ts   # UI ↔ noyau 桥梁
│   │   └── useRenderer.ts       # 渲染器管理
│   └── index.ts
│
├── index.ts                     # 系统总导出
└── README.md                    # 本文档
```

## 🚀 快速开始

### 1. 访问编辑器

路由路径：`/iot-visualization/editor`

### 2. 基础用法

```vue
<script setup>
import { Editor } from '@/features/iot-visualization/editor'
</script>

<template>
  <Editor />
</template>
```

### 3. 使用编辑器桥梁

```typescript
import { useEditorBridge } from '@/features/iot-visualization/editor'

const {
  renderTree,      // 渲染树（只读）
  addCard,         // 添加卡片
  updateNode,      // 更新节点
  deleteSelected,  // 删除选中
  undo,            // 撤销
  redo             // 重做
} = useEditorBridge()

// 添加一个告警状态卡片
addCard('alert-status', { x: 100, y: 100 })
```

## 🎨 核心特性

### 1. Noyau 核心引擎

#### 状态管理（Pinia）
- **50+ Actions**：addNode, updateNode, moveNode, resizeNode...
- **40+ Selectors**：selectNodeById, selectVisibleNodes, fuzzySearchNodes...
- **历史记录**：完整的 undo/redo 支持
- **多选操作**：批量操作节点

#### 数据源引擎
支持 4 种数据源类型：
- **Static**：静态数据
- **HTTP**：RESTful API（集成 @sa/axios）
- **WebSocket**：实时数据推送（支持自动重连）
- **Script**：自定义 JavaScript 脚本

#### 交互引擎
支持 4 种交互动作：
- **navigateToUrl**：页面跳转
- **updateComponentData**：更新组件数据
- **changeVisibility**：显示/隐藏组件
- **showNotification**：系统通知

### 2. Cartes 卡片框架

#### Card2.1 适配器
- 自动转换 `ComponentDefinition` → `ICardManifest`
- 完全复用 Card2.1 的 Vue 组件
- 继承数据绑定、交互配置、settingConfig

#### 卡片注册表
```typescript
import { cardRegistry } from '@/features/iot-visualization/cartes'

// 获取所有卡片
const allCards = cardRegistry.getAll()

// 按分类获取
const systemCards = cardRegistry.getByCategory('系统')

// 搜索卡片
const results = cardRegistry.search('告警')

// 统计信息
const stats = cardRegistry.getStats()
```

### 3. Vue 渲染器

- **动态组件渲染**：自动加载 Card2.1 组件
- **响应式更新**：watch renderTree 自动刷新
- **样式支持**：完整支持位置、大小、变换、样式
- **锁定/隐藏**：支持节点锁定和可见性控制

## 📦 依赖关系

### 外部依赖
- `vue`：Vue 3 框架
- `pinia`：状态管理
- `naive-ui`：UI 组件库
- `@sa/axios`：HTTP 请求
- `nanoid`：ID 生成
- `lodash-es`：工具函数

### 内部依赖
- `@/card2.1`：复用 Card2.1 组件系统

## 🔧 开发指南

### 添加新的数据源提供者

1. 实现 `IDataSourceProvider` 接口
2. 注册到 `DataSourceExecutor`

```typescript
// 1. 创建提供者
class CustomDataSourceProvider extends BaseDataSourceProvider {
  readonly type = 'custom' as const

  create(config: CustomDataSourceConfig): IDataSourceInstance {
    // 实现
  }
}

// 2. 注册
const executor = createDataSourceExecutor()
executor.registerProvider(new CustomDataSourceProvider())
```

### 添加新的交互动作

1. 实现 `IInteractionActionHandler` 接口
2. 注册到 `InteractionEngine`

```typescript
// 1. 创建动作处理器
class CustomActionHandler extends BaseInteractionActionHandler {
  readonly type = 'customAction' as const

  async execute(context: InteractionContext): Promise<void> {
    // 实现
  }

  getMetadata(): ActionMetadata {
    // 返回元数据
  }
}

// 2. 注册
const engine = createInteractionEngine()
engine.registerAction(new CustomActionHandler())
```

### 添加新的渲染器

1. 实现 `IRenderer` 接口
2. 在 `useRenderer` 中注册

```typescript
// 1. 创建渲染器
export class CanvasRenderer extends BaseRenderer {
  getType(): RendererType { return 'canvas' }

  async mount(container, renderTree) {
    // 实现 Canvas 渲染逻辑
  }

  // ... 其他方法
}

// 2. 在 useRenderer.ts 中注册
case 'canvas':
  return new CanvasRenderer()
```

## 🎯 设计原则

### 1. 依赖倒置
- 底层模块（noyau）定义接口契约
- 上层模块（renderers, editor）实现具体功能
- 核心引擎完全框架无关，可在 Node.js 中测试

### 2. 单向数据流
```
State (noyau) → Actions → Selectors → Store → UI (editor)
                                              ↓
                                         Renderer
```

### 3. 策略模式
- 数据源系统：`IDataSourceProvider`
- 交互系统：`IInteractionActionHandler`
- 渲染器系统：`IRenderer`

### 4. 适配器模式
- Card2.1 Adapter：无缝对接现有组件系统

## 📊 性能优化

- ✅ 虚拟滚动（未来）
- ✅ 按需渲染（只渲染可见节点）
- ✅ 防抖/节流（交互引擎内置）
- ✅ 组件懒加载
- ✅ 历史记录限制（最多 50 条）

## 🚧 未来扩展

### Canvas 渲染器
- 高性能大规模节点渲染
- 基于 Fabric.js 或原生 Canvas

### WebGL 渲染器
- 3D 可视化支持
- 基于 Three.js 或 PixiJS

### 组件库面板
- 拖拽添加组件
- 分类浏览
- 搜索过滤

### 属性配置面板
- 动态表单生成
- 数据源配置
- 交互配置

## 📝 版本历史

### v3.0.0 (2025-01-08)
- ✅ 完整的核心引擎（noyau）
- ✅ Card2.1 适配器（cartes）
- ✅ Vue 渲染器（renderers/vue）
- ✅ 基础编辑器界面（editor）
- ✅ 路由集成

## 📖 参考文档

- [migration-plan-v3.md](../../migration-plan-v3.md) - 架构蓝图
- [new-visualization-architecture.md](../../new-visualization-architecture.md) - 架构设计
- [Card2.1 Documentation](../card2.1/README.md) - Card2.1 组件系统

## 🤝 贡献指南

遵循项目的强制性开发规范：
1. 完整理解需求后再开发
2. 一次性完整实现，不留半成品
3. 所有文本使用国际化
4. 使用 Naive UI 组件
5. 使用主题变量，禁止硬编码颜色

---

**构建于 2025 年，面向未来的可视化系统。**
