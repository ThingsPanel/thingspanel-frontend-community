# 可视化重构架构方案 (v3.0)

**目标**: 构建一个支持多渲染器、高度解耦、可独立扩展的现代化可视化功能生态。

## 1. 核心设计原则

*   **渲染器抽象**: 彻底分离“渲染什么”（状态与数据）和“如何渲染”（DOM, Canvas, WebGL）。
*   **单向依赖**: 严格遵循 `应用 -> 渲染器 -> 框架 -> 核心` 的单向依赖链。
*   **依赖倒置**: 底层模块通过定义 `interface` 契约来服务上层，上层负责实现和适配。
*   **单一职责**: 每个模块只做一件事，并通过接口清晰地暴露其能力。

## 2. 模块化目录结构

```
src/
├── features/
│
│   ├── 1️⃣ visualization-core/  (核心引擎 - 产出“渲染树”)
│   │   ├── data-sources/        # 数据源管理 (定义接口, 提供执行器)
│   │   │   ├── IDataSource.ts   # (契约) 定义数据源必须满足的接口
│   │   │   └── executor.ts      # 负责执行数据源请求、轮询、转换
│   │   │
│   │   ├── interactions/        # 交互管理 (定义动作, 提供引擎)
│   │   │   ├── IInteraction.ts  # (契约) 定义交互动作的接口
│   │   │   └── engine.ts        # 负责解析和执行交互命令
│   │   │
│   │   └── state/               # 画布状态管理
│   │       ├── canvas-state.ts  # 管理画布节点树，并生成“渲染树”
│   │       └── ICanvasNode.ts   # (契约) 定义渲染树节点的纯数据结构
│   │
│   ├── 2️⃣ card-framework/      (卡片定义 - 提供“卡片元数据”)
│   │   ├── builtin-cards/       # 内置卡片库
│   │   │   ├── GaugeCard/
│   │   │   │   ├── index.vue    # Vue 实现版本
│   │   │   │   ├── index.canvas.ts # (未来) Canvas 实现版本
│   │   │   │   └── config.ts    # ✨ 卡片的核心元数据 (属性、数据接口等)
│   │   │   └── ...
│   │   └── ICardManifest.ts     # (契约) 定义卡片清单的结构
│   │
│   ├── 3️⃣ renderers/           (✨ 新增：渲染器层)
│   │   ├── IRenderer.ts         # (契约) 定义所有渲染器都必须实现的接口
│   │   │
│   │   ├── vue-renderer/        # Vue 渲染器实现
│   │   │   ├── index.ts         # 实现 IRenderer 接口
│   │   │   └── registry.ts      # 维护卡片类型到 Vue 组件的映射
│   │   │
│   │   └── canvas-renderer/     # (未来) Canvas 渲染器实现
│   │       ├── index.ts
│   │       └── registry.ts
│   │
│   └── 4️⃣ visual-editor/       (编辑器应用 - 消费“渲染器”)
│       ├── index.vue            # 编辑器主入口
│       ├── components/          # 编辑器自身的UI组件 (e.g., 属性配置面板)
│       └── composables/
│           └── use-renderer.ts  # ✨ 根据当前选择，加载并驱动渲染器
│
└── ... (其他目录)
```

## 3. 工作流程解析

1.  **状态驱动**: `visualization-core` 的 `canvas-state.ts` 维护一个描述画布所有节点信息的“状态树”。当状态变更时（如用户拖动一个组件），它会生成一个纯粹的、与UI无关的“渲染树”数组。

    ```typescript
    // 渲染树 (Render Tree) 示例:
    [
      { id: 'node-1', type: 'GaugeCard', props: { value: 85, x: 10, y: 20 } },
      { id: 'node-2', type: 'ChartCard', props: { data: [...], x: 200, y: 20 } }
    ]
    ```

2.  **渲染器选择**: `visual-editor` 作为顶层应用，允许用户选择渲染器（如 "Vue" 或 "Canvas"）。`use-renderer.ts` Hook 负责动态加载并实例化对应的渲染器模块（如 `vue-renderer`）。

3.  **渲染执行**: `visual-editor` 监听 `visualization-core` 的状态变化。一旦接收到新的“渲染树”，就调用当前激活的渲染器实例的 `.render(renderTree)` 方法。

4.  **具体渲染**:
    *   **`vue-renderer`** 会遍历“渲染树”，根据节点的 `type` 查找其内部注册的 Vue 组件，然后通过 Vue 的 `h()` 函数和动态组件机制，将节点渲染为真实的 DOM 元素。
    *   **`canvas-renderer`** (如果实现) 则会遍历“渲染树”，根据节点的 `type` 查找对应的 Canvas 绘制函数，然后在 `<canvas>` 上执行绘图指令。

## 4. 优势

*   **支持多渲染器**: 完美实现 Vue、Canvas 或其他渲染技术的支持和切换。
*   **极致解耦**: `core` (数据), `card-framework` (定义), `renderer` (渲染), `editor` (应用) 四个层次的职责清晰明确。
*   **高可扩展性**: 增加新卡片、新交互、甚至新的渲染技术，都只需要在对应模块下添加新文件，不影响其他部分。
*   **高可测试性**: `visualization-core` 可以在 Node.js 环境中进行完整的单元测试，因为它不依赖任何浏览器或UI框架。