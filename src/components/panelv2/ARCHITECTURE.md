# PanelV2 组件架构设计文档

## 1. 项目概述

`PanelV2` 是一个高度可配置、可扩展的看板组件系统，旨在提供一个灵活的框架，允许开发者通过组合不同的模块（工具、卡片、渲染器）来构建功能丰富的仪表盘或可视化编辑器。

## 2. 核心设计理念

### 2.1 渲染责任下放 (Delegated Rendering)
`PanelV2` 自身不负责渲染任何具体的卡片内容。它的核心 `Canvas` 组件仅提供一个带有**插槽 (Slot)** 的布局系统。真正的渲染决策由 `PanelV2` 的使用者，在插槽中根据数据动态完成。

### 2.2 配置驱动一切 (Configuration-Driven)
数据结构是设计的核心。卡片和看板的配置被明确分离，并且配置结构本身将决定加载哪个对应的 `Inspector`（配置器）。

### 2.3 设计原则
*   **数据驱动 (Data-Driven):** 整个看板的UI和行为由一个中心化的状态对象描述
*   **组件化与可组合 (Componentized & Composable):** 功能被拆分为独立的、可复用的组件
*   **可扩展性 (Extensible):** 核心框架提供清晰的扩展点，方便添加新的卡片类型、工具和渲染逻辑
*   **关注点分离 (Separation of Concerns):** 各个模块职责分明，相互解耦

## 3. 项目结构

### 3.1 推荐目录结构

```
src/components/panelv2/
├── ARCHITECTURE.md         # 架构文档
├── PanelV2.vue             # 主入口组件，整合所有部分
├── PanelDemo.vue           # 用于演示和测试的示例页面
├── types.ts                # 核心 TypeScript 类型定义，模块间的契约
│
├── canvas/                 # 核心：画布模块
│   └── Canvas.vue          # 画布主组件 (处理拖放、渲染网格、动态加载卡片)
│
├── cards/                  # 核心：可重用的卡片组件集合
│   ├── TextCard.vue        # 示例：文本卡片
│   └── ...                 # 未来可添加图表、图片等更多卡片
│
├── inspector/              # 核心：配置器模块
│   ├── Inspector.vue       # 配置器主组件 (根据选中项动态加载具体的配置面板)
│   └── inspectors/         # 具体的配置面板组件
│       ├── PanelInspector.vue    # 看板自身的配置面板
│       └── TextCardInspector.vue # 文本卡片的配置面板
│
├── sidebar/                # 核心：侧边栏模块
│   └── Sidebar.vue         # 侧边栏主组件 (渲染可拖拽的组件列表)
│
├── toolbar/                # 核心：工具栏模块
│   └── Toolbar.vue         # 工具栏主组件
│
└── state/                  # 状态管理 (推荐使用 Pinia)
    └── panelStore.ts       # 定义所有状态、Getters 和 Actions
```

### 3.2 整体架构图

```mermaid
graph TD
    subgraph User Implementation (e.g., PanelDemo.vue)
        direction LR
        U1[Card & Inspector Registries] --> U2[Renderer Logic]
        U2 -- "Listens to Slot" --> P2[Canvas]
        U2 -- "Renders Specific Card" --> P2
    end

    subgraph PanelV2 Core
        direction LR
        P1[State Management] -.-> P2[Canvas]
        P1 -.-> P3[Inspector]
        P1 -.-> P4[Sidebar]
        P1 -.-> P5[Toolbar]

        P2 -- "Emits Layout/Select Events" --> P1
        P3 -- "Emits Config Events" --> P1
        P4 -- "Emits Drag Events" --> P1
        P5 -- "Emits Action Events" --> P1
    end

    P2 -- "Provides Slot with Data" --> U2
    P3 -- "Uses Dynamic Component" --> U1

    style PanelV2 Core fill:#f9f,stroke:#333,stroke-width:2px
```

### 3.3 模块职责

#### PanelV2 Core (核心库)
*   **State Management (状态管理):** 单一事实来源，数据结构关注"配置"而非"内容"
*   **Canvas (画布):** 管理布局（如 Gridstack），为每个卡片数据项暴露具名插槽，将完整数据作为 props 传递
*   **Inspector (配置器):** 配置中心，根据选中项的配置标识动态加载对应的配置器组件
*   **Sidebar (侧边栏):** 渲染可拖拽的组件列表，支持树形结构
*   **Toolbar (工具栏):** 渲染顶部工具按钮，支持自定义操作

