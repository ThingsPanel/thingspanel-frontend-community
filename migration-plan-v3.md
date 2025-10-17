# 架构 v3.0 重写蓝图 (The Rewrite Blueprint)

**核心理念**: 放弃迁移，拥抱新生。我们不再受困于历史包袱，而是基于 v3.0 的核心原则（渲染器抽象、单向依赖、依赖倒置），从零开始构建一个面向未来、极致解耦的可视化生态系统。

---

## 最终成品：完美的目录结构

经过反复推敲与权衡，这便是我们新一代可视化功能 (`iot-visualization`) 的最终目录结构。它被设计为高内聚、低耦合，且拥有清晰的职责边界。

```
src/
└── features/
    └── iot-visualization/
        │
        ├──  noyau/  (法语: 核心/内核 - The Core Engine)
        │   ├── state/
        │   │   ├── canvas.store.ts       # ✅ 核心状态机 (Pinia/Zustand)，管理“渲染树”的唯一真理源
        │   │   ├── canvas.actions.ts     # ✅ 定义所有可对画布执行的原子操作 (如 addNode, updateNodeProps)
        │   │   └── canvas.selectors.ts   # ✅ 提供从状态派生数据的计算函数 (如 selectNodeById, getSelectedNodes)
        │   │
        │   ├── data-sources/
        │   │   ├── interface.ts          # ✅ (契约) 定义 IDataSource 和 IDataSourceExecutor
        │   │   ├── executor.ts           # ✅ 负责调度和执行所有数据源请求的引擎
        │   │   └── providers/            # ✨ 各种数据源的具体实现
        │   │       ├── http.provider.ts
        │   │       └── script.provider.ts
        │   │
        │   ├── interactions/
        │   │   ├── interface.ts          # ✅ (契约) 定义 IInteraction 和 IInteractionEngine
        │   │   ├── engine.ts             # ✅ 负责解析和触发所有交互事件的引擎
        │   │   └── actions/              # ✨ 各种交互动作的具体实现
        │   │       ├── navigateTo.action.ts
        │   │       └── openModal.action.ts
        │   │
        │   ├── types/                    # ✅ 整个核心引擎的类型定义
        │   │   ├── canvas.types.ts       # (ICanvasNode, RenderTree)
        │   │   ├── data.types.ts
        │   │   └── interaction.types.ts
        │   │
        │   └── index.ts                  # ✅ 核心引擎的统一出口，定义其公共 API
        │
        ├── cartes/ (法语: 卡片 - The Card Framework)
        │   ├── interface.ts              # ✅ (契约) 定义 ICardManifest (卡片清单)
        │   ├── registry.ts               # ✅ 负责加载并注册所有卡片清单
        │   └── library/                  # ✨ 内置卡片库
        │       └── GaugeCard/
        │           ├── manifest.ts       # ✅ (核心) 卡片的元数据，实现 ICardManifest
        │           ├── GaugeCard.vue     # ✅ Vue 版本的渲染实现
        │           └── GaugeCard.canvas.ts # (未来) Canvas 版本的渲染实现
        │
        ├── renderers/ (渲染器层)
        │   ├── interface.ts              # ✅ (契约) 定义所有渲染器必须实现的 IRenderer 接口
        │   ├── vue/
        │   │   ├── VueRenderer.ts        # ✅ Vue 渲染器的主要实现
        │   │   ├── component.vue         # ✅ 承载 Vue 渲染结果的宿主组件
        │   │   └── registry.ts           # ✅ 维护卡片类型到 Vue 组件的映射
        │   └── canvas/
        │       ├── CanvasRenderer.ts
        │       ├── component.vue
        │       └── registry.ts
        │
        └── editor/ (编辑器应用)
            ├── Editor.vue                # ✅ 编辑器 UI 的主入口
            ├── components/               # ✨ 编辑器自身的所有 UI 组件
            │   ├── sidebar/
            │   │   └── WidgetLibrary.vue # 从 `cartes/library` 读取卡片并展示
            │   ├── properties-panel/
            │   │   ├── PropertiesPanel.vue # 属性面板主组件
            │   │   └── form-generator/   # ✅ 基于 JSON Schema 动态生成配置表单
            │   └── toolbar/
            │       └── EditorToolbar.vue
            │
            ├── composables/              # ✨ 编辑器 UI 的业务逻辑
            │   ├── useEditorBridge.ts    # ✅ (关键) 连接 UI 操作与 `noyau` 引擎 API 的桥梁
            │   └── useRenderer.ts        # ✅ 管理渲染器的加载与切换
            │
            └── store/
                └── ui.store.ts           # ✅ 仅管理编辑器 UI 自身的状态 (如激活的面板)
```

---

## 设计哲学与推敲过程

这个结构不是随意的，而是经过深思熟虑的产物：

1.  **为什么叫 `noyau` 和 `cartes`？**
    *   **推敲**: 我避免了使用像 `core` 或 `card-framework` 这样在现有代码库中已被占用的名称，以防止重构过程中出现路径混淆和潜在的冲突。选用简短而优雅的法语词汇，既能明确其意（`noyau` - 核心, `cartes` - 卡片），又能创造一个全新的、无歧义的命名空间，象征着彻底的新生。

2.  **`noyau` 内部为何如此划分？**
    *   **推敲**: `state` 目录下的 `store`, `actions`, `selectors` 划分，是借鉴了 Redux/Pinia 的最佳实践。它强制将“状态变更”、“如何变更”、“如何读取”三者分离，使得状态管理变得极其可预测和易于调试。这与旧代码中状态散落在各个角落的混乱情况形成鲜明对比。
    *   `data-sources` 和 `interactions` 下的 `providers` 和 `actions` 子目录，运用了“策略模式”。`executor` 和 `engine` 是不变的策略执行者，而 `providers` 和 `actions` 目录下的文件是可无限扩展的具体策略。这使得添加一种新的数据源或交互动作，仅需增加一个文件，而无需改动核心引擎。

3.  **`cartes/library` 的结构有何深意？**
    *   **推敲**: 每个卡片被视为一个独立的“微型包”。`manifest.ts` 是它的“package.json”，定义了它的所有元数据和对外契约。而 `GaugeCard.vue` 和 `GaugeCard.canvas.ts` 则是它针对不同渲染目标的具体实现。这种结构确保了卡片的独立性和多态性，未来甚至可以有 `GaugeCard.webgl.ts`。

4.  **`editor/composables/useEditorBridge.ts` 的作用是什么？**
    *   **推敲**: 这是防止 UI 层与核心层再次耦合的“防火墙”。`editor` 中的所有 Vue 组件，都不允许直接调用 `noyau` 的 API。它们只能通过 `useEditorBridge.ts` 这个唯一的桥梁来发送意图（例如 `bridge.addNode('GaugeCard')`）。这个 Hook 内部会处理所有与 `noyau` 的通信，确保了单向数据流的纯粹性。

这个蓝图为您提供了一个清晰、健壮且可扩展的起点。现在，我们可以基于这个“完美的目录结构”，开始第一步的编码工作：**创建 `noyau` 模块**。