#### User Implementation (用户实现层)
*   **Renderer Logic (渲染逻辑):** 通过 v-slot 监听 Canvas 插槽，根据数据的 type 字段决定渲染哪个具体卡片组件
*   **Card & Inspector Registries (注册表):** 维护卡片类型和配置器标识到 Vue 组件的映射关系

## 4. 核心数据结构与类型定义

### 4.1 基础类型定义 (src/components/panelv2/types.ts)

#### 配置驱动的核心类型

```typescript
// --- 基础配置单元 ---
/**
 * @description 定义一个配置项，包含其值和对应的配置器组件标识
 * 这是实现"配置驱动"的基础
 */
export interface ConfigItem<T> {
  value: T; // 配置的实际值
  inspector: string; // 指向 InspectorRegistry 的 key，告诉UI应渲染哪个配置器组件
}

// --- 卡片数据结构 ---
/**
 * @description 代表一个卡片实例，主要由"布局"和"配置"组成
 */
export interface PanelCard {
  id: string; // 唯一实例ID
  type: string; // 卡片类型标识，用于在用户实现层决定渲染哪个内容组件
  layout: { x: number; y: number; w: number; h: number; }; // 布局信息
  // 卡片的具体配置，每个字段都是一个独立的、可配置的单元
  config: {
    [key: string]: ConfigItem<any>;
  };
}

// --- 可拖拽组件项 ---
export interface DraggableItem {
  type: string; // 组件类型
  label: string; // 显示名称
  icon?: string; // 图标
  defaultLayout?: Partial<PanelCard['layout']>; // 默认尺寸
  defaultProps?: Record<string, any>; // 拖拽生成卡片时的默认配置
}

// --- 看板状态 ---
/**
 * @description 整个看板的状态树
 */
export interface PanelState {
  cards: PanelCard[];
  layoutType: string; // 看板渲染器类型, e.g., 'gridstack'
  selectedItemId?: string | null; // 当前选中的卡片ID，null表示选中看板本身
  // 看板自身的全局配置
  config: {
    [key: string]: ConfigItem<any>;
  };
}

// --- 工具栏按钮定义 ---
export interface ToolbarAction {
  id: string;
  icon: string;
  tooltip: string;
  action: (state: PanelState) => void; // 点击后执行的操作
}
```

#### 数据示例

```typescript
// --- 文本卡片示例 ---
const exampleTextCard: PanelCard = {
  id: 'xyz-123',
  type: 'text-card', // 用于渲染逻辑
  layout: { x: 0, y: 0, w: 4, h: 2 },
  config: {
    // 每个配置项都清晰地指明了它的值和它的配置器
    title: { value: 'Hello World', inspector: 'text-input' },
    content: { value: 'This is a demo.', inspector: 'textarea-input' },
    color: { value: '#333333', inspector: 'color-picker' },
  }
};

// --- 看板全局配置示例 ---
const examplePanelState: PanelState = {
  cards: [/*...*/],
  layoutType: 'gridstack',
  selectedItemId: null,
  config: {
    backgroundColor: { value: '#ffffff', inspector: 'color-picker' },
    gridGap: { value: 10, inspector: 'number-input' },
  }
};
```

### 4.2 新数据结构的优势

1.  **高度解耦:** `Inspector` 组件不再需要一个庞大的 `if/else` 或 `switch` 来判断如何渲染。它只需遍历选中项的 `config` 对象，并根据每个 `ConfigItem` 的 `inspector` 字段动态加载通用配置组件（如 `TextInput.vue`, `ColorPicker.vue`）。
2.  **原子化与可组合:** 配置被分解为最小的"原子"单元。未来可以轻松地为任何卡片组合这些原子配置，而无需编写新的、特定的 `Inspector` 组件。
3.  **清晰的意图:** 数据结构本身就完整地描述了"是什么"(`value`)和"如何配置"(`inspector`)，具有自解释性。

## 5. 布局系统设计

### 5.1 布局架构

`PanelV2` 采用完全基于 Flexbox 的布局系统，确保在各种屏幕尺寸下都能提供良好的用户体验：

```css
/* 根容器 - 全屏布局 */
.panel-v2-root {
  height: 100%;
  width: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

/* 主容器 - 水平布局 */
.main-container {
  flex: 1;
  display: flex;
  overflow: hidden;
}

/* 侧边栏容器 - 可收起 */
.sidebar-container {
  width: 250px; /* 展开状态 */
  width: 0px;   /* 收起状态 */
  transition: width 0.3s ease;
  overflow: hidden;
}

/* 画布容器 - 占据剩余空间 */
.canvas-container {
  flex: 1;
  overflow: hidden;
}

/* 配置器容器 - 可收起 */
.inspector-container {
  width: 300px; /* 展开状态 */
  width: 0px;   /* 收起状态 */
  transition: width 0.3s ease;
  overflow: hidden;
}
```

### 5.2 响应式设计

- **全屏体验:** 通过 `height: 100%` 和 `overflow: hidden` 确保组件占满整个视口
- **智能收起:** 侧边栏和配置器支持平滑的展开/收起动画
- **无滚动条:** 通过精确的布局控制，避免出现不必要的滚动条

## 6. 状态管理

### 6.1 状态管理架构

推荐使用 Pinia 进行状态管理，提供以下核心功能：

```typescript
// src/components/panelv2/state/panelStore.ts
export const usePanelStore = defineStore('panel', {
  state: (): PanelState => ({
    cards: [],
    layoutType: 'gridstack',
    selectedItemId: null,
    config: {
      backgroundColor: { value: '#ffffff', inspector: 'color-picker' },
      gridGap: { value: 10, inspector: 'number-input' },
    }
  }),

  getters: {
    selectedCard: (state) => 
      state.cards.find(card => card.id === state.selectedItemId),
    
    selectedItem: (state) => 
      state.selectedItemId ? 
        state.cards.find(card => card.id === state.selectedItemId) : 
        { config: state.config }
  },

  actions: {
    addCard(cardData: Partial<PanelCard>) { /* ... */ },
    updateCard(cardId: string, updates: Partial<PanelCard>) { /* ... */ },
    deleteCard(cardId: string) { /* ... */ },
    selectItem(itemId: string | null) { /* ... */ },
    updateConfig(path: string, value: any) { /* ... */ }
  }
});
```

### 6.2 数据流

1. **单向数据流:** 所有状态变更都通过 actions 进行
2. **响应式更新:** Vue 的响应式系统自动更新相关组件
3. **类型安全:** TypeScript 确保数据结构的一致性

## 7. 工作流示例

### 7.1 添加新卡片

1.  **用户操作:** 从 `Sidebar` 拖拽一个 "Text" 组件到 `Canvas` 上
2.  **Sidebar:** `onDragStart` 事件触发，将 `{ type: 'text-card' }` 信息存入 `DataTransfer`
3.  **Canvas:**
    *   `onDrop` 事件触发，读取 `DataTransfer` 中的信息
    *   调用状态管理的 `addCard` action，并传入 `{ type: 'text-card', position: { x, y } }`
4.  **State Management:**
    *   `addCard` action 被执行
    *   生成一个新的 `PanelCard` 对象（包含唯一 `id`、`type`、`layout`），并将其添加到 `state.cards` 数组中
5.  **Vue 响应式更新:**
    *   `Canvas` 组件检测到 `state.cards` 变化
    *   根据新的卡片信息，从用户实现的渲染逻辑中渲染对应的卡片组件

### 7.2 修改卡片配置

1.  **用户操作:** 点击 `Canvas` 中的一个卡片
2.  **Canvas:** 发出 `select` 事件，`State Management` 更新 `selectedItemId`
3.  **Inspector:**
    *   检测到 `selectedItemId` 变化，从 `State` 中获取到对应的 `PanelCard` 对象
    *   **遍历 `card.config` 对象**。例如，遍历到 `title: { value: '...', inspector: 'text-input' }`
    *   它查找 `inspector` 注册表，找到 `'text-input'` 对应的组件 (`TextInputInspector.vue`)
    *   渲染 `TextInputInspector.vue` 组件，并将 `title.value` 作为 `v-model` 传入
4.  **用户操作:** 在渲染出的文本输入框中修改标题
5.  **Inspector:** `TextInputInspector.vue` 发出 `update:modelValue` 事件
6.  **State Management:** `Inspector` 监听到事件后，调用 `action`，将新的值更新到 `state.cards` 中对应卡片的 `config.title.value` 字段
7.  **Vue 响应式更新:**
    *   `Canvas` 的插槽收到了更新后的 `PanelCard` 数据
    *   **用户实现层的渲染逻辑**接收到新的 `props`，并将新的标题传递给它渲染的 `TextCard` 组件，UI更新

## 8. 组件注册表系统

### 8.1 卡片注册表

```typescript
// 在 PanelDemo.vue 或其他使用者中
const cardRegistry = {
  'text-card': TextCard,
  'chart-card': ChartCard,
  'image-card': ImageCard,
  // ... 更多卡片类型
};
```

### 8.2 配置器注册表

```typescript
const inspectorRegistry = {
  'text-input': TextInputInspector,
  'textarea-input': TextareaInputInspector,
  'color-picker': ColorPickerInspector,
  'number-input': NumberInputInspector,
  // ... 更多配置器类型
};
```

### 8.3 渲染逻辑示例

```vue
<!-- 在 PanelDemo.vue 的 Canvas 插槽中 -->
<template #card="{ card }">
  <component 
    :is="cardRegistry[card.type]" 
    :config="card.config"
    @update:config="updateCardConfig(card.id, $event)"
  />
</template>
```

## 9. 扩展指南

### 9.1 添加新卡片类型

1. **创建卡片组件:** 在 `cards/` 目录下创建新的 Vue 组件
2. **创建配置器:** 在 `inspector/inspectors/` 目录下创建对应的配置面板
3. **注册组件:** 在使用者代码中将新组件添加到注册表
4. **更新拖拽列表:** 在 `draggableItems` 中添加新的可拖拽项

### 9.2 自定义配置器

```typescript
// 创建自定义配置器组件
const CustomInspector = {
  props: ['modelValue'],
  emits: ['update:modelValue'],
  template: `
    <div>
      <!-- 自定义配置UI -->
    </div>
  `
};

// 注册到配置器注册表
inspectorRegistry['custom-input'] = CustomInspector;
```

### 9.3 扩展状态管理

```typescript
// 扩展 PanelState 接口
interface ExtendedPanelState extends PanelState {
  customProperty: any;
}

// 扩展 store actions
const extendedActions = {
  customAction(data: any) {
    // 自定义逻辑
  }
};
```

## 10. 最佳实践

### 10.1 性能优化

- **懒加载:** 使用 `defineAsyncComponent` 懒加载大型卡片组件
- **虚拟滚动:** 对于大量卡片的场景，考虑实现虚拟滚动
- **防抖处理:** 对频繁的配置更新操作进行防抖处理

### 10.2 类型安全

- **严格类型定义:** 为所有接口和组件提供完整的 TypeScript 类型
- **泛型支持:** 使用泛型确保配置项的类型安全
- **运行时验证:** 在开发环境中添加运行时类型检查

### 10.3 测试策略

- **单元测试:** 为每个核心组件编写单元测试
- **集成测试:** 测试组件间的交互和数据流
- **E2E测试:** 测试完整的用户工作流

## 11. 总结

`PanelV2` 架构通过以下核心特性实现了高度的灵活性和可扩展性：

1. **配置驱动的设计:** 通过 `ConfigItem` 接口实现了配置与渲染的完全分离
2. **插槽化渲染:** 核心组件只提供布局框架，具体渲染由使用者控制
3. **注册表系统:** 通过组件注册表实现了动态组件加载和类型扩展
4. **响应式状态管理:** 基于 Pinia 的状态管理确保了数据的一致性和可预测性
5. **模块化架构:** 清晰的模块划分使得每个部分都可以独立开发和测试

这个架构将 `PanelV2` 变成了一个纯粹的"布局与状态协调器"，将渲染和配置的复杂性完全推给了使用者，提供了最大程度的灵活性和可扩展性。